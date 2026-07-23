const { authenticateAdmin } = require('../../server/admin/admin-auth');
const { genericError, json } = require('../../server/admin/admin-response');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, genericError());
  }
  const session = await authenticateAdmin(req, res);
  if (!session) {
    return json(res, 401, genericError());
  }
  return json(res, 200, {
    success: true,
    user: { email: session.user.email || '' }
  });
};
