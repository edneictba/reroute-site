const { Readable } = require('node:stream');
const handler = require('../api/send-welcome-email');
const { renderWelcomeEmail } = require('../src/emails/templates/welcome-email');
const { getFirstName } = require('../src/emails/utils/email-validation');

const createReq = ({ method = 'POST', headers = {}, body = undefined }) => {
  const req = new Readable({ read() {} });
  req.method = method;
  req.headers = headers;

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

const callHandler = async (requestOptions) => {
  const req = createReq(requestOptions);
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

const run = async () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };
  const originalConsoleError = console.error;

  try {
    console.error = () => {};
    process.env.RESEND_API_KEY = 'test_key';
    process.env.RESEND_FROM_EMAIL = 'REROUTE <boasvindas@email.reroute.com.br>';
    process.env.REROUTE_SITE_URL = 'https://www.reroute.com.br';

    let fetchCalls = 0;
    global.fetch = async (url, options) => {
      fetchCalls += 1;
      assert(url === 'https://api.resend.com/emails', 'Resend endpoint incorreto.');
      assert(options.headers.Authorization === 'Bearer test_key', 'Authorization ausente.');
      assert(options.headers['Idempotency-Key'].startsWith('welcome:'), 'Idempotency-Key ausente.');
      const payload = JSON.parse(options.body);
      assert(payload.to[0] === 'ednei@example.com', 'Destinatario incorreto.');
      assert(payload.html.includes('Olá,'), 'Saudacao personalizada nao renderizada.');
      assert(!payload.html.includes('<script>'), 'HTML personalizado nao escapado.');
      return { ok: true, status: 200 };
    };

    let result = await callHandler({
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      body: {}
    });
    assert(result.statusCode === 405, 'GET deveria retornar 405.');

    result = await callHandler({
      headers: { 'content-type': 'text/plain' },
      body: {}
    });
    assert(result.statusCode === 400, 'Content-Type invalido deveria retornar 400.');

    result = await callHandler({
      headers: { 'content-type': 'application/json' },
      body: { name: 'Ednei', email: 'email-invalido' }
    });
    assert(result.statusCode === 400, 'E-mail invalido deveria retornar 400.');

    result = await callHandler({
      headers: { 'content-type': 'application/json' },
      body: { name: '', email: 'ednei@example.com' }
    });
    assert(result.statusCode === 400, 'Nome vazio deveria retornar 400.');

    result = await callHandler({
      headers: { 'content-type': 'application/json' },
      body: { name: 'Édnei Silva', email: 'ednei@example.com' }
    });
    assert(result.statusCode === 200, 'Nome com acento deveria ser aceito.');

    result = await callHandler({
      headers: { 'content-type': 'application/json' },
      body: { name: '<script>Ednei</script>', email: 'ednei@example.com' }
    });
    assert(result.statusCode === 200, 'Nome com tentativa de HTML deveria ser sanitizado.');

    result = await callHandler({
      headers: { 'content-type': 'application/json', 'content-length': '9000' },
      body: { name: 'Ednei', email: 'ednei@example.com' }
    });
    assert(result.statusCode === 400, 'Corpo excessivo deveria retornar 400.');

    delete process.env.RESEND_API_KEY;
    result = await callHandler({
      headers: { 'content-type': 'application/json' },
      body: { name: 'Ednei', email: 'ednei@example.com' }
    });
    assert(result.statusCode === 500, 'Ausencia de RESEND_API_KEY deveria retornar 500.');

    process.env.RESEND_API_KEY = 'test_key';
    global.fetch = async () => ({ ok: false, status: 503 });
    result = await callHandler({
      headers: { 'content-type': 'application/json' },
      body: { name: 'Ednei', email: 'ednei@example.com' }
    });
    assert(result.statusCode === 500, 'Erro simulado do Resend deveria retornar 500.');

    const template = renderWelcomeEmail({ firstName: getFirstName('Ednei'), siteUrl: 'https://www.reroute.com.br' });
    assert(template.html.includes('https://www.reroute.com.br/assets/images/logo-reroute-hns-640.png'), 'Logo deve usar URL absoluta.');
    assert(template.html.includes('https://www.reroute.com.br/assets/images/hns-world-map-960.jpg'), 'Mapa deve usar URL absoluta.');
    assert(template.html.includes('Conhecer o REROUTE'), 'Botao principal ausente.');

    console.log(`Email smoke tests passaram sem envio real. Chamadas fetch simuladas: ${fetchCalls}.`);
  } finally {
    global.fetch = originalFetch;
    process.env = originalEnv;
    console.error = originalConsoleError;
  }
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
