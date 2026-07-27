const navigationItems = [
  { key: 'dashboard', href: '/admin', label: 'Dashboard' },
  { key: 'leads', href: '/admin/leads', label: 'Leads' },
  { key: 'analytics', href: '/admin/analytics', label: 'Analytics' },
  { key: 'settings', href: '/admin/configuracoes', label: 'Configurações' }
];

const renderNavigation = (activeItem) => navigationItems.map((item) => `
  <a class="admin-nav-link${item.key === activeItem ? ' is-active' : ''}" href="${item.href}"${item.key === activeItem ? ' aria-current="page"' : ''}>
    <span>${item.label}</span>
  </a>`).join('');

const renderAdminLayout = ({
  activeItem,
  title,
  brandLabel,
  content,
  styles = [],
  scripts = []
}) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <meta name="copyright" content="Copyright © 2026 REROUTE - Tecnologia de Navegação Humana Ltda. Todos os direitos reservados.">
  <title>${title} | REROUTE Admin</title>
  <link rel="icon" href="/assets/icons/favicon.ico" sizes="any">
  <link rel="stylesheet" href="/assets/admin/admin.css?v=20260727-admin-navigation">
  <link rel="stylesheet" href="/assets/admin/admin-navigation.css?v=20260727-admin-navigation">
  ${styles.map((href) => `<link rel="stylesheet" href="${href}">`).join('\n  ')}
</head>
<body class="admin-body">
  <div class="admin-shell">
    <header class="admin-header">
      <a class="admin-brand" href="/admin" aria-label="REROUTE Admin">
        <img src="/assets/images/logo-reroute-hns-320.webp" width="160" height="107" alt="REROUTE">
        <span>${brandLabel}</span>
      </a>
      <div class="admin-session">
        <span id="adminEmail">Sessão protegida</span>
        <button class="admin-nav-toggle" type="button" aria-label="Abrir navegação administrativa" aria-controls="adminNavigation" aria-expanded="false" data-admin-nav-toggle>
          <span></span><span></span><span></span>
        </button>
        <button class="admin-button admin-button-secondary" id="logoutButton" type="button">Sair</button>
      </div>
    </header>

    <div class="admin-layout">
      <aside class="admin-sidebar" id="adminNavigation" data-admin-navigation>
        <div class="admin-sidebar-heading">ADMINISTRAÇÃO</div>
        <nav class="admin-navigation" aria-label="Navegação administrativa">
          ${renderNavigation(activeItem)}
        </nav>
      </aside>
      <main class="admin-main">
        ${content}
      </main>
    </div>
  </div>
  <script src="/assets/admin/admin-navigation.js?v=20260727-admin-navigation" defer></script>
  ${scripts.map((src) => `<script src="${src}" defer></script>`).join('\n  ')}
</body>
</html>`;

module.exports = { renderAdminLayout };
