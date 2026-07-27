const { serviceRoleRequest } = require('./admin-auth');
const { getDashboardData } = require('./admin-data');

const getAnalyticsDashboard = async ({ days = 30 } = {}, fetchImpl = fetch) => {
  const safeDays = [7, 30, 90, 365].includes(Number(days)) ? Number(days) : 30;
  try {
    const response = await serviceRoleRequest('/rest/v1/rpc/get_admin_analytics_dashboard', {
      method: 'POST',
      body: JSON.stringify({ p_days: safeDays })
    }, fetchImpl);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
};

const getRecentEvents = async ({ days = 7, limit = 20 } = {}, fetchImpl = fetch) => {
  const safeDays = [1, 7, 30].includes(Number(days)) ? Number(days) : 7;
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 20);
  const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    select: 'visitor_id,event_name,occurred_at,device_type,referrer_host,utm_source,page_path',
    occurred_at: `gte.${since}`,
    order: 'occurred_at.desc',
    limit: String(safeLimit)
  });

  try {
    const response = await serviceRoleRequest(
      `/rest/v1/analytics_events?${params}`,
      { method: 'GET' },
      fetchImpl
    );
    if (!response.ok) return null;
    const rows = await response.json();
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
};

const getExecutiveDashboard = async ({ recentDays = 7 } = {}, fetchImpl = fetch) => {
  const safeRecentDays = [1, 7, 30].includes(Number(recentDays)) ? Number(recentDays) : 7;
  const [analytics, leads, recentEvents] = await Promise.all([
    getAnalyticsDashboard({ days: 7 }, fetchImpl),
    getDashboardData({ page: 1, pageSize: 10 }, fetchImpl),
    getRecentEvents({ days: safeRecentDays, limit: 20 }, fetchImpl)
  ]);

  if (!analytics || !leads || !recentEvents) return null;

  const todayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
  const today = (analytics.daily || []).find((row) => row.metric_date === todayKey) || {};
  const uniqueToday = Number(today.unique_visitors) || 0;
  const registrationsToday = Number(leads.metrics?.today) || 0;

  return {
    metrics: {
      visitsToday: Number(today.visits) || 0,
      uniqueVisitorsToday: uniqueToday,
      registrationsToday,
      conversionToday: uniqueToday
        ? Number(((registrationsToday / uniqueToday) * 100).toFixed(2))
        : 0,
      visitsLast7Days: Number(analytics.metrics?.visits) || 0,
      registrationsLast7Days: Number(leads.metrics?.last7Days) || 0
    },
    lastRegistrationAt: leads.leads?.[0]?.created_at || null,
    lastEventAt: recentEvents[0]?.occurred_at || null,
    recentDays: safeRecentDays,
    recentEvents
  };
};

module.exports = { getAnalyticsDashboard, getExecutiveDashboard, getRecentEvents };
