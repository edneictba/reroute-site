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

const failure = (statusCode, error) => ({
  success: false,
  statusCode,
  error
});

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
    return failure(400, 'Payload muito grande.');
  }

  if (req.body && typeof req.body === 'object') {
    return { success: true, payload: req.body };
  }

  if (typeof req.body === 'string') {
    try {
      return { success: true, payload: JSON.parse(req.body) };
    } catch (error) {
      return failure(400, 'Dados invalidos.');
    }
  }

  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;

    if (size > MAX_BODY_BYTES) {
      return failure(400, 'Payload muito grande.');
    }

    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');

  try {
    return { success: true, payload: rawBody ? JSON.parse(rawBody) : {} };
  } catch (error) {
    return failure(400, 'Dados invalidos.');
  }
};

const createIdempotencyKey = (email) => {
  const hash = crypto
    .createHash('sha256')
    .update(`welcome:${normalizeEmail(email)}`)
    .digest('hex');
  return `welcome:${hash.slice(0, 48)}`;
};

const sendWithResend = async ({ email, firstName }) => {
  console.log("RESEND_API_KEY:", !!process.env.RESEND_API_KEY);
  console.log("FROM:", process.env.RESEND_FROM_EMAIL);
  console.log("SITE:", process.env.REROUTE_SITE_URL);

  if (!process.env.RESEND_API_KEY) {
    return failure(500, 'RESEND_API_KEY ausente.');
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    return failure(500, 'RESEND_FROM_EMAIL ausente.');
  }

  const siteUrl = getSiteUrl();
  const { subject, html, text } = renderWelcomeEmail({ firstName, siteUrl });
  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      'Idempotency-Key': createIdempotencyKey(email)
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [email],
      reply_to: REPLY_TO,
      subject,
      html,
      text,
      tags: [
        { name: 'type', value: 'transactional' },
        { name: 'event', value: 'welcome_waitlist' }
      ]
    })
  });

  if (!response.ok) {
    return failure(500, `Resend respondeu com status ${response.status}.`);
  }

  return { success: true };
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { success: false, error: 'Metodo nao permitido.' });
  }

  const contentType = String(req.headers['content-type'] || '');

  if (!contentType.toLowerCase().includes('application/json')) {
    return json(res, 400, { success: false, error: 'Dados invalidos.' });
  }

  if (!isAllowedOrigin(req.headers.origin)) {
    return json(res, 400, { success: false, error: 'Dados invalidos.' });
  }

  try {
    const bodyResult = await readJsonBody(req);

    if (!bodyResult.success) {
      return json(res, bodyResult.statusCode, {
        success: false,
        error: bodyResult.error
      });
    }

    const validation = validateLeadPayload(bodyResult.payload);

    if (!validation.valid) {
      return json(res, 400, { success: false, error: 'Dados invalidos.' });
    }

    const resendResult = await sendWithResend(validation.data);

    if (!resendResult.success) {
      console.error('Falha ao enviar e-mail transacional de boas-vindas.', {
        message: resendResult.error
      });
      return json(res, resendResult.statusCode, {
        success: false,
        error: resendResult.error
      });
    }

    return json(res, 200, { success: true });
  } catch (error) {
    console.error('Falha ao enviar e-mail transacional de boas-vindas.', {
      message: error.message
    });
    return json(res, 500, {
      success: false,
      error: error.message
    });
  }
};

module.exports.createIdempotencyKey = createIdempotencyKey;
module.exports.sendWithResend = sendWithResend;
