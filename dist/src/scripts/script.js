const navShell = document.querySelector('[data-nav]');
const toggle = document.querySelector('[data-menu-toggle]');
const links = document.querySelector('[data-nav-links]');
const getTranslation = (key, fallback = '') => window.rerouteI18n?.t(key) || fallback;

const setMenuState = (open) => {
  links?.classList.toggle('open', open);
  toggle?.classList.toggle('active', open);
  toggle?.setAttribute('aria-expanded', String(open));
  toggle?.setAttribute('aria-label', open ? getTranslation('nav.close', 'Fechar menu') : getTranslation('nav.open', 'Abrir menu'));
};

window.addEventListener('scroll', () => {
  navShell?.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

toggle?.addEventListener('click', () => {
  const open = !links?.classList.contains('open');
  setMenuState(open);
});

links?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    setMenuState(false);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && links?.classList.contains('open')) {
    setMenuState(false);
    toggle?.focus();
  }
});

const revealElements = document.querySelectorAll('.reveal');
const audienceCards = document.querySelectorAll('[data-audience-card]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  revealElements.forEach(el => observer.observe(el));
} else {
  revealElements.forEach(el => el.classList.add('visible'));
}

if (reduceMotion) {
  audienceCards.forEach(card => card.classList.add('visible'));
} else if ('IntersectionObserver' in window) {
  const audienceObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const index = Array.from(audienceCards).indexOf(entry.target);
        window.setTimeout(() => {
          entry.target.classList.add('visible');
        }, Math.max(index, 0) * 140);
        audienceObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.22, rootMargin: '0px 0px -12% 0px' });

  audienceCards.forEach(card => audienceObserver.observe(card));
} else {
  audienceCards.forEach(card => card.classList.add('visible'));
}

const productTour = document.querySelector('[data-product-tour]');

if (productTour) {
  const viewport = productTour.querySelector('[data-product-tour-viewport]');
  const track = productTour.querySelector('[data-product-tour-track]');
  const slides = [...productTour.querySelectorAll('[data-product-tour-slide]')];
  const dots = [...productTour.querySelectorAll('[data-product-tour-dot]')];
  const previousButton = productTour.querySelector('[data-product-tour-previous]');
  const nextButton = productTour.querySelector('[data-product-tour-next]');
  const autoplayDelay = 6500;
  let activeIndex = 0;
  let autoplayTimer = null;
  let pointerStartX = null;
  let isVisible = !('IntersectionObserver' in window);
  let isPaused = false;

  const renderProductTour = (nextIndex) => {
    activeIndex = (nextIndex + slides.length) % slides.length;
    productTour.dataset.activeIndex = String(activeIndex);
    track.style.transform = `translate3d(-${activeIndex * 100}%, 0, 0)`;

    slides.forEach((slide, index) => {
      const isActive = index === activeIndex;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
    });

    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
      dot.tabIndex = isActive ? 0 : -1;
    });
  };

  const stopAutoplay = () => {
    window.clearInterval(autoplayTimer);
    autoplayTimer = null;
  };

  const startAutoplay = () => {
    stopAutoplay();

    if (!reduceMotion && isVisible && !isPaused && !document.hidden) {
      autoplayTimer = window.setInterval(() => {
        renderProductTour(activeIndex + 1);
      }, autoplayDelay);
    }
  };

  const navigateProductTour = (nextIndex) => {
    renderProductTour(nextIndex);
    startAutoplay();
  };

  previousButton?.addEventListener('click', () => navigateProductTour(activeIndex - 1));
  nextButton?.addEventListener('click', () => navigateProductTour(activeIndex + 1));

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => navigateProductTour(index));
    dot.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return;
      }

      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (activeIndex + direction + slides.length) % slides.length;
      navigateProductTour(nextIndex);
      dots[nextIndex]?.focus();
    });
  });

  viewport?.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    pointerStartX = event.clientX;
  });

  viewport?.addEventListener('pointerup', (event) => {
    if (pointerStartX === null) {
      return;
    }

    const distance = event.clientX - pointerStartX;
    pointerStartX = null;

    if (Math.abs(distance) >= 48) {
      navigateProductTour(activeIndex + (distance < 0 ? 1 : -1));
    }
  });

  viewport?.addEventListener('pointercancel', () => {
    pointerStartX = null;
  });

  productTour.addEventListener('mouseenter', () => {
    isPaused = true;
    stopAutoplay();
  });

  productTour.addEventListener('mouseleave', () => {
    isPaused = false;
    startAutoplay();
  });

  productTour.addEventListener('focusin', () => {
    isPaused = true;
    stopAutoplay();
  });

  productTour.addEventListener('focusout', (event) => {
    if (!productTour.contains(event.relatedTarget)) {
      isPaused = false;
      startAutoplay();
    }
  });

  document.addEventListener('visibilitychange', startAutoplay);

  if ('IntersectionObserver' in window) {
    const productTourObserver = new IntersectionObserver((entries) => {
      isVisible = entries[0]?.isIntersecting ?? false;
      startAutoplay();
    }, { threshold: 0.25 });

    productTourObserver.observe(productTour);
  } else {
    startAutoplay();
  }

  renderProductTour(0);
}

