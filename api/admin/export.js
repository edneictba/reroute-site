const { authenticateAdmin } = require('../../server/admin/admin-auth');
const { createCsv, getExportRows } = require('../../server/admin/admin-data');
const { applyPrivateHeaders, genericError, json } = require('../../server/admin/admin-response');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, genericError());
  }
  const session = await authenticateAdmin(req, res);
  if (!session) {
    return json(res, 401, genericError());
  }

  const rows = await getExportRows();
  if (!rows) {
    return json(res, 500, genericError());
  }

  const date = new Date().toISOString().slice(0, 10);
  applyPrivateHeaders(res);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="reroute-leads-${date}.csv"`);
  res.end(createCsv(rows));
};
