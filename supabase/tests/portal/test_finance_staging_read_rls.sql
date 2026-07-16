-- REROUTE Portal Sprint 18 - finance staging read/RLS scenarios.
-- Requires all migrations plus supabase/seeds/staging/finance.sql.
-- Run only in an isolated local or staging Supabase database.

begin;

do $$
declare
  reroute_org_id uuid := (select id from public.organizations where slug = 'reroute');
  other_org_id uuid := '18000000-0000-4000-9000-000000000001';
  investor_workspace_id uuid := (
    select id from public.workspaces where organization_id = reroute_org_id and slug = 'investor'
  );
  finance_workspace_id uuid := (
    select id from public.workspaces where organization_id = reroute_org_id and slug = 'finance'
  );
  other_workspace_id uuid := '18000000-0000-4000-9000-000000000002';
  read_user_id uuid := '18000000-0000-4000-9001-000000000001';
  manage_user_id uuid := '18000000-0000-4000-9001-000000000002';
  no_permission_user_id uuid := '18000000-0000-4000-9001-000000000003';
  other_workspace_user_id uuid := '18000000-0000-4000-9001-000000000004';
  other_org_user_id uuid := '18000000-0000-4000-9001-000000000005';
  other_role_id uuid := '18000000-0000-4000-9000-000000000003';
begin
  if reroute_org_id is null or investor_workspace_id is null or finance_workspace_id is null then
    raise exception 'Required REROUTE fixtures are missing';
  end if;

  insert into public.organizations (id, name, slug, status)
  values (other_org_id, 'Other Test Organization', 'other-finance-test', 'active')
  on conflict (id) do nothing;

  insert into public.workspaces (id, organization_id, name, slug, status)
  values (other_workspace_id, other_org_id, 'Other Investor Workspace', 'other-investor', 'active')
  on conflict (id) do nothing;

  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  values
    (read_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'finance-read@example.test', 'test', now(), now(), now()),
    (manage_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'finance-manage@example.test', 'test', now(), now(), now()),
    (no_permission_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'finance-none@example.test', 'test', now(), now(), now()),
    (other_workspace_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'finance-workspace@example.test', 'test', now(), now(), now()),
    (other_org_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'finance-organization@example.test', 'test', now(), now(), now())
  on conflict (id) do nothing;

  update public.profiles
  set status = 'active'
  where id in (read_user_id, manage_user_id, no_permission_user_id, other_workspace_user_id);

  update public.profiles
  set organization_id = other_org_id, status = 'active'
  where id = other_org_user_id;

  insert into public.workspace_members (workspace_id, profile_id, status, joined_at)
  values
    (investor_workspace_id, read_user_id, 'active', now()),
    (investor_workspace_id, manage_user_id, 'active', now()),
    (investor_workspace_id, no_permission_user_id, 'active', now()),
    (finance_workspace_id, other_workspace_user_id, 'active', now()),
    (other_workspace_id, other_org_user_id, 'active', now())
  on conflict (workspace_id, profile_id) do update set status = 'active';

  insert into public.user_roles (profile_id, role_id, workspace_id, status)
  values
    (read_user_id, (select id from public.roles where organization_id = reroute_org_id and slug = 'investor'), investor_workspace_id, 'active'),
    (manage_user_id, (select id from public.roles where organization_id = reroute_org_id and slug = 'accountant'), investor_workspace_id, 'active'),
    (no_permission_user_id, (select id from public.roles where organization_id = reroute_org_id and slug = 'employee'), investor_workspace_id, 'active'),
    (other_workspace_user_id, (select id from public.roles where organization_id = reroute_org_id and slug = 'investor'), finance_workspace_id, 'active')
  on conflict (profile_id, role_id, workspace_id) do update set status = 'active';

  insert into public.roles (id, organization_id, name, slug, status)
  values (other_role_id, other_org_id, 'Other Finance Reader', 'other_finance_reader', 'active')
  on conflict (id) do nothing;

  insert into public.role_capabilities (role_id, capability_id, granted)
  values (other_role_id, (select id from public.capabilities where key = 'finance.read'), true)
  on conflict (role_id, capability_id) do update set granted = true;

  insert into public.user_roles (profile_id, role_id, workspace_id, status)
  values (other_org_user_id, other_role_id, other_workspace_id, 'active')
  on conflict (profile_id, role_id, workspace_id) do update set status = 'active';
end;
$$;

set local role authenticated;

select set_config('request.jwt.claim.sub', '18000000-0000-4000-9001-000000000001', true);
do $$
begin
  if (select count(*) from public.financial_transactions where id::text like '18000000-0000-4000-8001-%') <> 40 then
    raise exception 'finance.read user cannot read the 40 staging transactions';
  end if;
  if exists (
    select 1
    from public.financial_transactions ft
    where ft.id::text like '18000000-0000-4000-8001-%'
      and not exists (
        select 1
        from public.workspaces w
        join public.organizations o on o.id = w.organization_id
        where w.id = ft.workspace_id
          and o.id = ft.organization_id
          and w.slug = 'investor'
          and o.slug = 'reroute'
      )
  ) then
    raise exception 'finance.read ownership scope is invalid';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '18000000-0000-4000-9001-000000000002', true);
do $$
begin
  if (select count(*) from public.financial_summaries where id = '18000000-0000-4000-8000-000000000001') <> 1
    or (select count(*) from public.financial_budgets where id::text like '18000000-0000-4000-8002-%') <> 3
    or (select count(*) from public.financial_cash_flows where id::text like '18000000-0000-4000-8003-%') <> 12 then
    raise exception 'finance.manage user cannot read all staging finance fixtures';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '18000000-0000-4000-9001-000000000003', true);
do $$ begin
  if exists (select 1 from public.financial_summaries where id = '18000000-0000-4000-8000-000000000001') then
    raise exception 'User without finance capability read staging finance data';
  end if;
end $$;

select set_config('request.jwt.claim.sub', '18000000-0000-4000-9001-000000000004', true);
do $$ begin
  if exists (select 1 from public.financial_transactions where id::text like '18000000-0000-4000-8001-%') then
    raise exception 'User from a different workspace read staging finance data';
  end if;
end $$;

select set_config('request.jwt.claim.sub', '18000000-0000-4000-9001-000000000005', true);
do $$ begin
  if exists (select 1 from public.financial_transactions where id::text like '18000000-0000-4000-8001-%') then
    raise exception 'User from a different organization read REROUTE finance data';
  end if;
end $$;

reset role;
rollback;
