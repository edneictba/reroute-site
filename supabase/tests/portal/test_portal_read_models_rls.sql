-- REROUTE Portal Sprint 1A - read-model RLS scenarios.
-- Run only in an isolated local or staging Supabase database after all Portal migrations.

begin;

do $$
declare
  org_id uuid := (select id from public.organizations where slug = 'reroute');
  workspace_id uuid := (
    select id from public.workspaces where organization_id = org_id and slug = 'investor'
  );
  investor_user_id uuid := '1a000000-0000-4000-8000-000000000001';
  employee_user_id uuid := '1a000000-0000-4000-8000-000000000002';
begin
  if org_id is null or workspace_id is null then
    raise exception 'Required Portal fixtures are missing';
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at
  )
  values
    (investor_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'read-model-investor@example.test', 'test', now(), now(), now()),
    (employee_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'read-model-employee@example.test', 'test', now(), now(), now())
  on conflict (id) do nothing;

  update public.profiles
  set status = 'active'
  where id in (investor_user_id, employee_user_id);

  insert into public.workspace_members (workspace_id, profile_id, status, joined_at)
  values
    (workspace_id, investor_user_id, 'active', now()),
    (workspace_id, employee_user_id, 'active', now())
  on conflict (workspace_id, profile_id) do update set status = 'active';

  insert into public.user_roles (profile_id, role_id, workspace_id, status)
  values
    (investor_user_id, (select id from public.roles where organization_id = org_id and slug = 'investor'), workspace_id, 'active'),
    (employee_user_id, (select id from public.roles where organization_id = org_id and slug = 'employee'), workspace_id, 'active')
  on conflict (profile_id, role_id, workspace_id) do update set status = 'active';

  insert into public.portal_projects (
    id, organization_id, workspace_id, payload, version, publication_status, published_at
  ) values (
    '1a000000-0000-4000-8100-000000000001', org_id, workspace_id,
    '{"projects":[]}'::jsonb, 1, 'published', now()
  );

  insert into public.portal_updates (
    id, organization_id, workspace_id, payload, version, publication_status, published_at
  ) values (
    '1a000000-0000-4000-8200-000000000001', org_id, workspace_id,
    '{"updates":[]}'::jsonb, 1, 'published', now()
  );

  insert into public.portal_documents (
    id, organization_id, workspace_id, payload, version, publication_status, published_at
  ) values (
    '1a000000-0000-4000-8300-000000000001', org_id, workspace_id,
    '{"documents":[]}'::jsonb, 1, 'published', now()
  );

  insert into public.portal_roadmap (
    id, organization_id, workspace_id, payload, version, publication_status, published_at
  ) values (
    '1a000000-0000-4000-8400-000000000001', org_id, workspace_id,
    '{"milestones":[]}'::jsonb, 1, 'published', now()
  );

  insert into public.portal_investors (
    id, organization_id, workspace_id, profile_id, payload, version, publication_status, published_at
  ) values
    ('1a000000-0000-4000-8500-000000000001', org_id, workspace_id, investor_user_id,
     '{"summary":{"paidCapital":0}}'::jsonb, 1, 'published', now()),
    ('1a000000-0000-4000-8500-000000000002', org_id, workspace_id, null,
     '{"summary":{"paidCapital":0}}'::jsonb, 1, 'published', now());
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '1a000000-0000-4000-8000-000000000001', true);

do $$
begin
  if (select count(*) from public.portal_projects) <> 1
    or (select count(*) from public.portal_updates) <> 1
    or (select count(*) from public.portal_documents) <> 1
    or (select count(*) from public.portal_roadmap) <> 1 then
    raise exception 'Authorized workspace member cannot read published Portal models';
  end if;

  if (select count(*) from public.portal_investors) <> 1
    or not exists (select 1 from public.portal_investors where profile_id = auth.uid()) then
    raise exception 'Investor own-profile isolation failed';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '1a000000-0000-4000-8000-000000000002', true);

do $$
begin
  if exists (select 1 from public.portal_investors) then
    raise exception 'User without investor capability read investor models';
  end if;
end;
$$;

reset role;
rollback;
