import { signIn } from '../providers/auth-provider.js';
import { getNavigationForContext } from './navigation.js';
import { getDashboardData, loadDashboardData } from '../providers/dashboard-provider.js';
import { getUpdatesData, getLatestUpdates, loadUpdatesData } from '../providers/updates-provider.js';
import { getDocumentsData, getLatestDocuments, loadDocumentsData } from '../providers/documents-provider.js';
import { getRoadmapData, loadRoadmapData } from '../providers/roadmap-provider.js';
import { getProjectsData, getModulesByRoadmapId, loadProjectsData } from '../providers/projects-provider.js';
import { getFinanceData } from '../providers/finance-provider.js';
import { getInvestorsData, loadInvestorsData } from '../providers/investors-provider.js';
import { getInvestorWorkspaceData, investorWorkspaceNav } from '../providers/demo-investor-workspace.js';
import { getAdminData, loadAdminData } from '../providers/admin-provider.js';
import { setActiveWorkspace, subscribeUserContext } from '../auth/user-context.js';
import { requestPasswordReset, updatePassword } from '../services/auth-service.js';
import { bindLogout, getSafeReturnPath, protectPrivatePage, redirectAuthenticatedUser } from '../guards/route-guard.js';

const sidebar = document.querySelector('[data-portal-sidebar]');
const sidebarToggle = document.querySelector('[data-sidebar-toggle]');
const loginForm = document.querySelector('[data-login-form]');
const recoveryForm = document.querySelector('[data-recovery-form]');
const resetForm = document.querySelector('[data-reset-form]');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let projectEvolutionChart = null;
let financeCashflowChart = null;
let financeDistributionChart = null;
let financeBudgetChart = null;
let investorCapitalChart = null;
let investorOwnershipChart = null;
let investorOccupancyChart = null;
let investorContributionsChart = null;

const deniedMessages = {
  missing_profile: 'Seu acesso ainda não foi configurado pela administração do REROUTE.',
  profile_invited: 'Seu convite ainda precisa ser ativado pela administração do REROUTE.',
  profile_suspended: 'Seu acesso ao Portal está temporariamente suspenso.',
  profile_disabled: 'Seu acesso ao Portal está desativado.',
  organization_inactive: 'A organização vinculada ao seu acesso não está ativa.',
  no_workspace: 'Nenhum workspace ativo foi liberado para o seu acesso.',
  no_role: 'Nenhuma role ativa foi liberada para o seu acesso.',
  missing_capability: 'As permissões necessárias para acessar esta área ainda não foram liberadas.',
  portal_not_configured: 'A estrutura de autorização do Portal ainda não está disponível neste ambiente.',
  session_expired: 'Sua sessão expirou. Acesse novamente para continuar.'
};

const setSidebarState = (open) => {
  sidebar?.classList.toggle('open', open);
  sidebarToggle?.setAttribute('aria-expanded', String(open));
  sidebarToggle?.setAttribute('aria-label', open ? 'Fechar menu do portal' : 'Abrir menu do portal');
};

const getMessageTarget = (form) => {
  const id = form?.dataset?.messageTarget;
  return id ? document.getElementById(id) : form?.querySelector('[aria-live]');
};

const setFormMessage = (form, message, isError = false) => {
  const target = getMessageTarget(form);

  if (!target) {
    return;
  }

  target.classList.toggle('error', isError);
  target.textContent = message;
};

const setFieldState = (field, message = '') => {
  if (!field) {
    return;
  }

  const errorElement = document.getElementById(`${field.id}Error`);
  const hasError = Boolean(message);

  field.setAttribute('aria-invalid', String(hasError));
  field.classList.toggle('invalid', hasError);

  if (errorElement) {
    errorElement.textContent = message;
    errorElement.hidden = !hasError;
  }
};

const resetFieldStates = (form) => {
  form.querySelectorAll('input').forEach((field) => setFieldState(field));
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const validateEmailField = (field) => {
  const email = normalizeEmail(field?.value);

  if (!email || !emailPattern.test(email)) {
    return { valid: false, value: email, message: 'Informe um e-mail valido.' };
  }

  return { valid: true, value: email, message: '' };
};

const setSubmitState = (button, loadingText, loading) => {
  if (!button) {
    return '';
  }

  const originalText = button.dataset.originalText || button.textContent || '';
  button.dataset.originalText = originalText;
  button.disabled = loading;
  button.textContent = loading ? loadingText : originalText;
  return originalText;
};

const getDisplayName = (context) => {
  const profile = context.profile || {};
  return profile.display_name || profile.full_name || context.authUser?.email || 'Usuário autorizado';
};

const getPrimaryRole = (context) => {
  const roles = context.roles || [];
  const activeWorkspaceId = context.activeWorkspace?.id;
  const contextualRole = roles.find((role) => role.workspaceId === activeWorkspaceId) || roles.find((role) => !role.workspaceId) || roles[0];
  return contextualRole?.name || 'Acesso autorizado';
};

const getSafeImageUrl = (value) => {
  const raw = String(value || '').trim();

  if (!raw) {
    return '';
  }

  try {
    const parsed = new URL(raw, window.location.origin);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
  } catch (_error) {
    return raw.startsWith('/') && !raw.startsWith('//') ? raw : '';
  }
};

const setText = (selector, value) => {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
};

const renderNavigation = (context) => {
  const nav = document.querySelector('[data-portal-nav]');

  if (!nav || !context.isAuthorized) {
    return;
  }

  nav.innerHTML = '';

  if (document.body.matches('[data-portal-section="investor-workspace"]')) {
    investorWorkspaceNav.forEach((item) => {
      const link = document.createElement('a');
      link.href = item.route;
      link.textContent = item.label;

      if (item.route === window.location.pathname) {
        link.setAttribute('aria-current', 'page');
      }

      nav.appendChild(link);
    });

    const logout = document.createElement('button');
    logout.className = 'portal-nav-logout';
    logout.type = 'button';
    logout.textContent = 'Sair';
    logout.addEventListener('click', () => {
      document.querySelector('.portal-topbar [data-logout]')?.click();
    });
    nav.appendChild(logout);
    return;
  }

  getNavigationForContext(context).forEach((item) => {
    const link = document.createElement('a');
    link.href = item.route;
    link.title = item.status === 'active' ? item.label : `${item.label} - em breve`;
    link.textContent = item.label;

    const currentPath = `${window.location.pathname}${window.location.hash}`;

    if (item.route === window.location.pathname || item.route === currentPath) {
      link.setAttribute('aria-current', 'page');
    }

    if (item.status !== 'active') {
      const badge = document.createElement('small');
      badge.textContent = 'Em breve';
      link.appendChild(badge);
    }

    nav.appendChild(link);
  });
};

const getToneLabel = (tone) => {
  const labels = {
    online: 'Online',
    progress: 'Construção',
    planned: 'Planejado'
  };

  return labels[tone] || 'Demo';
};

const formatPortalDate = (date) => (
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))
);

const getYearFromDate = (date) => String(new Date(date).getFullYear());

const createBadge = (text, className = 'portal-badge demo') => {
  const badge = document.createElement('span');
  const statusClass = String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  badge.className = `${className}${statusClass ? ` status-${statusClass}` : ''}`;
  badge.textContent = text;
  return badge;
};

const getStatusBadgeClass = (status) => {
  if (status === 'Concluído' || status === 'Atual' || status === 'Publicado') {
    return 'portal-badge success';
  }

  if (status === 'Em desenvolvimento' || status === 'Em revisão') {
    return 'portal-badge warning';
  }

  return 'portal-badge demo';
};

const renderWorkspaceSelector = (context) => {
  const container = document.querySelector('[data-workspace-switcher]');

  if (!container) {
    return;
  }

  if (!context.workspaces?.length || context.workspaces.length === 1) {
    container.hidden = true;
    return;
  }

  container.hidden = false;
  container.innerHTML = '';

  const label = document.createElement('label');
  label.className = 'portal-sr-only';
  label.htmlFor = 'portalWorkspaceSwitch';
  label.textContent = 'Workspace ativo';

  const select = document.createElement('select');
  select.id = 'portalWorkspaceSwitch';
  select.className = 'portal-select compact';
  select.setAttribute('aria-label', 'Workspace ativo');

  context.workspaces.forEach((workspace) => {
    const option = document.createElement('option');
    option.value = workspace.slug;
    option.textContent = workspace.name;
    option.selected = workspace.slug === context.activeWorkspace?.slug;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    setActiveWorkspace(select.value);
    window.location.replace('/portal/dashboard/');
  });

  container.append(label, select);
};

const renderInvestorHero = (data) => {
  const container = document.querySelector('[data-dashboard-hero]');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  const content = document.createElement('div');
  content.className = 'portal-investor-hero-content';

  const eyebrow = document.createElement('span');
  eyebrow.className = 'portal-kicker';
  eyebrow.textContent = data.hero.eyebrow;

  const title = document.createElement('h2');
  title.textContent = data.hero.title;

  const description = document.createElement('p');
  description.className = 'portal-page-copy';
  description.textContent = data.hero.description;

  content.append(eyebrow, title, description);

  const highlights = document.createElement('div');
  highlights.className = 'portal-investor-highlights';

  data.hero.highlights.forEach((item) => {
    const highlight = document.createElement('div');
    const label = document.createElement('span');
    const value = document.createElement('strong');

    label.textContent = item.label;
    value.textContent = item.value;
    highlight.append(label, value);
    highlights.appendChild(highlight);
  });

  container.append(content, highlights);
};

const renderProjectStatus = (data) => {
  const container = document.querySelector('[data-dashboard-status]');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  data.projectStatus.forEach((item) => {
    const card = document.createElement('article');
    card.className = `portal-card portal-metric portal-status-card ${item.tone}`;

    const label = document.createElement('span');
    label.textContent = item.label;

    const value = document.createElement('strong');
    value.textContent = item.value;

    const badge = document.createElement('small');
    badge.className = 'portal-status-pill';
    badge.textContent = getToneLabel(item.tone);

    card.append(label, value, badge);
    container.appendChild(card);
  });
};

const renderRoadmap = (data) => {
  const container = document.querySelector('[data-dashboard-roadmap]');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'portal-section-heading';

  const title = document.createElement('h2');
  title.textContent = 'Roadmap';

  const badge = document.createElement('span');
  badge.className = 'portal-badge demo';
  badge.textContent = 'Demo';

  header.append(title, badge);

  const timeline = document.createElement('ol');
  timeline.className = 'portal-roadmap';

  data.roadmap.forEach((item) => {
    const row = document.createElement('li');
    row.className = `portal-roadmap-item ${item.marker}`;

    const marker = document.createElement('span');
    marker.className = `portal-roadmap-marker ${item.marker}`;
    marker.textContent = item.marker === 'done' ? '✓' : '';

    const body = document.createElement('div');
    const label = document.createElement('strong');
    const status = document.createElement('span');

    label.textContent = item.label;
    status.textContent = item.status;
    body.append(label, status);
    row.append(marker, body);
    timeline.appendChild(row);
  });

  container.append(header, timeline);
};

const renderProjectEvolutionChart = (data) => {
  const container = document.querySelector('[data-dashboard-chart]');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'portal-section-heading';

  const title = document.createElement('h2');
  title.textContent = data.evolution.title;

  const badge = document.createElement('span');
  badge.className = 'portal-badge demo';
  badge.textContent = 'Sem financeiro';

  header.append(title, badge);

  const description = document.createElement('p');
  description.className = 'portal-page-copy';
  description.textContent = data.evolution.description;

  const chartWrap = document.createElement('div');
  chartWrap.className = 'portal-chart-wrap';

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', data.evolution.title);
  canvas.setAttribute('role', 'img');
  chartWrap.appendChild(canvas);

  container.append(header, description, chartWrap);

  if (!window.Chart) {
    const fallback = document.createElement('p');
    fallback.className = 'portal-page-copy';
    fallback.textContent = `${data.evolution.labels.join(' | ')}: ${data.evolution.values.join(', ')}`;
    chartWrap.replaceChildren(fallback);
    return;
  }

  if (projectEvolutionChart) {
    projectEvolutionChart.destroy();
  }

  projectEvolutionChart = new window.Chart(canvas, {
    type: 'line',
    data: {
      labels: data.evolution.labels,
      datasets: [{
        label: 'Maturidade demonstrativa',
        data: data.evolution.values,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, .16)',
        pointBackgroundColor: '#8bea32',
        pointBorderColor: '#ffffff',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 3,
        tension: .38,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(2, 6, 23, .96)',
          borderColor: 'rgba(139, 234, 50, .35)',
          borderWidth: 1,
          titleColor: '#ffffff',
          bodyColor: '#c5cfde'
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, .06)' },
          ticks: { color: '#8c9ab0' }
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(255, 255, 255, .06)' },
          ticks: { color: '#8c9ab0', callback: (value) => `${value}%` }
        }
      }
    }
  });
};

const renderUpdates = () => {
  const container = document.querySelector('[data-dashboard-updates]');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  const title = document.createElement('h2');
  title.textContent = 'Últimas Atualizações';

  const allUpdatesLink = document.createElement('a');
  allUpdatesLink.className = 'portal-button secondary compact';
  allUpdatesLink.href = '/portal/atualizacoes/';
  allUpdatesLink.textContent = 'Ver todas';

  const header = document.createElement('div');
  header.className = 'portal-section-heading';
  header.append(title, allUpdatesLink);

  const list = document.createElement('div');
  list.className = 'portal-update-list';

  getLatestUpdates(5).forEach((item) => {
    const card = document.createElement('article');
    card.className = 'portal-update-card';

    const meta = document.createElement('div');
    meta.className = 'portal-update-meta';
    meta.append(createBadge(item.category), createBadge(formatPortalDate(item.date), 'portal-badge'));

    const itemTitle = document.createElement('strong');
    itemTitle.textContent = item.title;

    const description = document.createElement('p');
    description.textContent = item.summary;

    card.append(meta, itemTitle, description);
    list.appendChild(card);
  });

  container.append(header, list);
};

