const {
  hasAllowedOriginAndHost,
  isRateLimited,
  saveAnalyticsEvent,
  validateAnalyticsEvent
} = require('../server/analytics-event');
const { genericError, json } = require('../server/admin/admin-response');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, genericError());
  }
  if (!hasAllowedOriginAndHost(req)) {
    return json(res, 403, genericError());
  }
  if (isRateLimited(req)) {
    return json(res, 429, genericError());
  }

  const event = validateAnalyticsEvent(req.body);
  if (!event) {
    return json(res, 400, genericError());
  }

  const saved = await saveAnalyticsEvent(event);
  return saved
    ? json(res, 202, { success: true })
    : json(res, 500, genericError());
};
