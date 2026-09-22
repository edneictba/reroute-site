const { renderAdminLayout } = require('./admin-layout');

const renderAdminUsers = () => renderAdminLayout({
  activeItem: 'users',
  title: 'Usuários',
  brandLabel: 'Admin Usuários',
  styles: ['/assets/admin/admin-users.css?v=20260922-users'],
  scripts: ['/assets/admin/admin-users.js?v=20260922-users'],
  content: `
    <section class="admin-intro">
      <div>
        <span class="admin-kicker">ACESSO AO REROUTE</span>
        <h1>Usuários</h1>
        <p>Acompanhe quem entrou no REROUTE e até onde avançou.</p>
      </div>
    </section>
    <section class="admin-card admin-users-card" aria-labelledby="usersTitle">
      <form class="admin-users-controls" id="usersFilters">
        <label>Buscar por e-mail<input id="usersSearch" name="search" type="search" autocomplete="off" placeholder="usuario@exemplo.com"></label>
        <label>Onboarding<select id="usersOnboarding" name="onboarding"><option value="all">Todos</option><option value="completed">Concluído</option><option value="pending">Pendente</option><option value="no_profile">Sem perfil</option></select></label>
        <label>Acesso<select id="usersProvider" name="provider"><option value="all">Todos</option><option value="google">Google</option><option value="email">E-mail</option></select></label>
        <button class="admin-button" type="submit">Buscar</button>
      </form>
      <div id="usersStatus" class="table-status" role="status" aria-live="polite">Carregando usuários…</div>
      <div class="admin-users-table-wrap">
        <table class="admin-users-table">
          <thead><tr><th>E-mail</th><th>Cadastro</th><th>Último login</th><th>Acesso</th><th>Onboarding</th><th>Check-ins</th><th>Dias fechados</th><th>Última atividade</th></tr></thead>
          <tbody id="usersTableBody"></tbody>
        </table>
      </div>
      <div class="admin-users-footer"><span id="usersTotal"></span><div class="admin-users-pagination"><button class="admin-button admin-button-secondary" id="usersPrevious" type="button">Anterior</button><span id="usersPageLabel">Página 0 de 0</span><button class="admin-button admin-button-secondary" id="usersNext" type="button">Próxima</button></div></div>
    </section>`
});

module.exports = { renderAdminUsers };
