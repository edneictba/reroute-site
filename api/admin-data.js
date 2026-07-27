const { genericError, json } = require('../server/admin/admin-response');

const handlers = {
  analytics: require('../server/admin/handlers/analytics'),
  dashboard: require('../server/admin/handlers/dashboard'),
  export: require('../server/admin/handlers/export'),
  leads: require('../server/admin/handlers/leads')
};

module.exports = async function handler(req, res) {
  const action = String(req.query?.action || '');
  const actionHandler = handlers[action];
  return actionHandler
    ? actionHandler(req, res)
    : json(res, 404, genericError());
};
