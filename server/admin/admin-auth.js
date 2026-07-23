const crypto = require('node:crypto');

const ACCESS_COOKIE = 'reroute_admin_access';
const REFRESH_COOKIE = 'reroute_admin_refresh';
const REQUEST_TIMEOUT_MS = 8000;
const LOCAL_LOGIN_WINDOW_MS = 60 * 1000;
const LOCAL_LOGIN_MAX_ATTEMPTS = 20;
const localLoginAttempts = new Map();

const getConfig = () => ({
  supabaseUrl: String(process.env.SUPABASE_URL || '').replace(/\/+$/, ''),
  anonKey: String(process.env.SUPABASE_ANON_KEY || ''),
  serviceRoleKey: String(process.env.SUPABASE_SERVICE_ROLE_KEY || ''),
  auditSecret: String(process.env.ADMIN_AUDIT_SECRET || '')
});

const fetchWithTimeout = async (url, options = {}, fetchImpl = fetch) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetchImpl(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const parseCookies = (req) => Object.fromEntries(
  String(req.headers.cookie || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separator = part.indexOf('=');
      return separator < 0
        ? [part, '']
        : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
    })
);

const serializeCookie = (name, value, maxAge) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=${Math.max(0, Math.floor(maxAge))}`;
};

const appendCookies = (res, cookies) => {
  const existing = res.getHeader?.('Set-Cookie');
  const values = Array.isArray(existing) ? existing : existing ? [existing] : [];
  res.setHeader('Set-Cookie', [...values, ...cookies]);
};

const setSessionCookies = (res, session) => {
  appendCookies(res, [
    serializeCookie(ACCESS_COOKIE, session.access_token, Math.max(Number(session.expires_in || 3600) - 30, 60)),
    serializeCookie(REFRESH_COOKIE, session.refresh_token, 60 * 60 * 24 * 30)
  ]);
};

const clearSessionCookies = (res) => {
  appendCookies(res, [
    serializeCookie(ACCESS_COOKIE, '', 0),
    serializeCookie(REFRESH_COOKIE, '', 0)
  ]);
};

const getRequestIp = (req) => {
  const candidates = [
    req.headers['cf-connecting-ip'],
    req.headers['x-real-ip'],
    String(req.headers['x-forwarded-for'] || '').split(',')[0],
    req.socket?.remoteAddress
  ];
  return String(candidates.find((value) => typeof value === 'string' && value.trim()) || 'unknown').trim().slice(0, 64);
};

const isLocalDevelopmentRequest = (req) => {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  const origin = String(req.headers.origin || '').replace(/\/+$/, '');
  const host = String(req.headers.host || '').toLowerCase();
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
};

const hashAuditValue = (value) => {
  const { auditSecret } = getConfig();
  if (auditSecret.length < 32) {
    return '';
  }
  return crypto.createHmac('sha256', auditSecret).update(String(value || '')).digest('hex');
};

const serviceRoleRequest = async (path, options = {}, fetchImpl = fetch) => {
  const { supabaseUrl, serviceRoleKey } = getConfig();
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('admin_service_not_configured');
  }

  const authorizationHeaders = serviceRoleKey.startsWith('sb_secret_')
    ? {}
    : { Authorization: `Bearer ${serviceRoleKey}` };

  return fetchWithTimeout(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      ...authorizationHeaders,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  }, fetchImpl);
};

const callAdminRpc = async (functionName, body, fetchImpl = fetch) => {
  const response = await serviceRoleRequest(`/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    body: JSON.stringify(body)
  }, fetchImpl);

  if (!response.ok) {
    throw new Error('admin_rpc_failed');
  }
  return response.json();
};

const logAdminEvent = async ({ eventType, userId = null, email = '', req, metadata = {} }, fetchImpl = fetch) => {
  const ipHash = hashAuditValue(getRequestIp(req));
  const emailHash = email ? hashAuditValue(String(email).trim().toLowerCase()) : null;
  if (!ipHash || (email && !emailHash)) {
    return false;
  }

  try {
    await callAdminRpc('record_admin_access_event', {
      p_event_type: eventType,
      p_user_id: userId,
      p_email_hash: emailHash,
      p_ip_hash: ipHash,
      p_metadata: metadata
    }, fetchImpl);
    return true;
  } catch {
    return false;
  }
};

const checkLoginRateLimit = async ({ email, req }, fetchImpl = fetch) => {
  if (isLocalDevelopmentRequest(req)) {
    const now = Date.now();
    const key = `${getRequestIp(req)}:${String(email).trim().toLowerCase()}`;
    const recentAttempts = (localLoginAttempts.get(key) || [])
      .filter((timestamp) => now - timestamp < LOCAL_LOGIN_WINDOW_MS);
    if (recentAttempts.length >= LOCAL_LOGIN_MAX_ATTEMPTS) {
      localLoginAttempts.set(key, recentAttempts);
      return false;
    }
    recentAttempts.push(now);
    localLoginAttempts.set(key, recentAttempts);
    return true;
  }

  const ipHash = hashAuditValue(getRequestIp(req));
  const emailHash = hashAuditValue(String(email).trim().toLowerCase());
  if (!ipHash || !emailHash) {
    return false;
  }

  try {
    const result = await callAdminRpc('check_admin_login_rate_limit', {
      p_ip_hash: ipHash,
      p_email_hash: emailHash
    }, fetchImpl);
    return result === true;
  } catch {
    return false;
  }
};

