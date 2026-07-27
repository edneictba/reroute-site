const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateAnalyticsEvent } = require('../server/analytics-event');
const { getExecutiveDashboard } = require('../server/admin/analytics-data');
const { renderAdminAnalytics } = require('../server/admin/analytics-template');
const analyticsHandler = require('../api/analytics');
const adminDashboardHandler = require('../api/admin/dashboard');

const rootDir = path.resolve(__dirname, '..');
const migrationPath = path.join(rootDir, 'supabase/migrations/20260727003820_landing_analytics_events.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');
const collector = fs.readFileSync(path.join(rootDir, 'src/scripts/analytics.js'), 'utf8');
const build = fs.readFileSync(path.join(rootDir, 'scripts/build.js'), 'utf8');
const vercel = JSON.parse(fs.readFileSync(path.join(rootDir, 'vercel.json'), 'utf8'));

const validPayload = {
  visitorId: '4fd7cbcc-d652-4f5a-b34a-a6e23197635b',
  sessionId: 'd6726a34-2796-48ea-8102-21a54124098c',
  eventName: 'page_view',
  pagePath: '/',
  referrerHost: 'example.com',
  utmSource: 'newsletter',
  utmMedium: 'email',
  utmCampaign: 'launch',
  utmContent: '',
  utmTerm: '',
  deviceType: 'desktop',
  browser: 'Chrome',
  operatingSystem: 'Windows',
  language: 'pt-BR',
  screenWidth: 1920,
  screenHeight: 1080,
  durationSeconds: null,
  scrollPercent: null,
  eventData: {},
  occurredAt: new Date().toISOString()
};

assert.equal(validateAnalyticsEvent(validPayload)?.event_name, 'page_view');
assert.equal(validateAnalyticsEvent({ ...validPayload, eventName: 'arbitrary_event' }), null);
assert.equal(validateAnalyticsEvent({ ...validPayload, email: 'private@example.com' }), null);
assert.equal(validateAnalyticsEvent({ ...validPayload, pagePath: '/?email=private@example.com' }), null);

assert.match(migration, /create table public\.analytics_events/i);
assert.match(migration, /enable row level security/i);
assert.match(migration, /revoke all on public\.analytics_events from public, anon, authenticated/i);
assert.match(migration, /with \(security_invoker = true\)/i);
assert.match(migration, /grant execute on function public\.get_admin_analytics_dashboard\(integer\)\s+to service_role/i);
assert.doesNotMatch(migration, /grant (select|insert).* to anon/i);

assert.match(collector, /localStorage/);
assert.match(collector, /sessionStorage/);
assert.match(collector, /sendBeacon/);
assert.match(collector, /form_abandon/);
assert.match(collector, /reroute_analytics_opt_out/);
assert.match(collector, /\/api\/admin\/session/);
assert.ok(
  collector.indexOf('hasOptOut() || await hasAdminSession()') < collector.indexOf("send('page_view')"),
  'Coletor inicializa antes de verificar opt-out e sessao administrativa.'
);
assert.doesNotMatch(collector, /whatsappE164|nameInput|emailInput/);
assert.match(build, /src\/scripts\/analytics\.js/);
assert.ok(vercel.rewrites.some((rewrite) => rewrite.source === '/admin/analytics'));

const adminPage = renderAdminAnalytics();
assert.match(adminPage, /Analytics \| REROUTE Admin/);
assert.match(adminPage, /\/assets\/admin\/admin-analytics\.js/);
assert.doesNotMatch(adminPage, /<script[^>]*>[^<]+<\/script>/i);

const createRes = () => ({
  statusCode: 200,
  headers: {},
  body: '',
  setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
  getHeader(name) { return this.headers[name.toLowerCase()]; },
  end(payload) { this.body = payload || ''; }
});

const todayKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());
const recentEvent = {
  visitor_id: '4fd7cbcc-d652-4f5a-b34a-a6e23197635b',
  event_name: 'page_view',
  occurred_at: '2026-07-27T12:00:00Z',
  device_type: 'mobile',
  referrer_host: 'google.com',
  utm_source: null,
  page_path: '/'
};

