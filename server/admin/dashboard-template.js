const { renderAdminLayout } = require('./admin-layout');

const renderAdminDashboard = () => renderAdminLayout({
  activeItem: 'dashboard',
  title: 'Dashboard',
  brandLabel: 'Admin',
  content: `
    <section class="admin-intro">
      <div>
        <span class="admin-kicker">VISÃO GERAL</span>
        <h1>Dashboard</h1>
        <p>Acesse os módulos administrativos disponíveis para a Landing Page.</p>
      </div>
    </section>

    <section class="admin-shortcuts" aria-label="Atalhos administrativos">
      <a class="admin-shortcut" href="/admin/leads">
        <span class="admin-kicker">LISTA DE ESPERA</span>
        <h2>Leads</h2>
        <p>Consulte os cadastros, acompanhe o crescimento e exporte os dados disponíveis.</p>
      </a>
      <a class="admin-shortcut" href="/admin/analytics">
        <span class="admin-kicker">COMPORTAMENTO</span>
        <h2>Analytics</h2>
        <p>Visualize visitas, origens de tráfego, dispositivos e o funil de conversão.</p>
      </a>
    </section>`
});

module.exports = { renderAdminDashboard };
