const crypto = require('node:crypto');
const { renderWelcomeEmail } = require('../src/emails/templates/welcome-email');
const { MAX_BODY_BYTES, normalizeEmail, validateLeadPayload } = require('../src/emails/utils/email-validation');

const DEFAULT_SITE_URL = 'https://www.reroute.com.br';
const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const REPLY_TO = 'contato@reroute.com.br';

const json = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
};

const getSiteUrl = () => String(process.env.REROUTE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  const siteUrl = getSiteUrl();
  return origin === siteUrl || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};

const readJsonBody = async (req) => {
  const contentLength = Number(req.headers['content-length'] || 0);

  if (contentLength > MAX_BODY_BYTES) {
    const error = new Error('Payload muito grande.');
    error.statusCode = 400;
    throw error;
  }

  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body);
  }

  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;

    if (size > MAX_BODY_BYTES) {
      const error = new Error('Payload muito grande.');
      error.statusCode = 400;
      throw error;
    }

    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
};

const createIdempotencyKey = (email) => {
  const hash = crypto
    .createHash('sha256')
    .update(`welcome:${normalizeEmail(email)}`)
    .digest('hex');
  return `welcome:${hash.slice(0, 48)}`;
};

const sendWithResend = async ({ name, email, firstName }) => {
  const apiKey = process.env.RESEND_API_KEY;
  console.log("RESEND_API_KEY existe?", !!process.env.RESEND_API_KEY);
console.log("FROM:", process.env.RESEND_FROM_EMAIL);
console.log("SITE:", process.env.REROUTE_SITE_URL);
  const from = process.env.RESEND_FROM_EMAIL || 'REROUTE <boasvindas@email.reroute.com.br>';
  const siteUrl = getSiteUrl();

  if (!apiKey) {
    throw new Error('RESEND_API_KEY ausente.');
  }

  const emailContent = renderWelcomeEmail({ firstName, siteUrl });

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': createIdempotencyKey(email)
    },
    body: JSON.stringify({
      from,
      to: [email],
      reply_to: REPLY_TO,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      tags: [
        { name: 'type', value: 'transactional' },
        { name: 'event', value: 'welcome_waitlist' }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Resend respondeu com status ${response.status}.`);
  }
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { success: false, error: 'Método não permitido.' });
  }

  const contentType = String(req.headers['content-type'] || '');

  if (!contentType.toLowerCase().includes('application/json')) {
    return json(res, 400, { success: false, error: 'Dados inválidos.' });
  }

  if (!isAllowedOrigin(req.headers.origin)) {
    return json(res, 400, { success: false, error: 'Dados inválidos.' });
  }

  try {
    const payload = await readJsonBody(req);
    const validation = validateLeadPayload(payload);

    if (!validation.valid) {
      return json(res, 400, { success: false, error: 'Dados inválidos.' });
    }

    await sendWithResend(validation.data);
    return json(res, 200, { success: true });
  } catch (error) {
    if (error.statusCode === 400 || error instanceof SyntaxError) {
      return json(res, 400, { success: false, error: 'Dados inválidos.' });
    }

    console.error('Falha ao enviar e-mail transacional de boas-vindas.', {
      message: error.message
    });
    return json(res, 500, { success: false, error: 'Não foi possível enviar o e-mail.' });
  }
};

module.exports.createIdempotencyKey = createIdempotencyKey;
module.exports.sendWithResend = sendWithResend;
