const {
  genericFailure,
  getRequestIp,
  hasAllowedOriginAndHost,
  readJsonBody,
  registerLead,
  validateRegistrationPayload,
  verifyTurnstile
} = require('../server/lead-registration');
const { sendWelcomeEmail } = require('../server/resend-client');

const json = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(payload));
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, genericFailure(405));
  }

  const contentType = String(req.headers['content-type'] || '').toLowerCase().split(';')[0].trim();

  if (contentType !== 'application/json' || !hasAllowedOriginAndHost(req)) {
    return json(res, 400, genericFailure());
  }

  const bodyResult = await readJsonBody(req);
  const validation = bodyResult.valid ? validateRegistrationPayload(bodyResult.payload) : { valid: false };

  if (!validation.valid) {
    return json(res, 400, genericFailure());
  }

  const ip = getRequestIp(req);
  const turnstile = await verifyTurnstile({
    token: validation.data.turnstileToken,
    ip,
    expectedHostname: String(req.headers.host || '').split(':')[0].toLowerCase()
  });

  if (!turnstile.success) {
    console.warn('Cadastro bloqueado pelo Turnstile.', { reason: turnstile.reason });
    return json(res, 400, genericFailure());
  }

  const registration = await registerLead({ ...validation.data, ip });

  if (registration.rateLimited) {
    console.warn('Cadastro bloqueado por rate limit.');
    return json(res, 429, genericFailure(429));
  }

  if (!registration.success) {
    console.error('Falha interna ao registrar lead.', { reason: registration.reason });
    return json(res, 500, genericFailure(500));
  }

  if (registration.status === 'created') {
    const emailResult = await sendWelcomeEmail(validation.data);

    if (!emailResult.success) {
      console.error('Lead criado; envio de boas-vindas falhou.', { reason: emailResult.reason });
    }
  }

  return json(res, 200, {
    success: true,
    message: 'Cadastro recebido.'
  });
};
