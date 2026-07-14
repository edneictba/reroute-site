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

const form = document.getElementById('waitlistForm');
const message = document.getElementById('formMessage');
const successModal = document.getElementById('successModal');
const successModalDialog = successModal?.querySelector('.success-modal__dialog');
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
  const name = document.getElementById('nome')?.value.trim();
  const email = document.getElementById('email')?.value.trim().toLowerCase();
  const whatsapp = document.getElementById('whatsapp')?.value.trim();

  if (!name || !email) {
    setFormMessage('Preencha seu nome e e-mail para continuar.');
    return;
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