const initInteractiveDemo = () => {
  const modal = document.getElementById('interactiveDemoModal');
  const dialog = modal?.querySelector('.demo-modal__dialog');
  const openTrigger = document.querySelector('[data-demo-open]');
  const siteShell = document.querySelector('.site-shell');
  const image = document.getElementById('interactiveDemoImage');
  const imageError = modal?.querySelector('.demo-modal__image-error');
  const stepLabel = document.getElementById('interactiveDemoStep');
  const title = document.getElementById('interactiveDemoTitle');
  const description = document.getElementById('interactiveDemoDescription');
  const previousButton = modal?.querySelector('[data-demo-previous]');
  const nextButton = modal?.querySelector('[data-demo-next]');
  const ctaButton = modal?.querySelector('[data-demo-cta]');
  const dots = [...(modal?.querySelectorAll('[data-demo-dot]') || [])];
  const swipeHint = modal?.querySelector('[data-demo-swipe-hint]');

  if (!modal || !dialog || !openTrigger || !image || !stepLabel || !title || !description) {
    return;
  }

  const demoSteps = [
    {
      image: 'assets/images/reroute-em-acao/01.png',
      altKey: 'tour.alt1',
      titleKey: 'demo.title1',
      descriptionKey: 'demo.description1',
      title: 'Qual é o seu destino?',
      description: 'Tudo começa entendendo onde você quer chegar. O REROUTE transforma seu objetivo em um destino claro.'
    },
    {
      image: 'assets/images/reroute-em-acao/02.png',
      altKey: 'tour.alt2',
      titleKey: 'demo.title2',
      descriptionKey: 'demo.description2',
      title: 'Conte um pouco sobre o seu momento',
      description: 'Sua rotina, seu tempo e sua realidade ajudam o REROUTE a entender de onde você está partindo.'
    },
    {
      image: 'assets/images/reroute-em-acao/03.png',
      altKey: 'tour.alt3',
      titleKey: 'demo.title3',
      descriptionKey: 'demo.description3',
      title: 'Entendemos seu contexto',
      description: 'O REROUTE identifica padrões, pontos fortes e obstáculos que podem influenciar sua jornada.'
    },
    {
      image: 'assets/images/reroute-em-acao/04.png',
      altKey: 'tour.alt4',
      titleKey: 'demo.title4',
      descriptionKey: 'demo.description4',
      title: 'Sua rota é adaptativa',
      description: 'Quando a vida muda, o REROUTE recalcula o próximo passo para manter você avançando.'
    },
    {
      image: 'assets/images/reroute-em-acao/05.png',
      altKey: 'tour.alt5',
      titleKey: 'demo.title5',
      descriptionKey: 'demo.description5',
      title: 'Seu primeiro passo começa agora',
      description: 'A rota começa com uma ação possível para hoje, acompanhada de check-ins e ajustes ao longo da jornada.'
    }
  ];

  let activeDemoIndex = 0;
  let modalReturnFocus = null;
  let pointerStartX = null;
  let suppressOpenClick = false;
  let bodyPaddingRight = '';
  let swipeHintDismissed = false;

  const demoText = (key, fallback) => getTranslation(key, fallback);

  const updateDemoUI = () => {
    const step = demoSteps[activeDemoIndex];
    const isFirst = activeDemoIndex === 0;
    const isLast = activeDemoIndex === demoSteps.length - 1;
    const stepNumber = activeDemoIndex + 1;

    imageError.hidden = true;
    image.hidden = false;
    image.src = step.image;
    image.alt = demoText(step.altKey, step.title);
    stepLabel.textContent = demoText('demo.step', `PASSO ${stepNumber} DE ${demoSteps.length}`)
      .replace('{current}', String(stepNumber))
      .replace('{total}', String(demoSteps.length));
    title.textContent = demoText(step.titleKey, step.title);
    description.textContent = demoText(step.descriptionKey, step.description);

    previousButton.disabled = isFirst;
    nextButton.hidden = isLast;
    ctaButton.hidden = !isLast;

    dots.forEach((dot, index) => {
      const isActive = index === activeDemoIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
      dot.setAttribute('aria-label', demoText('demo.goto', `Ir para o passo ${index + 1}`).replace('{step}', String(index + 1)));
      dot.tabIndex = isActive ? 0 : -1;
    });

    dialog.dataset.demoStep = String(stepNumber);
  };

  const goToDemoSlide = (nextIndex) => {
    const boundedIndex = Math.max(0, Math.min(nextIndex, demoSteps.length - 1));
    if (boundedIndex === activeDemoIndex) {
      return;
    }

    activeDemoIndex = boundedIndex;
    swipeHintDismissed = true;
    swipeHint.hidden = true;
    updateDemoUI();
  };

  const setBackgroundInert = (inert) => {
    if (siteShell) {
      siteShell.inert = inert;
    }
  };

  const openDemoModal = () => {
    const carouselIndex = Number(productTour?.dataset.activeIndex || 0);
    activeDemoIndex = carouselIndex >= 0 && carouselIndex < demoSteps.length ? carouselIndex : 0;
    modalReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : openTrigger;
    bodyPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    updateDemoUI();
    swipeHint.hidden = swipeHintDismissed;
    modal.hidden = false;
    document.body.classList.add('demo-modal-open');
    setBackgroundInert(true);
    productTour?.classList.add('has-opened-demo');
    dialog.querySelector('[data-demo-close]')?.focus({ preventScroll: true });
  };

  const closeDemoModal = ({ returnFocus = true } = {}) => {
    if (modal.hidden) {
      return;
    }

    modal.hidden = true;
    document.body.classList.remove('demo-modal-open');
    document.body.style.paddingRight = bodyPaddingRight;
    setBackgroundInert(false);

    if (returnFocus && modalReturnFocus && document.contains(modalReturnFocus)) {
      modalReturnFocus.focus({ preventScroll: true });
    }

    modalReturnFocus = null;
  };

  const trapDemoFocus = (event) => {
    const focusable = [...dialog.querySelectorAll('button:not([disabled]):not([hidden]), [href], [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.hidden);

    if (!focusable.length) {
      return;
    }

    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const handleDemoSwipe = (distance) => {
    if (Math.abs(distance) < 48) {
      return;
    }

    goToDemoSlide(activeDemoIndex + (distance < 0 ? 1 : -1));
  };

  openTrigger.addEventListener('pointerdown', (event) => {
    pointerStartX = event.clientX;
  });

  openTrigger.addEventListener('pointerup', (event) => {
    if (pointerStartX === null) {
      return;
    }

    suppressOpenClick = Math.abs(event.clientX - pointerStartX) > 12;
    pointerStartX = null;

    if (suppressOpenClick) {
      window.requestAnimationFrame(() => {
        suppressOpenClick = false;
      });
    }
  });

  openTrigger.addEventListener('click', () => {
    if (!suppressOpenClick) {
      openDemoModal();
    }
  });

  openTrigger.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDemoModal();
    }
  });

  modal.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('[data-demo-close]')) {
      closeDemoModal();
    }
  });

  previousButton?.addEventListener('click', () => goToDemoSlide(activeDemoIndex - 1));
  nextButton?.addEventListener('click', () => goToDemoSlide(activeDemoIndex + 1));
  dots.forEach((dot, index) => dot.addEventListener('click', () => goToDemoSlide(index)));

  dialog.addEventListener('pointerdown', (event) => {
    if (event.target instanceof Element && event.target.closest('button')) {
      return;
    }
    pointerStartX = event.clientX;
  });

  dialog.addEventListener('pointerup', (event) => {
    if (pointerStartX === null) {
      return;
    }
    handleDemoSwipe(event.clientX - pointerStartX);
    pointerStartX = null;
  });

  dialog.addEventListener('pointercancel', () => {
    pointerStartX = null;
  });

  image.addEventListener('error', () => {
    image.hidden = true;
    imageError.hidden = false;
  });

  image.addEventListener('load', () => {
    image.hidden = false;
    imageError.hidden = true;
  });

  ctaButton?.addEventListener('click', () => {
    const formSection = document.getElementById('comecar');
    const firstField = document.getElementById('nome');
    closeDemoModal({ returnFocus: false });
    formSection?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    window.requestAnimationFrame(() => firstField?.focus({ preventScroll: true }));
  });

  document.addEventListener('keydown', (event) => {
    if (modal.hidden) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeDemoModal();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToDemoSlide(activeDemoIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToDemoSlide(activeDemoIndex + 1);
    } else if (event.key === 'Tab') {
      trapDemoFocus(event);
    }
  });

  window.addEventListener('reroute:languagechange', updateDemoUI);
  updateDemoUI();
};

