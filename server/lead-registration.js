const crypto = require('node:crypto');

const MAX_BODY_BYTES = 8192;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const MAX_WHATSAPP_LENGTH = 16;
const TURNSTILE_TOKEN_MAX_LENGTH = 2048;
const TURNSTILE_VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const UPSTREAM_TIMEOUT_MS = 8000;

const genericFailure = () => ({
  success: false,
  message: 'Nao foi possivel concluir o cadastro. Tente novamente.'
});

const hasControlCharacters = (value = '') => /[\u0000-\u001F\u007F]/.test(String(value));
const normalizeName = (value = '') => String(value).trim().replace(/\s+/g, ' ');
const normalizeEmail = (value = '') => String(value).trim().toLowerCase();
const isValidEmail = (value = '') => value.length <= MAX_EMAIL_LENGTH && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
const isValidWhatsapp = (value = '') => value.length <= MAX_WHATSAPP_LENGTH && /^\+[1-9]\d{7,14}$/.test(value);

const validateRegistrationPayload = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false };
  }

  const allowedFields = ['email', 'name', 'turnstileToken', 'whatsapp'];
  const fields = Object.keys(payload).sort();

  if (fields.length !== allowedFields.length || fields.some((field, index) => field !== allowedFields[index])) {
    return { valid: false };
  }

  if (Object.values(payload).some((value) => typeof value !== 'string')) {
    return { valid: false };
  }

  const name = normalizeName(payload.name);
  const email = normalizeEmail(payload.email);
  const whatsapp = payload.whatsapp.trim();
  const turnstileToken = payload.turnstileToken.trim();

  if (
    name.length < 2 ||
    name.length > MAX_NAME_LENGTH ||
    hasControlCharacters(name) ||
    /[<>]/.test(name) ||
    hasControlCharacters(email) ||
    !isValidEmail(email) ||
    !isValidWhatsapp(whatsapp) ||
    !turnstileToken ||
    turnstileToken.length > TURNSTILE_TOKEN_MAX_LENGTH ||
    hasControlCharacters(turnstileToken)
  ) {
    return { valid: false };
  }

  return {
    valid: true,
    data: { name, email, whatsapp, turnstileToken }
  };
};

const getRequestIp = (req) => {
  const candidates = [
    req.headers['cf-connecting-ip'],
    req.headers['x-real-ip'],
    String(req.headers['x-forwarded-for'] || '').split(',')[0],
    req.socket?.remoteAddress
  ];

  const candidate = candidates.find((value) => typeof value === 'string' && value.trim());
  return String(candidate || 'unknown').trim().slice(0, 64);
};

const getAllowedSite = () => {
  try {
    return new URL(process.env.REROUTE_SITE_URL || 'https://www.reroute.com.br');
  } catch {
    return null;
  }
};

const isLocalDevelopmentRequest = (origin, host) => (
  process.env.NODE_ENV !== 'production' &&
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) &&
  /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)
);

const hasAllowedOriginAndHost = (req) => {
  const origin = String(req.headers.origin || '').replace(/\/+$/, '');
  const host = String(req.headers.host || '').toLowerCase();
  const allowedSite = getAllowedSite();

  if (!origin || !host || !allowedSite) {
    return false;
  }

  return (
    origin === allowedSite.origin && host === allowedSite.host.toLowerCase()
  ) || isLocalDevelopmentRequest(origin, host);
};

const readJsonBody = async (req) => {
  const contentLength = Number(req.headers['content-length'] || 0);

  if (!Number.isFinite(contentLength) || contentLength > MAX_BODY_BYTES) {
    return { valid: false };
  }

  if (req.body && typeof req.body === 'object') {
    return { valid: true, payload: req.body };
  }

  if (typeof req.body === 'string') {
    try {
      return { valid: true, payload: JSON.parse(req.body) };
    } catch {
      return { valid: false };
    }
  }

  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;

    if (size > MAX_BODY_BYTES) {
      return { valid: false };
    }

    chunks.push(chunk);
  }

  try {
    const rawBody = Buffer.concat(chunks).toString('utf8');
    return { valid: true, payload: rawBody ? JSON.parse(rawBody) : {} };
  } catch {
    return { valid: false };
  }
};

const verifyTurnstile = async ({ token, ip, expectedHostname, fetchImpl = fetch }) => {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return { success: false, reason: 'turnstile_not_configured' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetchImpl(TURNSTILE_VERIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: ip,
        idempotency_key: crypto.randomUUID()
      }).toString(),
      signal: controller.signal
    });
    const result = response.ok ? await response.json() : null;
    const hostnameMatches = result?.hostname === expectedHostname;
    const actionMatches = result?.action === 'waitlist_registration';

    return {
      success: Boolean(result?.success && hostnameMatches && actionMatches),
      reason: result?.success ? 'metadata_mismatch' : 'challenge_failed'
    };
  } catch {
    return { success: false, reason: 'verification_unavailable' };
  } finally {
    clearTimeout(timeout);
  }
};

const hashRateLimitValue = (value) => {
  const secret = process.env.LEAD_RATE_LIMIT_SECRET;

  if (!secret || secret.length < 32) {
    return '';
  }

  return crypto.createHmac('sha256', secret).update(String(value)).digest('hex');
};

const registerLead = async ({ name, email, whatsapp, ip, fetchImpl = fetch }) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ipHash = hashRateLimitValue(ip);
  const emailHash = hashRateLimitValue(email);

  if (!supabaseUrl || !serviceRoleKey || !ipHash || !emailHash) {
    return { success: false, reason: 'registration_not_configured' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetchImpl(`${String(supabaseUrl).replace(/\/+$/, '')}/rest/v1/rpc/register_public_lead`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_name: name,
        p_email: email,
        p_whatsapp: whatsapp,
        p_ip_hash: ipHash,
        p_email_hash: emailHash
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      return { success: false, reason: 'database_rejected' };
    }

    const result = await response.json();
    const status = Array.isArray(result) ? result[0]?.result : result?.result ?? result;

    if (!['created', 'existing', 'rate_limited'].includes(status)) {
      return { success: false, reason: 'invalid_database_response' };
    }

    return { success: status !== 'rate_limited', rateLimited: status === 'rate_limited', status };
  } catch {
    return { success: false, reason: 'database_unavailable' };
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  MAX_BODY_BYTES,
  genericFailure,
  getAllowedSite,
  getRequestIp,
  hasAllowedOriginAndHost,
  hashRateLimitValue,
  readJsonBody,
  registerLead,
  validateRegistrationPayload,
  verifyTurnstile
};
