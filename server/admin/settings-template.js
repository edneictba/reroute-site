const { renderAdminLayout } = require('./admin-layout');

const renderAdminSettings = () => renderAdminLayout({
  activeItem: 'settings',
  title: 'Configurações',
  brandLabel: 'Admin',
  content: `
    <section class="admin-intro">
      <div>
        <span class="admin-kicker">ADMINISTRAÇÃO</span>
        <h1>Configurações</h1>
        <p>Área reservada para futuras configurações administrativas.</p>
      </div>
    </section>
    <section class="admin-card admin-placeholder">
      <div>
        <span class="admin-kicker">EM BREVE</span>
        <h2>Configurações administrativas</h2>
        <p>Novas opções de configuração serão adicionadas futuramente.</p>
      </div>
    </section>`
});

module.exports = { renderAdminSettings };
