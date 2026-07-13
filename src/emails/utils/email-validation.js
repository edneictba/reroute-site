const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const MAX_BODY_BYTES = 8192;

const hasControlCharacters = (value = '') => /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(String(value));

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const isValidEmail = (email = '') => {
  const normalized = normalizeEmail(email);
  return normalized.length <= MAX_EMAIL_LENGTH && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized);
};

const isSafeText = (value = '', maxLength = MAX_NAME_LENGTH) => {
  const text = String(value);
  return text.length <= maxLength && !hasControlCharacters(text);
};

const getFirstName = (name = '') => {
  const text = String(name)
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\p{L}\p{M}' -]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const [firstName = ''] = text.split(' ');
  return firstName.length >= 2 && firstName.length <= 32 ? firstName : '';
};

const validateLeadPayload = (payload = {}) => {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const email = normalizeEmail(payload.email);

  if (!name || !email || !isSafeText(name) || hasControlCharacters(email) || !isValidEmail(email)) {
    return { valid: false, error: 'Dados inválidos.' };
  }

  return {
    valid: true,
    data: {
      name,
      email,
      firstName: getFirstName(name)
    }
  };
};

module.exports = {
  MAX_BODY_BYTES,
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  getFirstName,
  hasControlCharacters,
  isSafeText,
  isValidEmail,
  normalizeEmail,
  validateLeadPayload
};
