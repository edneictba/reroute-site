const { serviceRoleRequest } = require('./admin-auth');

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

module.exports = { getAnalyticsDashboard };
