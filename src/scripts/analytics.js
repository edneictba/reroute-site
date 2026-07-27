(() => {
  const ENDPOINT = '/api/analytics';
  const VISITOR_KEY = 'reroute_analytics_visitor';
  const SESSION_KEY = 'reroute_analytics_session';
  const ACQUISITION_KEY = 'reroute_analytics_acquisition';
  const OPT_OUT_KEY = 'reroute_analytics_opt_out';
  const UUID_PATTERN = /^[0-9a-f-]{36}$/i;
  const pageStartedAt = Date.now();
  const sentScrollMilestones = new Set();
  let formStarted = false;
  let formSubmitted = false;
  let durationSent = false;

  const createId = () => {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
      const random = Math.floor(Math.random() * 16);
      const value = character === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  };

  const readStorage = (storage, key) => {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  };

  const writeStorage = (storage, key, value) => {
    try {
      storage.setItem(key, value);
    } catch {
      // Analytics must never interfere with the Landing experience.
    }
  };

  const getOrCreateId = (storage, key) => {
    const cookieValue = document.cookie
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${key}=`))
      ?.slice(key.length + 1);
    const existing = readStorage(storage, key) || cookieValue;
    if (existing && UUID_PATTERN.test(existing)) return existing;
    const generated = createId();
    writeStorage(storage, key, generated);
    return generated;
  };

  const hasOptOut = () => {
    const cookieOptOut = document.cookie
      .split(';')
      .map((part) => part.trim())
      .some((part) => part === `${OPT_OUT_KEY}=true`);
    return cookieOptOut || readStorage(window.localStorage, OPT_OUT_KEY) === 'true';
  };

  const hasAdminSession = async () => {
    try {
      const response = await fetch('/api/admin/session', {
        credentials: 'same-origin',
        cache: 'no-store'
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const startAnalytics = async () => {
    if (hasOptOut() || await hasAdminSession()) return;

  const visitorId = getOrCreateId(window.localStorage, VISITOR_KEY);
  const sessionId = getOrCreateId(window.sessionStorage, SESSION_KEY);
  document.cookie = `${VISITOR_KEY}=${visitorId}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;

  const detectBrowser = () => {
    const userAgent = navigator.userAgent;
    if (/Edg\//.test(userAgent)) return 'Edge';
    if (/OPR\//.test(userAgent)) return 'Opera';
    if (/Firefox\//.test(userAgent)) return 'Firefox';
    if (/Chrome\//.test(userAgent)) return 'Chrome';
    if (/Safari\//.test(userAgent)) return 'Safari';
    return 'Other';
  };

  const detectOperatingSystem = () => {
    const userAgent = navigator.userAgent;
    if (/Windows NT/.test(userAgent)) return 'Windows';
    if (/Android/.test(userAgent)) return 'Android';
    if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
    if (/Mac OS X/.test(userAgent)) return 'macOS';
    if (/Linux/.test(userAgent)) return 'Linux';
    return 'Other';
  };

  const detectDevice = () => {
    const width = Math.max(window.innerWidth || 0, 1);
    if (/Mobi|Android|iPhone|iPod/i.test(navigator.userAgent) || width < 768) return 'mobile';
    if (/iPad|Tablet/i.test(navigator.userAgent) || width < 1100) return 'tablet';
    return 'desktop';
  };

  const getAcquisition = () => {
    const saved = readStorage(window.sessionStorage, ACQUISITION_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Invalid browser storage is replaced below.
      }
    }

    const params = new URLSearchParams(location.search);
    let referrerHost = '';
    try {
      referrerHost = document.referrer ? new URL(document.referrer).hostname : '';
    } catch {
      referrerHost = '';
    }
    const acquisition = {
      referrerHost,
      utmSource: params.get('utm_source') || '',
      utmMedium: params.get('utm_medium') || '',
      utmCampaign: params.get('utm_campaign') || '',
      utmContent: params.get('utm_content') || '',
      utmTerm: params.get('utm_term') || ''
    };
    writeStorage(window.sessionStorage, ACQUISITION_KEY, JSON.stringify(acquisition));
    return acquisition;
  };

  const acquisition = getAcquisition();
  const buildPayload = (eventName, details = {}) => ({
    visitorId,
    sessionId,
    eventName,
    pagePath: location.pathname || '/',
    ...acquisition,
    deviceType: detectDevice(),
    browser: detectBrowser(),
    operatingSystem: detectOperatingSystem(),
    language: navigator.language || document.documentElement.lang || 'unknown',
    screenWidth: Math.max(window.screen?.width || window.innerWidth || 1, 1),
    screenHeight: Math.max(window.screen?.height || window.innerHeight || 1, 1),
    durationSeconds: details.durationSeconds ?? null,
    scrollPercent: details.scrollPercent ?? null,
    eventData: details.eventData || {},
    occurredAt: new Date().toISOString()
  });

  const send = (eventName, details = {}, { beacon = false } = {}) => {
    const body = JSON.stringify(buildPayload(eventName, details));
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
      return;
    }
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'same-origin'
    }).catch(() => {});
  };

  const getCtaName = (element) => (
    element.getAttribute('data-analytics-name')
    || element.getAttribute('aria-label')
    || element.textContent
    || 'cta'
  ).trim().replace(/\s+/g, ' ').slice(0, 120);

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const cta = event.target.closest(
      'a.btn, button.btn, .nav-links a, [data-demo-open], [data-demo-cta], .footer-links a'
    );
    if (!cta) return;
    send('cta_click', {
      eventData: {
        name: getCtaName(cta),
        target: String(cta.getAttribute('href') || cta.id || cta.dataset.analyticsName || '').slice(0, 200)
      }
    });
  });

  const form = document.getElementById('waitlistForm');
  if (form) {
    const markFormOpen = () => send('form_open');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          markFormOpen();
          observer.disconnect();
        }
      }, { threshold: 0.35 });
      observer.observe(form);
    } else {
      markFormOpen();
    }

    form.addEventListener('input', (event) => {
      if (formStarted || !(event.target instanceof HTMLInputElement) || !event.target.value.trim()) return;
      formStarted = true;
      send('form_start');
    });
  }

  window.addEventListener('reroute:formsubmit', () => {
    formSubmitted = true;
    send('form_submit');
  });

  const sendDuration = () => {
    if (!durationSent) {
      durationSent = true;
      send('page_duration', {
        durationSeconds: Math.min(Math.round((Date.now() - pageStartedAt) / 1000), 86400)
      }, { beacon: true });
    }
  };

  const sendLifecycleEvents = () => {
    sendDuration();
    if (formStarted && !formSubmitted) {
      send('form_abandon', {}, { beacon: true });
      formStarted = false;
    }
  };

  const trackScroll = () => {
    const documentHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const percent = Math.min(Math.round((window.scrollY / documentHeight) * 100), 100);
    for (const milestone of [25, 50, 75, 90, 100]) {
      if (percent >= milestone && !sentScrollMilestones.has(milestone)) {
        sentScrollMilestones.add(milestone);
        send('scroll_depth', { scrollPercent: milestone });
      }
    }
  };

  window.addEventListener('scroll', trackScroll, { passive: true });
  window.addEventListener('pagehide', sendLifecycleEvents);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sendDuration();
  });

  send('page_view');
  };

  startAnalytics();
})();
