const { serviceRoleRequest } = require('./admin-auth');
const { getDashboardData } = require('./admin-data');

const ANALYTICS_EVENT_SELECT = [
  'visitor_id',
  'session_id',
  'event_name',
  'occurred_at',
  'referrer_host',
  'utm_source',
  'duration_seconds',
  'scroll_percent',
  'event_data'
].join(',');

const percentage = (value, total) => total
  ? Number(((Number(value) / Number(total)) * 100).toFixed(1))
  : 0;

const classifyOrigin = (row) => {
  const source = `${row.utm_source || ''} ${row.referrer_host || ''}`.toLowerCase();
  if (/facebook|fb\b|meta/.test(source)) return 'Facebook';
  if (/instagram|ig\b/.test(source)) return 'Instagram';
  if (/linkedin/.test(source)) return 'LinkedIn';
  if (/google/.test(source)) return 'Google';
  if (/chatgpt|openai/.test(source)) return 'ChatGPT';
  if (!source.trim()) return 'Direto';
  return 'Outros';
};

const classifyCta = (row) => {
  const name = String(row.event_data?.name || '').toLowerCase();
  const target = String(row.event_data?.target || '').toLowerCase();
  if (name.includes('hero_teste_gratuito') || name.includes('quero testar gratuitamente')) return 'CTA Hero';
  if (name.includes('história') || name.includes('historia')) return 'CTA História';
  if (name.includes('como_funciona') || name.includes('veja como funciona')) return 'CTA Como Funciona';
  if (target === '#comecar' || target === '/#comecar' || name === 'começar') return 'CTA Final';
  return null;
};

const isConversionCta = (row) => {
  const name = String(row.event_data?.name || '').toLowerCase();
  const target = String(row.event_data?.target || '').toLowerCase();
  return target === '#comecar'
    || target === '/#comecar'
    || name.includes('hero_teste_gratuito')
    || name.includes('quero testar gratuitamente')
    || name.includes('cadastre-se gratuitamente')
    || name.includes('experimentar gratuitamente');
};

const secondsBetween = (start, end) => Math.max(
  Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000),
  0
);

const buildJourneyDiagnosis = ({ visitors, registrations, eventVisitors }) => {
  const stages = [
    { value: visitors, message: 'Maior perda ocorre antes do clique no CTA.' },
    { value: eventVisitors.cta_click, message: 'Maior perda ocorre antes da abertura do formulário.' },
    { value: eventVisitors.form_open, message: 'Maior abandono ocorre durante o preenchimento do formulário.' },
    { value: eventVisitors.form_start, message: 'Boa taxa de abertura do formulário, mas baixa conclusão.' },
    { value: registrations, message: 'A jornada apresenta boa continuidade até a conclusão do cadastro.' }
  ];

  if (!visitors) return 'Ainda não há visitas suficientes para gerar um diagnóstico.';
  let weakestIndex = stages.length - 1;
  let weakestRetention = 1;
  for (let index = 0; index < stages.length - 1; index += 1) {
    const current = stages[index].value;
    const next = stages[index + 1].value;
    const retention = current ? next / current : 1;
    if (retention < weakestRetention) {
      weakestRetention = retention;
      weakestIndex = index;
    }
  }
  return stages[weakestIndex].message;
};

