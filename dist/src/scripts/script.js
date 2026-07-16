const navShell = document.querySelector('[data-nav]');
const toggle = document.querySelector('[data-menu-toggle]');
const links = document.querySelector('[data-nav-links]');

const setMenuState = (open) => {
  links?.classList.toggle('open', open);
  toggle?.classList.toggle('active', open);
  toggle?.setAttribute('aria-expanded', String(open));
  toggle?.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
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

const form = document.getElementById('waitlistForm');
const message = document.getElementById('formMessage');
const nameInput = document.getElementById('nome');
const emailInput = document.getElementById('email');
const whatsappInput = document.getElementById('whatsapp');
const successModal = document.getElementById('successModal');
const successModalDialog = successModal?.querySelector('.success-modal__dialog');
const fieldErrors = {
  nome: document.getElementById('nomeError'),
  email: document.getElementById('emailError'),
  whatsapp: document.getElementById('whatsappError')
};
const validBrazilianAreaCodes = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99'
]);
const successMessage = 'Cadastro realizado com sucesso! Verifique seu e-mail. Caso a mensagem esteja em Spam, Lixo Eletrônico ou Promoções, marque-a como confiável para continuar recebendo as comunicações do REROUTE.';

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

const getDigits = (value) => value.replace(/\D/g, '');

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

const hasInvalidRepeatedDigits = (digits) => /^(\d)\1+$/.test(digits);

const isValidBrazilianPhone = (digits) => {
  if (!/^\d{10,11}$/.test(digits) || hasInvalidRepeatedDigits(digits)) {
    return false;
  }

  const areaCode = digits.slice(0, 2);
  if (!validBrazilianAreaCodes.has(areaCode)) {
    return false;
  }

  return digits !== '123456789' && digits !== '1234567890' && digits !== '12345678901';
};

const formatBrazilianPhone = (value) => {
  const digits = getDigits(value).slice(0, 11);
  const areaCode = digits.slice(0, 2);
  const number = digits.slice(2);

  if (digits.length <= 2) {
    return areaCode ? `(${areaCode}` : '';
  }

  if (digits.length <= 6) {
    return `(${areaCode}) ${number}`;
  }

  if (digits.length <= 10) {
    return `(${areaCode}) ${number.slice(0, 4)}-${number.slice(4)}`;
  }

  return `(${areaCode}) ${number.slice(0, 5)}-${number.slice(5)}`;
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
  const whatsapp = getDigits(whatsappInput?.value || '');
  const invalidFields = [];

  if (name.length < 2) {
    setFieldError(nameInput, fieldErrors.nome, 'Informe o nome pelo qual você gostaria de ser chamado.');
    invalidFields.push(nameInput);
  } else {
    setFieldError(nameInput, fieldErrors.nome, '');
  }

  if (!isValidEmail(email)) {
    setFieldError(emailInput, fieldErrors.email, 'Informe um e-mail válido.');
    invalidFields.push(emailInput);
  } else {
    setFieldError(emailInput, fieldErrors.email, '');
  }

  if (!isValidBrazilianPhone(whatsapp)) {
    setFieldError(whatsappInput, fieldErrors.whatsapp, 'Informe um número de WhatsApp válido com DDD.');
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

whatsappInput?.addEventListener('input', () => {
  const cursorAtEnd = whatsappInput.selectionStart === whatsappInput.value.length;
  whatsappInput.value = formatBrazilianPhone(whatsappInput.value);

  if (cursorAtEnd) {
    whatsappInput.setSelectionRange(whatsappInput.value.length, whatsappInput.value.length);
  }
});

clearFieldErrorOnInput(nameInput, fieldErrors.nome, () => normalizeName(nameInput?.value || '').length >= 2);
clearFieldErrorOnInput(emailInput, fieldErrors.email, () => isValidEmail(normalizeEmail(emailInput?.value || '')));
clearFieldErrorOnInput(whatsappInput, fieldErrors.whatsapp, () => isValidBrazilianPhone(getDigits(whatsappInput?.value || '')));

const openSuccessModal = () => {
  if (!successModal || !successModalDialog) {
    setFormMessage(successMessage);
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
  setFormMessage(successMessage);

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

  const submitButton = form.querySelector('button');
  const originalButtonText = submitButton?.textContent || 'Cadastrar';
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

  if (whatsappInput) {
    whatsappInput.value = formatBrazilianPhone(whatsapp);
  }

  const payload = {
    name,
    email,
    whatsapp
  };

  setFormMessage('Enviando cadastro...');
  form.setAttribute('aria-busy', 'true');
  submissionInProgress = true;

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';
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
        setFormMessage('Este e-mail ja esta cadastrado. Obrigado pelo interesse no REROUTE.');
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
    openSuccessModal();
  } catch (error) {
    setFormMessage('Nao foi possivel enviar seu cadastro agora. Tente novamente em instantes.');
  } finally {
    form.removeAttribute('aria-busy');
    submissionInProgress = false;

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
});
