const { genericError, json } = require('../server/admin/admin-response');

const handlers = {
  login: require('../server/admin/handlers/login'),
  logout: require('../server/admin/handlers/logout'),
  session: require('../server/admin/handlers/session')
};

module.exports = async function handler(req, res) {
  const action = String(req.query?.action || '');
  const actionHandler = handlers[action];
  return actionHandler
    ? actionHandler(req, res)
    : json(res, 404, genericError());
};
