(() => {
  'use strict';

  const PIXEL_ID = '653689209335433';
  const CONSENT_KEY = 'reroute_marketing_consent';
  const CONSENT_VERSION = '2026-08-16';
  const VALID_STATUSES = new Set(['accepted', 'rejected']);
  const META_SCRIPT_ID = 'reroute-meta-pixel';
  const META_SCRIPT_URL = 'https://connect.facebook.net/en_US/fbevents.js';
  const copy = {
    pt: {
      title: 'Preferências de cookies',
      body: 'Com sua autorização, usamos cookies de marketing para mensurar visitas e cadastros e melhorar nossos anúncios. O site funciona normalmente se você recusar.',
      privacy: 'Saiba mais na Política de Privacidade.',
      reject: 'Recusar cookies não essenciais',
      accept: 'Aceitar cookies de marketing',
      currentAccepted: 'Cookies de marketing aceitos. Você pode alterar ou revogar esta decisão.',
      currentRejected: 'Cookies de marketing recusados. Você pode alterar esta decisão.'
    },
    es: {
      title: 'Preferencias de cookies',
      body: 'Con tu autorización, usamos cookies de marketing para medir visitas y registros y mejorar nuestros anuncios. El sitio funciona normalmente si los rechazas.',
      privacy: 'Más información en la Política de Privacidad.',
      reject: 'Rechazar cookies no esenciales',
      accept: 'Aceptar cookies de marketing',
      currentAccepted: 'Cookies de marketing aceptadas. Puedes cambiar o revocar esta decisión.',
      currentRejected: 'Cookies de marketing rechazadas. Puedes cambiar esta decisión.'
    },
    en: {
      title: 'Cookie preferences',
      body: 'With your permission, we use marketing cookies to measure visits and registrations and improve our ads. The site works normally if you decline.',
      privacy: 'Learn more in our Privacy Policy.',
      reject: 'Reject non-essential cookies',
      accept: 'Accept marketing cookies',
      currentAccepted: 'Marketing cookies accepted. You can change or revoke this decision.',
      currentRejected: 'Marketing cookies rejected. You can change this decision.'
    }
  };

  let pixelEnabled = false;
  let pageViewTracked = false;
  let leadTracked = false;
  let banner = null;
  let previousFocus = null;

  const getLanguage = () => {
    const language = window.rerouteI18n?.getLanguage?.() || document.documentElement.lang || 'pt';
    return String(language).toLowerCase().startsWith('es') ? 'es' : String(language).toLowerCase().startsWith('en') ? 'en' : 'pt';
  };

  const readConsent = () => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(CONSENT_KEY) || 'null');
      return saved?.version === CONSENT_VERSION && VALID_STATUSES.has(saved?.status) && saved?.decidedAt
        ? saved
        : null;
    } catch {
      return null;
    }
  };

  const saveConsent = (status) => {
    const decision = { status, decidedAt: new Date().toISOString(), version: CONSENT_VERSION };
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(decision));
    } catch {
      // The decision still applies for this page when storage is unavailable.
    }
    return decision;
  };

  const expireMetaCookies = () => {
    ['_fbp', '_fbc'].forEach((name) => {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    });
  };

  const initializeFbq = () => {
    if (window.fbq) return;
    const fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;
  };

  const enablePixel = () => {
    if (pixelEnabled || readConsent()?.status !== 'accepted') return false;
    pixelEnabled = true;
    initializeFbq();
    window.fbq('consent', 'grant');
    window.fbq('init', PIXEL_ID);

    if (!document.getElementById(META_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = META_SCRIPT_ID;
      script.async = true;
      script.src = META_SCRIPT_URL;
      document.head.appendChild(script);
    }

    if (!pageViewTracked) {
      pageViewTracked = true;
      window.fbq('track', 'PageView');
    }
    return true;
  };

  const disablePixel = () => {
    pixelEnabled = false;
    if (window.fbq) window.fbq('consent', 'revoke');
    document.getElementById(META_SCRIPT_ID)?.remove();
    expireMetaCookies();
  };

  const renderBanner = () => {
    if (!banner) return;
    const language = getLanguage();
    const text = copy[language];
    const decision = readConsent();
    banner.querySelector('[data-cookie-title]').textContent = text.title;
    banner.querySelector('[data-cookie-body]').textContent = text.body;
    banner.querySelector('[data-cookie-privacy]').textContent = text.privacy;
    banner.querySelector('[data-cookie-reject]').textContent = text.reject;
    banner.querySelector('[data-cookie-accept]').textContent = text.accept;
    banner.querySelector('[data-cookie-current]').textContent = decision?.status === 'accepted'
      ? text.currentAccepted
      : decision?.status === 'rejected'
        ? text.currentRejected
        : '';
  };

  const showBanner = ({ restoreFocus = false } = {}) => {
    if (!banner) return;
    if (restoreFocus) previousFocus = document.activeElement;
    renderBanner();
    banner.hidden = false;
    document.body.classList.add('cookie-consent-open');
    banner.querySelector('[data-cookie-reject]')?.focus({ preventScroll: true });
  };

  const hideBanner = () => {
    if (!banner) return;
    banner.hidden = true;
    document.body.classList.remove('cookie-consent-open');
    previousFocus?.focus?.({ preventScroll: true });
    previousFocus = null;
  };

  const choose = (status) => {
    saveConsent(status);
    if (status === 'accepted') enablePixel(); else disablePixel();
    hideBanner();
  };

  const createBanner = () => {
    banner = document.createElement('section');
    banner.className = 'cookie-consent';
    banner.hidden = true;
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'true');
    banner.setAttribute('aria-labelledby', 'cookieConsentTitle');
    banner.innerHTML = `
      <div class="cookie-consent__backdrop" aria-hidden="true"></div>
      <div class="cookie-consent__panel">
        <h2 id="cookieConsentTitle" data-cookie-title></h2>
        <p data-cookie-body></p>
        <a href="/politica-de-privacidade.html#cookies-e-meta-pixel" data-cookie-privacy></a>
        <p class="cookie-consent__current" data-cookie-current role="status"></p>
        <div class="cookie-consent__actions">
          <button type="button" data-cookie-reject></button>
          <button type="button" data-cookie-accept></button>
        </div>
      </div>`;
    document.body.appendChild(banner);
    banner.querySelector('[data-cookie-reject]').addEventListener('click', () => choose('rejected'));
    banner.querySelector('[data-cookie-accept]').addEventListener('click', () => choose('accepted'));
  };

  const trackLead = () => {
    if (leadTracked || !pixelEnabled || readConsent()?.status !== 'accepted' || typeof window.fbq !== 'function') return false;
    leadTracked = true;
    window.fbq('track', 'Lead');
    return true;
  };

  createBanner();
  document.querySelectorAll('[data-cookie-preferences]').forEach((button) => button.addEventListener('click', () => showBanner({ restoreFocus: true })));
  window.addEventListener('reroute:languagechange', renderBanner);

  const decision = readConsent();
  if (decision?.status === 'accepted') enablePixel();
  else if (!decision) showBanner();

  window.REROUTE_MARKETING = Object.freeze({
    trackLead,
    openPreferences: () => showBanner({ restoreFocus: true }),
    getConsent: readConsent
  });
})();