const renderUpdatesPageHeader = (data) => {
  const container = document.querySelector('[data-updates-page-header]');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  const content = document.createElement('div');
  const breadcrumb = document.createElement('div');
  breadcrumb.className = 'portal-breadcrumb';
  ['Portal', '/', 'Atualizações'].forEach((item) => {
    const span = document.createElement('span');
    span.textContent = item;
    breadcrumb.appendChild(span);
  });

  const eyebrow = document.createElement('span');
  eyebrow.className = 'portal-kicker';
  eyebrow.textContent = data.page.eyebrow;

  const title = document.createElement('h1');
  title.className = 'portal-page-title';
  title.textContent = data.page.title;

  const description = document.createElement('p');
  description.className = 'portal-page-copy';
  description.textContent = data.page.description;

  content.append(breadcrumb, eyebrow, title, description);

  const context = createBadge('Conteúdo demonstrativo', 'portal-badge demo');
  container.append(content, context);
};

const filterUpdates = (data, filters) => {
  const query = filters.query.trim().toLowerCase();

  return data.updates
    .filter((update) => filters.category === 'all' || update.category === filters.category)
    .filter((update) => filters.status === 'all' || update.status === filters.status)
    .filter((update) => {
      if (!query) {
        return true;
      }

      const searchable = [
        update.title,
        update.category,
        update.author,
        update.summary,
        update.content,
        update.status,
        ...update.tags
      ].join(' ').toLowerCase();

      return searchable.includes(query);
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

const renderUpdatesList = (updates) => {
  const container = document.querySelector('[data-updates-list]');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (!updates.length) {
    const empty = document.createElement('article');
    empty.className = 'portal-empty-state';
    empty.textContent = 'Nenhuma atualização encontrada com os filtros selecionados.';
    container.appendChild(empty);
    return;
  }

  updates.forEach((update) => {
    const card = document.createElement('article');
    card.className = 'portal-official-update-card';

    const meta = document.createElement('div');
    meta.className = 'portal-update-meta';
    meta.append(
      createBadge(update.category),
      createBadge(update.status, update.status === 'Publicado' ? 'portal-badge success' : 'portal-badge warning'),
      createBadge(update.readingTime, 'portal-badge')
    );

    const title = document.createElement('h2');
    title.textContent = update.title;

    const details = document.createElement('p');
    details.className = 'portal-update-details';
    details.textContent = `${formatPortalDate(update.date)} • ${update.author}`;

    const summary = document.createElement('p');
    summary.className = 'portal-page-copy';
    summary.textContent = update.summary;

    const content = document.createElement('p');
    content.className = 'portal-update-content';
    content.textContent = update.content;

    const tags = document.createElement('div');
    tags.className = 'portal-tag-list';
    update.tags.forEach((tag) => {
      const tagElement = document.createElement('span');
      tagElement.textContent = `#${tag}`;
      tags.appendChild(tagElement);
    });

    card.append(meta, title, details, summary, content, tags);
    container.appendChild(card);
  });
};

const renderUpdatesTimeline = (updates) => {
  const container = document.querySelector('[data-updates-timeline]');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  const title = document.createElement('h2');
  title.textContent = 'Timeline';

  const timeline = document.createElement('ol');
  timeline.className = 'portal-roadmap portal-official-timeline';

  updates.slice(0, 8).forEach((update) => {
    const item = document.createElement('li');
    item.className = 'portal-roadmap-item done';

    const marker = document.createElement('span');
    marker.className = 'portal-roadmap-marker done';
    marker.textContent = '✓';

    const body = document.createElement('div');
    const label = document.createElement('strong');
    const status = document.createElement('span');

    label.textContent = update.title;
    status.textContent = `${formatPortalDate(update.date)} • ${update.category}`;
    body.append(label, status);
    item.append(marker, body);
    timeline.appendChild(item);
  });

  container.append(title, timeline);
};

const renderUpdatesToolbar = (data) => {
  const container = document.querySelector('[data-updates-toolbar]');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'portal-input';
  search.placeholder = 'Pesquisar atualizações';
  search.setAttribute('aria-label', 'Pesquisar atualizações');

  const category = document.createElement('select');
  category.className = 'portal-select';
  category.setAttribute('aria-label', 'Filtrar por categoria');
  category.append(new Option('Todas as categorias', 'all'));
  data.categories.forEach((item) => category.append(new Option(item, item)));

  const status = document.createElement('select');
  status.className = 'portal-select';
  status.setAttribute('aria-label', 'Filtrar por status');
  status.append(new Option('Todos os status', 'all'));
  data.statuses.forEach((item) => status.append(new Option(item, item)));

  const result = document.createElement('span');
  result.className = 'portal-updates-count';

  const applyFilters = () => {
    const filtered = filterUpdates(data, {
      query: search.value,
      category: category.value,
      status: status.value
    });

    result.textContent = `${filtered.length} publicações`;
    renderUpdatesList(filtered);
    renderUpdatesTimeline(filtered);
  };

  search.addEventListener('input', applyFilters);
  category.addEventListener('change', applyFilters);
  status.addEventListener('change', applyFilters);

  container.append(search, category, status, result);
  applyFilters();
};

const renderOfficialUpdatesModule = () => {
  if (!document.body.matches('[data-portal-page="updates"]')) {
    return;
  }

  const dashboardData = getDashboardData();
  const updatesData = getUpdatesData();
  setText('[data-dashboard-environment]', dashboardData.header.environmentLabel);
  setText('[data-dashboard-footer]', dashboardData.header.footerNote);
  renderUpdatesPageHeader(updatesData);
  renderUpdatesToolbar(updatesData);
};

const renderNextSteps = (data) => {
  const container = document.querySelector('[data-dashboard-next-steps]');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  const title = document.createElement('h2');
  title.textContent = 'Próximos Passos';

  const list = document.createElement('ul');
  list.className = 'portal-list portal-next-steps';

  data.nextSteps.forEach((item) => {
    const row = document.createElement('li');
    const label = document.createElement('span');
    const status = document.createElement('span');

    label.textContent = item.title;
    status.className = 'portal-badge demo';
    status.textContent = item.status;
    row.append(label, status);
    list.appendChild(row);
  });

  container.append(title, list);
};

const renderDashboardDocuments = () => {
  const container = document.querySelector('[data-dashboard-documents]');

  if (!container) {
    return;
  }

  const data = getDocumentsData();
  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'portal-section-heading';

  const title = document.createElement('h2');
  title.textContent = data.dashboard.title;

  const allDocumentsLink = document.createElement('a');
  allDocumentsLink.className = 'portal-button secondary compact';
  allDocumentsLink.href = '/portal/documentos/';
  allDocumentsLink.textContent = 'Abrir Data Room';

  header.append(title, allDocumentsLink);

  const description = document.createElement('p');
  description.className = 'portal-page-copy';
  description.textContent = data.dashboard.description;

  const list = document.createElement('div');
  list.className = 'portal-document-mini-list';

  getLatestDocuments(5).forEach((documentItem) => {
    const card = document.createElement('article');
    card.className = 'portal-document-mini-card';

    const meta = document.createElement('div');
    meta.className = 'portal-update-meta';
    meta.append(
      createBadge(documentItem.category),
      createBadge(documentItem.format, 'portal-badge'),
      createBadge(documentItem.status, documentItem.status === 'Atual' ? 'portal-badge success' : 'portal-badge warning')
    );

    const itemTitle = document.createElement('strong');
    itemTitle.textContent = documentItem.title;

    const itemDetails = document.createElement('span');
    itemDetails.textContent = `${formatPortalDate(documentItem.date)} • ${documentItem.version} • ${documentItem.size}`;

    card.append(meta, itemTitle, itemDetails);
    list.appendChild(card);
  });

  container.append(header, description, list);
};

const renderDocumentsPageHeader = (data) => {
  const container = document.querySelector('[data-documents-page-header]');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  const content = document.createElement('div');
  const breadcrumb = document.createElement('div');
  breadcrumb.className = 'portal-breadcrumb';
  ['Portal', '/', 'Documentos'].forEach((item) => {
    const span = document.createElement('span');
    span.textContent = item;
    breadcrumb.appendChild(span);
  });

  const eyebrow = document.createElement('span');
  eyebrow.className = 'portal-kicker';
  eyebrow.textContent = data.page.eyebrow;

  const title = document.createElement('h1');
  title.className = 'portal-page-title';
  title.textContent = data.page.title;

  const description = document.createElement('p');
  description.className = 'portal-page-copy';
  description.textContent = data.page.description;

  content.append(breadcrumb, eyebrow, title, description);

  const context = createBadge('Documentos demonstrativos', 'portal-badge demo');
  container.append(content, context);
};

const getDocumentYears = (documents) => (
  [...new Set(documents.map((documentItem) => getYearFromDate(documentItem.date)))]
    .sort((a, b) => Number(b) - Number(a))
);

const filterDocuments = (data, filters) => {
  const query = filters.query.trim().toLowerCase();

  return data.documents
    .filter((documentItem) => filters.category === 'all' || documentItem.category === filters.category)
    .filter((documentItem) => filters.status === 'all' || documentItem.status === filters.status)
    .filter((documentItem) => filters.year === 'all' || getYearFromDate(documentItem.date) === filters.year)
    .filter((documentItem) => {
      if (!query) {
        return true;
      }

      const searchable = [
        documentItem.title,
        documentItem.category,
        documentItem.description,
        documentItem.author,
        documentItem.version,
        documentItem.size,
        documentItem.format,
        documentItem.status,
        documentItem.accessLevel
      ].join(' ').toLowerCase();

      return searchable.includes(query);
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

const renderDocumentsSummary = (documents) => {
  const container = document.querySelector('[data-documents-summary]');

  if (!container) {
    return;
  }

  const current = documents.filter((documentItem) => documentItem.status === 'Atual').length;
  const review = documents.filter((documentItem) => documentItem.status === 'Em revisão').length;
  const categories = new Set(documents.map((documentItem) => documentItem.category)).size;
  const restricted = documents.filter((documentItem) => documentItem.accessLevel === 'Restrito').length;
  const summary = [
    { label: 'Documentos', value: String(documents.length), tone: 'online' },
    { label: 'Atuais', value: String(current), tone: 'online' },
    { label: 'Em revisão', value: String(review), tone: 'progress' },
    { label: 'Categorias', value: String(categories), tone: 'online' },
    { label: 'Restritos', value: String(restricted), tone: 'planned' }
  ];

  container.innerHTML = '';

  summary.forEach((item) => {
    const card = document.createElement('article');
    card.className = `portal-card portal-metric portal-status-card ${item.tone}`;

    const label = document.createElement('span');
    label.textContent = item.label;

    const value = document.createElement('strong');
    value.textContent = item.value;

    card.append(label, value);
    container.appendChild(card);
  });
};

const renderDocumentsTable = (documents) => {
  const container = document.querySelector('[data-documents-table]');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'portal-section-heading';

  const title = document.createElement('h2');
  title.textContent = 'Data Room';

  const count = createBadge(`${documents.length} documentos`, 'portal-badge demo');
  header.append(title, count);

  if (!documents.length) {
    const empty = document.createElement('article');
    empty.className = 'portal-empty-state';
    empty.textContent = 'Nenhum documento encontrado com os filtros selecionados.';
    container.append(header, empty);
    return;
  }

  const tableWrap = document.createElement('div');
  tableWrap.className = 'portal-document-table-wrap';

  const table = document.createElement('table');
  table.className = 'portal-document-table';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Documento', 'Categoria', 'Data', 'Versão', 'Status', 'Acesso', 'Ações'].forEach((item) => {
    const th = document.createElement('th');
    th.textContent = item;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  const tbody = document.createElement('tbody');
  documents.forEach((documentItem) => {
    const row = document.createElement('tr');

    const documentCell = document.createElement('td');
    const documentTitle = document.createElement('strong');
    const documentDescription = document.createElement('span');
    const documentMeta = document.createElement('small');
    documentTitle.textContent = documentItem.title;
    documentDescription.textContent = documentItem.description;
    documentMeta.textContent = `${documentItem.author} • ${documentItem.format} • ${documentItem.size}`;
    documentCell.append(documentTitle, documentDescription, documentMeta);

    const categoryCell = document.createElement('td');
    categoryCell.appendChild(createBadge(documentItem.category));

    const dateCell = document.createElement('td');
    dateCell.textContent = formatPortalDate(documentItem.date);

    const versionCell = document.createElement('td');
    versionCell.textContent = documentItem.version;

    const statusCell = document.createElement('td');
    statusCell.appendChild(createBadge(documentItem.status, documentItem.status === 'Atual' ? 'portal-badge success' : 'portal-badge warning'));

    const accessCell = document.createElement('td');
    accessCell.textContent = documentItem.accessLevel;

    const actionsCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'portal-document-actions';
    const viewButton = document.createElement('button');
    viewButton.className = 'portal-button secondary compact';
    viewButton.type = 'button';
    viewButton.disabled = true;
    viewButton.textContent = 'Visualizar';
    viewButton.setAttribute('aria-label', `Visualizar ${documentItem.title} indisponível nesta demonstração`);
    const downloadButton = document.createElement('button');
    downloadButton.className = 'portal-button secondary compact';
    downloadButton.type = 'button';
    downloadButton.disabled = true;
    downloadButton.textContent = 'Download';
    downloadButton.setAttribute('aria-label', `Download de ${documentItem.title} indisponível nesta demonstração`);
    actions.append(viewButton, downloadButton);
    actionsCell.appendChild(actions);

    row.append(documentCell, categoryCell, dateCell, versionCell, statusCell, accessCell, actionsCell);
    tbody.appendChild(row);
  });

  table.append(thead, tbody);
  tableWrap.appendChild(table);
  container.append(header, tableWrap);
};

const renderDocumentsToolbar = (data) => {
  const container = document.querySelector('[data-documents-toolbar]');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'portal-input';
  search.placeholder = 'Pesquisar documentos';
  search.setAttribute('aria-label', 'Pesquisar documentos');

  const category = document.createElement('select');
  category.className = 'portal-select';
  category.setAttribute('aria-label', 'Filtrar documentos por categoria');
  category.append(new Option('Todas as categorias', 'all'));
  data.categories.forEach((item) => category.append(new Option(item, item)));

  const status = document.createElement('select');
  status.className = 'portal-select';
  status.setAttribute('aria-label', 'Filtrar documentos por status');
  status.append(new Option('Todos os status', 'all'));
  data.statuses.forEach((item) => status.append(new Option(item, item)));

  const year = document.createElement('select');
  year.className = 'portal-select';
  year.setAttribute('aria-label', 'Filtrar documentos por ano');
  year.append(new Option('Todos os anos', 'all'));
  getDocumentYears(data.documents).forEach((item) => year.append(new Option(item, item)));

  const result = document.createElement('span');
  result.className = 'portal-updates-count';

  const applyFilters = () => {
    const filtered = filterDocuments(data, {
      query: search.value,
      category: category.value,
      status: status.value,
      year: year.value
    });

    result.textContent = `${filtered.length} documentos`;
    renderDocumentsSummary(filtered);
    renderDocumentsTable(filtered);
  };

  search.addEventListener('input', applyFilters);
  category.addEventListener('change', applyFilters);
  status.addEventListener('change', applyFilters);
  year.addEventListener('change', applyFilters);

  container.append(search, category, status, year, result);
  applyFilters();
};

const renderDocumentsModule = () => {
  if (!document.body.matches('[data-portal-page="documents"]')) {
    return;
  }

  const dashboardData = getDashboardData();
  const documentsData = getDocumentsData();
  setText('[data-dashboard-environment]', dashboardData.header.environmentLabel);
  setText('[data-dashboard-footer]', dashboardData.header.footerNote);
  renderDocumentsPageHeader(documentsData);
  renderDocumentsToolbar(documentsData);
};

const renderDashboardRoadmapSummary = () => {
  const container = document.querySelector('[data-dashboard-roadmap-summary]');

  if (!container) {
    return;
  }

  const data = getRoadmapData();
  const { summary } = data;
  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'portal-section-heading';

  const title = document.createElement('h2');
  title.textContent = data.dashboard.title;

  const link = document.createElement('a');
  link.className = 'portal-button secondary compact';
  link.href = '/portal/roadmap/';
  link.textContent = 'Abrir Roadmap';

  header.append(title, link);

  const description = document.createElement('p');
  description.className = 'portal-page-copy';
  description.textContent = data.dashboard.description;

  const progress = document.createElement('div');
  progress.className = 'portal-smart-progress';
  progress.innerHTML = `<span style="width:${summary.progress}%"></span>`;

  const list = document.createElement('ul');
  list.className = 'portal-list portal-roadmap-dashboard-list';

  [
    ['Progresso', `${summary.progress}%`],
    ['Sprint Atual', summary.currentSprint],
    ['Próxima Sprint', summary.nextSprint],
    ['Última Atualização', formatPortalDate(summary.latestUpdate)]
  ].forEach(([label, value]) => {
    const row = document.createElement('li');
    const labelElement = document.createElement('span');
    const valueElement = document.createElement('strong');
    labelElement.textContent = label;
    valueElement.textContent = value;
    row.append(labelElement, valueElement);
    list.appendChild(row);
  });

  container.append(header, description, progress, list);
};

const renderRoadmapPageHeader = (data) => {
  const container = document.querySelector('[data-roadmap-page-header]');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  const content = document.createElement('div');
  const breadcrumb = document.createElement('div');
  breadcrumb.className = 'portal-breadcrumb';
  ['Portal', '/', 'Roadmap'].forEach((item) => {
    const span = document.createElement('span');
    span.textContent = item;
    breadcrumb.appendChild(span);
  });

  const eyebrow = document.createElement('span');
  eyebrow.className = 'portal-kicker';
  eyebrow.textContent = data.page.eyebrow;

  const title = document.createElement('h1');
  title.className = 'portal-page-title';
  title.textContent = data.page.title;

  const description = document.createElement('p');
  description.className = 'portal-page-copy';
  description.textContent = data.page.description;

  content.append(breadcrumb, eyebrow, title, description);
  container.append(content, createBadge('Roadmap demonstrativo', 'portal-badge demo'));
};

const renderRoadmapOverview = (data) => {
  const container = document.querySelector('[data-roadmap-overview]');

  if (!container) {
    return;
  }

  const { summary } = data;
  container.innerHTML = '';

  const content = document.createElement('div');
  const title = document.createElement('h2');
  title.textContent = 'Visão estratégica dos próximos anos';

  const copy = document.createElement('p');
  copy.className = 'portal-page-copy';
  copy.textContent = 'Uma leitura demonstrativa sobre onde estamos, o que já foi entregue e os próximos movimentos estratégicos do REROUTE.';

  content.append(title, copy);

  const progressBlock = document.createElement('div');
  progressBlock.className = 'portal-roadmap-progress-block';
  const label = document.createElement('span');
  label.textContent = 'Progresso geral';
  const value = document.createElement('strong');
  value.textContent = `${summary.progress}%`;
  const bar = document.createElement('div');
  bar.className = 'portal-smart-progress';
  bar.innerHTML = `<span style="width:${summary.progress}%"></span>`;
  progressBlock.append(label, value, bar);

  container.append(content, progressBlock);
};

const renderRoadmapSummary = (summary) => {
  const container = document.querySelector('[data-roadmap-summary]');

  if (!container) {
    return;
  }

  const cards = [
    { label: 'Total de marcos', value: String(summary.total), tone: 'online' },
    { label: 'Concluídos', value: String(summary.completed), tone: 'online' },
    { label: 'Em desenvolvimento', value: String(summary.inProgress), tone: 'progress' },
    { label: 'Planejados', value: String(summary.planned), tone: 'planned' }
  ];

  container.innerHTML = '';

  cards.forEach((item) => {
    const card = document.createElement('article');
    card.className = `portal-card portal-metric portal-status-card ${item.tone}`;
    const label = document.createElement('span');
    label.textContent = item.label;
    const value = document.createElement('strong');
    value.textContent = item.value;
    card.append(label, value);
    container.appendChild(card);
  });
};

const filterRoadmap = (data, filters) => {
  const query = filters.query.trim().toLowerCase();

  return data.milestones
    .filter((item) => filters.category === 'all' || item.category === filters.category)
    .filter((item) => filters.status === 'all' || item.status === filters.status)
    .filter((item) => {
      if (!query) {
        return true;
      }

      const searchable = [
        item.title,
        item.category,
        item.description,
        item.priority,
        item.status,
        item.expectedDate,
        item.version,
        item.owner,
        ...item.dependencies
      ].join(' ').toLowerCase();

      return searchable.includes(query);
    })
    .sort((a, b) => {
      const statusDiff = data.statusOrder.indexOf(a.status) - data.statusOrder.indexOf(b.status);
      return statusDiff || new Date(a.expectedDate) - new Date(b.expectedDate);
    });
};

const renderRoadmapList = (milestones) => {
  const container = document.querySelector('[data-roadmap-list]');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (!milestones.length) {
    const empty = document.createElement('article');
    empty.className = 'portal-empty-state';
    empty.textContent = 'Nenhum marco encontrado com os filtros selecionados.';
    container.appendChild(empty);
    return;
  }

  milestones.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'portal-smart-roadmap-card';

    const meta = document.createElement('div');
    meta.className = 'portal-update-meta';
    meta.append(
      createBadge(item.category),
      createBadge(item.status, getStatusBadgeClass(item.status)),
      createBadge(item.priority, 'portal-badge'),
      createBadge(item.version, 'portal-badge')
    );

    const title = document.createElement('h2');
    title.textContent = item.title;

    const description = document.createElement('p');
    description.className = 'portal-page-copy';
    description.textContent = item.description;

    const progressHeader = document.createElement('div');
    progressHeader.className = 'portal-roadmap-progress-row';
    const progressLabel = document.createElement('span');
    progressLabel.textContent = 'Percentual';
    const progressValue = document.createElement('strong');
    progressValue.textContent = `${item.percent}%`;
    progressHeader.append(progressLabel, progressValue);

    const progress = document.createElement('div');
    progress.className = 'portal-smart-progress';
    progress.innerHTML = `<span style="width:${item.percent}%"></span>`;

    const relatedModules = getModulesByRoadmapId(item.id);
    const relatedLink = document.createElement('a');
    relatedLink.className = 'portal-button secondary compact portal-roadmap-related-link';
    relatedLink.href = `/portal/projetos/?roadmap=${encodeURIComponent(item.id)}`;
    relatedLink.textContent = `${relatedModules.length} módulos relacionados`;

    const details = document.createElement('div');
    details.className = 'portal-roadmap-detail-grid';
    [
      ['Data prevista', formatPortalDate(item.expectedDate)],
      ['Responsável', item.owner],
      ['Dependências', item.dependencies.join(', ')]
    ].forEach(([label, value]) => {
      const detail = document.createElement('div');
      const labelElement = document.createElement('span');
      const valueElement = document.createElement('strong');
      labelElement.textContent = label;
      valueElement.textContent = value;
      detail.append(labelElement, valueElement);
      details.appendChild(detail);
    });

    card.append(meta, title, description, progressHeader, progress, relatedLink, details);
    container.appendChild(card);
  });
};

const renderRoadmapStrategy = (data, milestones) => {
  const container = document.querySelector('[data-roadmap-strategy]');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  const title = document.createElement('h2');
  title.textContent = 'Linha estratégica';

  const timeline = document.createElement('ol');
  timeline.className = 'portal-roadmap portal-official-timeline';

  milestones.slice(0, 10).forEach((item) => {
    const row = document.createElement('li');
    row.className = `portal-roadmap-item ${item.status === 'Concluído' ? 'done' : item.status === 'Em desenvolvimento' ? 'current' : 'planned'}`;

    const marker = document.createElement('span');
    marker.className = `portal-roadmap-marker ${item.status === 'Concluído' ? 'done' : item.status === 'Em desenvolvimento' ? 'current' : 'planned'}`;
    marker.textContent = item.status === 'Concluído' ? '✓' : '';

    const body = document.createElement('div');
    const label = document.createElement('strong');
    label.textContent = item.title;
    const status = document.createElement('span');
    status.textContent = `${item.status} • ${formatPortalDate(item.expectedDate)}`;
    body.append(label, status);
    row.append(marker, body);
    timeline.appendChild(row);
  });

  container.append(title, timeline);
};

const renderRoadmapToolbar = (data) => {
  const container = document.querySelector('[data-roadmap-toolbar]');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'portal-input';
  search.placeholder = 'Pesquisar no roadmap';
  search.setAttribute('aria-label', 'Pesquisar no roadmap');

  const category = document.createElement('select');
  category.className = 'portal-select';
  category.setAttribute('aria-label', 'Filtrar roadmap por categoria');
  category.append(new Option('Todas as categorias', 'all'));
  data.categories.forEach((item) => category.append(new Option(item, item)));

  const status = document.createElement('select');
  status.className = 'portal-select';
  status.setAttribute('aria-label', 'Filtrar roadmap por status');
  status.append(new Option('Todos os status', 'all'));
  data.statuses.forEach((item) => status.append(new Option(item, item)));

  const result = document.createElement('span');
  result.className = 'portal-updates-count';

  const applyFilters = () => {
    const filtered = filterRoadmap(data, {
      query: search.value,
      category: category.value,
      status: status.value
    });

    result.textContent = `${filtered.length} marcos`;
    renderRoadmapList(filtered);
    renderRoadmapStrategy(data, filtered);
  };

  search.addEventListener('input', applyFilters);
  category.addEventListener('change', applyFilters);
  status.addEventListener('change', applyFilters);

  container.append(search, category, status, result);
  applyFilters();
};

const renderRoadmapModule = () => {
  if (!document.body.matches('[data-portal-page="roadmap"]')) {
    return;
  }

  const dashboardData = getDashboardData();
  const roadmapData = getRoadmapData();
  setText('[data-dashboard-environment]', dashboardData.header.environmentLabel);
  setText('[data-dashboard-footer]', dashboardData.header.footerNote);
  renderRoadmapPageHeader(roadmapData);
  renderRoadmapOverview(roadmapData);
  renderRoadmapSummary(roadmapData.summary);
  renderRoadmapToolbar(roadmapData);
};

const renderDashboardProjects = () => {
  const container = document.querySelector('[data-dashboard-projects]');

  if (!container) {
    return;
  }

  const data = getProjectsData();
  const { summary } = data;
  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'portal-section-heading';
  const title = document.createElement('h2');
  title.textContent = data.dashboard.title;
  const link = document.createElement('a');
  link.className = 'portal-button secondary compact';
  link.href = '/portal/projetos/';
  link.textContent = 'Abrir Projetos';
  header.append(title, link);

  const description = document.createElement('p');
  description.className = 'portal-page-copy';
  description.textContent = data.dashboard.description;

  const grid = document.createElement('div');
  grid.className = 'portal-dashboard-project-grid';
  [
    ['Projetos Ativos', String(summary.activeProjects)],
    ['Sprint Atual', summary.currentSprint],
    ['Tarefas Concluídas', String(summary.completedTasks)],
    ['Próximas Entregas', summary.upcomingDeliveries.slice(0, 2).join(', ')]
  ].forEach(([label, value]) => {
    const item = document.createElement('div');
    const itemLabel = document.createElement('span');
    const itemValue = document.createElement('strong');
    itemLabel.textContent = label;
    itemValue.textContent = value;
    item.append(itemLabel, itemValue);
    grid.appendChild(item);
  });

  container.append(header, description, grid);
};

const renderProjectsPageHeader = (data) => {
  const container = document.querySelector('[data-projects-page-header]');

  if (!container) {
    return;
  }

  container.innerHTML = '';
  const content = document.createElement('div');
  const breadcrumb = document.createElement('div');
  breadcrumb.className = 'portal-breadcrumb';
  ['Portal', '/', 'Projetos'].forEach((item) => {
    const span = document.createElement('span');
    span.textContent = item;
    breadcrumb.appendChild(span);
  });
  const eyebrow = document.createElement('span');
  eyebrow.className = 'portal-kicker';
  eyebrow.textContent = data.page.eyebrow;
  const title = document.createElement('h1');
  title.className = 'portal-page-title';
  title.textContent = data.page.title;
  const description = document.createElement('p');
  description.className = 'portal-page-copy';
  description.textContent = data.page.description;
  content.append(breadcrumb, eyebrow, title, description);
  container.append(content, createBadge('Dados demonstrativos', 'portal-badge demo'));
};

const renderProjectsSummary = (summary) => {
  const container = document.querySelector('[data-projects-summary]');

  if (!container) {
    return;
  }

  const cards = [
    ['Projetos', summary.projects],
    ['Épicos', summary.epics],
    ['Módulos', summary.modules],
    ['Sprints', summary.sprints],
    ['Tarefas', summary.tasks],
    ['Progresso Geral', `${summary.progress}%`]
  ];
  container.innerHTML = '';
  cards.forEach(([label, value]) => {
    const card = document.createElement('article');
    card.className = 'portal-card portal-metric portal-status-card progress';
    const labelElement = document.createElement('span');
    labelElement.textContent = label;
    const valueElement = document.createElement('strong');
    valueElement.textContent = String(value);
    card.append(labelElement, valueElement);
    container.appendChild(card);
  });
};

const filterProjects = (data, filters) => {
  const query = filters.query.trim().toLowerCase();
  const roadmapModules = filters.roadmap
    ? new Set(data.modules.filter((module) => module.roadmapId === filters.roadmap).map((module) => module.projectId))
    : null;

  return data.projects
    .filter((project) => filters.category === 'all' || project.category === filters.category)
    .filter((project) => filters.status === 'all' || project.status === filters.status)
    .filter((project) => filters.priority === 'all' || project.priority === filters.priority)
    .filter((project) => !roadmapModules || roadmapModules.has(project.id))
    .filter((project) => {
      if (!query) {
        return true;
      }

      const searchable = [
        project.name,
        project.description,
        project.status,
        project.priority,
        project.owner,
        project.category,
        project.version,
        ...project.dependencies
      ].join(' ').toLowerCase();

      return searchable.includes(query);
    });
};

const getProjectChildren = (data, projectId) => {
  const epics = data.epics.filter((epic) => epic.projectId === projectId);
  const modules = data.modules.filter((module) => module.projectId === projectId);
  const tasks = data.tasks.filter((task) => task.projectId === projectId);
  return { epics, modules, tasks };
};

const renderProjectsBoard = (data, projects) => {
  const container = document.querySelector('[data-projects-board]');

  if (!container) {
    return;
  }

  container.innerHTML = '';
  data.statuses.forEach((status) => {
    const column = document.createElement('section');
    column.className = 'portal-kanban-column';
    const header = document.createElement('div');
    header.className = 'portal-section-heading';
    const title = document.createElement('h2');
    title.textContent = status;
    const statusProjects = projects.filter((project) => project.status === status);
    header.append(title, createBadge(String(statusProjects.length), 'portal-badge'));
    const list = document.createElement('div');
    list.className = 'portal-kanban-list';

    statusProjects.forEach((project) => {
      const card = document.createElement('article');
      card.className = 'portal-kanban-card';
      const meta = document.createElement('div');
      meta.className = 'portal-update-meta';
      meta.append(createBadge(project.category), createBadge(project.priority, 'portal-badge'));
      const name = document.createElement('strong');
      name.textContent = project.name;
      const progress = document.createElement('div');
      progress.className = 'portal-smart-progress';
      progress.innerHTML = `<span style="width:${project.percent}%"></span>`;
      const percent = document.createElement('span');
      percent.textContent = `${project.percent}% • ${project.owner}`;
      card.append(meta, name, progress, percent);
      list.appendChild(card);
    });

    column.append(header, list);
    container.appendChild(column);
  });
};

const renderProjectsList = (data, projects) => {
  const container = document.querySelector('[data-projects-list]');

  if (!container) {
    return;
  }

  container.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'portal-section-heading';
  const title = document.createElement('h2');
  title.textContent = 'Lista de execução';
  header.append(title, createBadge(`${projects.length} projetos`, 'portal-badge demo'));
  container.appendChild(header);

  projects.forEach((project) => {
    const children = getProjectChildren(data, project.id);
    const card = document.createElement('article');
    card.className = 'portal-project-execution-card';
    const meta = document.createElement('div');
    meta.className = 'portal-update-meta';
    meta.append(
      createBadge(project.category),
      createBadge(project.status, getStatusBadgeClass(project.status)),
      createBadge(project.priority, 'portal-badge'),
      createBadge(project.version, 'portal-badge')
    );
    const title = document.createElement('h2');
    title.textContent = project.name;
    const description = document.createElement('p');
    description.className = 'portal-page-copy';
    description.textContent = project.description;
    const progressRow = document.createElement('div');
    progressRow.className = 'portal-roadmap-progress-row';
    const progressLabel = document.createElement('span');
    progressLabel.textContent = 'Progresso';
    const progressValue = document.createElement('strong');
    progressValue.textContent = `${project.percent}%`;
    progressRow.append(progressLabel, progressValue);
    const progress = document.createElement('div');
    progress.className = 'portal-smart-progress';
    progress.innerHTML = `<span style="width:${project.percent}%"></span>`;
    const stats = document.createElement('div');
    stats.className = 'portal-roadmap-detail-grid';
    [
      ['Épicos', children.epics.length],
      ['Módulos', children.modules.length],
      ['Tarefas', children.tasks.length],
      ['Data prevista', formatPortalDate(project.expectedDate)],
      ['Responsável', project.owner],
      ['Dependências', project.dependencies.join(', ')]
    ].forEach(([label, value]) => {
      const detail = document.createElement('div');
      const labelElement = document.createElement('span');
      const valueElement = document.createElement('strong');
      labelElement.textContent = label;
      valueElement.textContent = String(value);
      detail.append(labelElement, valueElement);
      stats.appendChild(detail);
    });

    const moduleList = document.createElement('div');
    moduleList.className = 'portal-project-module-list';
    children.modules.slice(0, 5).forEach((module) => {
      const item = document.createElement('span');
      item.textContent = `${module.name} (${module.status})`;
      moduleList.appendChild(item);
    });

    card.append(meta, title, description, progressRow, progress, stats, moduleList);
    container.appendChild(card);
  });
};

const renderProjectsTimeline = (data, projects) => {
  const container = document.querySelector('[data-projects-timeline]');

  if (!container) {
    return;
  }

  const visibleProjectIds = new Set(projects.map((project) => project.id));
  const tasks = data.tasks.filter((task) => visibleProjectIds.has(task.projectId)).slice(0, 12);
  container.innerHTML = '';
  const title = document.createElement('h2');
  title.textContent = 'Timeline e riscos';
  const timeline = document.createElement('ol');
  timeline.className = 'portal-roadmap portal-official-timeline';
  tasks.forEach((task) => {
    const row = document.createElement('li');
    row.className = `portal-roadmap-item ${task.status === 'Concluído' ? 'done' : task.status === 'Em Desenvolvimento' ? 'current' : 'planned'}`;
    const marker = document.createElement('span');
    marker.className = `portal-roadmap-marker ${task.status === 'Concluído' ? 'done' : task.status === 'Em Desenvolvimento' ? 'current' : 'planned'}`;
    marker.textContent = task.status === 'Concluído' ? '✓' : '';
    const body = document.createElement('div');
    const label = document.createElement('strong');
    label.textContent = task.title;
    const status = document.createElement('span');
    status.textContent = `${task.status} • ${task.risk} • ${task.nextStep}`;
    body.append(label, status);
    row.append(marker, body);
    timeline.appendChild(row);
  });
  container.append(title, timeline);
};

const renderProjectsToolbar = (data) => {
  const container = document.querySelector('[data-projects-toolbar]');

  if (!container) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const roadmap = params.get('roadmap') || '';
  container.innerHTML = '';

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'portal-input';
  search.placeholder = 'Pesquisar projetos, épicos e módulos';
  search.setAttribute('aria-label', 'Pesquisar no Execution Center');

  const category = document.createElement('select');
  category.className = 'portal-select';
  category.setAttribute('aria-label', 'Filtrar projetos por categoria');
  category.append(new Option('Todas as categorias', 'all'));
  data.categories.forEach((item) => category.append(new Option(item, item)));

  const status = document.createElement('select');
  status.className = 'portal-select';
  status.setAttribute('aria-label', 'Filtrar projetos por status');
  status.append(new Option('Todos os status', 'all'));
  data.statuses.forEach((item) => status.append(new Option(item, item)));

  const priority = document.createElement('select');
  priority.className = 'portal-select';
  priority.setAttribute('aria-label', 'Filtrar projetos por prioridade');
  priority.append(new Option('Todas as prioridades', 'all'));
  data.priorities.forEach((item) => priority.append(new Option(item, item)));

  const result = document.createElement('span');
  result.className = 'portal-updates-count';

  const applyFilters = () => {
    const filtered = filterProjects(data, {
      query: search.value,
      category: category.value,
      status: status.value,
      priority: priority.value,
      roadmap
    });
    result.textContent = roadmap ? `${filtered.length} projetos relacionados` : `${filtered.length} projetos`;
    renderProjectsBoard(data, filtered);
    renderProjectsList(data, filtered);
    renderProjectsTimeline(data, filtered);
  };

  search.addEventListener('input', applyFilters);
  category.addEventListener('change', applyFilters);
  status.addEventListener('change', applyFilters);
  priority.addEventListener('change', applyFilters);

  if (roadmap) {
    container.append(createBadge(`Roadmap: ${roadmap}`, 'portal-badge warning'));
  }
  container.append(search, category, status, priority, result);
  applyFilters();
};

const renderProjectsModule = () => {
  if (!document.body.matches('[data-portal-page="projects"]')) {
    return;
  }

  const dashboardData = getDashboardData();
  const projectsData = getProjectsData();
  setText('[data-dashboard-environment]', dashboardData.header.environmentLabel);
  setText('[data-dashboard-footer]', dashboardData.header.footerNote);
  renderProjectsPageHeader(projectsData);
  renderProjectsSummary(projectsData.summary);
  renderProjectsToolbar(projectsData);
};

const getFinanceStateLabel = (status) => {
  const labels = {
    loading: 'Carregando',
    success: 'Dados reais',
    empty: 'Sem dados',
    error: 'Erro',
    forbidden: 'Sem permissão',
    schema_missing: 'Tabelas ausentes',
    invalid_workspace: 'Workspace inválido',
    invalid_organization: 'Organização inválida'
  };

  return labels[status] || 'Estado financeiro';
};

const renderFinanceStateNotice = (container, state, title = 'Dados financeiros reais') => {
  if (!container || !state) {
    return;
  }

  const notice = document.createElement('article');
  notice.className = `portal-empty-state portal-finance-state ${state.status || 'loading'}`;
  const heading = document.createElement('strong');
  heading.textContent = title;
  const badge = createBadge(getFinanceStateLabel(state.status), state.status === 'success' ? 'portal-badge success' : 'portal-badge warning');
  const message = document.createElement('p');
  message.className = 'portal-page-copy';
  message.textContent = state.message || 'Carregando dados financeiros reais.';
  notice.append(heading, badge, message);
  container.appendChild(notice);
};

const renderDashboardFinance = async (context) => {
  const container = document.querySelector('[data-dashboard-finance]');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'portal-section-heading';
  const title = document.createElement('h2');
  title.textContent = 'Saúde Financeira';
  const link = document.createElement('a');
  link.className = 'portal-button secondary compact';
  link.href = '/portal/financeiro/';
  link.textContent = 'Abrir Financeiro';
  header.append(title, link);

  container.append(header);
  renderFinanceStateNotice(container, { status: 'loading', message: 'Carregando resumo financeiro...' }, 'Financeiro');

  const financeData = await getFinanceData(context);

  container.innerHTML = '';
  container.append(header);

  if (financeData.financeState?.status !== 'success') {
    renderFinanceStateNotice(container, financeData.financeState, 'Financeiro');
    return;
  }

  const nextDescription = document.createElement('p');
  nextDescription.className = 'portal-page-copy';
  nextDescription.textContent = financeData.dashboard.description;
  const nextGrid = document.createElement('div');
  nextGrid.className = 'portal-dashboard-project-grid';
  const overviewByLabel = new Map(financeData.overview.map((item) => [item.label, item.value]));
  const indicatorsByLabel = new Map(financeData.indicators.map((item) => [item.label, item.value]));
  [
    ['Saldo', overviewByLabel.get('Saldo Disponível')],
    ['Receitas', overviewByLabel.get('Receitas')],
    ['Despesas', overviewByLabel.get('Despesas')],
    ['Orçamento utilizado', indicatorsByLabel.get('Percentual utilizado')]
  ].forEach(([label, value]) => {
    const item = document.createElement('div');
    const itemLabel = document.createElement('span');
    const itemValue = document.createElement('strong');
    itemLabel.textContent = label;
    itemValue.textContent = value || 'Sem registro';
    item.append(itemLabel, itemValue);
    nextGrid.appendChild(item);
  });
  container.append(nextDescription, nextGrid);
};

const renderFinancePageHeader = (data) => {
  const container = document.querySelector('[data-finance-page-header]');

  if (!container) {
    return;
  }

  container.innerHTML = '';
  const content = document.createElement('div');
  const breadcrumb = document.createElement('div');
  breadcrumb.className = 'portal-breadcrumb';
  ['Portal', '/', 'Financeiro'].forEach((item) => {
    const span = document.createElement('span');
    span.textContent = item;
    breadcrumb.appendChild(span);
  });
  const eyebrow = document.createElement('span');
  eyebrow.className = 'portal-kicker';
  eyebrow.textContent = data.page.eyebrow;
  const title = document.createElement('h1');
  title.className = 'portal-page-title';
  title.textContent = data.page.title;
  const description = document.createElement('p');
  description.className = 'portal-page-copy';
  description.textContent = data.page.description;
  content.append(breadcrumb, eyebrow, title, description);
  const badgeLabel = data.financeState?.status === 'success' ? 'Dados financeiros' : getFinanceStateLabel(data.financeState?.status);
  const badgeClass = data.financeState?.status === 'success' ? 'portal-badge success' : 'portal-badge warning';
  container.append(content, createBadge(badgeLabel, badgeClass));
};

const renderFinanceOverview = (data) => {
  const container = document.querySelector('[data-finance-overview]');

  if (!container) {
    return;
  }

  container.innerHTML = '';
  data.overview.forEach((item) => {
    const card = document.createElement('article');
    card.className = `portal-card portal-metric portal-status-card ${item.tone}`;
    const label = document.createElement('span');
    label.textContent = item.label;
    const value = document.createElement('strong');
    value.textContent = item.value;
    card.append(label, value);
    container.appendChild(card);
  });
};

const renderFinanceAlerts = (data) => {
  const container = document.querySelector('[data-finance-alerts]');

  if (!container) {
    return;
  }

  container.innerHTML = '';
  data.alerts.forEach((alert) => {
    const card = document.createElement('article');
    card.className = `portal-finance-alert ${alert.tone}`;
    const title = document.createElement('strong');
    title.textContent = alert.title;
    const description = document.createElement('p');
    description.textContent = alert.description;
    card.append(title, description);
    container.appendChild(card);
  });
};

const createFinanceChartCard = (titleText, canvasLabel) => {
  const card = document.createElement('article');
  card.className = 'portal-card padded portal-finance-chart-card';
  const header = document.createElement('div');
  header.className = 'portal-section-heading';
  const title = document.createElement('h2');
  title.textContent = titleText;
  header.append(title, createBadge('Atualizado', 'portal-badge success'));
  const wrap = document.createElement('div');
  wrap.className = 'portal-chart-wrap';
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', canvasLabel);
  canvas.setAttribute('role', 'img');
  wrap.appendChild(canvas);
  card.append(header, wrap);
  return { card, canvas, wrap };
};

const renderFinanceCharts = (data) => {
  const container = document.querySelector('[data-finance-charts]');

  if (!container) {
    return;
  }

  container.innerHTML = '';
  const cashflow = createFinanceChartCard(data.charts.cashflow.title, 'Fluxo de caixa');
  const distribution = createFinanceChartCard(data.charts.distribution.title, 'Distribuição percentual dos custos');
  const budget = createFinanceChartCard(data.charts.budget.title, 'Progresso do orçamento');
  container.append(cashflow.card, distribution.card, budget.card);

  if (!window.Chart) {
    [cashflow, distribution, budget].forEach((chart) => {
      const fallback = document.createElement('p');
      fallback.className = 'portal-page-copy';
      fallback.textContent = 'Gráfico indisponível neste ambiente.';
      chart.wrap.replaceChildren(fallback);
    });
    return;
  }

  if (financeCashflowChart) financeCashflowChart.destroy();
  if (financeDistributionChart) financeDistributionChart.destroy();
  if (financeBudgetChart) financeBudgetChart.destroy();

  financeCashflowChart = new window.Chart(cashflow.canvas, {
    type: 'line',
    data: {
      labels: data.charts.cashflow.labels,
      datasets: [
        { label: 'Entradas', data: data.charts.cashflow.entries, borderColor: '#8bea32', backgroundColor: 'rgba(139,234,50,.12)', tension: .35, fill: true },
        { label: 'Saídas', data: data.charts.cashflow.exits, borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,.1)', tension: .35, fill: true },
        { label: 'Saldo', data: data.charts.cashflow.balance, borderColor: '#1687ff', backgroundColor: 'rgba(22,135,255,.08)', tension: .35, fill: false }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#c5cfde' } } }, scales: { x: { ticks: { color: '#8c9ab0' }, grid: { color: 'rgba(255,255,255,.06)' } }, y: { ticks: { color: '#8c9ab0' }, grid: { color: 'rgba(255,255,255,.06)' } } } }
  });

  financeDistributionChart = new window.Chart(distribution.canvas, {
    type: 'doughnut',
    data: {
      labels: data.charts.distribution.labels,
      datasets: [{ data: data.charts.distribution.values, backgroundColor: ['#1687ff', '#22d3ee', '#8bea32', '#22c55e', '#facc15', '#38bdf8', '#14b8a6', '#84cc16', '#a78bfa', '#64748b'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#c5cfde', boxWidth: 10 } } } }
  });

  financeBudgetChart = new window.Chart(budget.canvas, {
    type: 'bar',
    data: {
      labels: data.charts.budget.labels,
      datasets: [
        { label: 'Previsto', data: data.charts.budget.planned, backgroundColor: '#1687ff', borderRadius: 12 },
        { label: 'Realizado', data: data.charts.budget.actual, backgroundColor: '#22d3ee', borderRadius: 12 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#c5cfde' } } }, scales: { x: { ticks: { color: '#8c9ab0' }, grid: { display: false } }, y: { ticks: { color: '#8c9ab0' }, grid: { color: 'rgba(255,255,255,.06)' } } } }
  });
};

const renderFinanceWidgets = (data) => {
  const container = document.querySelector('[data-finance-widgets]');

  if (!container) {
    return;
  }

  container.innerHTML = '';
  const title = document.createElement('h2');
  title.textContent = 'Widgets executivos';
  const grid = document.createElement('div');
  grid.className = 'portal-finance-widget-grid';

  const groups = [
    ['Evolução mensal', data.widgets.monthlyEvolution.map((item) => `${item.month}: ${item.value}`)],
    ['Maiores despesas', data.widgets.largestExpenses.map((item) => `${item.label}: ${item.value}`)],
    ['Comparativo previsto x realizado', data.widgets.forecastComparison.map((item) => `${item.label}: ${item.planned} / ${item.actual}`)],
    ['Resumo financeiro', data.widgets.financialSummary]
  ];

  groups.forEach(([label, items]) => {
    const card = document.createElement('article');
    const heading = document.createElement('strong');
    heading.textContent = label;
    const list = document.createElement('ul');
    list.className = 'portal-list';
    items.forEach((item) => {
      const row = document.createElement('li');
      const text = document.createElement('span');
      text.textContent = item;
      row.appendChild(text);
      list.appendChild(row);
    });
    card.append(heading, list);
    grid.appendChild(card);
  });

  container.append(title, grid);
};

const renderFinanceTimeline = (data) => {
  const container = document.querySelector('[data-finance-timeline]');

  if (!container) {
    return;
  }

  container.innerHTML = '';
  const title = document.createElement('h2');
  title.textContent = 'Timeline financeira';
  const timeline = document.createElement('ol');
  timeline.className = 'portal-roadmap portal-official-timeline';
  data.timeline.forEach((item) => {
    const row = document.createElement('li');
    row.className = `portal-roadmap-item ${item.tone}`;
    const marker = document.createElement('span');
    marker.className = `portal-roadmap-marker ${item.tone}`;
    marker.textContent = item.tone === 'done' ? '✓' : '';
    const body = document.createElement('div');
    const label = document.createElement('strong');
    label.textContent = item.title;
    const status = document.createElement('span');
    status.textContent = `${item.status} • ${item.amount} • ${item.formattedDate}`;
    body.append(label, status);
    row.append(marker, body);
    timeline.appendChild(row);
  });
  container.append(title, timeline);
};

const renderFinanceModule = async (context) => {
  if (!document.body.matches('[data-portal-page="finance"]')) {
    return;
  }

  const loadingState = {
    status: 'loading',
    message: 'Carregando dados financeiros reais para este workspace.'
  };
  setText('[data-dashboard-environment]', 'Workspace autenticado');
  setText('[data-dashboard-footer]', 'Dados financeiros protegidos por contexto autorizado e RLS.');
  renderFinancePageHeader({
    page: {
      eyebrow: 'Investor Intelligence Center',
      title: 'Saúde Financeira',
      description: 'Painel executivo para acompanhar saldo, receitas, despesas, fluxo de caixa e orçamento do REROUTE.'
    },
    financeState: loadingState
  });

  const overview = document.querySelector('[data-finance-overview]');
  if (overview) {
    overview.innerHTML = '';
    renderFinanceStateNotice(overview, loadingState, 'Visão financeira real');
  }

  const widgets = document.querySelector('[data-finance-widgets]');
  if (widgets) {
    widgets.innerHTML = '';
    renderFinanceStateNotice(widgets, loadingState, 'Widgets financeiros reais');
  }

  const stateContainers = [
    document.querySelector('[data-finance-alerts]'),
    document.querySelector('[data-finance-charts]'),
    document.querySelector('[data-finance-timeline]')
  ];
  stateContainers.forEach((container) => {
    if (!container) return;
    container.innerHTML = '';
    renderFinanceStateNotice(container, loadingState, 'Financeiro');
  });

  const financeData = await getFinanceData(context);
  renderFinancePageHeader(financeData);

  if (financeData.financeState?.status === 'success') {
    renderFinanceOverview(financeData);
    renderFinanceAlerts(financeData);
    renderFinanceCharts(financeData);
    renderFinanceWidgets(financeData);
    renderFinanceTimeline(financeData);
    return;
  }

  if (overview) {
    overview.innerHTML = '';
    renderFinanceStateNotice(overview, financeData.financeState, 'Visão financeira');
  }

  if (widgets) {
    widgets.innerHTML = '';
    renderFinanceStateNotice(widgets, financeData.financeState, 'Widgets financeiros');
  }

  stateContainers.forEach((container) => {
    if (!container) return;
    container.innerHTML = '';
    renderFinanceStateNotice(container, financeData.financeState, 'Financeiro');
  });
};

const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const renderDashboardInvestors = (context) => {
  const container = document.querySelector('[data-dashboard-investors]');

  if (!container) {
    return;
  }

  if (!context?.capabilities?.has('investor.manage')) {
    container.hidden = true;
    return;
  }

  const data = getInvestorsData();
  const { summary } = data;
  container.hidden = false;
  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'portal-section-heading';
  const title = document.createElement('h2');
  title.textContent = data.dashboard.title;
  const link = document.createElement('a');
  link.className = 'portal-button secondary compact';
  link.href = '/portal/investidores/';
  link.textContent = 'Abrir Cap Table';
  header.append(title, link);

  const description = document.createElement('p');
  description.className = 'portal-page-copy';
  description.textContent = data.dashboard.description;

  const grid = document.createElement('div');
  grid.className = 'portal-dashboard-project-grid';
  [
    ['Cotas ocupadas', String(summary.occupiedQuotas)],
    ['Cotas disponíveis', String(summary.availableQuotas)],
    ['Capital integralizado', formatCurrency(summary.paidCapital)],
    ['Pendências', formatCurrency(summary.pendingCapital)]
  ].forEach(([label, value]) => {
    const item = document.createElement('div');
    const itemLabel = document.createElement('span');
    const itemValue = document.createElement('strong');
    itemLabel.textContent = label;
    itemValue.textContent = value;
    item.append(itemLabel, itemValue);
    grid.appendChild(item);
  });

  container.append(header, description, grid);
};

const renderInvestorsPageHeader = (data) => {
  const container = document.querySelector('[data-investors-page-header]');

  if (!container) return;

  container.innerHTML = '';
  const content = document.createElement('div');
  const breadcrumb = document.createElement('div');
  breadcrumb.className = 'portal-breadcrumb';
  ['Portal', '/', 'Investidores'].forEach((item) => {
    const span = document.createElement('span');
    span.textContent = item;
    breadcrumb.appendChild(span);
  });
  const eyebrow = document.createElement('span');
  eyebrow.className = 'portal-kicker';
  eyebrow.textContent = data.page.eyebrow;
  const title = document.createElement('h1');
  title.className = 'portal-page-title';
  title.textContent = data.page.title;
  const description = document.createElement('p');
  description.className = 'portal-page-copy';
  description.textContent = data.page.description;
  content.append(breadcrumb, eyebrow, title, description);
  container.append(content, createBadge('Admin demonstrativo', 'portal-badge warning'));
};

const renderInvestorsSummary = (summary) => {
  const container = document.querySelector('[data-investors-summary]');

  if (!container) return;

  const cards = [
    ['Total de cotas', summary.totalQuotas],
    ['Cotas ocupadas', summary.occupiedQuotas],
    ['Cotas disponíveis', summary.availableQuotas],
    ['Capital previsto', formatCurrency(summary.plannedCapital)],
    ['Capital comprometido', formatCurrency(summary.committedCapital)],
    ['Capital integralizado', formatCurrency(summary.paidCapital)],
    ['Saldo a integralizar', formatCurrency(summary.pendingCapital)],
    ['Participação distribuída', `${summary.distributedOwnership}%`]
  ];
  container.innerHTML = '';
  cards.forEach(([label, value]) => {
    const card = document.createElement('article');
    card.className = 'portal-card portal-metric portal-status-card progress';
    const labelElement = document.createElement('span');
    labelElement.textContent = label;
    const valueElement = document.createElement('strong');
    valueElement.textContent = String(value);
    card.append(labelElement, valueElement);
    container.appendChild(card);
  });
};

const renderInvestorsAlerts = (data) => {
  const container = document.querySelector('[data-investors-alerts]');

  if (!container) return;

  container.innerHTML = '';
  data.alerts.forEach((alert) => {
    const card = document.createElement('article');
    card.className = `portal-finance-alert ${alert.tone}`;
    const title = document.createElement('strong');
    title.textContent = alert.title;
    const description = document.createElement('p');
    description.textContent = alert.description;
    card.append(title, description);
    container.appendChild(card);
  });
};

const createInvestorChartCard = (titleText, label) => {
  const card = document.createElement('article');
  card.className = 'portal-card padded portal-finance-chart-card';
  const header = document.createElement('div');
  header.className = 'portal-section-heading';
  const title = document.createElement('h2');
  title.textContent = titleText;
  header.append(title, createBadge('Demo', 'portal-badge demo'));
  const wrap = document.createElement('div');
  wrap.className = 'portal-chart-wrap';
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', label);
  canvas.setAttribute('role', 'img');
  wrap.appendChild(canvas);
  card.append(header, wrap);
  return { card, canvas, wrap };
};

const renderInvestorsCharts = (data) => {
  const container = document.querySelector('[data-investors-charts]');

  if (!container) return;

  container.innerHTML = '';
  const capital = createInvestorChartCard('Capital comprometido versus integralizado', 'Capital comprometido versus integralizado');
  const ownership = createInvestorChartCard('Distribuição de participação por cotista', 'Distribuição de participação por cotista');
  const occupancy = createInvestorChartCard('Ocupação das 20 cotas', 'Ocupação das cotas');
  const contributions = createInvestorChartCard('Evolução demonstrativa das integralizações', 'Evolução das integralizações');
  container.append(capital.card, ownership.card, occupancy.card, contributions.card);

  if (!window.Chart) {
    [capital, ownership, occupancy, contributions].forEach((chart) => {
      const fallback = document.createElement('p');
      fallback.className = 'portal-page-copy';
      fallback.textContent = 'Gráfico demonstrativo indisponível neste ambiente.';
      chart.wrap.replaceChildren(fallback);
    });
    return;
  }

  if (investorCapitalChart) investorCapitalChart.destroy();
  if (investorOwnershipChart) investorOwnershipChart.destroy();
  if (investorOccupancyChart) investorOccupancyChart.destroy();
  if (investorContributionsChart) investorContributionsChart.destroy();

  investorCapitalChart = new window.Chart(capital.canvas, {
    type: 'bar',
    data: { labels: data.charts.capital.labels, datasets: [{ data: data.charts.capital.values, backgroundColor: ['#1687ff', '#22d3ee', '#8bea32'], borderRadius: 12 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#8c9ab0' }, grid: { display: false } }, y: { ticks: { color: '#8c9ab0' }, grid: { color: 'rgba(255,255,255,.06)' } } } }
  });
  investorOwnershipChart = new window.Chart(ownership.canvas, {
    type: 'doughnut',
    data: { labels: data.charts.ownership.labels, datasets: [{ data: data.charts.ownership.values, backgroundColor: ['#1687ff', '#22d3ee', '#8bea32', '#22c55e', '#facc15', '#38bdf8', '#14b8a6', '#84cc16', '#a78bfa', '#64748b'], borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#c5cfde', boxWidth: 10 } } } }
  });
  investorOccupancyChart = new window.Chart(occupancy.canvas, {
    type: 'doughnut',
    data: { labels: data.charts.occupancy.labels, datasets: [{ data: data.charts.occupancy.values, backgroundColor: ['#22d3ee', '#64748b'], borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#c5cfde' } } } }
  });
  investorContributionsChart = new window.Chart(contributions.canvas, {
    type: 'line',
    data: { labels: data.charts.contributions.labels, datasets: [{ label: 'Integralizações', data: data.charts.contributions.values, borderColor: '#8bea32', backgroundColor: 'rgba(139,234,50,.12)', tension: .35, fill: true }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#c5cfde' } } }, scales: { x: { ticks: { color: '#8c9ab0' }, grid: { color: 'rgba(255,255,255,.06)' } }, y: { ticks: { color: '#8c9ab0' }, grid: { color: 'rgba(255,255,255,.06)' } } } }
  });
};

const filterInvestors = (data, filters) => {
  const query = filters.query.trim().toLowerCase();

  return data.capTable
    .filter((item) => filters.number === 'all' || item.investorNumber === filters.number)
    .filter((item) => filters.investment === 'all' || item.investmentStatus === filters.investment)
    .filter((item) => filters.payment === 'all' || item.paymentStatus === filters.payment)
    .filter((item) => filters.documentation === 'all' || item.documentationStatus === filters.documentation)
    .filter((item) => filters.access === 'all' || item.accessStatus === filters.access)
    .filter((item) => filters.position === 'all' || (filters.position === 'available' ? item.quantityOfQuotas === 0 : item.quantityOfQuotas > 0))
    .filter((item) => {
      if (!query) return true;
      return [item.investorNumber, item.displayName, item.investmentStatus, item.paymentStatus, item.documentationStatus, item.accessStatus, item.notes].join(' ').toLowerCase().includes(query);
    });
};

const openInvestorDetail = (data, investorId) => {
  const panel = document.querySelector('[data-investor-detail]');
  const item = data.capTable.find((investor) => investor.id === investorId);

  if (!panel || !item) return;

  panel.hidden = false;
  panel.innerHTML = '';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'investorDetailTitle');

  const close = document.createElement('button');
  close.className = 'portal-modal-close';
  close.type = 'button';
  close.textContent = 'Fechar';
  close.addEventListener('click', () => {
    panel.hidden = true;
  });

  const title = document.createElement('h2');
  title.id = 'investorDetailTitle';
  title.textContent = `Cotista nº ${item.investorNumber}`;

  const summary = document.createElement('div');
  summary.className = 'portal-roadmap-detail-grid';
  [
    ['Nome de exibição', item.displayName],
    ['Cotas', item.quantityOfQuotas],
    ['Percentual', `${item.ownershipPercentage}%`],
    ['Capital comprometido', formatCurrency(item.committedAmount)],
    ['Integralizado', formatCurrency(item.paidAmount)],
    ['Saldo pendente', formatCurrency(item.pendingAmount)],
    ['Entrada', item.joinedAt || 'Não iniciada'],
    ['Último aporte', item.lastContributionAt || 'Sem aporte'],
    ['Acesso', data.statuses.labels[item.accessStatus]]
  ].forEach(([label, value]) => {
    const detail = document.createElement('div');
    const detailLabel = document.createElement('span');
    const detailValue = document.createElement('strong');
    detailLabel.textContent = label;
    detailValue.textContent = String(value);
    detail.append(detailLabel, detailValue);
    summary.appendChild(detail);
  });

  const contributionsTitle = document.createElement('h3');
  contributionsTitle.textContent = 'Histórico de aportes';
  const contributions = document.createElement('ul');
  contributions.className = 'portal-list';
  item.contributions.forEach((contribution) => {
    const row = document.createElement('li');
    const text = document.createElement('span');
    const amount = document.createElement('strong');
    text.textContent = `${contribution.date} • ${contribution.type} • ${contribution.description}`;
    amount.textContent = formatCurrency(contribution.amount);
    row.append(text, amount);
    contributions.appendChild(row);
  });

  const docsTitle = document.createElement('h3');
  docsTitle.textContent = 'Documentos demonstrativos';
  const docs = document.createElement('ul');
  docs.className = 'portal-list';
  item.documents.forEach((documentItem) => {
    const row = document.createElement('li');
    const text = document.createElement('span');
    const status = document.createElement('strong');
    text.textContent = `${documentItem.type} • ${documentItem.title}`;
    status.textContent = data.statuses.labels[documentItem.status] || documentItem.status;
    row.append(text, status);
    docs.appendChild(row);
  });

  const notes = document.createElement('p');
  notes.className = 'portal-page-copy';
  notes.textContent = item.notes;

  panel.append(close, title, summary, contributionsTitle, contributions, docsTitle, docs, notes);
  close.focus();
};

const renderInvestorsTable = (data, rows) => {
  const container = document.querySelector('[data-investors-table]');

  if (!container) return;

  container.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'portal-section-heading';
  const title = document.createElement('h2');
  title.textContent = 'Cap Table';
  header.append(title, createBadge(`${rows.length} posições`, 'portal-badge demo'));

  if (!rows.length) {
    const empty = document.createElement('article');
    empty.className = 'portal-empty-state';
    empty.textContent = 'Nenhuma posição encontrada com os filtros selecionados.';
    container.append(header, empty);
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'portal-document-table-wrap';
  const table = document.createElement('table');
  table.className = 'portal-document-table portal-investors-table';
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  ['Número', 'Cotista', 'Cotas', 'Participação', 'Comprometido', 'Integralizado', 'Pendente', 'Status', 'Documentação', 'Acesso', 'Detalhe'].forEach((label) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = label;
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  const tbody = document.createElement('tbody');

  rows.forEach((item) => {
    const row = document.createElement('tr');
    const cells = [
      item.investorNumber,
      item.displayName,
      item.quantityOfQuotas,
      `${item.ownershipPercentage}%`,
      formatCurrency(item.committedAmount),
      formatCurrency(item.paidAmount),
      formatCurrency(item.pendingAmount)
    ];
    cells.forEach((value, index) => {
      const td = document.createElement('td');
      if (index === 3) {
        const bar = document.createElement('div');
        bar.className = 'portal-investor-ownership';
        bar.innerHTML = `<span style="width:${item.ownershipPercentage}%"></span>`;
        const strong = document.createElement('strong');
        strong.textContent = value;
        td.append(strong, bar);
      } else {
        td.textContent = value;
      }
      row.appendChild(td);
    });
    [item.investmentStatus, item.documentationStatus, item.accessStatus].forEach((status) => {
      const td = document.createElement('td');
      td.appendChild(createBadge(data.statuses.labels[status] || status, getStatusBadgeClass(data.statuses.labels[status] || status)));
      row.appendChild(td);
    });
    const action = document.createElement('td');
    const button = document.createElement('button');
    button.className = 'portal-button secondary compact';
    button.type = 'button';
    button.textContent = 'Abrir';
    button.setAttribute('aria-label', `Abrir detalhe da cota ${item.investorNumber}`);
    button.addEventListener('click', () => openInvestorDetail(data, item.id));
    action.appendChild(button);
    row.appendChild(action);
    tbody.appendChild(row);
  });

  table.append(thead, tbody);
  wrap.appendChild(table);
  container.append(header, wrap);
};

const renderInvestorsToolbar = (data) => {
  const container = document.querySelector('[data-investors-toolbar]');

  if (!container) return;

  container.innerHTML = '';
  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'portal-input';
  search.placeholder = 'Pesquisar cotista ou status';
  search.setAttribute('aria-label', 'Pesquisar no cap table');

  const createSelect = (label, values, allLabel) => {
    const select = document.createElement('select');
    select.className = 'portal-select';
    select.setAttribute('aria-label', label);
    select.append(new Option(allLabel, 'all'));
    values.forEach((value) => select.append(new Option(data.statuses.labels[value] || value, value)));
    return select;
  };

  const number = createSelect('Filtrar por número da cota', data.capTable.map((item) => item.investorNumber), 'Todas as cotas');
  const investment = createSelect('Filtrar por status do investimento', data.statuses.investment, 'Todos os investimentos');
  const payment = createSelect('Filtrar por pagamento', data.statuses.payment, 'Todos os pagamentos');
  const documentation = createSelect('Filtrar por documentação', data.statuses.documentation, 'Todas as documentações');
  const access = createSelect('Filtrar por acesso', data.statuses.access, 'Todos os acessos');
  const position = document.createElement('select');
  position.className = 'portal-select';
  position.setAttribute('aria-label', 'Filtrar por posição disponível ou ocupada');
  position.append(new Option('Todas as posições', 'all'), new Option('Disponíveis', 'available'), new Option('Ocupadas', 'occupied'));
  const result = document.createElement('span');
  result.className = 'portal-updates-count';

  const applyFilters = () => {
    const filtered = filterInvestors(data, {
      query: search.value,
      number: number.value,
      investment: investment.value,
      payment: payment.value,
      documentation: documentation.value,
      access: access.value,
      position: position.value
    });
    result.textContent = `${filtered.length} posições`;
    renderInvestorsTable(data, filtered);
  };

  [search, number, investment, payment, documentation, access, position].forEach((input) => {
    input.addEventListener(input.tagName === 'INPUT' ? 'input' : 'change', applyFilters);
  });

  container.append(search, number, investment, payment, documentation, access, position, result);
  applyFilters();
};

const renderInvestorsModule = () => {
  if (!document.body.matches('[data-portal-page="investors"]')) {
    return;
  }

  const dashboardData = getDashboardData();
  const investorsData = getInvestorsData();
  setText('[data-dashboard-environment]', dashboardData.header.environmentLabel);
  setText('[data-dashboard-footer]', dashboardData.header.footerNote);
  renderInvestorsPageHeader(investorsData);
  renderInvestorsSummary(investorsData.summary);
  renderInvestorsAlerts(investorsData);
  renderInvestorsCharts(investorsData);
  renderInvestorsToolbar(investorsData);
};

const appendMetricCard = (container, label, value, tone = 'progress') => {
  const card = document.createElement('article');
  card.className = `portal-card portal-metric portal-status-card ${tone}`;
  const labelElement = document.createElement('span');
  labelElement.textContent = label;
  const valueElement = document.createElement('strong');
  valueElement.textContent = String(value);
  card.append(labelElement, valueElement);
  container.appendChild(card);
};

const createInvestorSection = (title, description = '') => {
  const section = document.createElement('section');
  section.className = 'portal-card padded portal-investor-section';
  const header = document.createElement('div');
  header.className = 'portal-section-heading';
  const copy = document.createElement('div');
  const heading = document.createElement('h2');
  heading.textContent = title;
  copy.appendChild(heading);

  if (description) {
    const paragraph = document.createElement('p');
    paragraph.className = 'portal-page-copy';
    paragraph.textContent = description;
    copy.appendChild(paragraph);
  }

  header.appendChild(copy);
  section.appendChild(header);
  return section;
};

const appendInvestorList = (container, rows) => {
  const list = document.createElement('ul');
  list.className = 'portal-list';
  rows.forEach(([label, value]) => {
    const row = document.createElement('li');
    const labelElement = document.createElement('span');
    labelElement.textContent = label;
    const valueElement = document.createElement('strong');
    valueElement.textContent = String(value);
    row.append(labelElement, valueElement);
    list.appendChild(row);
  });
  container.appendChild(list);
};

const appendInvestorTable = (container, columns, rows) => {
  const wrap = document.createElement('div');
  wrap.className = 'portal-document-table-wrap';
  const table = document.createElement('table');
  table.className = 'portal-document-table portal-investor-workspace-table';
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  columns.forEach((column) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = column.label;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  const tbody = document.createElement('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    columns.forEach((column) => {
      const td = document.createElement('td');
      const value = column.render ? column.render(row) : row[column.key];
      if (value instanceof Node) {
        td.appendChild(value);
      } else {
        td.textContent = String(value ?? '');
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.append(thead, tbody);
  wrap.appendChild(table);
  container.appendChild(wrap);
};

const renderInvestorWorkspaceHeader = (data, context) => {
  const container = document.querySelector('[data-investor-workspace-header]');

  if (!container) return;

  container.innerHTML = '';
  const content = document.createElement('div');
  const breadcrumb = document.createElement('div');
  breadcrumb.className = 'portal-breadcrumb';
  ['Portal', '/', 'Investidor'].forEach((item) => {
    const span = document.createElement('span');
    span.textContent = item;
    breadcrumb.appendChild(span);
  });
  const eyebrow = document.createElement('span');
  eyebrow.className = 'portal-kicker';
  eyebrow.textContent = data.page.eyebrow;
  const title = document.createElement('h1');
  title.className = 'portal-page-title';
  title.textContent = `Ola, ${data.investor.displayName}.`;
  const description = document.createElement('p');
  description.className = 'portal-page-copy';
  description.textContent = data.page.description;
  content.append(breadcrumb, eyebrow, title, description);
  container.append(
    content,
    createBadge(`Cotista no ${data.investor.investorNumber}`, 'portal-badge success'),
    createBadge(context.activeWorkspace?.name || 'Workspace do investidor', 'portal-badge demo')
  );
};

const renderInvestorWorkspaceShell = (data) => {
  const metrics = document.querySelector('[data-investor-workspace-metrics]');

  if (!metrics) return;

  metrics.innerHTML = '';
  appendMetricCard(metrics, 'Cotista', `no ${data.investor.investorNumber}`, 'online');
  appendMetricCard(metrics, 'Participacao', data.position.ownership, 'online');
  appendMetricCard(metrics, 'Cotas', data.position.quantityOfQuotas, 'progress');
  appendMetricCard(metrics, 'Status', data.position.consistency, 'online');
  appendMetricCard(metrics, 'Notificacoes', data.dashboard.pendingNotifications, 'progress');
};

const renderInvestorOverview = (container, data) => {
  const hero = createInvestorSection('Dashboard do Cotista', 'Resumo individual demonstrativo com participacao, aportes, documentos e progresso autorizado.');
  const grid = document.createElement('div');
  grid.className = 'portal-investor-detail-grid';
  [
    ['Numero do cotista', `Cotista no ${data.investor.investorNumber}`],
    ['Status da participacao', data.position.investmentStatus],
    ['Valor comprometido', data.position.committed],
    ['Valor integralizado', data.position.paid],
    ['Saldo pendente', data.position.pending],
    ['Entrada', data.investor.joinedAt || 'Pendente'],
    ['Ultima integralizacao', data.investor.lastContributionAt || 'Pendente'],
    ['Progresso do projeto', `${data.dashboard.projectProgress}%`]
  ].forEach(([label, value]) => {
    const item = document.createElement('div');
    const small = document.createElement('span');
    small.textContent = label;
    const strong = document.createElement('strong');
    strong.textContent = value;
    item.append(small, strong);
    grid.appendChild(item);
  });
  hero.appendChild(grid);
  container.appendChild(hero);

  const columns = document.createElement('section');
  columns.className = 'portal-grid two portal-dashboard-columns';
  const docs = createInvestorSection('Documentos recentes');
  appendInvestorList(docs, data.documents.slice(0, 4).map((item) => [item.title, item.accessLevel]));
  const updates = createInvestorSection('Atualizacoes recentes');
  appendInvestorList(updates, data.updates.slice(0, 4).map((item) => [item.title, item.category]));
  columns.append(docs, updates);
  container.appendChild(columns);
};

const renderInvestorParticipation = (container, data) => {
  const section = createInvestorSection('Minha participacao', 'Cap table individual com demais cotistas exibidos apenas de forma agregada e anonimizada.');
  appendInvestorList(section, [
    ['Numero da cota', data.position.investorNumber],
    ['Quantidade de cotas', data.position.quantityOfQuotas],
    ['Percentual societario', data.position.ownership],
    ['Capital comprometido', data.position.committed],
    ['Capital integralizado', data.position.paid],
    ['Saldo', data.position.pending],
    ['Status', data.position.investmentStatus],
    ['Cenario de diluicao', 'Demonstrativo, nao vinculante']
  ]);
  appendInvestorTable(section, [
    { label: 'Posicao', key: 'label' },
    { label: 'Cotas', key: 'quotas' },
    { label: 'Participacao', render: (row) => `${row.ownership}%` },
    { label: 'Status', key: 'status' }
  ], data.capTable);
  container.appendChild(section);
};

const renderInvestorContributions = (container, data) => {
  const section = createInvestorSection('Historico de aportes', 'Timeline demonstrativa coerente com valor comprometido, integralizado e saldo pendente.');
  appendInvestorTable(section, [
    { label: 'Data', key: 'date' },
    { label: 'Tipo', key: 'type' },
    { label: 'Descricao', key: 'description' },
    { label: 'Valor', key: 'amountLabel' },
    { label: 'Status', key: 'status' },
    { label: 'Referencia', key: 'reference' },
    { label: 'Comprovante', key: 'receipt' },
    { label: 'Observacao', key: 'note' }
  ], data.contributions);
  container.appendChild(section);
};

const renderInvestorDocuments = (container, data) => {
  const section = createInvestorSection('Data Room individual', 'Documentos demonstrativos com classificacao de acesso. Nenhum Storage real conectado nesta etapa.');
  appendInvestorTable(section, [
    { label: 'Documento', key: 'title' },
    { label: 'Categoria', key: 'category' },
    { label: 'Acesso', key: 'accessLevel' },
    { label: 'Relacao', key: 'relation' },
    { label: 'Versao', key: 'version' },
    { label: 'Status', key: 'status' },
    { label: 'Acoes', render: () => 'Visualizar / Download placeholder' }
  ], data.documents);
  container.appendChild(section);
};

const renderInvestorUpdates = (container, data) => {
  const section = createInvestorSection('Atualizacoes autorizadas', 'Comunicados e marcos demonstrativos relevantes para o investidor.');
  appendInvestorTable(section, [
    { label: 'Titulo', key: 'title' },
    { label: 'Categoria', key: 'category' },
    { label: 'Data', render: (row) => formatPortalDate(row.date) },
    { label: 'Status', key: 'status' },
    { label: 'Resumo', key: 'summary' }
  ], data.updates);
  container.appendChild(section);
};

const renderInvestorNotifications = (container, data) => {
  const section = createInvestorSection('Central de notificacoes', 'Notificacoes demonstrativas locais. Nenhum envio externo real foi implementado.');
  appendInvestorTable(section, [
    { label: 'Titulo', key: 'title' },
    { label: 'Tipo', key: 'type' },
    { label: 'Estado', key: 'status' },
    { label: 'Data', render: (row) => formatPortalDate(row.date) },
    { label: 'Prioridade', render: (row) => row.important ? 'Importante' : 'Normal' }
  ], data.notifications);
  container.appendChild(section);
};

const renderInvestorProfile = (container, data) => {
  const profile = createInvestorSection('Perfil do investidor', 'Campos sensiveis permanecem protegidos e sem dados ficticios realistas.');
  appendInvestorList(profile, [
    ['Nome de exibicao', data.investor.displayName],
    ['Nome completo', data.investor.fullName],
    ['E-mail', data.investor.email],
    ['Telefone', data.investor.phone],
    ['Idioma', data.investor.language],
    ['Fuso horario', data.investor.timezone],
    ['Status', data.investor.status],
    ['Numero do cotista', `Cotista no ${data.investor.investorNumber}`],
    ['Situacao do acesso', data.investor.accessStatus]
  ]);
  appendInvestorList(profile, data.sensitiveFields.map((field) => [field, 'Protegido']));
  container.appendChild(profile);

  const acceptances = createInvestorSection('Aceites e termos');
  appendInvestorTable(acceptances, [
    { label: 'Termo', key: 'title' },
    { label: 'Status', key: 'status' },
    { label: 'Data', render: (row) => formatPortalDate(row.date) }
  ], data.acceptances);
  container.appendChild(acceptances);
};

const renderInvestorWorkspaceModule = (context) => {
  if (!document.body.matches('[data-portal-page="investor-workspace"]')) {
    return;
  }

  const data = getInvestorWorkspaceData(context);
  const view = document.body.dataset.investorView || 'dashboard';
  setText('[data-dashboard-environment]', 'Workspace do cotista - dados demonstrativos');
  setText('[data-dashboard-footer]', 'Workspace individual com dados demonstrativos e anonimizados. RLS permanece como barreira principal.');
  setText('[data-investor-header-number]', `Cotista no ${data.investor.investorNumber}`);
  renderInvestorWorkspaceHeader(data, context);
  renderInvestorWorkspaceShell(data);

  const container = document.querySelector('[data-investor-workspace-content]');
  if (!container) return;

  container.innerHTML = '';
  const renderers = {
    dashboard: renderInvestorOverview,
    participacao: renderInvestorParticipation,
    aportes: renderInvestorContributions,
    documentos: renderInvestorDocuments,
    atualizacoes: renderInvestorUpdates,
    notificacoes: renderInvestorNotifications,
    perfil: renderInvestorProfile
  };
  (renderers[view] || renderInvestorOverview)(container, data);
};

const createAdminHeading = (title, description = '') => {
  const header = document.createElement('div');
  header.className = 'portal-section-heading';

  const copy = document.createElement('div');
  const heading = document.createElement('h2');
  heading.textContent = title;
  copy.append(heading);

  if (description) {
    const paragraph = document.createElement('p');
    paragraph.className = 'portal-page-copy';
    paragraph.textContent = description;
    copy.append(paragraph);
  }

  header.append(copy);
  return header;
};

const createAdminTable = (columns, rows) => {
  const wrap = document.createElement('div');
  wrap.className = 'portal-table-wrap';
  const table = document.createElement('table');
  table.className = 'portal-table';
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  columns.forEach((column) => {
    const th = document.createElement('th');
    th.textContent = column.label;
    headRow.append(th);
  });
  thead.append(headRow);

  const tbody = document.createElement('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    columns.forEach((column) => {
      const td = document.createElement('td');
      const value = typeof column.value === 'function' ? column.value(row) : row[column.key];
      if (value instanceof Node) {
        td.append(value);
      } else {
        td.textContent = value ?? '';
      }
      tr.append(td);
    });
    tbody.append(tr);
  });

  table.append(thead, tbody);
  wrap.append(table);
  return wrap;
};

const createAdminChips = (items) => {
  const chips = document.createElement('div');
  chips.className = 'portal-admin-chips';
  items.forEach((item) => {
    const chip = document.createElement('span');
    chip.textContent = item;
    chips.append(chip);
  });
  return chips;
};

const createAdminProcessCard = (item) => {
  const card = document.createElement('article');
  card.className = 'portal-admin-process-card';
  const top = document.createElement('div');
  top.className = 'portal-admin-process-top';
  const status = document.createElement('strong');
  status.textContent = item.status;
  const count = createBadge(String(item.count), 'portal-badge demo');
  top.append(status, count);
  const description = document.createElement('p');
  description.textContent = item.description;
  card.append(top, description);
  return card;
};

const renderAdminHero = (data) => {
  const hero = document.querySelector('[data-admin-hero]');
  if (!hero) {
    return;
  }

  hero.innerHTML = '';
  const copy = document.createElement('div');
  const badge = createBadge(data.page.eyebrow, 'portal-badge demo');
  const title = document.createElement('h2');
  title.textContent = data.page.title;
  const description = document.createElement('p');
  description.className = 'portal-page-copy';
  description.textContent = data.page.description;
  copy.append(badge, title, description);

  const summary = document.createElement('div');
  summary.className = 'portal-admin-hero-summary';
  [
    ['Módulos administrativos', data.navigation.length],
    ['Workspaces', data.workspaces.length],
    ['Roles', data.roles.length],
    ['Capabilities', data.capabilities.length]
  ].forEach(([label, value]) => {
    const item = document.createElement('div');
    const span = document.createElement('span');
    span.textContent = label;
    const strong = document.createElement('strong');
    strong.textContent = value;
    item.append(span, strong);
    summary.append(item);
  });

  hero.append(copy, summary);
};

const renderAdminMetrics = (data) => {
  const container = document.querySelector('[data-admin-metrics]');
  if (!container) {
    return;
  }

  container.innerHTML = '';
  data.metrics.forEach((metric) => {
    const card = document.createElement('article');
    card.className = `portal-card portal-metric portal-status-card ${metric.tone || 'progress'}`;
    const label = document.createElement('span');
    label.textContent = metric.label;
    const value = document.createElement('strong');
    value.textContent = metric.value;
    const tone = document.createElement('small');
    tone.className = 'portal-status-pill';
    tone.textContent = getToneLabel(metric.tone);
    card.append(label, value, tone);
    container.append(card);
  });
};

const renderAdminMenu = (data) => {
  const container = document.querySelector('[data-admin-menu]');
  if (!container) {
    return;
  }

  container.innerHTML = '';
  container.append(createAdminHeading('Menu administrativo', 'Mapa demonstrativo das áreas internas de governança.'));
  container.append(createAdminChips(data.navigation));
};

const renderAdminWorkspaces = (data) => {
  const container = document.querySelector('[data-admin-workspaces]');
  if (!container) {
    return;
  }

  container.innerHTML = '';
  container.append(createAdminHeading('Workspaces', 'Visão administrativa dos ambientes de acesso.'));
  const grid = document.createElement('div');
  grid.className = 'portal-admin-card-grid';
  data.workspaces.forEach((workspace) => {
    const card = document.createElement('article');
    card.className = 'portal-admin-mini-card';
    const heading = document.createElement('h3');
    heading.textContent = workspace.name;
    const meta = document.createElement('p');
    meta.textContent = `${workspace.status} · ${workspace.users} usuários`;
    card.append(heading, meta, createAdminChips(workspace.capabilities));
    grid.append(card);
  });
  container.append(grid);
};

const renderAdminRoles = (data) => {
  const container = document.querySelector('[data-admin-roles]');
  if (!container) {
    return;
  }

  container.innerHTML = '';
  container.append(createAdminHeading('Roles', 'Papéis demonstrativos e níveis de acesso.'));
  container.append(createAdminTable([
    { label: 'Role', key: 'name' },
    { label: 'Descrição', key: 'description' },
    { label: 'Usuários', key: 'users' },
    { label: 'Acesso', key: 'accessLevel' }
  ], data.roles));
};

const renderAdminCapabilities = (data) => {
  const container = document.querySelector('[data-admin-capabilities]');
  if (!container) {
    return;
  }

  container.innerHTML = '';
  container.append(createAdminHeading('Matriz de capabilities', 'Quem pode, quem não pode, dependências e criticidade.'));
  container.append(createAdminTable([
    { label: 'Capability', key: 'key' },
    { label: 'Pode', value: (item) => item.allowed.join(', ') },
    { label: 'Não pode', value: (item) => item.denied.join(', ') },
    { label: 'Dependências', value: (item) => item.dependencies.join(', ') },
    { label: 'Criticidade', key: 'criticality' }
  ], data.capabilities));
};

const renderAdminUsers = (data) => {
  const container = document.querySelector('[data-admin-users]');
  if (!container) {
    return;
  }

  container.innerHTML = '';
  container.append(createAdminHeading('Usuários demonstrativos', 'Tabela de governança sem usuários reais.'));
  container.append(createAdminTable([
    { label: 'Nome', key: 'name' },
    { label: 'Workspace', key: 'workspace' },
    { label: 'Role', key: 'role' },
    { label: 'Status', key: 'status' },
    { label: 'Último acesso', key: 'lastAccess' },
    { label: 'Convite', key: 'invite' },
    { label: 'Permissões', key: 'permissions' },
    { label: 'Ações', key: 'action' }
  ], data.users));
};

const renderAdminProcesses = (selector, title, description, items) => {
  const container = document.querySelector(selector);
  if (!container) {
    return;
  }

  container.innerHTML = '';
  container.append(createAdminHeading(title, description));
  const grid = document.createElement('div');
  grid.className = 'portal-admin-process-grid';
  items.forEach((item) => grid.append(createAdminProcessCard(item)));
  container.append(grid);
};

const renderAdminRoadmap = (data) => {
  const container = document.querySelector('[data-admin-roadmap]');
  if (!container) {
    return;
  }

  container.innerHTML = '';
  container.append(createAdminHeading('Roadmap administrativo', 'Ações visuais para marcos, prioridade, categoria e status. Sem salvar.'));
  container.append(createAdminTable([
    { label: 'Ação', key: 'action' },
    { label: 'Prioridade', key: 'priority' },
    { label: 'Categoria', key: 'category' },
    { label: 'Status', key: 'status' }
  ], data.roadmapAdmin));
};

const renderAdminDocuments = (data) => {
  const container = document.querySelector('[data-admin-documents]');
  if (!container) {
    return;
  }

  container.innerHTML = '';
  container.append(createAdminHeading('Documentos administrativos', 'Categorias, versões, permissões e upload placeholder. Sem Storage.'));
  container.append(createAdminTable([
    { label: 'Categoria', key: 'category' },
    { label: 'Status', key: 'status' },
    { label: 'Versão', key: 'versions' },
    { label: 'Tipo', key: 'type' },
    { label: 'Permissões', key: 'permissions' },
    { label: 'Upload', key: 'upload' }
  ], data.documentsAdmin));
};

const renderAdminSettings = (data) => {
  const container = document.querySelector('[data-admin-settings]');
  if (!container) {
    return;
  }

  container.innerHTML = '';
  container.append(createAdminHeading('Configurações', 'Áreas demonstrativas de configuração futura.'));
  container.append(createAdminChips(data.settings));
};

const renderAdminLogs = (data) => {
  const container = document.querySelector('[data-admin-logs]');
  if (!container) {
    return;
  }

  container.innerHTML = '';
  container.append(createAdminHeading('Logs administrativos', 'Timeline demonstrativa de eventos operacionais.'));
  const list = document.createElement('ol');
  list.className = 'portal-roadmap portal-admin-log-list';
  data.logs.forEach((log) => {
    const item = document.createElement('li');
    item.className = 'portal-roadmap-item';
    const marker = document.createElement('span');
    marker.className = 'portal-roadmap-marker current';
    marker.textContent = '•';
    const copy = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = `${log.type} · ${log.user}`;
    const span = document.createElement('span');
    span.textContent = `${log.description} · ${log.time}`;
    copy.append(strong, span);
    item.append(marker, copy);
    list.append(item);
  });
  container.append(list);
};

const renderAdminAudit = (data) => {
  const container = document.querySelector('[data-admin-audit]');
  if (!container) {
    return;
  }

  container.innerHTML = '';
  container.append(createAdminHeading('Auditoria', 'Tabela demonstrativa de eventos auditáveis. IPs fictícios.'));
  container.append(createAdminTable([
    { label: 'Data', key: 'date' },
    { label: 'Usuário', key: 'user' },
    { label: 'Evento', key: 'event' },
    { label: 'Módulo', key: 'module' },
    { label: 'Resultado', key: 'result' },
    { label: 'Criticidade', key: 'criticality' },
    { label: 'Origem', key: 'origin' },
    { label: 'IP fictício', key: 'ip' }
  ], data.audit));
};

const renderAdminCenter = () => {
  if (!document.body.matches('[data-portal-page="admin"]')) {
    return;
  }

  const dashboardData = getDashboardData();
  const data = getAdminData();
  setText('[data-dashboard-environment]', 'Admin Center - dados demonstrativos');
  setText('[data-dashboard-footer]', 'Ambiente administrativo demonstrativo. Nenhum dado real conectado.');
  setText('[data-admin-title]', data.page.title);
  setText('[data-admin-description]', data.page.description);
  renderAdminHero(data);
  renderAdminMetrics(data);
  renderAdminMenu(data);
  renderAdminWorkspaces(data);
  renderAdminRoles(data);
  renderAdminCapabilities(data);
  renderAdminUsers(data);
  renderAdminProcesses('[data-admin-invites]', 'Convites', 'Fluxo visual demonstrativo sem envio real.', data.invites);
  renderAdminProcesses('[data-admin-editorial]', 'Controle editorial', 'Estados editoriais demonstrativos para publicações oficiais.', data.editorial);
  renderAdminRoadmap(data);
  renderAdminDocuments(data);
  renderAdminSettings(data);
  renderAdminLogs(data);
  renderAdminAudit(data);
  setText('[data-dashboard-environment]', dashboardData.header.environmentLabel.replace('Ambiente autenticado', 'Admin Center'));
};

const renderInvestorDashboard = (context) => {
  if (!document.body.matches('[data-portal-page="dashboard"]')) {
    return;
  }

  const data = getDashboardData();
  setText('[data-dashboard-environment]', data.header.environmentLabel);
  setText('[data-dashboard-footer]', data.header.footerNote);
  renderInvestorHero(data);
  renderProjectStatus(data);
  renderRoadmap(data);
  renderProjectEvolutionChart(data);
  renderUpdates();
  renderNextSteps(data);
  renderDashboardDocuments();
  renderDashboardRoadmapSummary();
  renderDashboardProjects();
  void renderDashboardFinance(context);
  renderDashboardInvestors(context);
};

const renderContext = async (context) => {
  if (!context.isAuthorized) {
    return;
  }

  await Promise.all([
    loadDashboardData(context),
    loadRoadmapData(context),
    loadProjectsData(context),
    loadInvestorsData(context),
    loadDocumentsData(context),
    loadUpdatesData(context),
    loadAdminData(context)
  ]);

  const displayName = getDisplayName(context);
  const roleName = getPrimaryRole(context);

  setText('[data-user-email]', context.authUser?.email || 'Usuário autenticado');
  setText('[data-user-name]', displayName);
  setText('[data-user-initial]', displayName.trim().charAt(0).toUpperCase() || 'R');
  document.querySelectorAll('[data-user-initial]').forEach((avatar) => {
    const avatarUrl = getSafeImageUrl(context.profile?.avatarUrl);
    avatar.style.backgroundImage = avatarUrl ? `url("${avatarUrl}")` : '';
    avatar.style.backgroundSize = avatarUrl ? 'cover' : '';
    avatar.style.backgroundPosition = avatarUrl ? 'center' : '';
    avatar.textContent = avatarUrl ? '' : (displayName.trim().charAt(0).toUpperCase() || 'R');
    avatar.setAttribute('aria-label', `Avatar de ${displayName}`);
  });
  setText('[data-context-greeting]', `Olá, ${displayName}.`);
  setText('[data-context-organization]', context.organization?.name || 'REROUTE');
  setText('[data-context-workspace]', context.activeWorkspace?.name || 'Workspace não definido');
  setText('[data-context-role]', roleName);
  setText('[data-context-status]', context.profile?.status || 'active');
  setText('[data-context-updated]', context.loadedAt ? new Date(context.loadedAt).toLocaleString('pt-BR') : 'Agora');

  renderNavigation(context);
  renderWorkspaceSelector(context);
  renderInvestorDashboard(context);
  renderOfficialUpdatesModule();
  renderDocumentsModule();
  renderRoadmapModule();
  renderProjectsModule();
  void renderFinanceModule(context);
  renderInvestorsModule();
  renderInvestorWorkspaceModule(context);
  renderAdminCenter();

  [
    [getUpdatesData(), '[data-updates-list]', 'Atualizações'],
    [getDocumentsData(), '[data-documents-table]', 'Documentos'],
    [getRoadmapData(), '[data-roadmap-list]', 'Roadmap'],
    [getProjectsData(), '[data-projects-list]', 'Projetos'],
    [getInvestorsData(), '[data-investors-table]', 'Investidores'],
    [getAdminData(), '[data-admin-hero]', 'Administração']
  ].forEach(([data, selector, title]) => {
    if (data.moduleState?.status === 'success') return;
    const container = document.querySelector(selector);
    if (!container) return;
    container.innerHTML = '';
    renderFinanceStateNotice(container, data.moduleState, title);
  });
};

const renderAccessDeniedReason = () => {
  const title = document.querySelector('[data-access-denied-title]');
  const message = document.querySelector('[data-access-denied-message]');

  if (!message) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const reason = params.get('reason') || 'not_authorized';

  if (title) {
    title.textContent = 'Você não possui autorização para acessar esta área.';
  }

  message.textContent = deniedMessages[reason] || 'Seu acesso ainda não está autorizado para esta área.';
};

const getRecoveryRedirectUrl = () => {
  const url = new URL('/portal/redefinir-senha/', window.location.origin);
  return url.toString();
};

const getRecoveryUrlError = () => {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(window.location.search);
  const code = hashParams.get('error') || searchParams.get('error');
  const description = hashParams.get('error_description') || searchParams.get('error_description') || '';

  if (!code && !description) {
    return '';
  }

  if (description.toLowerCase().includes('expired')) {
    return 'O link expirou. Solicite uma nova redefinicao de senha.';
  }

  return 'Link de recuperacao invalido. Solicite uma nova redefinicao.';
};

const bindPasswordToggles = () => {
  document.querySelectorAll('[data-password-toggle]').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const targetId = toggle.getAttribute('data-password-target');
      const input = targetId ? document.getElementById(targetId) : toggle.closest('.portal-input-wrap')?.querySelector('input');

      if (!input) {
        return;
      }

      const showPassword = input.type === 'password';
      input.type = showPassword ? 'text' : 'password';
      toggle.textContent = showPassword ? 'Ocultar' : 'Mostrar';
      toggle.setAttribute('aria-pressed', String(showPassword));
    });
  });
};

const bindLoginForm = () => {
  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    resetFieldStates(loginForm);
    setFormMessage(loginForm, '');

    const emailField = loginForm.elements.email;
    const passwordField = loginForm.elements.password;
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const emailValidation = validateEmailField(emailField);

    if (!emailValidation.valid) {
      setFieldState(emailField, emailValidation.message);
      setFormMessage(loginForm, emailValidation.message, true);
      emailField?.focus();
      return;
    }

    if (!passwordField?.value) {
      const message = 'Informe sua senha.';
      setFieldState(passwordField, message);
      setFormMessage(loginForm, message, true);
      passwordField?.focus();
      return;
    }

    setSubmitState(submitButton, 'Verificando...', true);
    setFormMessage(loginForm, 'Verificando credenciais...');

    const result = await signIn(emailValidation.value, passwordField.value);

    if (!result.success) {
      setFormMessage(loginForm, result.error, true);
      setSubmitState(submitButton, '', false);
      passwordField?.focus();
      return;
    }

    setFormMessage(loginForm, 'Acesso confirmado. Abrindo o Portal...');
    window.location.replace(getSafeReturnPath());
  });
};

const bindRecoveryForm = () => {
  recoveryForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    resetFieldStates(recoveryForm);
    setFormMessage(recoveryForm, '');

    const emailField = recoveryForm.elements.email;
    const submitButton = recoveryForm.querySelector('button[type="submit"]');
    const emailValidation = validateEmailField(emailField);

    if (!emailValidation.valid) {
      setFieldState(emailField, emailValidation.message);
      setFormMessage(recoveryForm, emailValidation.message, true);
      emailField?.focus();
      return;
    }

    setSubmitState(submitButton, 'Enviando...', true);

    const result = await requestPasswordReset(emailValidation.value, getRecoveryRedirectUrl());
    const isConfigError = result.error?.includes('Configuracao do Supabase');
    setFormMessage(recoveryForm, isConfigError ? result.error : result.message, isConfigError);
    setSubmitState(submitButton, '', false);

    if (!result.success && result.error) {
      recoveryForm.dataset.lastError = result.error;
    }
  });
};

const bindResetForm = () => {
  if (resetForm) {
    const urlError = getRecoveryUrlError();
    if (urlError) {
      setFormMessage(resetForm, urlError, true);
    }
  }

  resetForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    resetFieldStates(resetForm);
    setFormMessage(resetForm, '');

    const passwordField = resetForm.elements.password;
    const confirmField = resetForm.elements.confirmPassword;
    const submitButton = resetForm.querySelector('button[type="submit"]');

    if (!passwordField?.value || passwordField.value.length < 8) {
      const message = 'A nova senha deve ter pelo menos 8 caracteres.';
      setFieldState(passwordField, message);
      setFormMessage(resetForm, message, true);
      passwordField?.focus();
      return;
    }

    if (passwordField.value !== confirmField?.value) {
      const message = 'As senhas precisam ser identicas.';
      setFieldState(confirmField, message);
      setFormMessage(resetForm, message, true);
      confirmField?.focus();
      return;
    }

    setSubmitState(submitButton, 'Atualizando...', true);
    setFormMessage(resetForm, 'Atualizando senha...');

    const result = await updatePassword(passwordField.value);

    if (!result.success) {
      setFormMessage(resetForm, result.error, true);
      setSubmitState(submitButton, '', false);
      return;
    }

    passwordField.value = '';
    confirmField.value = '';
    setFormMessage(resetForm, 'Senha atualizada com sucesso. Voce ja pode acessar o Portal.');
    setSubmitState(submitButton, '', false);

    window.setTimeout(() => {
      window.location.replace('/portal/login/');
    }, 1400);
  });
};

sidebarToggle?.addEventListener('click', () => {
  setSidebarState(!sidebar?.classList.contains('open'));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && sidebar?.classList.contains('open')) {
    setSidebarState(false);
    sidebarToggle?.focus();
  }

  const investorDetail = document.querySelector('[data-investor-detail]');
  if (event.key === 'Escape' && investorDetail && !investorDetail.hidden) {
    investorDetail.hidden = true;
  }
});

sidebar?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setSidebarState(false));
});

document.querySelector('[data-portal-nav]')?.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    setSidebarState(false);
  }
});

bindPasswordToggles();
bindLoginForm();
bindRecoveryForm();
bindResetForm();
renderAccessDeniedReason();
subscribeUserContext(renderContext);

if (document.body.matches('[data-auth-required="true"]')) {
  protectPrivatePage();
  bindLogout();
}

if (document.body.matches('[data-portal-page="login"]')) {
  redirectAuthenticatedUser();
}
