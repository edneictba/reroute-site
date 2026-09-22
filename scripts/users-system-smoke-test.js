const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const usersHandler = require('../server/admin/handlers/users');
const usersPageHandler = require('../server/admin/handlers/page-users');
const { renderAdminUsers } = require('../server/admin/users-template');
const root = path.resolve(__dirname, '..');

const createRes = () => ({
  statusCode: 200,
  headers: {},
  body: '',
  setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
  getHeader(name) { return this.headers[name.toLowerCase()]; },
  end(body) { this.body = body || ''; }
});

const request = ({ cookie = '', query = {}, method = 'GET' } = {}) => ({
  method,
  query,
  headers: { cookie, host: 'www.reroute.com.br', origin: 'https://www.reroute.com.br' },
  socket: { remoteAddress: '203.0.113.10' }
});

const response = {
  users: [{ email: 'admin@example.com', createdAt: '2026-09-21T17:32:00Z', lastSignInAt: null, provider: 'Google + E-mail', onboarding: 'Concluído', checkins: 2, checkouts: 1, lastActivityAt: '2026-09-21' }],
  pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 }
};

const run = async () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };
  try {
    process.env.NODE_ENV = 'production';
    process.env.SUPABASE_URL = 'https://project.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon_test_only';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_test_only';
    global.fetch = async (url) => {
      if (url.endsWith('/auth/v1/user')) return { ok: true, json: async () => ({ id: '11111111-1111-4111-8111-111111111111' }) };
      if (url.includes('/rest/v1/admin_users?')) return { ok: true, json: async () => [{ user_id: '11111111-1111-4111-8111-111111111111' }] };
      if (url.endsWith('/rpc/get_admin_users')) return { ok: true, json: async () => response };
      throw new Error(`Unexpected fetch: ${url}`);
    };

    let res = createRes();
    await usersHandler(request(), res);
    assert.equal(res.statusCode, 401, 'endpoint sem autenticação não retornou 401');

    res = createRes();
    await usersHandler(request({ cookie: 'reroute_admin_access=access-token', query: { page: '0' } }), res);
    assert.equal(res.statusCode, 400, 'parâmetro inválido não retornou 400');
    assert.deepEqual(JSON.parse(res.body), { success: false, error: 'invalid_parameters' });

    res = createRes();
    await usersHandler(request({ cookie: 'reroute_admin_access=access-token' }), res);
    assert.equal(res.statusCode, 200, 'endpoint autenticado não retornou 200');
    assert.deepEqual(JSON.parse(res.body), { success: true, data: response });
    assert.doesNotMatch(res.body, /service_role_test_only|SUPABASE_SERVICE_ROLE_KEY|11111111-1111/);

    res = createRes();
    await usersPageHandler(request(), res);
    assert.equal(res.statusCode, 302, 'página sem autenticação não redirecionou');
    assert.equal(res.headers.location, '/admin/login');

    res = createRes();
    await usersPageHandler(request({ cookie: 'reroute_admin_access=access-token' }), res);
    assert.equal(res.statusCode, 200, 'página autenticada não retornou 200');
    assert.match(res.body, /<h1>Usuários<\/h1>/);
    assert.equal((res.body.match(/<th>/g) || []).length, 8, 'tabela não possui oito colunas');
    assert.match(res.body, /admin-users\.js/);

    const page = renderAdminUsers();
    assert.match(page, /Acompanhe quem entrou no REROUTE e até onde avançou/);
    assert.doesNotMatch(page, /<script[^>]*>[^<]+<\/script>/i);

    const navigation = fs.readFileSync(path.join(root, 'server/admin/admin-layout.js'), 'utf8');
    const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
    const asset = fs.readFileSync(path.join(root, 'assets/admin/admin-users.js'), 'utf8');
    assert.match(navigation, /href: '\/admin\/users', label: 'Usuários'/);
    assert.ok(vercel.rewrites.some((rewrite) => rewrite.source === '/admin/users' && rewrite.destination === '/api/admin-pages?page=users'));
    assert.ok(vercel.rewrites.some((rewrite) => rewrite.source === '/api/admin/users' && rewrite.destination === '/api/admin-data?action=users'));
    assert.ok(asset.includes('/api/admin/users'));
    assert.match(asset, /America\/Sao_Paulo/);
    assert.match(asset, /usersPrevious/);
    console.log('Users system smoke tests passed: auth, endpoint, validation, privacy, page, navigation, table and pagination.');
  } finally {
    global.fetch = originalFetch;
    process.env = originalEnv;
  }
};

run().catch((error) => { console.error(error.message); process.exit(1); });
