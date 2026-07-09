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

const form = document.getElementById('waitlistForm');
const message = document.getElementById('formMessage');

const SUPABASE_URL = 'https://lfubkmzwahfuvngegdhg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_o5-WlqjAkGLQJiyMjWJ8hA_eazYqsHS';
const LEADS_ENDPOINT = `${SUPABASE_URL}/rest/v1/leads`;

const setFormMessage = (text) => {
  if (message) {
    message.textContent = text;
  }
};

const parseSupabaseError = async (response) => {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

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

    form.reset();
    setFormMessage('Cadastro recebido com sucesso. Em breve voce recebera novidades do REROUTE.');
  } catch (error) {
    setFormMessage('Nao foi possivel enviar seu cadastro agora. Tente novamente em instantes.');
  } finally {
    form.removeAttribute('aria-busy');

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
});
