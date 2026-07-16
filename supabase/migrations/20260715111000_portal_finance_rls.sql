-- REROUTE Portal Sprint 17 - read-only financial RLS.

alter table public.financial_summaries enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.financial_budgets enable row level security;
alter table public.financial_cash_flows enable row level security;

revoke all on public.financial_summaries from anon, authenticated;
revoke all on public.financial_transactions from anon, authenticated;
revoke all on public.financial_budgets from anon, authenticated;
revoke all on public.financial_cash_flows from anon, authenticated;

grant select on public.financial_summaries to authenticated;
grant select on public.financial_transactions to authenticated;
grant select on public.financial_budgets to authenticated;
grant select on public.financial_cash_flows to authenticated;

create or replace function public.can_read_finance_workspace(p_organization_id uuid, p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.workspaces w
    join public.workspace_members wm
      on wm.workspace_id = w.id
     and wm.profile_id = auth.uid()
     and wm.status = 'active'
    where w.id = p_workspace_id
      and w.organization_id = p_organization_id
      and w.status = 'active'
      and p_organization_id = public.current_profile_organization_id()
      and (
        public.has_capability('finance.read', w.slug)
        or public.has_capability('finance.manage', w.slug)
      )
  );
$$;

revoke all on function public.can_read_finance_workspace(uuid, uuid) from public;
grant execute on function public.can_read_finance_workspace(uuid, uuid) to authenticated;

drop policy if exists financial_summaries_select_authorized on public.financial_summaries;
create policy financial_summaries_select_authorized
on public.financial_summaries for select to authenticated
using (public.can_read_finance_workspace(organization_id, workspace_id));

drop policy if exists financial_transactions_select_authorized on public.financial_transactions;
create policy financial_transactions_select_authorized
on public.financial_transactions for select to authenticated
using (public.can_read_finance_workspace(organization_id, workspace_id));

drop policy if exists financial_budgets_select_authorized on public.financial_budgets;
create policy financial_budgets_select_authorized
on public.financial_budgets for select to authenticated
using (public.can_read_finance_workspace(organization_id, workspace_id));

drop policy if exists financial_cash_flows_select_authorized on public.financial_cash_flows;
create policy financial_cash_flows_select_authorized
on public.financial_cash_flows for select to authenticated
using (public.can_read_finance_workspace(organization_id, workspace_id));

