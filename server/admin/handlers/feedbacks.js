const { authenticateAdmin } = require('../admin-auth');
const { genericError, json } = require('../admin-response');
const { getFeedbacks, updateFeedbackStatus } = require('../feedbacks-data');

module.exports = async function handler(req, res) {
  if (!await authenticateAdmin(req, res)) return json(res, 401, genericError());
  try {
    if (req.method === 'GET') {
      const feedbacks = await getFeedbacks();
      return feedbacks ? json(res, 200, { success: true, data: feedbacks }) : json(res, 502, genericError());
    }
    if (req.method === 'PATCH') {
      const updated = await updateFeedbackStatus(req.body?.id, req.body?.status);
      return updated ? json(res, 200, { success: true }) : json(res, 400, genericError());
    }
    res.setHeader('Allow', 'GET, PATCH'); return json(res, 405, genericError());
  } catch { return json(res, 502, genericError()); }
};
