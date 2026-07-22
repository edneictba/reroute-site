const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');
const handler = require('../api/register-lead');

const rootDir = path.resolve(__dirname, '..');

const createReq = ({ method = 'POST', headers = {}, body = undefined }) => {
  const req = new Readable({ read() {} });
  req.method = method;
  req.headers = {
    host: 'www.reroute.com.br',
    origin: 'https://www.reroute.com.br',
    'content-type': 'application/json',
    'cf-connecting-ip': '203.0.113.10',
    ...headers
  };
  req.socket = { remoteAddress: '203.0.113.10' };

  if (body !== undefined) {
    req.body = body;
  }

  req.push(null);
  return req;
};

const createRes = () => ({
  statusCode: 200,
  headers: {},
  body: '',
  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value;
  },
  end(payload) {
    this.body = payload || '';
  }
});

const callHandler = async (options) => {
  const req = createReq(options);
  const res = createRes();
  await handler(req, res);
  return {
    statusCode: res.statusCode,
    body: res.body ? JSON.parse(res.body) : null,
    headers: res.headers
  };
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const validPayload = () => ({
  name: 'Ednei Silva',
  email: 'ednei@example.com',
  whatsapp: '+5511999999999',
  turnstileToken: 'valid-turnstile-token'
});

const run = async () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  try {
    console.error = () => {};
    console.warn = () => {};
    process.env.NODE_ENV = 'production';
    process.env.REROUTE_SITE_URL = 'https://www.reroute.com.br';
    process.env.TURNSTILE_SECRET_KEY = 'turnstile_test_secret';
    process.env.LEAD_RATE_LIMIT_SECRET = 'rate-limit-test-secret-with-32-characters';
    process.env.SUPABASE_URL = 'https://project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_test_only';
    process.env.RESEND_API_KEY = 'resend_test_only';
    process.env.RESEND_FROM_EMAIL = 'REROUTE <boasvindas@email.reroute.com.br>';

    let databaseStatus = 'created';
    let turnstileValid = true;
    let turnstileCalls = 0;
    let databaseCalls = 0;
    let resendCalls = 0;

    global.fetch = async (url, options) => {
      if (url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
        turnstileCalls += 1;
        assert(!String(options.body).includes(process.env.SUPABASE_SERVICE_ROLE_KEY), 'Service role vazou para o Turnstile.');
        return {
          ok: true,
          json: async () => ({
            success: turnstileValid,
            hostname: 'www.reroute.com.br',
            action: 'waitlist_registration'
          })
        };
      }

      if (url === 'https://project.supabase.co/rest/v1/rpc/register_public_lead') {
        databaseCalls += 1;
        assert(options.headers.Authorization === 'Bearer service_role_test_only', 'RPC sem autorizacao server-side.');
        assert(!options.body.includes('valid-turnstile-token'), 'Token Turnstile nao deve ir para o banco.');
        return { ok: true, json: async () => [{ result: databaseStatus }] };
      }

      if (url === 'https://api.resend.com/emails') {
        resendCalls += 1;
        const payload = JSON.parse(options.body);
        assert(payload.to[0] === 'ednei@example.com', 'Destinatario deve vir do cadastro validado.');
        assert(options.headers['Idempotency-Key'].startsWith('welcome:'), 'Idempotencia ausente.');
        return { ok: true, status: 200 };
      }

      throw new Error(`Fetch inesperado: ${url}`);
    };

    let result = await callHandler({ body: validPayload() });
    assert(result.statusCode === 200 && result.body.success, 'Cadastro legitimo deveria passar.');
    assert(turnstileCalls === 1 && databaseCalls === 1 && resendCalls === 1, 'Fluxo legitimo incompleto.');
    const genericSuccessBody = JSON.stringify(result.body);

    databaseStatus = 'existing';
    result = await callHandler({ body: validPayload() });
    assert(result.statusCode === 200, 'Cadastro duplicado deveria retornar sucesso generico.');
    assert(JSON.stringify(result.body) === genericSuccessBody, 'Novo e duplicado devem ter resposta indistinguivel.');
    assert(resendCalls === 1, 'Duplicado nao deve disparar novo e-mail.');

    const invalidPayloads = [
      { ...validPayload(), name: '' },
      { ...validPayload(), email: 'email-invalido' },
      { ...validPayload(), whatsapp: '11999999999' },
      { ...validPayload(), name: 'A'.repeat(81) },
      { ...validPayload(), name: '<script>alert(1)</script>' },
      { ...validPayload(), unexpected: 'field' },
      { name: 'Ednei', email: 'ednei@example.com', whatsapp: '+5511999999999' },
      { name: 'Ednei', email: 'arbitrary@example.com', turnstileToken: 'token' }
    ];
    const callsBeforeInvalidPayloads = turnstileCalls + databaseCalls + resendCalls;

    for (const body of invalidPayloads) {
      result = await callHandler({ body });
      assert(result.statusCode === 400 && !result.body.success, 'Payload invalido deveria ser rejeitado.');
    }

    assert(
      turnstileCalls + databaseCalls + resendCalls === callsBeforeInvalidPayloads,
      'Payload invalido nao pode chegar a servicos externos.'
    );

    result = await callHandler({ headers: { origin: 'https://evil.example' }, body: validPayload() });
    assert(result.statusCode === 400, 'Origin invalido deveria ser rejeitado.');

    result = await callHandler({ headers: { host: 'evil.example' }, body: validPayload() });
    assert(result.statusCode === 400, 'Host invalido deveria ser rejeitado.');

    turnstileValid = false;
    result = await callHandler({ body: validPayload() });
    assert(result.statusCode === 400, 'Turnstile invalido deveria ser rejeitado.');
    turnstileValid = true;

    databaseStatus = 'rate_limited';
    result = await callHandler({ body: validPayload() });
    assert(result.statusCode === 429, 'Rate limit deveria retornar 429.');
    databaseStatus = 'created';

    result = await callHandler({ method: 'GET', body: {} });
    assert(result.statusCode === 405, 'Metodo diferente de POST deveria ser rejeitado.');

    const frontend = fs.readFileSync(path.join(rootDir, 'src/scripts/script.js'), 'utf8');
    const setupMigration = fs.readFileSync(
      path.join(rootDir, 'supabase/migrations/20260721232000_secure_public_lead_registration.sql'),
      'utf8'
    );
    const lockdownMigration = fs.readFileSync(
      path.join(rootDir, 'supabase/migrations/20260721233000_lock_down_public_lead_access.sql'),
      'utf8'
    );
    const migration = `${setupMigration}\n${lockdownMigration}`;
    const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
    const translations = fs.readFileSync(path.join(rootDir, 'src/scripts/i18n.js'), 'utf8');

    assert(!frontend.includes('/rest/v1/leads'), 'Frontend ainda acessa leads diretamente.');
    assert(!frontend.includes('SUPABASE_ANON_KEY'), 'Frontend ainda contem chave Supabase do cadastro.');
    assert(frontend.includes('/api/register-lead'), 'Frontend nao usa o endpoint unificado.');
    assert(!fs.existsSync(path.join(rootDir, 'api/send-welcome-email.js')), 'Endpoint publico antigo ainda existe.');
    assert(/revoke all on public\.leads from public, anon, authenticated/i.test(migration), 'Migration nao revoga acesso publico e anonimo.');
    assert(!/revoke all on public\.leads/i.test(setupMigration), 'Migration de preparacao nao pode interromper o frontend anterior.');
    assert(/revoke all on public\.leads/i.test(lockdownMigration), 'Migration de lockdown nao bloqueia o acesso direto.');
    assert(/grant execute on function public\.register_public_lead[\s\S]*to service_role/i.test(migration), 'RPC nao esta restrita ao service role.');
    assert(/ip_attempts >= 5/i.test(migration), 'Limite por IP ausente.');
    assert(/email_attempts >= 3/i.test(migration), 'Limite por e-mail ausente.');
    assert(/interval '15 minutes'/i.test(migration), 'Janela por IP incorreta.');
    assert(/interval '24 hours'/i.test(migration), 'Janela por e-mail incorreta.');
    assert(/pg_advisory_xact_lock/i.test(migration), 'Rate limit nao esta protegido contra concorrencia.');
    assert(indexHtml.includes('turnstileWidget'), 'Widget Turnstile ausente.');
    assert(['pt:', 'es:', 'en:'].every((language) => translations.includes(language)), 'Idiomas da Landing foram afetados.');

    originalConsoleError(
      `Security registration tests passed. Turnstile: ${turnstileCalls}; database: ${databaseCalls}; Resend: ${resendCalls}.`
    );
  } finally {
    global.fetch = originalFetch;
    process.env = originalEnv;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  }
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