initInteractiveDemo();

const form = document.getElementById('waitlistForm');
const message = document.getElementById('formMessage');
const nameInput = document.getElementById('nome');
const emailInput = document.getElementById('email');
const whatsappInput = document.getElementById('whatsapp');
const whatsappE164Input = document.getElementById('whatsappE164');
const successModal = document.getElementById('successModal');
const successModalDialog = successModal?.querySelector('.success-modal__dialog');
const fieldErrors = {
  nome: document.getElementById('nomeError'),
  email: document.getElementById('emailError'),
  whatsapp: document.getElementById('whatsappError')
};
const SUPABASE_URL = 'https://lfubkmzwahfuvngegdhg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_o5-WlqjAkGLQJiyMjWJ8hA_eazYqsHS';
const LEADS_ENDPOINT = `${SUPABASE_URL}/rest/v1/leads`;
const WELCOME_EMAIL_ENDPOINT = '/api/send-welcome-email';
let submissionInProgress = false;
let modalReturnFocus = null;

const setFormMessage = (text) => {
  if (message) {
    message.textContent = text;
  }
};

const normalizeName = (value) => value.trim().replace(/\s+/g, ' ');

const normalizeEmail = (value) => value.trim().toLowerCase();

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

const getPhoneOptions = () => ({
      initialCountry: 'br',
      separateDialCode: true,
      countrySearch: true,
      countryOrder: ['br', 'pe', 'ca', 'us', 'pt'],
      countryNameLocale: window.rerouteI18n?.getCountryLocale() || 'pt-BR',
      strictMode: true,
      formatAsYouType: true,
      uiTranslations: {
        selectedCountryAriaLabel: getTranslation('phone.selected', 'Alterar país para o número de telefone, selecionado ${countryName} (${dialCode})'),
        noCountrySelected: getTranslation('phone.none', 'Selecionar país para o número de telefone'),
        countryListAriaLabel: getTranslation('phone.list', 'Lista de países'),
        searchPlaceholder: getTranslation('phone.search', 'Pesquisar país'),
        clearSearchAriaLabel: getTranslation('phone.clear', 'Limpar pesquisa'),
        searchEmptyState: getTranslation('phone.empty', 'Nenhum país encontrado'),
        searchSummaryAria: (count) => `${count} ${getTranslation('phone.list', 'países')}`
      }
    });

