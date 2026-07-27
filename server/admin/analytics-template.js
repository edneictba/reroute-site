const renderAdminAnalytics = () => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <meta name="copyright" content="Copyright © 2026 REROUTE - Tecnologia de Navegação Humana Ltda. Todos os direitos reservados.">
  <title>Analytics | REROUTE Admin</title>
  <link rel="icon" href="/assets/icons/favicon.ico" sizes="any">
  <link rel="stylesheet" href="/assets/admin/admin.css?v=20260722-admin1">
  <link rel="stylesheet" href="/assets/admin/admin-analytics.css?v=20260727-analytics1">
</head>
<body class="admin-body">
  <div class="admin-shell">
    <header class="admin-header">
      <a class="admin-brand" href="/admin" aria-label="REROUTE Admin">
        <img src="/assets/images/logo-reroute-hns-320.webp" width="160" height="107" alt="REROUTE">
        <span>Admin Analytics</span>
      </a>
      <div class="admin-session">
        <a class="admin-button admin-button-secondary" href="/admin">Leads</a>
        <span id="adminEmail">Sessão protegida</span>
        <button class="admin-button admin-button-secondary" id="logoutButton" type="button">Sair</button>
      </div>
    </header>

    <main class="admin-main">
      <section class="admin-intro">
        <div>
          <span class="admin-kicker">COMPORTAMENTO DA LANDING</span>
          <h1>Analytics</h1>
          <p>Entenda a jornada dos visitantes até a conclusão do cadastro.</p>
        </div>
        <label class="analytics-period">Período
          <select id="analyticsPeriod">
            <option value="7">7 dias</option>
            <option value="30" selected>30 dias</option>
            <option value="90">90 dias</option>
            <option value="365">12 meses</option>
          </select>
        </label>
      </section>

      <div id="analyticsStatus" class="table-status" role="status" aria-live="polite">Carregando métricas…</div>

      <section class="metric-grid" aria-label="Resumo de Analytics">
        <article class="metric-card"><span>Visitas</span><strong id="metricVisits">—</strong></article>
        <article class="metric-card"><span>Visitantes únicos</span><strong id="metricVisitors">—</strong></article>
        <article class="metric-card"><span>Cadastros enviados</span><strong id="metricSubmits">—</strong></article>
        <article class="metric-card"><span>Taxa de conversão</span><strong id="metricConversion">—</strong></article>
      </section>

      <section class="analytics-grid">
        <article class="admin-card">
          <div class="card-heading"><div><span class="admin-kicker">CONVERSÃO</span><h2>Funil de cadastro</h2></div></div>
          <div class="analytics-list analytics-funnel" id="funnelList"></div>
        </article>
        <article class="admin-card">
          <div class="card-heading"><div><span class="admin-kicker">AQUISIÇÃO</span><h2>Origem do tráfego</h2></div></div>
          <div class="analytics-list" id="trafficList"></div>
        </article>
        <article class="admin-card">
          <div class="card-heading"><div><span class="admin-kicker">TECNOLOGIA</span><h2>Dispositivos</h2></div></div>
          <div class="analytics-list" id="deviceList"></div>
        </article>
        <article class="admin-card">
          <div class="card-heading"><div><span class="admin-kicker">COMPORTAMENTO</span><h2>Eventos mais frequentes</h2></div></div>
          <div class="analytics-list" id="eventList"></div>
        </article>
      </section>
    </main>
  </div>
  <script src="/assets/admin/admin-analytics.js?v=20260727-analytics1" defer></script>
</body>
</html>`;

module.exports = { renderAdminAnalytics };