const aggregateEventDetails = (rows) => {
  const pageViews = rows.filter((row) => row.event_name === 'page_view');
  const visitorIds = new Set(pageViews.map((row) => row.visitor_id));
  const journeyByVisitor = new Map();
  for (const row of [...rows].sort((left, right) => new Date(left.occurred_at) - new Date(right.occurred_at))) {
    const journey = journeyByVisitor.get(row.visitor_id) || {
      visited: false,
      sawCta: false,
      clickedCta: false,
      openedForm: false,
      startedForm: false,
      submittedForm: false
    };
    if (row.event_name === 'page_view') {
      journey.visited = true;
      journey.sawCta = true;
    } else if (row.event_name === 'cta_click' && journey.sawCta && isConversionCta(row)) {
      journey.clickedCta = true;
    } else if (row.event_name === 'form_open' && journey.clickedCta) {
      journey.openedForm = true;
    } else if (row.event_name === 'form_start' && journey.openedForm) {
      journey.startedForm = true;
    } else if (row.event_name === 'form_submit' && journey.openedForm) {
      journey.submittedForm = true;
    }
    journeyByVisitor.set(row.visitor_id, journey);
  }
  const journeyCounts = {
    visitors: [...journeyByVisitor.values()].filter((journey) => journey.visited).length,
    sawCta: [...journeyByVisitor.values()].filter((journey) => journey.sawCta).length,
    clickedCta: [...journeyByVisitor.values()].filter((journey) => journey.clickedCta).length,
    openedForm: [...journeyByVisitor.values()].filter((journey) => journey.openedForm).length,
    startedForm: [...journeyByVisitor.values()].filter((journey) => journey.startedForm).length,
    submittedForm: [...journeyByVisitor.values()].filter((journey) => journey.submittedForm).length
  };
  const originNames = ['Facebook', 'Instagram', 'LinkedIn', 'Google', 'Direto', 'ChatGPT', 'Outros'];
  const origins = new Map(originNames.map((name) => [name, { visits: 0, registrations: 0 }]));
  for (const row of pageViews) origins.get(classifyOrigin(row)).visits += 1;
  for (const row of rows.filter((event) => event.event_name === 'form_submit')) {
    origins.get(classifyOrigin(row)).registrations += 1;
  }

  const hourlyVisitors = Array.from({ length: 24 }, (_, hour) => ({
    name: `${String(hour).padStart(2, '0')}h`,
    visitors: new Set()
  }));
  for (const row of pageViews) {
    const hour = Number(new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      hourCycle: 'h23'
    }).format(new Date(row.occurred_at)));
    if (hourlyVisitors[hour]) hourlyVisitors[hour].visitors.add(row.visitor_id);
  }

  const visitsByVisitor = new Map();
  for (const row of pageViews) visitsByVisitor.set(row.visitor_id, (visitsByVisitor.get(row.visitor_id) || 0) + 1);
  const recurringVisitors = [...visitsByVisitor.values()].filter((visits) => visits > 1).length;
  const newVisitors = Math.max(visitorIds.size - recurringVisitors, 0);

  const scrollSteps = [
    { name: 'Hero', threshold: 0, visitors: new Set(pageViews.map((row) => row.visitor_id)) },
    { name: 'História do fundador', threshold: 25, visitors: new Set() },
    { name: 'Para quem é', threshold: 50, visitors: new Set() },
    { name: 'Como funciona', threshold: 75, visitors: new Set() },
    { name: 'CTA final', threshold: 90, visitors: new Set() }
  ];
  for (const row of rows.filter((event) => event.event_name === 'scroll_depth')) {
    for (const step of scrollSteps) {
      if (Number(row.scroll_percent) >= step.threshold) step.visitors.add(row.visitor_id);
    }
  }

  const ctaNames = ['CTA Hero', 'CTA História', 'CTA Como Funciona', 'CTA Final'];
  const ctaClicks = new Map(ctaNames.map((name) => [name, 0]));
  for (const row of rows.filter((event) => event.event_name === 'cta_click')) {
    const name = classifyCta(row);
    if (name) ctaClicks.set(name, ctaClicks.get(name) + 1);
  }

  const sessionEvents = new Map();
  for (const row of rows) {
    if (!sessionEvents.has(row.session_id)) sessionEvents.set(row.session_id, []);
    sessionEvents.get(row.session_id).push(row);
  }
  const timeToOpen = [];
  const timeToSubmit = [];
  for (const events of sessionEvents.values()) {
    const ordered = events.sort((left, right) => new Date(left.occurred_at) - new Date(right.occurred_at));
    const pageView = ordered.find((row) => row.event_name === 'page_view');
    const formOpen = ordered.find((row) => row.event_name === 'form_open');
    const formSubmit = ordered.find((row) => row.event_name === 'form_submit');
    if (pageView && formOpen) timeToOpen.push(secondsBetween(pageView.occurred_at, formOpen.occurred_at));
    if (pageView && formSubmit) timeToSubmit.push(secondsBetween(pageView.occurred_at, formSubmit.occurred_at));
  }
  const durations = rows
    .filter((row) => row.event_name === 'page_duration' && Number.isFinite(Number(row.duration_seconds)))
    .map((row) => Number(row.duration_seconds));
  const average = (values) => values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0;

  return {
    metrics: {
      uniqueVisitors: journeyCounts.visitors,
      conversionRate: percentage(journeyCounts.submittedForm, journeyCounts.visitors)
    },
    funnel: [
      { name: 'Visitante único', value: journeyCounts.visitors },
      { name: 'Viu CTA', value: journeyCounts.sawCta },
      { name: 'Clicou no CTA', value: journeyCounts.clickedCta },
      { name: 'Formulário aberto', value: journeyCounts.openedForm },
      { name: 'Cadastro enviado', value: journeyCounts.submittedForm }
    ],
    diagnosis: {
      visitors: journeyCounts.visitors,
      registrations: journeyCounts.submittedForm,
      conversionRate: percentage(journeyCounts.submittedForm, journeyCounts.visitors),
      message: buildJourneyDiagnosis({
        visitors: journeyCounts.visitors,
        registrations: journeyCounts.submittedForm,
        eventVisitors: {
          cta_click: journeyCounts.clickedCta,
          form_open: journeyCounts.openedForm,
          form_start: journeyCounts.startedForm,
          form_submit: journeyCounts.submittedForm
        }
      })
    },
    originConversion: originNames.map((name) => ({
      name,
      visits: origins.get(name).visits,
      registrations: origins.get(name).registrations,
      conversionRate: percentage(origins.get(name).registrations, origins.get(name).visits)
    })),
    hourlyVisitors: hourlyVisitors.map(({ name, visitors }) => ({ name, total: visitors.size })),
    visitorTypes: [
      { name: 'Novos visitantes', total: newVisitors, percentage: percentage(newVisitors, visitorIds.size) },
      { name: 'Visitantes recorrentes', total: recurringVisitors, percentage: percentage(recurringVisitors, visitorIds.size) }
    ],
    scrollJourney: scrollSteps.map(({ name, visitors }) => ({
      name,
      total: visitors.size,
      percentage: percentage(visitors.size, visitorIds.size)
    })),
    ctaClicks: ctaNames.map((name) => ({ name, total: ctaClicks.get(name) })),
    averageTimes: {
      page: average(durations),
      formOpen: average(timeToOpen),
      registration: average(timeToSubmit)
    }
  };
};

