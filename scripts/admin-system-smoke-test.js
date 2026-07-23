const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');

const loginHandler = require('../api/admin/login');
const logoutHandler = require('../api/admin/logout');
const sessionHandler = require('../api/admin/session');
const leadsHandler = require('../api/admin/leads');
const exportHandler = require('../api/admin/export');
const pageHandler = require('../api/admin-page');

const rootDir = path.resolve(__dirname, '..');
const adminId = '11111111-1111-4111-8111-111111111111';
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const createReq = ({ method = 'GET', body, query = {}, cookie = '', headers = {} } = {}) => {
  const req = new Readable({ read() {} });
  req.method = method;
  req.body = body;
  req.query = query;
  req.headers = {
    host: 'www.reroute.com.br',
    origin: 'https://www.reroute.com.br',
    cookie,
    'content-type': 'application/json',
    'cf-connecting-ip': '203.0.113.20',
    ...headers
  };
  req.socket = { remoteAddress: '203.0.113.20' };
  req.push(null);
  return req;
};

const createRes = () => ({
  statusCode: 200,
  headers: {},
  body: '',
  setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
  getHeader(name) { return this.headers[name.toLowerCase()]; },
  end(payload) { this.body = payload || ''; }
});

const call = async (handler, options) => {
  const req = createReq(options);
  const res = createRes();
  await handler(req, res);
  return res;
};

const jsonResponse = (ok, data, status = ok ? 200 : 400) => ({
  ok, status, json: async () => data
});

