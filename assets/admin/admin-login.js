const form = document.getElementById('adminLoginForm');
const emailInput = document.getElementById('adminEmailInput');
const passwordInput = document.getElementById('adminPasswordInput');
const message = document.getElementById('loginMessage');

const setMessage = (text) => {
  message.textContent = text;
};

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector('button[type="submit"]');
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  if (!emailInput.validity.valid || password.length < 8) {
    setMessage('Informe e-mail e senha válidos.');
    return;
  }

  form.setAttribute('aria-busy', 'true');
  submitButton.disabled = true;
  setMessage('Validando acesso…');

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      throw new Error('login_failed');
    }
    window.location.replace('/admin');
  } catch {
    passwordInput.value = '';
    passwordInput.focus();
    setMessage('Não foi possível autorizar o acesso. Verifique os dados e tente novamente.');
  } finally {
    form.removeAttribute('aria-busy');
    submitButton.disabled = false;
  }
});

fetch('/api/admin/session', { credentials: 'same-origin', cache: 'no-store' })
  .then((response) => {
    if (response.ok) {
      window.location.replace('/admin');
    }
  })
  .catch(() => {});
