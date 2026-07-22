const crypto = require('node:crypto');
const { renderWelcomeEmail } = require('../src/emails/templates/welcome-email');
const { getFirstName, normalizeEmail } = require('../src/emails/utils/email-validation');

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const REPLY_TO = 'contato@reroute.com.br';
const RESEND_TIMEOUT_MS = 8000;

const createIdempotencyKey = (email) => {
  const hash = crypto.createHash('sha256').update(`welcome:${normalizeEmail(email)}`).digest('hex');
  return `welcome:${hash.slice(0, 48)}`;
};

const sendWelcomeEmail = async ({ name, email, fetchImpl = fetch }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const siteUrl = String(process.env.REROUTE_SITE_URL || 'https://www.reroute.com.br').replace(/\/+$/, '');

  if (!apiKey || !from) {
    return { success: false, reason: 'email_not_configured' };
  }

  const { subject, html, text } = renderWelcomeEmail({ firstName: getFirstName(name), siteUrl });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RESEND_TIMEOUT_MS);

  try {
    const response = await fetchImpl(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': createIdempotencyKey(email)
      },
      body: JSON.stringify({
        from,
        to: [email],
        reply_to: REPLY_TO,
        subject,
        html,
        text,
        tags: [
          { name: 'type', value: 'transactional' },
          { name: 'event', value: 'welcome_waitlist' }
        ]
      }),
      signal: controller.signal
    });

    return response.ok
      ? { success: true }
      : { success: false, reason: `resend_status_${response.status}` };
  } catch {
    return { success: false, reason: 'resend_unavailable' };
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = { createIdempotencyKey, sendWelcomeEmail };
