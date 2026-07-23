const state = { page: 1, pageSize: 25, totalPages: 1, search: '' };
const elements = {
  adminEmail: document.getElementById('adminEmail'),
  chart: document.getElementById('growthChart'),
  exportButton: document.getElementById('exportButton'),
  logoutButton: document.getElementById('logoutButton'),
  month: document.getElementById('metricMonth'),
  next: document.getElementById('nextPage'),
  pageInfo: document.getElementById('pageInfo'),
  pageSize: document.getElementById('pageSize'),
  previous: document.getElementById('previousPage'),
  search: document.getElementById('leadSearch'),
  status: document.getElementById('tableStatus'),
  table: document.getElementById('leadsTable'),
  today: document.getElementById('metricToday'),
  total: document.getElementById('metricTotal'),
  week: document.getElementById('metricWeek')
};

const redirectToLogin = () => window.location.replace('/admin/login');
const formatNumber = (value) => new Intl.NumberFormat('pt-BR').format(Number(value) || 0);
const formatDate = (value) => new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo'
}).format(new Date(value));

const createCopyButton = (value, label) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy-button';
  button.textContent = value;
  button.setAttribute('aria-label', `Copiar ${label}: ${value}`);
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(value);
      button.dataset.copied = 'true';
      window.setTimeout(() => delete button.dataset.copied, 1200);
    } catch {
      button.dataset.copied = 'false';
    }
  });
  return button;
};

const renderLeads = (leads) => {
  elements.table.replaceChildren();
  if (!leads.length) {
    elements.status.textContent = 'Nenhum lead encontrado.';
    return;
  }
  elements.status.textContent = `${formatNumber(leads.length)} resultado(s) nesta página.`;
  const fragment = document.createDocumentFragment();
  for (const lead of leads) {
    const row = document.createElement('tr');
    const name = document.createElement('td');
    const email = document.createElement('td');
    const whatsapp = document.createElement('td');
    const createdAt = document.createElement('td');
    name.textContent = lead.name;
    email.append(createCopyButton(lead.email, 'e-mail'));
    whatsapp.append(createCopyButton(lead.whatsapp, 'WhatsApp'));
    createdAt.textContent = formatDate(lead.created_at);
    row.append(name, email, whatsapp, createdAt);
    fragment.append(row);
  }
  elements.table.append(fragment);
};

const renderChart = (daily) => {
  elements.chart.replaceChildren();
  if (!daily.length || daily.every((item) => Number(item.count) === 0)) {
    const empty = document.createElement('p');
    empty.className = 'admin-empty';
    empty.textContent = 'Ainda não há cadastros nos últimos 30 dias.';
    elements.chart.append(empty);
    return;
  }

  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  svg.setAttribute('viewBox', '0 0 900 260');
  svg.setAttribute('aria-hidden', 'true');
  const max = Math.max(...daily.map((item) => Number(item.count) || 0), 1);
  const points = daily.map((item, index) => {
    const x = 20 + index * (860 / Math.max(daily.length - 1, 1));
    const y = 230 - ((Number(item.count) || 0) / max) * 190;
    return `${x},${y}`;
  }).join(' ');
  const line = document.createElementNS(namespace, 'polyline');
  line.setAttribute('points', points);
  line.setAttribute('class', 'chart-line');
  svg.append(line);
  for (let index = 0; index < daily.length; index += 1) {
    const [x, y] = points.split(' ')[index].split(',');
    const point = document.createElementNS(namespace, 'circle');
    point.setAttribute('cx', x);
    point.setAttribute('cy', y);
    point.setAttribute('r', '4');
    point.setAttribute('class', 'chart-point');
    svg.append(point);
  }
  elements.chart.append(svg);
};

const loadData = async () => {
  elements.status.textContent = 'Carregando leads…';
  const params = new URLSearchParams({
    page: String(state.page), pageSize: String(state.pageSize), search: state.search
  });
  try {
    const response = await fetch(`/api/admin/leads?${params}`, { credentials: 'same-origin', cache: 'no-store' });
    if (response.status === 401) {
      redirectToLogin();
      return;
    }
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error('data_failed');
    }
    const { metrics, daily, leads, pagination } = payload.data;
    elements.total.textContent = formatNumber(metrics.total);
    elements.today.textContent = formatNumber(metrics.today);
    elements.week.textContent = formatNumber(metrics.last7Days);
    elements.month.textContent = formatNumber(metrics.currentMonth);
    state.page = pagination.page;
    state.totalPages = pagination.totalPages;
    elements.pageInfo.textContent = `Página ${state.page} de ${state.totalPages}`;
    elements.previous.disabled = state.page <= 1;
    elements.next.disabled = state.page >= state.totalPages;
    renderLeads(leads);
    renderChart(daily);
  } catch {
    elements.status.textContent = 'Não foi possível carregar os leads. Tente novamente.';
    elements.table.replaceChildren();
  }
};

elements.previous?.addEventListener('click', () => { if (state.page > 1) { state.page -= 1; loadData(); } });
elements.next?.addEventListener('click', () => { if (state.page < state.totalPages) { state.page += 1; loadData(); } });
elements.pageSize?.addEventListener('change', () => { state.pageSize = Number(elements.pageSize.value); state.page = 1; loadData(); });

let searchTimer;
elements.search?.addEventListener('input', () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    state.search = elements.search.value.trim();
    state.page = 1;
    loadData();
  }, 300);
});

elements.logoutButton?.addEventListener('click', async () => {
  elements.logoutButton.disabled = true;
  try {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
  } finally {
    redirectToLogin();
  }
});

fetch('/api/admin/session', { credentials: 'same-origin', cache: 'no-store' })
  .then(async (response) => {
    if (!response.ok) {
      redirectToLogin();
      return null;
    }
    return response.json();
  })
  .then((payload) => {
    if (payload?.user?.email) {
      elements.adminEmail.textContent = payload.user.email;
      loadData();
    }
  })
  .catch(redirectToLogin);
