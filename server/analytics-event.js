const { hasAllowedOriginAndHost, serviceRoleRequest } = require('./admin/admin-auth');

const EVENT_NAMES = new Set([
  'page_view',
  'page_duration',
  'scroll_depth',
  'cta_click',
  'form_open',
  'form_start',
  'form_abandon',
  'form_submit'
]);
const DEVICES = new Set(['desktop', 'tablet', 'mobile', 'unknown']);
const MAX_REQUESTS_PER_MINUTE = 120;
const requestWindows = new Map();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const allowedFields = new Set([
  'visitorId',
  'sessionId',
  'eventName',
  'pagePath',
  'referrerHost',
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'utmContent',
  'utmTerm',
  'deviceType',
  'browser',
  'operatingSystem',
  'language',
  'screenWidth',
  'screenHeight',
  'durationSeconds',
  'scrollPercent',
  'eventData',
  'occurredAt'
]);

const getClientKey = (req) => String(
  req.headers['cf-connecting-ip']
  || req.headers['x-real-ip']
  || String(req.headers['x-forwarded-for'] || '').split(',')[0]
  || req.socket?.remoteAddress
  || 'unknown'
).trim().slice(0, 64);

const isRateLimited = (req) => {
  const now = Date.now();
  const key = getClientKey(req);
  const recent = (requestWindows.get(key) || []).filter((timestamp) => now - timestamp < 60_000);
  if (recent.length >= MAX_REQUESTS_PER_MINUTE) {
    requestWindows.set(key, recent);
    return true;
  }
  recent.push(now);
  requestWindows.set(key, recent);
  return false;
};

const cleanText = (value, maxLength, { nullable = false } = {}) => {
  const normalized = String(value ?? '').trim();
  if (!normalized && nullable) return null;
  return normalized.slice(0, maxLength);
};

const cleanEventData = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result = {};
  for (const [key, rawValue] of Object.entries(value).slice(0, 12)) {
    const normalizedKey = cleanText(key, 40);
    if (!/^[a-zA-Z0-9_-]+$/.test(normalizedKey)) continue;
    if (typeof rawValue === 'boolean' || typeof rawValue === 'number') {
      result[normalizedKey] = rawValue;
    } else if (typeof rawValue === 'string') {
      result[normalizedKey] = cleanText(rawValue, 200);
    }
  }
  return result;
};

const validateAnalyticsEvent = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  if (Object.keys(payload).some((key) => !allowedFields.has(key))) return null;
  if (!UUID_PATTERN.test(String(payload.visitorId || '')) || !UUID_PATTERN.test(String(payload.sessionId || ''))) return null;
  if (!EVENT_NAMES.has(payload.eventName) || !DEVICES.has(payload.deviceType)) return null;

  const pagePath = cleanText(payload.pagePath, 300);
  const screenWidth = Number.parseInt(payload.screenWidth, 10);
  const screenHeight = Number.parseInt(payload.screenHeight, 10);
  const durationSeconds = payload.durationSeconds == null ? null : Number.parseInt(payload.durationSeconds, 10);
  const scrollPercent = payload.scrollPercent == null ? null : Number.parseInt(payload.scrollPercent, 10);
  const occurredAt = new Date(payload.occurredAt);

  if (
    !pagePath.startsWith('/')
    || /[?#]/.test(pagePath)
    || !Number.isInteger(screenWidth)
    || screenWidth < 1
    || screenWidth > 20000
    || !Number.isInteger(screenHeight)
    || screenHeight < 1
    || screenHeight > 20000
    || (durationSeconds !== null && (!Number.isInteger(durationSeconds) || durationSeconds < 0 || durationSeconds > 86400))
    || (scrollPercent !== null && (!Number.isInteger(scrollPercent) || scrollPercent < 0 || scrollPercent > 100))
    || Number.isNaN(occurredAt.getTime())
    || Math.abs(Date.now() - occurredAt.getTime()) > 24 * 60 * 60 * 1000
  ) {
    return null;
  }

  return {
    visitor_id: payload.visitorId,
    session_id: payload.sessionId,
    event_name: payload.eventName,
    page_path: pagePath,
    referrer_host: cleanText(payload.referrerHost, 253, { nullable: true }),
    utm_source: cleanText(payload.utmSource, 100, { nullable: true }),
    utm_medium: cleanText(payload.utmMedium, 100, { nullable: true }),
    utm_campaign: cleanText(payload.utmCampaign, 150, { nullable: true }),
    utm_content: cleanText(payload.utmContent, 150, { nullable: true }),
    utm_term: cleanText(payload.utmTerm, 150, { nullable: true }),
    device_type: payload.deviceType,
    browser: cleanText(payload.browser, 50) || 'Unknown',
    operating_system: cleanText(payload.operatingSystem, 50) || 'Unknown',
    language: cleanText(payload.language, 20) || 'unknown',
    screen_width: screenWidth,
    screen_height: screenHeight,
    duration_seconds: durationSeconds,
    scroll_percent: scrollPercent,
    event_data: cleanEventData(payload.eventData),
    occurred_at: occurredAt.toISOString()
  };
};

const saveAnalyticsEvent = async (event, fetchImpl = fetch) => {
  try {
    const response = await serviceRoleRequest('/rest/v1/analytics_events', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(event)
    }, fetchImpl);
    return response.ok;
  } catch {
    return false;
  }
};

module.exports = {
  hasAllowedOriginAndHost,
  isRateLimited,
  saveAnalyticsEvent,
  validateAnalyticsEvent
};