const run = async () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };
  let validCredentials = false;
  let rateLimitAllowed = true;
  let accessTokenValid = true;
  let refreshTokenValid = true;
  let authorizedAdmin = true;
  let dashboardRequest = null;
  let auditCalls = 0;
  let rateLimitCalls = 0;

  try {
    process.env.NODE_ENV = 'production';
    process.env.REROUTE_SITE_URL = 'https://www.reroute.com.br';
    process.env.SUPABASE_URL = 'https://project.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon_test_only';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_test_only';
    process.env.ADMIN_AUDIT_SECRET = 'admin-audit-secret-with-at-least-32-characters';

    global.fetch = async (url, options = {}) => {
      assert(!String(options.body || '').includes('service_role_test_only') || url.includes('/rest/v1/'), 'Service role enviada fora do Supabase REST.');

      if (url.endsWith('/rpc/check_admin_login_rate_limit')) {
        rateLimitCalls += 1;
        return jsonResponse(true, rateLimitAllowed);
      }
      if (url.endsWith('/rpc/record_admin_access_event')) {
        auditCalls += 1;
        assert(!String(options.body).includes('password'), 'Senha apareceu no log administrativo.');
        return jsonResponse(true, null);
      }
      if (url.includes('/auth/v1/token?grant_type=password')) {
        return validCredentials
          ? jsonResponse(true, { access_token: 'access-token', refresh_token: 'refresh-token', expires_in: 3600, user: { id: adminId, email: 'admin@reroute.com.br' } })
          : jsonResponse(false, {}, 400);
      }
      if (url.includes('/auth/v1/token?grant_type=refresh_token')) {
        return refreshTokenValid
          ? jsonResponse(true, { access_token: 'renewed-access', refresh_token: 'renewed-refresh', expires_in: 3600, user: { id: adminId, email: 'admin@reroute.com.br' } })
          : jsonResponse(false, {}, 401);
      }
      if (url.endsWith('/auth/v1/user')) {
        return accessTokenValid
          ? jsonResponse(true, { id: adminId, email: 'admin@reroute.com.br' })
          : jsonResponse(false, {}, 401);
      }
      if (url.endsWith('/auth/v1/logout')) {
        return jsonResponse(true, {});
      }
      if (url.includes('/rest/v1/admin_users?')) {
        return jsonResponse(true, authorizedAdmin ? [{ user_id: adminId }] : []);
      }
      if (url.endsWith('/rpc/get_admin_leads_dashboard')) {
        dashboardRequest = JSON.parse(options.body);
        return jsonResponse(true, {
          metrics: { total: 2, today: 1, last7Days: 2, currentMonth: 2 },
          daily: [{ date: '2026-07-22', count: 2 }],
          leads: [{ id: '1', name: 'Lead', email: 'lead@example.com', whatsapp: '+5511999999999', created_at: '2026-07-22T12:00:00Z' }],
          pagination: { page: 2, pageSize: 10, total: 2, totalPages: 1 }
        });
      }
      if (url.endsWith('/rpc/export_admin_leads')) {
        return jsonResponse(true, [{ name: '=HYPERLINK("evil")', email: 'lead@example.com', whatsapp: '+5511999999999', created_at: '2026-07-22T12:00:00Z' }]);
      }
      throw new Error(`Fetch inesperado: ${url}`);
    };

    let res = await call(pageHandler);
    assert(res.statusCode === 302 && res.headers.location === '/admin/login', 'Acesso anonimo ao /admin nao foi redirecionado.');
    assert(!res.body.includes('Painel de Leads'), 'Dashboard foi entregue sem autenticacao.');

    res = await call(sessionHandler);
    assert(res.statusCode === 401, 'Sessao anonima deveria retornar 401.');

    res = await call(loginHandler, { method: 'POST', body: { email: 'admin@reroute.com.br', password: 'senha-incorreta' } });
    assert(res.statusCode === 401 && !res.body.includes('credenciais'), 'Login invalido revelou detalhes ou foi aceito.');

    rateLimitAllowed = false;
    res = await call(loginHandler, { method: 'POST', body: { email: 'admin@reroute.com.br', password: 'senha-incorreta' } });
    assert(res.statusCode === 429, 'Rate limit de login nao foi aplicado.');
    rateLimitAllowed = true;
    validCredentials = true;

    authorizedAdmin = false;
    res = await call(loginHandler, { method: 'POST', body: { email: 'admin@reroute.com.br', password: 'senha-valida-123' } });
    assert(res.statusCode === 401 && !res.headers['set-cookie'], 'Usuario autenticado fora da allowlist recebeu sessao administrativa.');
    authorizedAdmin = true;

    res = await call(loginHandler, { method: 'POST', body: { email: 'admin@reroute.com.br', password: 'senha-valida-123' } });
    assert(res.statusCode === 200, 'Login administrativo valido falhou.');
    const setCookies = res.headers['set-cookie'];
    assert(Array.isArray(setCookies) && setCookies.every((cookie) => /HttpOnly/.test(cookie) && /Secure/.test(cookie) && /SameSite=Strict/.test(cookie)), 'Cookies administrativos inseguros.');
    assert(!res.body.includes('access-token') && !res.body.includes('refresh-token'), 'Token de sessao vazou no corpo.');

    const productionRateLimitCalls = rateLimitCalls;
    process.env.NODE_ENV = 'development';
    res = await call(loginHandler, {
      method: 'POST',
      body: { email: 'admin@reroute.com.br', password: 'senha-valida-123' },
      headers: {
        host: 'localhost:4174',
        origin: 'http://localhost:4174',
        'cf-connecting-ip': '127.0.0.1'
      }
    });
    assert(res.statusCode === 200, 'Login local valido falhou.');
    assert(rateLimitCalls === productionRateLimitCalls, 'Desenvolvimento local consultou o rate limit persistente de producao.');
    process.env.NODE_ENV = 'production';

    const cookie = 'reroute_admin_access=access-token; reroute_admin_refresh=refresh-token';
    res = await call(pageHandler, { cookie });
    assert(res.statusCode === 200 && res.body.includes('Painel de Leads'), 'Admin autorizado nao recebeu o dashboard.');
    assert(/no-store/.test(res.headers['cache-control']), 'Dashboard administrativo permite cache.');

    res = await call(leadsHandler, { cookie, query: { search: '  Maria  ', page: '2', pageSize: '10' } });
    assert(res.statusCode === 200, 'API de leads falhou.');
    assert(dashboardRequest.p_search === 'Maria' && dashboardRequest.p_page === 2 && dashboardRequest.p_page_size === 10, 'Busca ou paginacao nao foram normalizadas.');

    res = await call(exportHandler, { cookie });
    assert(res.statusCode === 200 && res.body.startsWith('\uFEFF'), 'CSV nao esta em UTF-8 com BOM.');
    assert(res.body.includes("'=HYPERLINK"), 'CSV Injection nao foi neutralizada.');
    assert(/attachment/.test(res.headers['content-disposition']), 'CSV nao foi entregue como download.');

    accessTokenValid = false;
    res = await call(sessionHandler, { cookie });
    assert(res.statusCode === 200, 'Sessao expirada nao foi renovada pelo refresh token.');
    assert(Array.isArray(res.headers['set-cookie']), 'Renovacao nao atualizou cookies HttpOnly.');
    refreshTokenValid = false;
    res = await call(pageHandler, { cookie });
    assert(res.statusCode === 302 && res.headers.location === '/admin/login', 'Sessao totalmente expirada nao redirecionou para login.');
    refreshTokenValid = true;
    accessTokenValid = true;

    res = await call(logoutHandler, { method: 'POST', cookie });
    assert(res.statusCode === 200, 'Logout falhou.');
    assert(res.headers['set-cookie'].some((value) => /Max-Age=0/.test(value)), 'Logout nao removeu cookies.');
    assert(auditCalls >= 3, 'Eventos administrativos relevantes nao foram auditados.');

    const publicAdminJs = [
      fs.readFileSync(path.join(rootDir, 'assets/admin/admin-login.js'), 'utf8'),
      fs.readFileSync(path.join(rootDir, 'assets/admin/admin-dashboard.js'), 'utf8')
    ].join('\n');
    assert(!/(service_role|SUPABASE_|RESEND_|ADMIN_AUDIT_SECRET)/i.test(publicAdminJs), 'Segredo ou acesso Supabase encontrado no frontend admin.');

    const migration = fs.readFileSync(path.join(rootDir, 'supabase/migrations/20260722120000_admin_leads_panel.sql'), 'utf8');
    assert(/enable row level security/gi.test(migration), 'RLS administrativa ausente.');
    assert(/revoke all[\s\S]*from public, anon, authenticated/gi.test(migration), 'Permissoes publicas administrativas nao foram revogadas.');
    assert(/to service_role/gi.test(migration), 'Funcoes administrativas nao estao restritas a service_role.');

    console.log('Admin security tests passed: auth, session, API, search, pagination, CSV and audit.');
  } finally {
    global.fetch = originalFetch;
    process.env = originalEnv;
  }
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
