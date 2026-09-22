(() => {
  const byId = (id) => document.getElementById(id);
  const number = (value) => new Intl.NumberFormat('pt-BR').format(Number(value) || 0);
  const list = (element, items, render) => {
    if (!element) return;
    element.replaceChildren();
    if (!Array.isArray(items) || !items.length) {
      const empty = document.createElement('p');
      empty.className = 'admin-empty';
      empty.textContent = 'Nenhum dado disponível neste período.';
      element.append(empty);
      return;
    }
    items.forEach((item) => element.append(render(item)));
  };
  const item = (title, value) => {
    const node = document.createElement('div');
    node.className = 'analytics-list-item';
    node.textContent = `${title}: ${value}`;
    return node;
  };
  const setValue = (id, value, suffix = '') => {
    const node = byId(id);
    if (node) node.textContent = value === null || value === undefined ? '—' : `${number(value)}${suffix}`;
  };

  const renderSupabase = (source) => {
    if (!source) return;
    const users = source.users || {};
    const journey = source.journey || {};
    setValue('supabaseRegisteredAccounts', users.registeredAccounts);
    setValue('supabaseNewAccounts', users.newAccounts);
    setValue('supabaseProfiles', users.profiles);
    setValue('supabaseOnboardingCompleted', users.onboardingCompleted);
    setValue('supabasePendingProfiles', users.pendingProfiles);
    setValue('supabaseAccountsWithoutProfile', users.accountsWithoutProfile);
    setValue('supabaseProfileCompletionRate', users.profileCompletionRate, '%');
    setValue('supabaseCheckinUsers', journey.checkinUsers);
    setValue('supabaseCheckins', journey.checkins);
    setValue('supabaseCheckoutUsers', journey.checkoutUsers);
    setValue('supabaseCheckouts', journey.checkouts);
    if (byId('appUsersStatus')) byId('appUsersStatus').textContent = source.status === 'ok' ? 'Dados operacionais carregados.' : 'Parte dos dados operacionais está indisponível.';
    if (byId('appJourneyStatus')) byId('appJourneyStatus').textContent = journey.status === 'ok' ? 'Jornada carregada.' : 'Parte da jornada está indisponível.';
  };

  const load = async () => {
    const days = byId('analyticsPeriod')?.value || '30';
    try {
      const response = await fetch(`/api/admin/app-analytics?days=${encodeURIComponent(days)}`, {
        credentials: 'same-origin', cache: 'no-store'
      });
      if (response.status === 401) {
        window.location.replace('/admin/login');
        return;
      }
      const payload = await response.json();
      if (!response.ok || payload.success !== true) throw new Error('app_analytics_failed');
      const { supabase, posthog, sentry } = payload.data.app;
      renderSupabase(supabase);
      const sourceStatus = [];
      if (posthog) {
        byId('appActiveUsers').textContent = number(posthog.metrics.activeUsers);
        byId('appUsers').textContent = number(posthog.metrics.appUsers);
        byId('appLogins').textContent = number(posthog.metrics.completedLogins);
        byId('appOnboardings').textContent = number(posthog.metrics.completedOnboardings);
        list(byId('appScreens'), posthog.screens, (row) => item(row.screen, `${number(row.views)} visitas · ${number(row.users)} usuários`));
        list(byId('appDaily'), posthog.daily, (row) => item(row.day, `${number(row.activeUsers)} usuários · ${number(row.screenViews)} telas`));
        sourceStatus.push('PostHog OK');
      } else {
        sourceStatus.push('PostHog temporariamente indisponível');
      }
      if (sentry) {
        byId('sentryUnresolved').textContent = number(sentry.unresolved);
        list(byId('sentryIssues'), sentry.issues, (issue) => item(issue.title, `${number(issue.count)} ocorrências · ${issue.level}`));
        sourceStatus.push('Sentry OK');
      } else {
        sourceStatus.push('Sentry temporariamente indisponível');
      }
      byId('appAnalyticsStatus').textContent = sourceStatus.join(' · ');
      byId('appStabilityStatus').textContent = sentry ? 'Dados do Sentry carregados.' : 'Dados do Sentry temporariamente indisponíveis.';
    } catch {
      byId('appAnalyticsStatus').textContent = 'Dados do App temporariamente indisponíveis.';
      byId('appStabilityStatus').textContent = 'Dados do Sentry temporariamente indisponíveis.';
    }
  };

  byId('analyticsPeriod')?.addEventListener('change', load);
  load();
})();