let internationalPhoneInput = whatsappInput && window.intlTelInput
  ? window.intlTelInput(whatsappInput, getPhoneOptions())
  : null;

window.addEventListener('reroute:languagechange', () => {
  if (!whatsappInput || !window.intlTelInput) {
    return;
  }

  const selectedCountry = internationalPhoneInput?.getSelectedCountry()?.iso2 || 'br';
  const currentNumber = internationalPhoneInput?.getNumber() || whatsappInput.value;
  internationalPhoneInput?.destroy();
  internationalPhoneInput = window.intlTelInput(whatsappInput, {
    ...getPhoneOptions(),
    initialCountry: selectedCountry
  });

  if (currentNumber) {
    internationalPhoneInput.setNumber(currentNumber);
  }
});

const getInternationalPhone = () => {
  if (!internationalPhoneInput || !internationalPhoneInput.isValidNumber()) {
    return '';
  }

  const e164 = internationalPhoneInput.getNumber();
  return /^\+[1-9]\d{7,14}$/.test(e164) ? e164 : '';
};

const setFieldError = (input, errorElement, messageText) => {
  if (!input || !errorElement) {
    return;
  }

  const hasError = Boolean(messageText);
  input.setAttribute('aria-invalid', String(hasError));
  errorElement.textContent = messageText;
};

