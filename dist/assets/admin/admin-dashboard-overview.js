const elements = {
  activity: document.getElementById('dashboardActivity'),
  conversionToday: document.getElementById('dashboardConversionToday'),
  lastEvent: document.getElementById('dashboardLastEvent'),
  lastRegistration: document.getElementById('dashboardLastRegistration'),
  period: document.getElementById('dashboardActivityPeriod'),
  refresh: document.getElementById('dashboardRefresh'),
  registrationsToday: document.getElementById('dashboardRegistrationsToday'),
  registrationsWeek: document.getElementById('dashboardRegistrationsWeek'),
  status: document.getElementById('dashboardStatus'),
  uniqueVisitorsToday: document.getElementById('dashboardVisitorsToday'),
  visitsToday: document.getElementById('dashboardVisitsToday'),
  visitsWeek: document.getElementById('dashboardVisitsWeek')
};

const eventLabels = {
  page_view: 'Nova visita',
  page_duration: 'Tempo na página registrado',
  scroll_depth: 'Profundidade de rolagem',
  cta_click: 'Clique em CTA',
  form_open: 'Formulário aberto',
  form_start: 'Preenchimento iniciado',
  form_abandon: 'Formulário abandonado',
  form_submit: 'Cadastro enviado'
};

const deviceLabels = {
  desktop: 'Desktop',
  mobile: 'Celular',
  tablet: 'Tablet',
  unknown: 'Não identificado'
};

const formatNumber = (value) => new Intl.NumberFormat('pt-BR').format(Number(value) || 0);
const formatDate = (value) => {
  if (!value) return 'Nenhum registro';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo'
  }).format(new Date(value));
};

const renderActivity = (events) => {
  elements.activity.replaceChildren();
  if (!Array.isArray(events) || !events.length) {
    const empty = document.createElement('p');
    empty.className = 'admin-empty';
    empty.textContent = 'Nenhum evento registrado no período selecionado.';
    elements.activity.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const event of events) {
    const item = document.createElement('article');
    item.className = 'admin-activity-item';

    const marker = document.createElement('span');
    marker.className = 'admin-activity-marker';
    marker.setAttribute('aria-hidden', 'true');

    const content = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = eventLabels[event.event_name] || 'Evento';
    const details = document.createElement('p');
    const source = event.utm_source || event.referrer_host || 'Direto';
    const visitor = String(event.visitor_id || '').slice(0, 8) || 'anônimo';
    details.textContent = [
      formatDate(event.occurred_at),
      deviceLabels[event.device_type] || 'Não identificado',
      `Origem: ${source}`,
      `Visitante: ${visitor}`,
      event.page_path ? `Página: ${event.page_path}` : ''
    ].filter(Boolean).join(' · ');
    content.append(title, details);
    item.append(marker, content);
    fragment.append(item);
  }
  elements.activity.append(fragment);
};

const renderMetrics = (data) => {
  const { metrics } = data;
  elements.visitsToday.textContent = formatNumber(metrics.visitsToday);
  elements.uniqueVisitorsToday.textContent = formatNumber(metrics.uniqueVisitorsToday);
  elements.registrationsToday.textContent = formatNumber(metrics.registrationsToday);
  elements.conversionToday.textContent = `${Number(metrics.conversionToday || 0).toLocaleString('pt-BR', {
    maximumFractionDigits: 2
  })}%`;
  elements.visitsWeek.textContent = formatNumber(metrics.visitsLast7Days);
  elements.registrationsWeek.textContent = formatNumber(metrics.registrationsLast7Days);
  elements.lastRegistration.textContent = formatDate(data.lastRegistrationAt);
  elements.lastEvent.textContent = formatDate(data.lastEventAt);
  renderActivity(data.recentEvents);
};

const loadDashboard = async () => {
  elements.status.textContent = 'Carregando resumo executivo…';
  elements.refresh.disabled = true;
  try {
    const response = await fetch(`/api/admin/dashboard?days=${encodeURIComponent(elements.period.value)}`, {
      credentials: 'same-origin',
      cache: 'no-store'
    });
    if (response.status === 401) {
      window.location.replace('/admin/login');
      return;
    }
    const payload = await response.json();
    if (!response.ok || payload.success !== true) throw new Error('dashboard_failed');
    renderMetrics(payload.data);
    elements.status.textContent = 'Resumo atualizado.';
  } catch {
    elements.status.textContent = 'Não foi possível carregar o resumo. Tente novamente.';
    elements.activity.replaceChildren();
    const error = document.createElement('p');
    error.className = 'admin-empty';
    error.textContent = 'A atividade recente está temporariamente indisponível.';
    elements.activity.append(error);
  } finally {
    elements.refresh.disabled = false;
  }
};

elements.period?.addEventListener('change', loadDashboard);
elements.refresh?.addEventListener('click', loadDashboard);
loadDashboard();
