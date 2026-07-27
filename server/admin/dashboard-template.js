const { renderAdminLayout } = require('./admin-layout');

const renderAdminDashboard = () => renderAdminLayout({
  activeItem: 'dashboard',
  title: 'Dashboard',
  brandLabel: 'Admin',
  styles: ['/assets/admin/admin-dashboard-overview.css?v=20260727-dashboard-overview'],
  scripts: ['/assets/admin/admin-dashboard-overview.js?v=20260727-dashboard-overview'],
  content: `
    <section class="admin-intro">
      <div>
        <span class="admin-kicker">VISÃO GERAL</span>
        <h1>Dashboard</h1>
        <p>Acesse os módulos administrativos disponíveis para a Landing Page.</p>
      </div>
    </section>

    <div id="dashboardStatus" class="table-status" role="status" aria-live="polite">Carregando resumo executivo…</div>

    <section class="metric-grid admin-executive-metrics" aria-label="Resumo executivo">
      <article class="metric-card"><span>Visitas de hoje</span><strong id="dashboardVisitsToday">—</strong></article>
      <article class="metric-card"><span>Visitantes únicos de hoje</span><strong id="dashboardVisitorsToday">—</strong></article>
      <article class="metric-card"><span>Cadastros enviados hoje</span><strong id="dashboardRegistrationsToday">—</strong></article>
      <article class="metric-card"><span>Taxa de conversão de hoje</span><strong id="dashboardConversionToday">—</strong></article>
      <article class="metric-card"><span>Visitas nos últimos 7 dias</span><strong id="dashboardVisitsWeek">—</strong></article>
      <article class="metric-card"><span>Cadastros nos últimos 7 dias</span><strong id="dashboardRegistrationsWeek">—</strong></article>
      <article class="metric-card metric-card--date"><span>Último cadastro recebido</span><strong id="dashboardLastRegistration">—</strong></article>
      <article class="metric-card metric-card--date"><span>Último evento registrado</span><strong id="dashboardLastEvent">—</strong></article>
    </section>

    <section class="admin-card admin-activity-card">
      <div class="card-heading admin-activity-heading">
        <div>
          <span class="admin-kicker">ANALYTICS</span>
          <h2>Atividade recente</h2>
        </div>
        <div class="admin-activity-controls">
          <label>Período
            <select id="dashboardActivityPeriod">
              <option value="1">Hoje</option>
              <option value="7" selected>Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
            </select>
          </label>
          <button class="admin-button admin-button-secondary" id="dashboardRefresh" type="button">Atualizar</button>
        </div>
      </div>
      <div id="dashboardActivity" class="admin-activity-list"></div>
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