const getAnalyticsEventDetails = async (safeDays, fetchImpl) => {
  const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString();
  const pageSize = 1000;
  const buildParams = (offset) => new URLSearchParams({
    select: ANALYTICS_EVENT_SELECT,
    occurred_at: `gte.${since}`,
    order: 'occurred_at.asc',
    limit: String(pageSize),
    offset: String(offset)
  });
  const fetchPage = async (offset, count = false) => {
    const response = await serviceRoleRequest(`/rest/v1/analytics_events?${buildParams(offset)}`, {
      method: 'GET',
      headers: count ? { Prefer: 'count=exact' } : {}
    }, fetchImpl);
    if (!response.ok) return null;
    const pageRows = await response.json();
    return {
      rows: Array.isArray(pageRows) ? pageRows : [],
      total: Number.parseInt(String(response.headers?.get?.('content-range') || '').split('/')[1], 10)
    };
  };

  const firstPage = await fetchPage(0, true);
  if (!firstPage) return null;
  const total = Number.isFinite(firstPage.total) ? firstPage.total : firstPage.rows.length;
  const offsets = [];
  for (let offset = pageSize; offset < total; offset += pageSize) offsets.push(offset);
  const remainingPages = await Promise.all(offsets.map((offset) => fetchPage(offset)));
  if (remainingPages.some((page) => !page)) return null;
  const rows = [firstPage, ...remainingPages].flatMap((page) => page.rows);
  return aggregateEventDetails(rows);
};

const getAnalyticsDashboard = async ({ days = 30 } = {}, fetchImpl = fetch) => {
  const safeDays = [7, 30, 90, 365].includes(Number(days)) ? Number(days) : 30;
  try {
    const response = await serviceRoleRequest('/rest/v1/rpc/get_admin_analytics_dashboard', {
      method: 'POST',
      body: JSON.stringify({ p_days: safeDays })
    }, fetchImpl);
    if (!response.ok) return null;
    const dashboard = await response.json();
    const details = await getAnalyticsEventDetails(safeDays, fetchImpl).catch(() => null);
    return details ? {
      ...dashboard,
      ...details,
      metrics: { ...dashboard.metrics, ...details.metrics }
    } : dashboard;
  } catch {
    return null;
  }
};

const getRecentEvents = async ({ days = 7, limit = 20 } = {}, fetchImpl = fetch) => {
  const safeDays = [1, 7, 30].includes(Number(days)) ? Number(days) : 7;
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 20);
  const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    select: 'visitor_id,event_name,occurred_at,device_type,referrer_host,utm_source,page_path',
    occurred_at: `gte.${since}`,
    order: 'occurred_at.desc',
    limit: String(safeLimit)
  });

  try {
    const response = await serviceRoleRequest(
      `/rest/v1/analytics_events?${params}`,
      { method: 'GET' },
      fetchImpl
    );
    if (!response.ok) return null;
    const rows = await response.json();
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
};

const getExecutiveDashboard = async ({ recentDays = 7 } = {}, fetchImpl = fetch) => {
  const safeRecentDays = [1, 7, 30].includes(Number(recentDays)) ? Number(recentDays) : 7;
  const [analytics, leads, recentEvents] = await Promise.all([
    getAnalyticsDashboard({ days: 7 }, fetchImpl),
    getDashboardData({ page: 1, pageSize: 10 }, fetchImpl),
    getRecentEvents({ days: safeRecentDays, limit: 20 }, fetchImpl)
  ]);

  if (!analytics || !leads || !recentEvents) return null;

  const todayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
  const today = (analytics.daily || []).find((row) => row.metric_date === todayKey) || {};
  const uniqueToday = Number(today.unique_visitors) || 0;
  const registrationsToday = Number(leads.metrics?.today) || 0;

  return {
    metrics: {
      visitsToday: Number(today.visits) || 0,
      uniqueVisitorsToday: uniqueToday,
      registrationsToday,
      conversionToday: uniqueToday
        ? Number(((registrationsToday / uniqueToday) * 100).toFixed(2))
        : 0,
      visitsLast7Days: Number(analytics.metrics?.visits) || 0,
      registrationsLast7Days: Number(leads.metrics?.last7Days) || 0
    },
    lastRegistrationAt: leads.leads?.[0]?.created_at || null,
    lastEventAt: recentEvents[0]?.occurred_at || null,
    recentDays: safeRecentDays,
    recentEvents
  };
};

module.exports = { getAnalyticsDashboard, getExecutiveDashboard, getRecentEvents };
