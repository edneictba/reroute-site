(() => {
  const languages = { pt: 'pt-BR', es: 'es', en: 'en' };
  let language = 'pt';
  try {
    const storedLanguage = localStorage.getItem('reroute-language');
    if (languages[storedLanguage]) language = storedLanguage;
  } catch {
    // Portuguese remains the safe default when storage is unavailable.
  }
  document.documentElement.lang = languages[language];
  document.documentElement.dataset.initialLanguage = language;
  document.documentElement.classList.add('i18n-pending');
  window.setTimeout(() => document.documentElement.classList.remove('i18n-pending'), 2500);
})();
