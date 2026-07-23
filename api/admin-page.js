const { ACCESS_COOKIE, REFRESH_COOKIE, authenticateAdmin, logAdminEvent, parseCookies } = require('../server/admin/admin-auth');
const { applyPrivateHeaders } = require('../server/admin/admin-response');
const { renderAdminDashboard } = require('../server/admin/dashboard-template');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.end('Method not allowed');
    return;
  }

  applyPrivateHeaders(res);
  const cookies = parseCookies(req);
  const session = await authenticateAdmin(req, res);
  if (!session) {
    if (cookies[ACCESS_COOKIE] || cookies[REFRESH_COOKIE]) {
      await logAdminEvent({ eventType: 'session_expired', req, metadata: { route: '/admin' } });
    }
    res.statusCode = 302;
    res.setHeader('Location', '/admin/login');
    res.end();
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(renderAdminDashboard());
};