const run = async () => {
  const executiveFetch = async (url) => {
    if (url.endsWith('/rpc/get_admin_analytics_dashboard')) {
      return { ok: true, json: async () => ({
        metrics: { visits: 30, uniqueVisitors: 20 },
        daily: [{ metric_date: todayKey, visits: 5, unique_visitors: 4 }]
      }) };
    }
    if (url.endsWith('/rpc/get_admin_leads_dashboard')) {
      return { ok: true, json: async () => ({
        metrics: { today: 2, last7Days: 8 },
        leads: [{ created_at: '2026-07-27T11:00:00Z' }]
      }) };
    }
    if (url.includes('/rest/v1/analytics_events?')) {
      return { ok: true, json: async () => [recentEvent] };
    }
    throw new Error(`Fetch inesperado: ${url}`);
  };

  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;
  try {
    process.env.SUPABASE_URL = 'https://project.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon_test_only';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_test_only';

    const executive = await getExecutiveDashboard({ recentDays: 7 }, executiveFetch);
    assert.equal(executive.metrics.visitsToday, 5);
    assert.equal(executive.metrics.uniqueVisitorsToday, 4);
    assert.equal(executive.metrics.registrationsToday, 2);
    assert.equal(executive.metrics.conversionToday, 50);
    assert.equal(executive.metrics.visitsLast7Days, 30);
    assert.equal(executive.metrics.registrationsLast7Days, 8);
    assert.equal(executive.recentEvents[0].event_name, 'page_view');
    assert.equal(
      executive.recentEvents.some((event) => (
        'email' in event || 'phone' in event || 'whatsapp' in event || 'lead_name' in event
      )),
      false
    );

    let analyticsWrites = 0;
    global.fetch = async (url) => {
      if (url.endsWith('/auth/v1/user')) {
        return { ok: true, json: async () => ({ id: validPayload.visitorId, email: 'admin@reroute.com.br' }) };
      }
      if (url.includes('/rest/v1/admin_users?')) {
        return { ok: true, json: async () => [{ user_id: validPayload.visitorId }] };
      }
      if (url.endsWith('/rest/v1/analytics_events')) {
        analyticsWrites += 1;
        return { ok: true, json: async () => ({}) };
      }
      throw new Error(`Fetch inesperado: ${url}`);
    };

    const adminReq = {
      method: 'POST',
      body: validPayload,
      headers: {
        cookie: 'reroute_admin_access=admin-token',
        host: 'www.reroute.com.br',
        origin: 'https://www.reroute.com.br'
      },
      socket: {}
    };
    let response = createRes();
    await analyticsHandler(adminReq, response);
    assert.equal(response.statusCode, 204);
    assert.equal(analyticsWrites, 0);

    global.fetch = async (url) => {
      if (url.endsWith('/rest/v1/analytics_events')) {
        analyticsWrites += 1;
        return { ok: true, json: async () => ({}) };
      }
      throw new Error(`Fetch inesperado: ${url}`);
    };
    const publicReq = {
      method: 'POST',
      body: validPayload,
      headers: {
        cookie: '',
        host: 'www.reroute.com.br',
        origin: 'https://www.reroute.com.br'
      },
      socket: { remoteAddress: '203.0.113.10' }
    };
    response = createRes();
    await analyticsHandler(publicReq, response);
    assert.equal(response.statusCode, 202);
    assert.equal(analyticsWrites, 1);

    response = createRes();
    await adminDashboardHandler({
      method: 'GET',
      query: {},
      headers: { cookie: '' }
    }, response);
    assert.equal(response.statusCode, 401);
  } finally {
    global.fetch = originalFetch;
    process.env = originalEnv;
  }

  console.log('Analytics security tests passed: opt-out, admin exclusion, public collection, executive metrics, privacy and protected dashboard.');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
