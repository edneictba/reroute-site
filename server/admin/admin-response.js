const applyPrivateHeaders = (res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
};

const json = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  applyPrivateHeaders(res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const genericError = () => ({ success: false, message: 'Não foi possível concluir esta operação.' });

module.exports = { applyPrivateHeaders, genericError, json };
