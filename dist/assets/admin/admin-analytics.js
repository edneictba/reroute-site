const elements = {
  email: document.getElementById('adminEmail'),
  logout: document.getElementById('logoutButton'),
  period: document.getElementById('analyticsPeriod'),
  status: document.getElementById('analyticsStatus'),
  visits: document.getElementById('metricVisits'),
  visitors: document.getElementById('metricVisitors'),
  submits: document.getElementById('metricSubmits'),
  conversion: document.getElementById('metricConversion'),
  funnel: document.getElementById('funnelList'),
  traffic: document.getElementById('trafficList'),
  devices: document.getElementById('deviceList'),
  events: document.getElementById('eventList')
};

const formatNumber = (value) => new Intl.NumberFormat('pt-BR').format(Number(value) || 0);
const eventLabels = {
  page_view: 'Visita',
  page_duration: 'Tempo na página',
  scroll_depth: 'Profundidade de rolagem',
  cta_click: 'Clique em CTA',
  form_open: 'Formulário aberto',
  form_start: 'Preenchimento iniciado',
  form_abandon: 'Formulário abandonado',
  form_submit: 'Cadastro enviado'
};

const renderList = (container, rows, { funnel = false, labelMap = null } = {}) => {
  container.replaceChildren();
  if (!Array.isArray(rows) || !rows.length) {
    const empty = document.createElement('p');
    empty.className = 'admin-empty';
    empty.textContent = 'Nenhum dado disponível neste período.';
    container.append(empty);
    return;
  }

  const maximum = Math.max(...rows.map((row) => Number(row.value ?? row.total) || 0), 1);
  for (const row of rows) {
    const value = Number(row.value ?? row.total) || 0;
    const item = document.createElement('div');
    item.className = 'analytics-list-item';

    const heading = document.createElement('div');
    heading.className = 'analytics-list-heading';
    const name = document.createElement('span');
    name.textContent = labelMap?.[row.name] || row.name || 'Não identificado';
    const total = document.createElement('strong');
    total.textContent = formatNumber(value);
    heading.append(name, total);

    const track = document.createElement('div');
    track.className = 'analytics-bar-track';
    const bar = document.createElement('span');
    bar.className = 'analytics-bar';
    bar.style.width = `${Math.max((value / maximum) * 100, value ? 2 : 0)}%`;
    track.append(bar);
    item.append(heading, track);
    if (funnel) item.classList.add('analytics-list-item--funnel');
    container.append(item);
  }
};

const loadAnalytics = async () => {
  elements.status.textContent = 'Carregando métricas…';
  try {
    const response = await fetch(`/api/admin/analytics?days=${encodeURIComponent(elements.period.value)}`, {
      credentials: 'same-origin',
      cache: 'no-store'
    });
    if (response.status === 401) {
      window.location.replace('/admin/login');
      return;
    }
    const payload = await response.json();
    if (!response.ok || payload.success !== true) throw new Error('analytics_failed');

    const { metrics, funnel, trafficSources, devices, topEvents } = payload.data;
    const submitStep = funnel.find((step) => step.name === 'Cadastro enviado');
    elements.visits.textContent = formatNumber(metrics.visits);
    elements.visitors.textContent = formatNumber(metrics.uniqueVisitors);
    elements.submits.textContent = formatNumber(submitStep?.value);
    elements.conversion.textContent = `${Number(metrics.conversionRate || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}%`;
    renderList(elements.funnel, funnel, { funnel: true });
    renderList(elements.traffic, trafficSources);
    renderList(elements.devices, devices);
    renderList(elements.events, topEvents, { labelMap: eventLabels });
    elements.status.textContent = `Métricas dos últimos ${payload.data.periodDays} dias.`;
  } catch {
    elements.status.textContent = 'Não foi possível carregar as métricas. Tente novamente.';
  }
};

elements.period?.addEventListener('change', loadAnalytics);
elements.logout?.addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
  window.location.replace('/admin/login');
});

fetch('/api/admin/session', { credentials: 'same-origin', cache: 'no-store' })
  .then((response) => response.ok ? response.json() : Promise.reject(new Error('unauthorized')))
  .then((payload) => {
    elements.email.textContent = payload.user.email;
    return loadAnalytics();
  })
  .catch(() => window.location.replace('/admin/login'));
