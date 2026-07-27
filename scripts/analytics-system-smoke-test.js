const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateAnalyticsEvent } = require('../server/analytics-event');
const { renderAdminAnalytics } = require('../server/admin/analytics-template');

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
assert.doesNotMatch(collector, /whatsappE164|nameInput|emailInput/);
assert.match(build, /src\/scripts\/analytics\.js/);
assert.ok(vercel.rewrites.some((rewrite) => rewrite.source === '/admin/analytics'));

const adminPage = renderAdminAnalytics();
assert.match(adminPage, /Analytics \| REROUTE Admin/);
assert.match(adminPage, /\/assets\/admin\/admin-analytics\.js/);
assert.doesNotMatch(adminPage, /<script[^>]*>[^<]+<\/script>/i);

console.log('Analytics security tests passed: validation, privacy, RLS, aggregate view, collector and protected page.');
