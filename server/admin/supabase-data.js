const { serviceRoleRequest } = require('./admin-auth');

const ALLOWED_DAYS = [7, 30, 90, 365];
const TIMEZONE = 'America/Sao_Paulo';
const RPC_PATH = '/rest/v1/rpc/get_admin_app_operational_analytics';

const safeDays = (value) => ALLOWED_DAYS.includes(Number(value)) ? Number(value) : 30;
const isCount = (value) => Number.isInteger(value) && value >= 0;

const isDailySeries = (value) => Array.isArray(value) && value.every((row) => (
  row && typeof row.day === 'string' && isCount(row.events) && isCount(row.users)
));

const isValidPayload = (payload) => {
  const period = payload?.period;
  const users = payload?.users;
  const journey = payload?.journey;
  if (!period || !users || !journey) return false;
  if (!ALLOWED_DAYS.includes(Number(period.days)) || period.timezone !== TIMEZONE) return false;
  if (![period.startDate, period.endDate, period.startUtc, period.endUtc]
    .every((value) => typeof value === 'string' && value.length > 0)) return false;
  const countKeys = [
    'registeredAccounts', 'newAccounts', 'profiles', 'onboardingCompleted',
    'onboardingCompletedInPeriod', 'pendingProfiles', 'accountsWithoutProfile'
  ];
  if (!countKeys.every((key) => isCount(users[key]))) return false;
  if (!(users.profileCompletionRate === null
    || (typeof users.profileCompletionRate === 'number' && Number.isFinite(users.profileCompletionRate)))) return false;
  if (!['checkinUsers', 'checkins', 'checkoutUsers', 'checkouts'].every((key) => isCount(journey[key]))) return false;
  return isDailySeries(journey.checkinsDaily) && isDailySeries(journey.checkoutsDaily);
};

const getSupabaseAppAnalytics = async ({ days = 30 } = {}, fetchImpl = fetch) => {
  const periodDays = safeDays(days);
  try {
    const response = await serviceRoleRequest(RPC_PATH, {
      method: 'POST',
      body: JSON.stringify({ p_days: periodDays })
    }, fetchImpl);
    if (!response.ok) return null;
    const payload = await response.json();
    if (!isValidPayload(payload)) return null;
    return { status: 'ok', ...payload };
  } catch {
    return null;
  }
};

module.exports = { getSupabaseAppAnalytics, isValidPayload, safeDays };
