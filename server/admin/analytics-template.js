const { renderAdminLayout } = require('./admin-layout');

const renderAdminAnalytics = () => renderAdminLayout({
  activeItem: 'analytics',
  title: 'Analytics',
  brandLabel: 'Admin Analytics',
  styles: ['/assets/admin/admin-analytics.css?v=20260802-journey-diagnostics'],
  scripts: ['/assets/admin/admin-analytics.js?v=20260802-journey-diagnostics'],
  content: `
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

    <section class="admin-card analytics-diagnosis" aria-labelledby="journeyDiagnosisTitle">
      <div class="card-heading">
        <div><span class="admin-kicker">RESUMO EXECUTIVO</span><h2 id="journeyDiagnosisTitle">Diagnóstico da Jornada</h2></div>
      </div>
      <div class="analytics-diagnosis-metrics">
        <div><span>Visitantes</span><strong id="diagnosisVisitors">—</strong></div>
        <div><span>Cadastros</span><strong id="diagnosisRegistrations">—</strong></div>
        <div><span>Conversão</span><strong id="diagnosisConversion">—</strong></div>
      </div>
      <p class="analytics-diagnosis-message" id="diagnosisMessage">Analisando a jornada dos visitantes…</p>
    </section>

    <section class="metric-grid" aria-label="Resumo de Analytics">
      <article class="metric-card"><span>Visitas</span><strong id="metricVisits">—</strong></article>
      <article class="metric-card"><span>Visitantes únicos</span><strong id="metricVisitors">—</strong></article>
      <article class="metric-card"><span>Total de cadastros</span><strong id="metricTotalRegistrations">—</strong></article>
      <article class="metric-card"><span>Envios do formulário no período</span><strong id="metricSubmits">—</strong></article>
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
      <article class="admin-card analytics-card--wide">
        <div class="card-heading"><div><span class="admin-kicker">CONVERSÃO</span><h2>Origem × Conversão</h2></div></div>
        <div class="analytics-table-wrap">
          <table class="analytics-table">
            <thead><tr><th>Origem</th><th>Visitas</th><th>Cadastros</th><th>Conversão</th></tr></thead>
            <tbody id="originConversionList"></tbody>
          </table>
        </div>
      </article>
      <article class="admin-card">
        <div class="card-heading"><div><span class="admin-kicker">TECNOLOGIA</span><h2>Dispositivos</h2></div></div>
        <div class="analytics-list" id="deviceList"></div>
      </article>
      <article class="admin-card">
        <div class="card-heading"><div><span class="admin-kicker">TECNOLOGIA</span><h2>Sistema Operacional</h2></div></div>
        <div class="analytics-list" id="operatingSystemList"></div>
      </article>
      <article class="admin-card">
        <div class="card-heading"><div><span class="admin-kicker">TECNOLOGIA</span><h2>Navegadores</h2></div></div>
        <div class="analytics-list" id="browserList"></div>
      </article>
      <article class="admin-card">
        <div class="card-heading"><div><span class="admin-kicker">AUDIÊNCIA</span><h2>Visitantes</h2></div></div>
        <div class="analytics-list" id="visitorTypeList"></div>
      </article>
      <article class="admin-card analytics-card--wide">
        <div class="card-heading"><div><span class="admin-kicker">DISTRIBUIÇÃO</span><h2>Horário das visitas</h2></div></div>
        <div class="analytics-hourly" id="hourlyVisitorsList"></div>
      </article>
      <article class="admin-card">
        <div class="card-heading"><div><span class="admin-kicker">PROFUNDIDADE</span><h2>Scroll da página</h2></div></div>
        <div class="analytics-list" id="scrollJourneyList"></div>
      </article>
      <article class="admin-card">
        <div class="card-heading"><div><span class="admin-kicker">INTERAÇÃO</span><h2>Cliques nos CTAs</h2></div></div>
        <div class="analytics-list" id="ctaClickList"></div>
      </article>
      <article class="admin-card analytics-card--wide">
        <div class="card-heading"><div><span class="admin-kicker">VELOCIDADE DA JORNADA</span><h2>Tempo médio</h2></div></div>
        <div class="analytics-time-grid">
          <div><span>Na página</span><strong id="averagePageTime">—</strong></div>
          <div><span>Até abrir o formulário</span><strong id="averageFormOpenTime">—</strong></div>
          <div><span>Até concluir o cadastro</span><strong id="averageRegistrationTime">—</strong></div>
        </div>
      </article>
      <article class="admin-card">
        <div class="card-heading"><div><span class="admin-kicker">COMPORTAMENTO</span><h2>Eventos mais frequentes</h2></div></div>
        <div class="analytics-list" id="eventList"></div>
      </article>
    </section>`
});

module.exports = { renderAdminAnalytics };
