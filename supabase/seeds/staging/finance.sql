-- REROUTE Portal Sprint 18 - fictitious staging finance fixtures.
-- Never apply this file to production. Contains no real or personal data.

do $$
declare
  reroute_organization_id uuid;
  investor_workspace_id uuid;
begin
  select id into reroute_organization_id
  from public.organizations
  where slug = 'reroute';

  if reroute_organization_id is null then
    raise exception 'REROUTE organization not found';
  end if;

  select id into investor_workspace_id
  from public.workspaces
  where organization_id = reroute_organization_id
    and slug = 'investor';

  if investor_workspace_id is null then
    raise exception 'REROUTE investor workspace not found';
  end if;

  insert into public.financial_summaries (
    id, organization_id, workspace_id, current_cash, monthly_burn_rate,
    estimated_runway_months, total_invested, total_executed,
    available_balance, reserve_amount, budget_usage_percentage
  ) values (
    '18000000-0000-4000-8000-000000000001', reroute_organization_id,
    investor_workspace_id, 842500, 93500, 9.01, 1200000, 357500,
    842500, 180000, 29.7917
  )
  on conflict (id) do update set
    organization_id = excluded.organization_id,
    workspace_id = excluded.workspace_id,
    current_cash = excluded.current_cash,
    monthly_burn_rate = excluded.monthly_burn_rate,
    estimated_runway_months = excluded.estimated_runway_months,
    total_invested = excluded.total_invested,
    total_executed = excluded.total_executed,
    available_balance = excluded.available_balance,
    reserve_amount = excluded.reserve_amount,
    budget_usage_percentage = excluded.budget_usage_percentage,
    updated_at = now();

  insert into public.financial_transactions (
    id, organization_id, workspace_id, transaction_date, type,
    category, description, amount, status
  )
  select
    ('18000000-0000-4000-8001-' || lpad(series_number::text, 12, '0'))::uuid,
    reroute_organization_id,
    investor_workspace_id,
    date '2026-01-05' + ((series_number - 1) * 5),
    case when series_number in (1, 11, 21, 31) then 'income' else 'expense' end,
    (array[
      'Produto e Tecnologia', 'Pessoas', 'Marketing', 'Operacoes',
      'Juridico', 'Infraestrutura', 'Pesquisa', 'Administrativo'
    ])[((series_number - 1) % 8) + 1],
    format(
      'Fixture staging %s | Conta: %s',
      lpad(series_number::text, 2, '0'),
      (array[
        'Caixa Principal', 'Reserva Operacional', 'Produto', 'Pessoas',
        'Marketing', 'Infraestrutura', 'Juridico', 'Pesquisa',
        'Administrativo', 'Investimentos'
      ])[((series_number - 1) % 10) + 1]
    ),
    case
      when series_number in (1, 11, 21, 31) then 300000
      else 3500 + (series_number * 725)
    end,
    'posted'
  from generate_series(1, 40) as fixture(series_number)
  on conflict (id) do update set
    organization_id = excluded.organization_id,
    workspace_id = excluded.workspace_id,
    transaction_date = excluded.transaction_date,
    type = excluded.type,
    category = excluded.category,
    description = excluded.description,
    amount = excluded.amount,
    status = excluded.status;

  insert into public.financial_budgets (
    id, organization_id, workspace_id, label, category,
    planned_amount, actual_amount, reserve_amount, status
  ) values
    ('18000000-0000-4000-8002-000000000001', reroute_organization_id, investor_workspace_id,
     'Produto e MVP 2026', 'Produto e Tecnologia', 420000, 168000, 50000, 'active'),
    ('18000000-0000-4000-8002-000000000002', reroute_organization_id, investor_workspace_id,
     'Operacao 2026', 'Operacoes', 310000, 112500, 45000, 'active'),
    ('18000000-0000-4000-8002-000000000003', reroute_organization_id, investor_workspace_id,
     'Go-to-market 2026', 'Marketing', 290000, 77000, 35000, 'active')
  on conflict (id) do update set
    organization_id = excluded.organization_id,
    workspace_id = excluded.workspace_id,
    label = excluded.label,
    category = excluded.category,
    planned_amount = excluded.planned_amount,
    actual_amount = excluded.actual_amount,
    reserve_amount = excluded.reserve_amount,
    status = excluded.status;

  insert into public.financial_cash_flows (
    id, organization_id, workspace_id, period_start, period_label,
    entries, exits, balance
  )
  select
    ('18000000-0000-4000-8003-' || lpad(series_number::text, 12, '0'))::uuid,
    reroute_organization_id,
    investor_workspace_id,
    (date '2026-01-01' + ((series_number - 1) * interval '1 month'))::date,
    (array['Jan/26', 'Fev/26', 'Mar/26', 'Abr/26', 'Mai/26', 'Jun/26',
           'Jul/26', 'Ago/26', 'Set/26', 'Out/26', 'Nov/26', 'Dez/26'])[series_number],
    case when series_number in (1, 4, 7, 10) then 300000 else 0 end,
    65000 + (series_number * 4750),
    1200000 - (series_number * 29791.67)
  from generate_series(1, 12) as fixture(series_number)
  on conflict (id) do update set
    organization_id = excluded.organization_id,
    workspace_id = excluded.workspace_id,
    period_start = excluded.period_start,
    period_label = excluded.period_label,
    entries = excluded.entries,
    exits = excluded.exits,
    balance = excluded.balance;
end;
$$;

