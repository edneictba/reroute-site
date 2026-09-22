(() => {
  const byId = (id) => document.getElementById(id);
  const state = { page: 1, pageSize: 25, totalPages: 0 };
  const formatDate = (value, dateOnly = false) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const parts = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
      ...(dateOnly ? {} : { hour: '2-digit', minute: '2-digit' })
    }).formatToParts(date).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
    return dateOnly ? `${parts.day}/${parts.month}/${parts.year}` : `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
  };
  const cell = (value) => { const node = document.createElement('td'); node.textContent = value ?? '—'; return node; };
  const render = (users) => {
    const body = byId('usersTableBody');
    body.replaceChildren();
    users.forEach((user) => {
      const row = document.createElement('tr');
      [user.email || '—', formatDate(user.createdAt), formatDate(user.lastSignInAt), user.provider || '—', user.onboarding, String(user.checkins), String(user.checkouts), formatDate(user.lastActivityAt, true)].forEach((value) => row.append(cell(value)));
      body.append(row);
    });
  };
  const load = async () => {
    const status = byId('usersStatus');
    status.textContent = 'Carregando usuários…';
    const params = new URLSearchParams({ page: String(state.page), pageSize: String(state.pageSize), search: byId('usersSearch').value.trim(), onboarding: byId('usersOnboarding').value, provider: byId('usersProvider').value });
    try {
      const response = await fetch(`/api/admin/users?${params.toString()}`, { credentials: 'same-origin', cache: 'no-store' });
      if (response.status === 401) { window.location.replace('/admin/login'); return; }
      const payload = await response.json();
      if (!response.ok || payload.success !== true) throw new Error('users_failed');
      const { users, pagination } = payload.data;
      render(users);
      state.totalPages = pagination.totalPages;
      byId('usersTotal').textContent = `${pagination.total} resultado${pagination.total === 1 ? '' : 's'}`;
      byId('usersPageLabel').textContent = pagination.totalPages ? `Página ${pagination.page} de ${pagination.totalPages}` : '';
      byId('usersPrevious').disabled = pagination.page <= 1 || pagination.totalPages === 0;
      byId('usersNext').disabled = pagination.page >= pagination.totalPages || pagination.totalPages === 0;
      status.textContent = pagination.total === 0 ? (byId('usersSearch').value || byId('usersOnboarding').value !== 'all' || byId('usersProvider').value !== 'all' ? 'Nenhum usuário encontrado para os filtros selecionados.' : 'Nenhum usuário encontrado.') : '';
    } catch {
      byId('usersTableBody').replaceChildren();
      byId('usersTotal').textContent = '';
      byId('usersPageLabel').textContent = '';
      status.textContent = 'Não foi possível carregar os usuários agora.';
    }
  };
  byId('usersFilters').addEventListener('submit', (event) => { event.preventDefault(); state.page = 1; load(); });
  byId('usersPrevious').addEventListener('click', () => { if (state.page > 1) { state.page -= 1; load(); } });
  byId('usersNext').addEventListener('click', () => { if (state.page < state.totalPages) { state.page += 1; load(); } });
  load();
})();