const resetLocalLoginRateLimit = ({ email, req }) => {
  if (!isLocalDevelopmentRequest(req)) {
    return;
  }
  const key = `${getRequestIp(req)}:${String(email).trim().toLowerCase()}`;
  localLoginAttempts.delete(key);
};

const authRequest = async (path, options = {}, fetchImpl = fetch) => {
  const { supabaseUrl, anonKey } = getConfig();
  if (!supabaseUrl || !anonKey) {
    throw new Error('admin_auth_not_configured');
  }
  return fetchWithTimeout(`${supabaseUrl}/auth/v1${path}`, {
    ...options,
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  }, fetchImpl);
};

const signInWithPassword = async ({ email, password }, fetchImpl = fetch) => {
  try {
    const response = await authRequest('/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }, fetchImpl);
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
};

const refreshSession = async (refreshToken, fetchImpl = fetch) => {
  if (!refreshToken || refreshToken.length > 4096) {
    return null;
  }
  try {
    const response = await authRequest('/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken })
    }, fetchImpl);
    return response.ok ? response.json() : null;
  } catch {
    return null;
  }
};

const getAuthUser = async (accessToken, fetchImpl = fetch) => {
  if (!accessToken || accessToken.length > 4096) {
    return null;
  }
  try {
    const response = await authRequest('/user', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    }, fetchImpl);
    return response.ok ? response.json() : null;
  } catch {
    return null;
  }
};

const isAuthorizedAdmin = async (userId, fetchImpl = fetch) => {
  if (!/^[0-9a-f-]{36}$/i.test(String(userId || ''))) {
    return false;
  }
  try {
    const response = await serviceRoleRequest(
      `/rest/v1/admin_users?user_id=eq.${encodeURIComponent(userId)}&is_active=eq.true&select=user_id&limit=1`,
      { method: 'GET' },
      fetchImpl
    );
    if (!response.ok) {
      const responseBody = typeof response.text === 'function'
        ? await response.text()
        : JSON.stringify(await response.json().catch(() => null));
      if (process.env.NODE_ENV !== 'production') {
        console.error('[admin-auth] public.admin_users rejected', {
          status: response.status,
          body: responseBody
        });
      }
      return false;
    }
    const rows = await response.json();
    return Array.isArray(rows) && rows.length === 1;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[admin-auth] public.admin_users failed', { message: error.message });
    }
    return false;
  }
};

const authenticateAdmin = async (req, res, fetchImpl = fetch) => {
  const cookies = parseCookies(req);
  let accessToken = cookies[ACCESS_COOKIE];
  let user = await getAuthUser(accessToken, fetchImpl);

  if (!user && cookies[REFRESH_COOKIE]) {
    const refreshed = await refreshSession(cookies[REFRESH_COOKIE], fetchImpl);
    if (refreshed?.access_token && refreshed?.refresh_token) {
      setSessionCookies(res, refreshed);
      accessToken = refreshed.access_token;
      user = refreshed.user || await getAuthUser(accessToken, fetchImpl);
    }
  }

  if (!user || !await isAuthorizedAdmin(user.id, fetchImpl)) {
    clearSessionCookies(res);
    return null;
  }

  return { user, accessToken };
};

const revokeSession = async (accessToken, fetchImpl = fetch) => {
  if (!accessToken) {
    return false;
  }
  try {
    const response = await authRequest('/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` }
    }, fetchImpl);
    return response.ok;
  } catch {
    return false;
  }
};

const hasAllowedOriginAndHost = (req) => {
  let allowed;
  try {
    allowed = new URL(process.env.REROUTE_SITE_URL || 'https://www.reroute.com.br');
  } catch {
    return false;
  }
  const origin = String(req.headers.origin || '').replace(/\/+$/, '');
  const host = String(req.headers.host || '').toLowerCase();
  const local = process.env.NODE_ENV !== 'production'
    && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  return local || (origin === allowed.origin && host === allowed.host.toLowerCase());
};

module.exports = {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  authenticateAdmin,
  checkLoginRateLimit,
  clearSessionCookies,
  getRequestIp,
  hasAllowedOriginAndHost,
  isAuthorizedAdmin,
  logAdminEvent,
  parseCookies,
  resetLocalLoginRateLimit,
  revokeSession,
  serviceRoleRequest,
  setSessionCookies,
  signInWithPassword
};
