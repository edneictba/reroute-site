const PROJECT_ID = '556954';
const HOST = 'https://us.posthog.com';
const EVENT_NAMES = ['abriu_tela', 'login_concluido', 'concluiu_onboarding'];
const TIMEOUT_MS = 8000;

const safeDays = (value) => [7, 30, 90, 365].includes(Number(value)) ? Number(value) : 30;

const query = (days) => ({
  kind: 'HogQLQuery',
  query: `SELECT
    count(DISTINCT distinct_id) AS active_users,
    count(DISTINCT if(event = 'abriu_tela', distinct_id, NULL)) AS app_users,
    countIf(event = 'login_concluido') AS completed_logins,
    countIf(event = 'concluiu_onboarding') AS completed_onboardings
  FROM events
  WHERE timestamp >= now() - INTERVAL ${days} DAY
    AND event IN (${EVENT_NAMES.map((name) => `'${name}'`).join(', ')})`
});

const trendQuery = (days) => ({
  kind: 'HogQLQuery',
  query: `SELECT
    toDate(timestamp) AS day,
    count(DISTINCT distinct_id) AS active_users,
    countIf(event = 'abriu_tela') AS screen_views
  FROM events
  WHERE timestamp >= now() - INTERVAL ${days} DAY
  GROUP BY day
  ORDER BY day ASC`
});

const screensQuery = (days) => ({
  kind: 'HogQLQuery',
  query: `SELECT
    properties.tela AS screen,
    count() AS views,
    count(DISTINCT distinct_id) AS users
  FROM events
  WHERE timestamp >= now() - INTERVAL ${days} DAY
    AND event = 'abriu_tela'
  GROUP BY screen
  ORDER BY views DESC
  LIMIT 20`
});

const request = async (body, fetchImpl = fetch) => {
  const key = process.env.POSTHOG_ADMIN_API_KEY?.trim();
  if (!key) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchImpl(`${HOST}/api/projects/${PROJECT_ID}/query/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: body }),
      signal: controller.signal
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const rows = (payload) => Array.isArray(payload?.results) ? payload.results : [];

const getPostHogAppAnalytics = async ({ days = 30 } = {}, fetchImpl = fetch) => {
  const periodDays = safeDays(days);
  const [summary, trend, screens] = await Promise.all([
    request(query(periodDays), fetchImpl),
    request(trendQuery(periodDays), fetchImpl),
    request(screensQuery(periodDays), fetchImpl)
  ]);
  if (!summary || !trend || !screens) return null;
  const [summaryRow = []] = rows(summary);
  return {
    periodDays,
    metrics: {
      activeUsers: Number(summaryRow[0]) || 0,
      appUsers: Number(summaryRow[1]) || 0,
      completedLogins: Number(summaryRow[2]) || 0,
      completedOnboardings: Number(summaryRow[3]) || 0
    },
    daily: rows(trend).map((row) => ({ day: String(row[0] || ''), activeUsers: Number(row[1]) || 0, screenViews: Number(row[2]) || 0 })),
    screens: rows(screens).map((row) => ({ screen: typeof row[0] === 'string' ? row[0] : 'Não identificada', views: Number(row[1]) || 0, users: Number(row[2]) || 0 }))
  };
};

module.exports = { getPostHogAppAnalytics };
