const elements = {
  period: document.getElementById('analyticsPeriod'),
  status: document.getElementById('analyticsStatus'),
  visits: document.getElementById('metricVisits'),
  visitors: document.getElementById('metricVisitors'),
  submits: document.getElementById('metricSubmits'),
  conversion: document.getElementById('metricConversion'),
  funnel: document.getElementById('funnelList'),
  traffic: document.getElementById('trafficList'),
  devices: document.getElementById('deviceList'),
  operatingSystems: document.getElementById('operatingSystemList'),
  browsers: document.getElementById('browserList'),
  diagnosisVisitors: document.getElementById('diagnosisVisitors'),
  diagnosisRegistrations: document.getElementById('diagnosisRegistrations'),
  diagnosisConversion: document.getElementById('diagnosisConversion'),
  diagnosisMessage: document.getElementById('diagnosisMessage'),
  originConversion: document.getElementById('originConversionList'),
  hourlyVisitors: document.getElementById('hourlyVisitorsList'),
  visitorTypes: document.getElementById('visitorTypeList'),
  scrollJourney: document.getElementById('scrollJourneyList'),
  ctaClicks: document.getElementById('ctaClickList'),
  averagePageTime: document.getElementById('averagePageTime'),
  averageFormOpenTime: document.getElementById('averageFormOpenTime'),
  averageRegistrationTime: document.getElementById('averageRegistrationTime'),
  events: document.getElementById('eventList')
};

const formatNumber = (value) => new Intl.NumberFormat('pt-BR').format(Number(value) || 0);
const formatPercentage = (value) => `${Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
const formatDuration = (seconds) => {
  const safeSeconds = Math.max(Math.round(Number(seconds) || 0), 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return minutes ? `${minutes}min ${String(remainder).padStart(2, '0')}s` : `${remainder}s`;
};
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

const operatingSystemGroups = [
  { name: 'Android', matches: ['android'] },
  { name: 'iPhone (iOS)', matches: ['ios', 'iphone', 'ipad', 'ipod'] },
  { name: 'Windows', matches: ['windows'] },
  { name: 'macOS', matches: ['macos', 'mac os'] },
  { name: 'Linux', matches: ['linux'] },
  { name: 'Outros', matches: [] }
];

const browserGroups = [
  { name: 'Chrome', matches: ['chrome', 'chromium'] },
  { name: 'Safari', matches: ['safari'] },
  { name: 'Edge', matches: ['edge', 'edg'] },
  { name: 'Firefox', matches: ['firefox'] },
  { name: 'Samsung Internet', matches: ['samsung internet', 'samsungbrowser'] },
  { name: 'Outros', matches: [] }
];

const groupTechnologyRows = (rows, groups) => {
  const totals = new Map(groups.map(({ name }) => [name, 0]));
  const fallback = groups.at(-1).name;

  for (const row of Array.isArray(rows) ? rows : []) {
    const sourceName = String(row.name || '').trim().toLowerCase();
    const group = groups.find(({ matches }) => matches.some((match) => sourceName.includes(match)));
    const target = group?.name || fallback;
    totals.set(target, totals.get(target) + (Number(row.value ?? row.total) || 0));
  }

  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
  return groups.map(({ name }) => ({
    name,
    total: totals.get(name),
    percentage: total ? (totals.get(name) / total) * 100 : 0
  }));
};

const renderList = (container, rows, { funnel = false, labelMap = null, showPercentage = false } = {}) => {
  if (!container) return;
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
    total.textContent = showPercentage
      ? `${formatNumber(value)} · ${Number(row.percentage || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
      : formatNumber(value);
    heading.append(name, total);

    const track = document.createElement('div');
    track.className = 'analytics-bar-track';
    const bar = document.createElement('span');
    bar.className = 'analytics-bar';
    const barPercentage = showPercentage ? Number(row.percentage || 0) : (value / maximum) * 100;
    bar.style.width = `${Math.max(barPercentage, value ? 2 : 0)}%`;
    track.append(bar);
    item.append(heading, track);
    if (funnel) item.classList.add('analytics-list-item--funnel');
    container.append(item);
  }
};

const renderOriginConversion = (rows) => {
  elements.originConversion.replaceChildren();
  for (const row of Array.isArray(rows) ? rows : []) {
    const tableRow = document.createElement('tr');
    const values = [row.name, formatNumber(row.visits), formatNumber(row.registrations), formatPercentage(row.conversionRate)];
    for (const value of values) {
      const cell = document.createElement('td');
      cell.textContent = value;
      tableRow.append(cell);
    }
    elements.originConversion.append(tableRow);
  }
};

const renderHourlyVisitors = (rows) => {
  elements.hourlyVisitors.replaceChildren();
  const safeRows = Array.isArray(rows) ? rows : [];
  const maximum = Math.max(...safeRows.map((row) => Number(row.total) || 0), 1);
  for (const row of safeRows) {
    const item = document.createElement('div');
    item.className = 'analytics-hour';
    item.title = `${row.name}: ${formatNumber(row.total)} visitante(s)`;
    const total = document.createElement('strong');
    total.textContent = formatNumber(row.total);
    const track = document.createElement('div');
    track.className = 'analytics-hour-track';
    const bar = document.createElement('span');
    bar.style.height = `${Math.max(((Number(row.total) || 0) / maximum) * 100, row.total ? 6 : 0)}%`;
    track.append(bar);
    const label = document.createElement('span');
    label.textContent = row.name;
    item.append(total, track, label);
    elements.hourlyVisitors.append(item);
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

    const {
      metrics,
      funnel,
      trafficSources,
      devices,
      browsers,
      operatingSystems,
      topEvents,
      diagnosis,
      originConversion,
      hourlyVisitors,
      visitorTypes,
      scrollJourney,
      ctaClicks,
      averageTimes
    } = payload.data;
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
    renderList(elements.operatingSystems, groupTechnologyRows(operatingSystems, operatingSystemGroups), {
      showPercentage: true
    });
    renderList(elements.browsers, groupTechnologyRows(browsers, browserGroups), { showPercentage: true });
    elements.diagnosisVisitors.textContent = formatNumber(diagnosis?.visitors ?? metrics.uniqueVisitors);
    elements.diagnosisRegistrations.textContent = formatNumber(diagnosis?.registrations ?? submitStep?.value);
    elements.diagnosisConversion.textContent = formatPercentage(diagnosis?.conversionRate ?? metrics.conversionRate);
    elements.diagnosisMessage.textContent = diagnosis?.message || 'Dados insuficientes para gerar o diagnóstico da jornada.';
    renderOriginConversion(originConversion);
    renderHourlyVisitors(hourlyVisitors);
    renderList(elements.visitorTypes, visitorTypes, { showPercentage: true });
    renderList(elements.scrollJourney, scrollJourney, { showPercentage: true });
    renderList(elements.ctaClicks, ctaClicks);
    elements.averagePageTime.textContent = formatDuration(averageTimes?.page);
    elements.averageFormOpenTime.textContent = formatDuration(averageTimes?.formOpen);
    elements.averageRegistrationTime.textContent = formatDuration(averageTimes?.registration);
    renderList(elements.events, topEvents, { labelMap: eventLabels });
    elements.status.textContent = `Métricas dos últimos ${payload.data.periodDays} dias.`;
  } catch {
    elements.status.textContent = 'Não foi possível carregar as métricas. Tente novamente.';
  }
};

elements.period?.addEventListener('change', loadAnalytics);
loadAnalytics();
