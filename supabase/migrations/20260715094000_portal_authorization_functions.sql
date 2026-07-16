-- REROUTE Portal - helper functions for RLS and authorization.

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select auth.uid();
$$;

create or replace function public.is_profile_active()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
  );
$$;

create or replace function public.current_profile_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select p.organization_id
  from public.profiles p
  where p.id = auth.uid()
    and p.status = 'active'
  limit 1;
$$;

create or replace function public.is_organization_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.organization_id = p_organization_id
      and p.status = 'active'
  );
$$;

create or replace function public.is_workspace_member(p_workspace_slug text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.workspace_members wm
    join public.workspaces w on w.id = wm.workspace_id
    join public.profiles p on p.id = wm.profile_id
    where p.id = auth.uid()
      and p.status = 'active'
      and wm.status = 'active'
      and w.status = 'active'
      and w.slug = p_workspace_slug
  );
$$;

create or replace function public.has_role(p_role_slug text, p_workspace_slug text default null)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.profiles p on p.id = ur.profile_id
    left join public.workspaces w on w.id = ur.workspace_id
    where p.id = auth.uid()
      and p.status = 'active'
      and r.slug = p_role_slug
      and r.status = 'active'
      and ur.status = 'active'
      and (ur.expires_at is null or ur.expires_at > now())
      and (
        p_workspace_slug is null
        or (
          w.slug = p_workspace_slug
          and w.status = 'active'
          and exists (
            select 1
            from public.workspace_members wm
            where wm.profile_id = p.id
              and wm.workspace_id = w.id
              and wm.status = 'active'
          )
        )
      )
  );
$$;

create or replace function public.has_capability(p_capability_key text, p_workspace_slug text default null)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  with effective_role_capabilities as (
    select rc.granted
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.role_capabilities rc on rc.role_id = r.id
    join public.capabilities c on c.id = rc.capability_id
    join public.profiles p on p.id = ur.profile_id
    left join public.workspaces w on w.id = ur.workspace_id
    where p.id = auth.uid()
      and p.status = 'active'
      and r.status = 'active'
      and ur.status = 'active'
      and c.key = p_capability_key
      and (ur.expires_at is null or ur.expires_at > now())
      and (
        p_workspace_slug is null
        or ur.workspace_id is null
        or (
          w.slug = p_workspace_slug
          and w.status = 'active'
          and exists (
            select 1
            from public.workspace_members wm
            where wm.profile_id = p.id
              and wm.workspace_id = w.id
              and wm.status = 'active'
          )
        )
      )
  )
  select
    exists (select 1 from effective_role_capabilities where granted = true)
    and not exists (select 1 from effective_role_capabilities where granted = false);
$$;

revoke all on function public.current_profile_id() from public;
revoke all on function public.is_profile_active() from public;
revoke all on function public.current_profile_organization_id() from public;
revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.is_workspace_member(text) from public;
revoke all on function public.has_role(text, text) from public;
revoke all on function public.has_capability(text, text) from public;
revoke all on function public.record_audit_log(uuid, uuid, text, text, uuid, jsonb) from public;

grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.is_profile_active() to authenticated;
grant execute on function public.current_profile_organization_id() to authenticated;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.is_workspace_member(text) to authenticated;
grant execute on function public.has_role(text, text) to authenticated;
grant execute on function public.has_capability(text, text) to authenticated;
