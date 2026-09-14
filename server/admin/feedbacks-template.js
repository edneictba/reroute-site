const { renderAdminLayout } = require('./admin-layout');

const renderAdminFeedbacks = () => renderAdminLayout({
  activeItem: 'feedbacks', title: 'Feedbacks', brandLabel: 'Admin de Feedbacks',
  scripts: ['/assets/admin/admin-feedbacks.js?v=20260914'],
  content: `
    <section class="admin-intro"><div><span class="admin-kicker">PRODUTO</span><h1>Feedbacks</h1><p>Entenda o que os usuários estão sentindo e priorize melhorias.</p></div></section>
    <section class="metric-grid" aria-label="Resumo dos feedbacks">
      <article class="metric-card"><span>Total</span><strong id="feedbackTotal">—</strong></article>
      <article class="metric-card"><span>Novos</span><strong id="feedbackNew">—</strong></article>
      <article class="metric-card"><span>Em análise</span><strong id="feedbackReview">—</strong></article>
      <article class="metric-card"><span>Resolvidos</span><strong id="feedbackResolved">—</strong></article>
      <article class="metric-card"><span>Nota média</span><strong id="feedbackAverage">—</strong></article>
    </section>
    <section class="admin-card"><div class="card-heading leads-toolbar"><div><span class="admin-kicker">ENTRADAS</span><h2>Feedbacks recebidos</h2></div><label class="search-field"><span class="sr-only">Buscar por nome ou e-mail</span><input id="feedbackSearch" type="search" maxlength="100" placeholder="Buscar nome ou e-mail" autocomplete="off"></label></div>
      <div class="lead-filters" id="feedbackFilters" role="group" aria-label="Filtros de feedback"></div>
      <div id="feedbackStatus" class="table-status" role="status" aria-live="polite">Carregando feedbacks…</div>
      <div class="table-scroll"><table><thead><tr><th>Usuário</th><th>E-mail</th><th>Tipo</th><th>Mensagem</th><th>Nota</th><th>Rota</th><th>Data/hora</th><th>Status</th></tr></thead><tbody id="feedbackTable"></tbody></table></div>
    </section>`
});

module.exports = { renderAdminFeedbacks };
