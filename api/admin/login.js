const {
  checkLoginRateLimit,
  hasAllowedOriginAndHost,
  isAuthorizedAdmin,
  logAdminEvent,
  resetLocalLoginRateLimit,
  setSessionCookies,
  signInWithPassword
} = require('../../server/admin/admin-auth');
const { genericError, json } = require('../../server/admin/admin-response');

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, genericError());
  }
  if (!hasAllowedOriginAndHost(req)) {
    return json(res, 400, genericError());
  }
  const contentType = String(req.headers['content-type'] || '').toLowerCase().split(';')[0].trim();
  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentType !== 'application/json' || !Number.isFinite(contentLength) || contentLength > 4096) {
    return json(res, 400, genericError());
  }

  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const fields = Object.keys(body).sort();
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (fields.join(',') !== 'email,password' || !isValidEmail(email) || password.length < 8 || password.length > 256) {
    return json(res, 400, genericError());
  }

  if (!await checkLoginRateLimit({ email, req })) {
    await logAdminEvent({ eventType: 'login_failure', email, req, metadata: { reason: 'rate_limited' } });
    return json(res, 429, genericError());
  }

  const session = await signInWithPassword({ email, password });
  if (!session?.access_token || !session?.refresh_token || !session?.user?.id) {
    await logAdminEvent({ eventType: 'login_failure', email, req, metadata: { reason: 'invalid_credentials' } });
    return json(res, 401, genericError());
  }

  const authorizedAdmin = await isAuthorizedAdmin(session.user.id);
  if (!authorizedAdmin) {
    await logAdminEvent({
      eventType: 'access_denied',
      userId: session.user.id,
      email,
      req,
      metadata: { reason: 'not_allowlisted' }
    });
    return json(res, 401, genericError());
  }

  setSessionCookies(res, session);
  resetLocalLoginRateLimit({ email, req });
  await logAdminEvent({ eventType: 'login_success', userId: session.user.id, email, req });
  return json(res, 200, { success: true });
};