const validateLeadForm = () => {
  const name = normalizeName(nameInput?.value || '');
  const email = normalizeEmail(emailInput?.value || '');
  const whatsapp = getInternationalPhone();
  const invalidFields = [];

  if (name.length < 2) {
    setFieldError(nameInput, fieldErrors.nome, getTranslation('form.nameInvalid', 'Informe o nome pelo qual você gostaria de ser chamado.'));
    invalidFields.push(nameInput);
  } else {
    setFieldError(nameInput, fieldErrors.nome, '');
  }

  if (!isValidEmail(email)) {
    setFieldError(emailInput, fieldErrors.email, getTranslation('form.emailInvalid', 'Informe um e-mail válido.'));
    invalidFields.push(emailInput);
  } else {
    setFieldError(emailInput, fieldErrors.email, '');
  }

  if (!whatsapp) {
    setFieldError(whatsappInput, fieldErrors.whatsapp, getTranslation('form.phoneInvalid', 'Informe um WhatsApp válido para o país selecionado.'));
    invalidFields.push(whatsappInput);
  } else {
    setFieldError(whatsappInput, fieldErrors.whatsapp, '');
  }

  return {
    valid: invalidFields.length === 0,
    firstInvalidField: invalidFields[0],
    data: {
      name,
      email,
      whatsapp
    }
  };
};

const clearFieldErrorOnInput = (input, errorElement, validator) => {
  input?.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') !== 'true') {
      return;
    }

    if (validator()) {
      setFieldError(input, errorElement, '');
    }
  });
};

clearFieldErrorOnInput(nameInput, fieldErrors.nome, () => normalizeName(nameInput?.value || '').length >= 2);
clearFieldErrorOnInput(emailInput, fieldErrors.email, () => isValidEmail(normalizeEmail(emailInput?.value || '')));
clearFieldErrorOnInput(whatsappInput, fieldErrors.whatsapp, () => Boolean(getInternationalPhone()));

