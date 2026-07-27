const { genericError, json } = require('../server/admin/admin-response');

const handlers = {
  analytics: require('../server/admin/handlers/page-analytics'),
  dashboard: require('../server/admin/handlers/page-dashboard'),
  leads: require('../server/admin/handlers/page-leads'),
  settings: require('../server/admin/handlers/page-settings')
};

module.exports = async function handler(req, res) {
  const page = String(req.query?.page || '');
  const pageHandler = handlers[page];
  return pageHandler
    ? pageHandler(req, res)
    : json(res, 404, genericError());
};
