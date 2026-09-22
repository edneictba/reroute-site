const { serviceRoleRequest } = require('./admin-auth');

const ALLOWED_ONBOARDING = ['all', 'completed', 'pending', 'no_profile'];
const ALLOWED_PROVIDERS = ['all', 'google', 'email'];
const MAX_PAGE_SIZE = 50;
const USER_KEYS = ['email', 'createdAt', 'lastSignInAt', 'provider', 'onboarding', 'checkins', 'checkouts', 'lastActivityAt'];
const PAGINATION_KEYS = ['page', 'pageSize', 'total', 'totalPages'];
const ONBOARDING_LABELS = ['Sem perfil', 'Pendente', 'Concluído'];
const PROVIDER_LABELS = ['E-mail', 'Google', 'Google + E-mail', 'Outro'];

const invalidParameters = () => new Error('invalid_parameters');

const parseParams = (query = {}) => {
  const page = Number(query.page || 1);
  const pageSize = Number(query.pageSize || 25);
  const search = String(query.search || '').trim();
  const onboarding = String(query.onboarding || 'all').trim().toLowerCase();
  const provider = String(query.provider || 'all').trim().toLowerCase();
  if (!Number.isInteger(page) || page < 1) throw invalidParameters();
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) throw invalidParameters();
  if (!ALLOWED_ONBOARDING.includes(onboarding)) throw invalidParameters();
  if (!ALLOWED_PROVIDERS.includes(provider)) throw invalidParameters();
  return { page, pageSize, search: search || null, onboarding, provider };
};

const isNullableString = (value) => value === null || typeof value === 'string';
const isNonNegativeInteger = (value) => Number.isInteger(value) && value >= 0;

const isValidUser = (user) => user && Object.keys(user).sort().join('|') === USER_KEYS.slice().sort().join('|')
  && isNullableString(user.email)
  && isNullableString(user.createdAt)
  && isNullableString(user.lastSignInAt)
  && (user.provider === null || PROVIDER_LABELS.includes(user.provider))
  && ONBOARDING_LABELS.includes(user.onboarding)
  && isNonNegativeInteger(user.checkins)
  && isNonNegativeInteger(user.checkouts)
  && isNullableString(user.lastActivityAt);

const isValidPayload = (payload, params) => {
  const users = payload?.users;
  const pagination = payload?.pagination;
  if (!Array.isArray(users) || !pagination) return false;
  if (Object.keys(payload).sort().join('|') !== 'pagination|users') return false;
  if (Object.keys(pagination).sort().join('|') !== PAGINATION_KEYS.slice().sort().join('|')) return false;
  if (!Number.isInteger(pagination.page) || pagination.page !== params.page) return false;
  if (!Number.isInteger(pagination.pageSize) || pagination.pageSize !== params.pageSize) return false;
  if (!isNonNegativeInteger(pagination.total) || !isNonNegativeInteger(pagination.totalPages)) return false;
  if (users.length > params.pageSize || pagination.totalPages < 0) return false;
  return users.every(isValidUser);
};

const getAdminUsers = async ({ query = {} } = {}, fetchImpl = fetch) => {
  let params;
  try {
    params = parseParams(query);
  } catch {
    const error = invalidParameters();
    error.code = 'invalid_parameters';
    throw error;
  }

  try {
    const response = await serviceRoleRequest('/rest/v1/rpc/get_admin_users', {
      method: 'POST',
      body: JSON.stringify({
        p_page: params.page,
        p_page_size: params.pageSize,
        p_search: params.search,
        p_onboarding: params.onboarding,
        p_provider: params.provider
      })
    }, fetchImpl);
    if (!response.ok) throw Object.assign(new Error('users_data_unavailable'), { code: 'users_data_unavailable' });
    const payload = await response.json();
    if (!isValidPayload(payload, params)) throw Object.assign(new Error('users_data_unavailable'), { code: 'users_data_unavailable' });
    return payload;
  } catch (error) {
    if (error?.code === 'invalid_parameters' || error?.code === 'users_data_unavailable') throw error;
    if (error?.name === 'AbortError' || error?.code === 'ABORT_ERR') {
      throw Object.assign(new Error('users_data_timeout'), { code: 'users_data_timeout' });
    }
    throw Object.assign(new Error('users_data_unavailable'), { code: 'users_data_unavailable' });
  }
};

module.exports = { ALLOWED_ONBOARDING, ALLOWED_PROVIDERS, getAdminUsers, isValidPayload, parseParams };
