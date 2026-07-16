-- REROUTE Portal Sprint 3 - seed idempotency validation.
-- Run only in a local/isolated Supabase database after applying all Portal migrations.

begin;

\i ../../migrations/20260715100000_portal_seed.sql
\i ../../migrations/20260715100000_portal_seed.sql

do $$
declare
  org_count integer;
  workspace_count integer;
  role_count integer;
  capability_count integer;
  duplicate_role_capabilities integer;
begin
  select count(*) into org_count from public.organizations where slug = 'reroute';
  select count(*) into workspace_count from public.workspaces where organization_id = (select id from public.organizations where slug = 'reroute');
  select count(*) into role_count from public.roles where organization_id = (select id from public.organizations where slug = 'reroute');
  select count(*) into capability_count from public.capabilities;

  select count(*)
    into duplicate_role_capabilities
  from (
    select role_id, capability_id, count(*)
    from public.role_capabilities
    group by role_id, capability_id
    having count(*) > 1
  ) duplicates;

  if org_count <> 1 then raise exception 'Expected one REROUTE organization, got %', org_count; end if;
  if workspace_count <> 6 then raise exception 'Expected 6 workspaces, got %', workspace_count; end if;
  if role_count <> 10 then raise exception 'Expected 10 roles, got %', role_count; end if;
  if capability_count <> 15 then raise exception 'Expected 15 capabilities, got %', capability_count; end if;
  if duplicate_role_capabilities <> 0 then raise exception 'Duplicate role_capabilities found'; end if;
end;
$$;

rollback;