whatsappInput?.addEventListener('countrychange', () => {
  if (whatsappE164Input) {
    whatsappE164Input.value = '';
  }

  if (whatsappInput.getAttribute('aria-invalid') === 'true' && getInternationalPhone()) {
    setFieldError(whatsappInput, fieldErrors.whatsapp, '');
  }
});

const openSuccessModal = () => {
  if (!successModal || !successModalDialog) {
    setFormMessage(getTranslation('form.success'));
    return;
  }

  modalReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  successModal.hidden = false;
  document.body.classList.add('modal-open');
  successModalDialog.focus({ preventScroll: true });
};

const closeSuccessModal = () => {
  if (!successModal) {
    return;
  }

  successModal.hidden = true;
  document.body.classList.remove('modal-open');
  setFormMessage(getTranslation('form.success'));

  if (modalReturnFocus && document.contains(modalReturnFocus)) {
    modalReturnFocus.focus({ preventScroll: true });
  }

  modalReturnFocus = null;
};

successModal?.addEventListener('click', (event) => {
  if (event.target instanceof Element && event.target.closest('[data-modal-close]')) {
    closeSuccessModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && successModal && !successModal.hidden) {
    closeSuccessModal();
    return;
  }

  if (event.key === 'Tab' && successModal && !successModal.hidden && successModalDialog) {
    const focusableElements = successModalDialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement || !lastElement) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
});

const parseSupabaseError = async (response) => {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const parseApiResponse = async (response) => {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { message: text };
  }
};

const sendWelcomeEmail = async ({ name, email }) => {
  const response = await fetch(WELCOME_EMAIL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, email })
  });

  const responseData = await parseApiResponse(response);

  if (!response.ok || responseData?.success === false) {
    console.error('Erro ao enviar e-mail:', {
      status: response.status,
      response: responseData
    });
    return false;
  }

  return true;
};

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (submissionInProgress) {
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton?.textContent || getTranslation('form.submit', 'Cadastrar');
  const validation = validateLeadForm();

  if (!validation.valid) {
    setFormMessage('');
    validation.firstInvalidField?.focus();
    return;
  }

  const { name, email, whatsapp } = validation.data;

  if (nameInput) {
    nameInput.value = name;
  }

  if (emailInput) {
    emailInput.value = email;
  }

  if (whatsappE164Input) {
    whatsappE164Input.value = whatsapp;
  }

  const payload = {
    name,
    email,
    whatsapp
  };

  setFormMessage(getTranslation('form.sending', 'Enviando cadastro...'));
  form.setAttribute('aria-busy', 'true');
  submissionInProgress = true;

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = getTranslation('form.sendingButton', 'Enviando...');
  }

  try {
    const response = await fetch(LEADS_ENDPOINT, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await parseSupabaseError(response);

      if (response.status === 409 || errorData.code === '23505') {
        setFormMessage(getTranslation('form.duplicate', 'Este e-mail já está cadastrado. Obrigado pelo interesse no REROUTE.'));
        return;
      }

      console.error('Erro Supabase:', response.status, errorData);
      throw new Error(errorData.message || 'Erro ao enviar cadastro.');
    }

    try {
      await sendWelcomeEmail({ name, email });
    } catch (emailError) {
      console.error('Erro ao enviar e-mail:', emailError);
    }

    form.reset();
    internationalPhoneInput?.setSelectedCountry('br');

    if (whatsappE164Input) {
      whatsappE164Input.value = '';
    }

    openSuccessModal();
  } catch (error) {
    setFormMessage(getTranslation('form.failure', 'Não foi possível enviar seu cadastro agora. Tente novamente em instantes.'));
  } finally {
    form.removeAttribute('aria-busy');
    submissionInProgress = false;

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
});
