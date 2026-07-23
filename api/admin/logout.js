const {
  authenticateAdmin,
  clearSessionCookies,
  hasAllowedOriginAndHost,
  logAdminEvent,
  revokeSession
} = require('../../server/admin/admin-auth');
const { genericError, json } = require('../../server/admin/admin-response');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, genericError());
  }
  if (!hasAllowedOriginAndHost(req)) {
    return json(res, 400, genericError());
  }

  const session = await authenticateAdmin(req, res);
  if (session) {
    await revokeSession(session.accessToken);
    await logAdminEvent({
      eventType: 'logout',
      userId: session.user.id,
      email: session.user.email || '',
      req
    });
  }
  clearSessionCookies(res);
  return json(res, 200, { success: true });
};
