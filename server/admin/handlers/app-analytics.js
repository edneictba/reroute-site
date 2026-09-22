const { authenticateAdmin } = require('../admin-auth');
const { getPostHogAppAnalytics } = require('../posthog-data');
const { getSentryAppStability } = require('../sentry-data');
const { getSupabaseAppAnalytics } = require('../supabase-data');
const { genericError, json } = require('../admin-response');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, genericError());
  }
  const session = await authenticateAdmin(req, res);
  if (!session) return json(res, 401, genericError());

  const results = await Promise.allSettled([
    getSupabaseAppAnalytics({ days: req.query?.days }),
    getPostHogAppAnalytics({ days: req.query?.days }),
    getSentryAppStability({ days: req.query?.days })
  ]);
  const [supabaseResult, posthogResult, sentryResult] = results;
  const supabase = supabaseResult.status === 'fulfilled' ? supabaseResult.value : null;
  const posthog = posthogResult.status === 'fulfilled' ? posthogResult.value : null;
  const sentry = sentryResult.status === 'fulfilled' ? sentryResult.value : null;
  return json(res, 200, {
    success: true,
    data: {
      period: supabase?.period || null,
      app: { supabase, posthog, sentry },
      sources: {
        supabase: Boolean(supabase),
        posthog: Boolean(posthog),
        sentry: Boolean(sentry)
      }
    }
  });
};
