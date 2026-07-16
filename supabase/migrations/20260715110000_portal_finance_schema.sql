-- REROUTE Portal Sprint 17 - financial read model.
-- Contains no real financial data and is safe to apply independently of the UI.

create table if not exists public.financial_summaries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  current_cash numeric(18, 2) not null default 0,
  monthly_burn_rate numeric(18, 2) not null default 0,
  estimated_runway_months numeric(8, 2) not null default 0,
  total_invested numeric(18, 2) not null default 0,
  total_executed numeric(18, 2) not null default 0,
  available_balance numeric(18, 2) not null default 0,
  reserve_amount numeric(18, 2) not null default 0,
  budget_usage_percentage numeric(7, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_summaries_amounts_check check (
    current_cash >= 0 and monthly_burn_rate >= 0 and estimated_runway_months >= 0
    and total_invested >= 0 and total_executed >= 0 and available_balance >= 0
    and reserve_amount >= 0 and budget_usage_percentage between 0 and 100
  )
);

create index if not exists financial_summaries_scope_updated_idx
on public.financial_summaries(organization_id, workspace_id, updated_at desc);

drop trigger if exists set_financial_summaries_updated_at on public.financial_summaries;
create trigger set_financial_summaries_updated_at
before update on public.financial_summaries
for each row execute function public.set_updated_at();

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  transaction_date date not null,
  type text not null,
  category text not null,
  description text not null,
  amount numeric(18, 2) not null,
  status text not null default 'posted',
  created_at timestamptz not null default now(),
  constraint financial_transactions_type_check check (type in ('income', 'expense', 'transfer')),
  constraint financial_transactions_amount_check check (amount > 0),
  constraint financial_transactions_status_check check (status in ('pending', 'posted', 'cancelled')),
  constraint financial_transactions_category_check check (char_length(trim(category)) between 2 and 80),
  constraint financial_transactions_description_check check (char_length(trim(description)) between 2 and 240)
);

create index if not exists financial_transactions_scope_date_idx
on public.financial_transactions(organization_id, workspace_id, transaction_date desc);

create table if not exists public.financial_budgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  label text not null,
  category text not null,
  planned_amount numeric(18, 2) not null default 0,
  actual_amount numeric(18, 2) not null default 0,
  reserve_amount numeric(18, 2) not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint financial_budgets_amounts_check check (
    planned_amount >= 0 and actual_amount >= 0 and reserve_amount >= 0
  ),
  constraint financial_budgets_status_check check (status in ('draft', 'active', 'closed', 'cancelled')),
  constraint financial_budgets_label_check check (char_length(trim(label)) between 2 and 120),
  constraint financial_budgets_category_check check (char_length(trim(category)) between 2 and 80)
);

create index if not exists financial_budgets_scope_created_idx
on public.financial_budgets(organization_id, workspace_id, created_at desc);

create table if not exists public.financial_cash_flows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  period_start date not null,
  period_label text not null,
  entries numeric(18, 2) not null default 0,
  exits numeric(18, 2) not null default 0,
  balance numeric(18, 2) not null default 0,
  created_at timestamptz not null default now(),
  constraint financial_cash_flows_values_check check (entries >= 0 and exits >= 0),
  constraint financial_cash_flows_label_check check (char_length(trim(period_label)) between 2 and 40),
  constraint financial_cash_flows_scope_period_key unique (organization_id, workspace_id, period_start)
);

create index if not exists financial_cash_flows_scope_period_idx
on public.financial_cash_flows(organization_id, workspace_id, period_start asc);

