const { authenticateAdmin } = require('../admin-auth');
const { getAdminUsers } = require('../users-data');
const { json } = require('../admin-response');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { success: false, error: 'method_not_allowed' });
  }
  if (!await authenticateAdmin(req, res)) {
    return json(res, 401, { success: false, error: 'unauthorized' });
  }
  try {
    const data = await getAdminUsers({ query: req.query }, fetch);
    return json(res, 200, { success: true, data });
  } catch (error) {
    if (error.code === 'invalid_parameters') return json(res, 400, { success: false, error: 'invalid_parameters' });
    if (error.code === 'users_data_timeout') return json(res, 504, { success: false, error: 'users_data_timeout' });
    return json(res, 502, { success: false, error: 'users_data_unavailable' });
  }
};
