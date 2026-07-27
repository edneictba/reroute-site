const navigation = document.querySelector('[data-admin-navigation]');
const navigationToggle = document.querySelector('[data-admin-nav-toggle]');
const logoutButton = document.getElementById('logoutButton');
const adminEmail = document.getElementById('adminEmail');

const setNavigationState = (open) => {
  navigation?.classList.toggle('is-open', open);
  navigationToggle?.setAttribute('aria-expanded', String(open));
  navigationToggle?.setAttribute('aria-label', open ? 'Fechar navegação administrativa' : 'Abrir navegação administrativa');
  document.body.classList.toggle('admin-navigation-open', open);
};

navigationToggle?.addEventListener('click', () => {
  setNavigationState(navigationToggle.getAttribute('aria-expanded') !== 'true');
});

navigation?.addEventListener('click', (event) => {
  if (event.target instanceof Element && event.target.closest('a')) {
    setNavigationState(false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navigation?.classList.contains('is-open')) {
    setNavigationState(false);
    navigationToggle?.focus();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 760 && navigation?.classList.contains('is-open')) {
    setNavigationState(false);
  }
});

logoutButton?.addEventListener('click', async () => {
  logoutButton.disabled = true;
  try {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
  } finally {
    window.location.replace('/admin/login');
  }
});

fetch('/api/admin/session', { credentials: 'same-origin', cache: 'no-store' })
  .then((response) => response.ok ? response.json() : Promise.reject(new Error('unauthorized')))
  .then((payload) => {
    if (payload?.user?.email) adminEmail.textContent = payload.user.email;
  })
  .catch(() => window.location.replace('/admin/login'));
