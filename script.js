const navShell = document.querySelector('[data-nav]');
const toggle = document.querySelector('[data-menu-toggle]');
const links = document.querySelector('[data-nav-links]');

window.addEventListener('scroll', () => {
  navShell?.classList.toggle('scrolled', window.scrollY > 10);
});

toggle?.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.classList.toggle('active', open);
  toggle.setAttribute('aria-expanded', String(open));
});

links?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    links.classList.remove('open');
    toggle?.classList.remove('active');
    toggle?.setAttribute('aria-expanded', 'false');
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const form = document.getElementById('waitlistForm');
const message = document.getElementById('formMessage');

const SUPABASE_URL = 'https://lfubkmzwahfuvngegdhg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_o5-WlqjAkGLQJiyMjWJ8hA_eazYqsHS';

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector('button');
  const payload = {
    nome: document.getElementById('nome').value.trim(),
    email: document.getElementById('email').value.trim(),
    whatsapp: document.getElementById('whatsapp').value.trim()
  };

  message.textContent = 'Enviando...';
  submitButton.disabled = true;

  try {
const response = await fetch(`${SUPABASE_URL}/rest/v1/%22Lista%20de%20espera%22`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

   if (!response.ok) {
    const erro = await response.text();
    console.error('Erro Supabase:', response.status, erro);
    throw new Error(erro);
}
    form.reset();
    message.textContent = 'Cadastro recebido. Destino mantido.';
  } catch (error) {
    message.textContent = 'Não foi possível enviar agora. Tente novamente em instantes.';
  } finally {
    submitButton.disabled = false;
  }
});
