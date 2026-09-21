const ORG = 'reroute-kj';
const PROJECT = 'reroute-app';
const TIMEOUT_MS = 8000;

const getSentryAppStability = async ({ days = 30 } = {}, fetchImpl = fetch) => {
  const token = process.env.SENTRY_API_TOKEN?.trim();
  if (!token) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const params = new URLSearchParams({
      project: PROJECT,
      environment: 'production',
      query: 'is:unresolved',
      statsPeriod: `${[7, 30, 90, 365].includes(Number(days)) ? Number(days) : 30}d`,
      limit: '20'
    });
    const response = await fetchImpl(`https://sentry.io/api/0/organizations/${ORG}/issues/?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    });
    if (!response.ok) return null;
    const issues = await response.json();
    if (!Array.isArray(issues)) return null;
    return {
      unresolved: issues.length,
      issues: issues.slice(0, 10).map((issue) => ({
        id: String(issue.id || ''),
        title: String(issue.title || 'Erro sem título').slice(0, 180),
        count: Number(issue.count) || 0,
        lastSeen: issue.lastSeen || null,
        firstSeen: issue.firstSeen || null,
        level: issue.level || 'error'
      }))
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = { getSentryAppStability };
