const { authenticateAdmin } = require('../admin-auth');
const { getPostHogAppAnalytics } = require('../posthog-data');
const { getSentryAppStability } = require('../sentry-data');
const { genericError, json } = require('../admin-response');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, genericError());
  }
  const session = await authenticateAdmin(req, res);
  if (!session) return json(res, 401, genericError());

  const [posthog, sentry] = await Promise.all([
    getPostHogAppAnalytics({ days: req.query?.days }),
    getSentryAppStability({ days: req.query?.days })
  ]);
  return json(res, 200, {
    success: true,
    data: {
      app: { posthog, sentry },
      sources: { posthog: Boolean(posthog), sentry: Boolean(sentry) }
    }
  });
};
