const { authenticateAdmin } = require('../../server/admin/admin-auth');
const { getDashboardData } = require('../../server/admin/admin-data');
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

  const data = await getDashboardData({
    search: req.query?.search,
    page: req.query?.page,
    pageSize: req.query?.pageSize
  });
  return data
    ? json(res, 200, { success: true, data })
    : json(res, 500, genericError());
};
