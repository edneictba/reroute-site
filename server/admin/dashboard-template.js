const renderAdminDashboard = () => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <meta name="copyright" content="Copyright © 2026 REROUTE - Tecnologia de Navegação Humana Ltda. Todos os direitos reservados.">
  <title>Leads | REROUTE Admin</title>
  <link rel="icon" href="/assets/icons/favicon.ico" sizes="any">
  <link rel="stylesheet" href="/assets/admin/admin.css?v=20260722-admin1">
</head>
<body class="admin-body">
  <div class="admin-shell">
    <header class="admin-header">
      <a class="admin-brand" href="/admin" aria-label="REROUTE Admin">
        <img src="/assets/images/logo-reroute-hns-320.webp" width="160" height="107" alt="REROUTE">
        <span>Admin de Leads</span>
      </a>
      <div class="admin-session">
        <span id="adminEmail">Sessão protegida</span>
        <button class="admin-button admin-button-secondary" id="logoutButton" type="button">Sair</button>
      </div>
    </header>

    <main class="admin-main">
      <section class="admin-intro">
        <div>
          <span class="admin-kicker">LISTA DE ESPERA</span>
          <h1>Painel de Leads</h1>
          <p>Acompanhe o crescimento dos cadastros da Landing Page.</p>
        </div>
        <a class="admin-button admin-button-primary" id="exportButton" href="/api/admin/export">Exportar CSV</a>
      </section>

      <section class="metric-grid" aria-label="Resumo dos cadastros">
        <article class="metric-card"><span>Total de inscritos</span><strong id="metricTotal">—</strong></article>
        <article class="metric-card"><span>Inscritos hoje</span><strong id="metricToday">—</strong></article>
        <article class="metric-card"><span>Últimos 7 dias</span><strong id="metricWeek">—</strong></article>
        <article class="metric-card"><span>Mês atual</span><strong id="metricMonth">—</strong></article>
      </section>

      <section class="admin-card chart-card">
        <div class="card-heading">
          <div><span class="admin-kicker">ÚLTIMOS 30 DIAS</span><h2>Crescimento diário</h2></div>
        </div>
        <div class="chart-wrap" id="growthChart" role="img" aria-label="Gráfico de crescimento diário dos leads">
          <p class="admin-empty">Carregando dados…</p>
        </div>
      </section>

      <section class="admin-card leads-card">
        <div class="card-heading leads-toolbar">
          <div><span class="admin-kicker">CADASTROS</span><h2>Leads mais recentes</h2></div>
          <div class="lead-filters">
            <label class="search-field">
              <span class="sr-only">Buscar leads</span>
              <input id="leadSearch" type="search" maxlength="100" placeholder="Buscar nome, e-mail ou WhatsApp" autocomplete="off">
            </label>
            <label class="page-size-field">Por página
              <select id="pageSize"><option value="10">10</option><option value="25" selected>25</option><option value="50">50</option><option value="100">100</option></select>
            </label>
          </div>
        </div>

        <div id="tableStatus" class="table-status" role="status" aria-live="polite">Carregando leads…</div>
        <div class="table-scroll">
          <table>
            <thead><tr><th>Nome</th><th>E-mail</th><th>WhatsApp</th><th>Data e hora</th></tr></thead>
            <tbody id="leadsTable"></tbody>
          </table>
        </div>
        <div class="pagination" aria-label="Paginação">
          <button class="admin-button admin-button-secondary" id="previousPage" type="button">Anterior</button>
          <span id="pageInfo">Página 1 de 1</span>
          <button class="admin-button admin-button-secondary" id="nextPage" type="button">Próxima</button>
        </div>
      </section>
    </main>
  </div>
  <script src="/assets/admin/admin-dashboard.js?v=20260722-admin1" defer></script>
</body>
</html>`;

module.exports = { renderAdminDashboard };
