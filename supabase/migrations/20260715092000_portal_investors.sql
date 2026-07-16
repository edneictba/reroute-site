-- REROUTE Portal - investor registry foundation.
-- Does not include financial values, CPF/RG, addresses, contracts or ownership data.

create table if not exists public.investors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  investor_number integer not null,
  status text not null default 'invited',
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investors_org_number_key unique (organization_id, investor_number),
  constraint investors_profile_id_key unique (profile_id),
  constraint investors_number_check check (investor_number between 1 and 20),
  constraint investors_status_check check (status in ('invited', 'active', 'suspended', 'exited'))
);

create index if not exists investors_organization_id_idx on public.investors(organization_id);
create index if not exists investors_status_idx on public.investors(status);

drop trigger if exists set_investors_updated_at on public.investors;
create trigger set_investors_updated_at
before update on public.investors
for each row execute function public.set_updated_at();
