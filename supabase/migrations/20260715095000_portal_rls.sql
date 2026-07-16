-- REROUTE Portal - Row Level Security policies.
-- Policies deliberately avoid public read/write access outside authenticated Portal users.

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.roles enable row level security;
alter table public.capabilities enable row level security;
alter table public.role_capabilities enable row level security;
alter table public.user_roles enable row level security;
alter table public.investors enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.organizations from anon, authenticated;
revoke all on public.profiles from anon, authenticated;
revoke all on public.workspaces from anon, authenticated;
revoke all on public.workspace_members from anon, authenticated;
revoke all on public.roles from anon, authenticated;
revoke all on public.capabilities from anon, authenticated;
revoke all on public.role_capabilities from anon, authenticated;
revoke all on public.user_roles from anon, authenticated;
revoke all on public.investors from anon, authenticated;
revoke all on public.audit_logs from anon, authenticated;

grant usage on schema public to authenticated;
grant select on public.organizations to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;
grant select on public.roles to authenticated;
grant select on public.capabilities to authenticated;
grant select on public.role_capabilities to authenticated;
grant select on public.user_roles to authenticated;
grant select on public.investors to authenticated;
grant select on public.audit_logs to authenticated;
grant insert, update on public.organizations to authenticated;
grant insert, update on public.workspaces to authenticated;
grant insert, update on public.workspace_members to authenticated;
grant insert, update on public.roles to authenticated;
grant insert, update on public.role_capabilities to authenticated;
grant insert, update on public.user_roles to authenticated;
grant insert, update on public.investors to authenticated;

create or replace function public.enforce_profile_update_scope()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if public.has_capability('users.manage') then
    return new;
  end if;

  if new.id <> auth.uid() then
    raise exception 'Profile update not allowed';
  end if;

  if new.organization_id is distinct from old.organization_id
    or new.email is distinct from old.email
    or new.status is distinct from old.status then
    raise exception 'Administrative profile fields cannot be changed by the profile owner';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_profile_update_scope on public.profiles;
create trigger enforce_profile_update_scope
before update on public.profiles
for each row execute function public.enforce_profile_update_scope();

revoke all on function public.enforce_profile_update_scope() from public;

drop policy if exists organizations_select_member_or_admin on public.organizations;
create policy organizations_select_member_or_admin
on public.organizations
for select
to authenticated
using (
  public.is_organization_member(id)
  or public.has_capability('users.manage')
);

drop policy if exists organizations_manage_admin on public.organizations;
create policy organizations_manage_admin
on public.organizations
for all
to authenticated
using (public.has_capability('users.manage'))
with check (public.has_capability('users.manage'));

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.has_capability('users.view')
  or public.has_capability('users.manage')
);

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
on public.profiles
for update
to authenticated
using (
  (id = auth.uid() and status = 'active')
  or public.has_capability('users.manage')
)
with check (
  (id = auth.uid() and organization_id = public.current_profile_organization_id() and status = 'active')
  or public.has_capability('users.manage')
);

drop policy if exists workspaces_select_member_or_admin on public.workspaces;
create policy workspaces_select_member_or_admin
on public.workspaces
for select
to authenticated
using (
  (
    status = 'active'
    and exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = workspaces.id
        and wm.profile_id = auth.uid()
        and wm.status = 'active'
    )
  )
  or public.has_capability('workspaces.view')
  or public.has_capability('workspaces.manage')
);

drop policy if exists workspaces_manage_admin on public.workspaces;
create policy workspaces_manage_admin
on public.workspaces
for all
to authenticated
using (public.has_capability('workspaces.manage'))
with check (public.has_capability('workspaces.manage'));

drop policy if exists workspace_members_select_own_or_admin on public.workspace_members;
create policy workspace_members_select_own_or_admin
on public.workspace_members
for select
to authenticated
using (
  profile_id = auth.uid()
  or public.has_capability('workspaces.view')
  or public.has_capability('workspaces.manage')
);

drop policy if exists workspace_members_manage_admin on public.workspace_members;
create policy workspace_members_manage_admin
on public.workspace_members
for all
to authenticated
using (public.has_capability('workspaces.manage'))
with check (public.has_capability('workspaces.manage'));

drop policy if exists roles_select_own_or_admin on public.roles;
create policy roles_select_own_or_admin
on public.roles
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.role_id = roles.id
      and ur.profile_id = auth.uid()
      and ur.status = 'active'
      and (ur.expires_at is null or ur.expires_at > now())
  )
  or public.has_capability('roles.view')
  or public.has_capability('roles.manage')
);

drop policy if exists roles_manage_admin on public.roles;
create policy roles_manage_admin
on public.roles
for all
to authenticated
using (public.has_capability('roles.manage'))
with check (public.has_capability('roles.manage'));

drop policy if exists capabilities_select_effective_or_admin on public.capabilities;
create policy capabilities_select_effective_or_admin
on public.capabilities
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    join public.role_capabilities rc on rc.role_id = ur.role_id
    where ur.profile_id = auth.uid()
      and ur.status = 'active'
      and (ur.expires_at is null or ur.expires_at > now())
      and rc.capability_id = capabilities.id
      and rc.granted = true
  )
  or public.has_capability('roles.view')
  or public.has_capability('roles.manage')
);

drop policy if exists role_capabilities_select_own_or_admin on public.role_capabilities;
create policy role_capabilities_select_own_or_admin
on public.role_capabilities
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.profile_id = auth.uid()
      and ur.role_id = role_capabilities.role_id
      and ur.status = 'active'
      and (ur.expires_at is null or ur.expires_at > now())
  )
  or public.has_capability('roles.view')
  or public.has_capability('roles.manage')
);

drop policy if exists role_capabilities_manage_admin on public.role_capabilities;
create policy role_capabilities_manage_admin
on public.role_capabilities
for all
to authenticated
using (public.has_capability('roles.manage'))
with check (public.has_capability('roles.manage'));

drop policy if exists user_roles_select_own_or_admin on public.user_roles;
create policy user_roles_select_own_or_admin
on public.user_roles
for select
to authenticated
using (
  profile_id = auth.uid()
  or public.has_capability('roles.view')
  or public.has_capability('roles.manage')
);

drop policy if exists user_roles_manage_admin on public.user_roles;
create policy user_roles_manage_admin
on public.user_roles
for all
to authenticated
using (public.has_capability('roles.manage'))
with check (
  public.has_capability('roles.manage')
  and profile_id <> auth.uid()
);

drop policy if exists investors_select_own_or_admin on public.investors;
create policy investors_select_own_or_admin
on public.investors
for select
to authenticated
using (
  profile_id = auth.uid()
  or public.has_capability('investor.view_general')
  or public.has_capability('investor.manage')
);

drop policy if exists investors_manage_admin on public.investors;
create policy investors_manage_admin
on public.investors
for all
to authenticated
using (public.has_capability('investor.manage'))
with check (public.has_capability('investor.manage'));

drop policy if exists audit_logs_select_authorized on public.audit_logs;
create policy audit_logs_select_authorized
on public.audit_logs
for select
to authenticated
using (
  public.has_capability('audit.view')
  or public.has_capability('audit.export')
);

-- Inserts are reserved for controlled server-side/admin flows. No update/delete
-- policy is created, so ordinary users cannot alter audit history.
drop policy if exists audit_logs_insert_authorized on public.audit_logs;
create policy audit_logs_insert_authorized
on public.audit_logs
for insert
to authenticated
with check (public.has_capability('audit.view'));
