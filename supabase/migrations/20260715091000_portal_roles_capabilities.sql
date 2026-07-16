-- REROUTE Portal - roles, capabilities and assignments.

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null,
  slug text not null,
  description text,
  is_system_role boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_org_slug_key unique (organization_id, slug),
  constraint roles_status_check check (status in ('active', 'disabled', 'archived'))
);

create index if not exists roles_organization_id_idx on public.roles(organization_id);
create index if not exists roles_status_idx on public.roles(status);

drop trigger if exists set_roles_updated_at on public.roles;
create trigger set_roles_updated_at
before update on public.roles
for each row execute function public.set_updated_at();

create table if not exists public.capabilities (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  module text not null,
  action text not null,
  description text,
  created_at timestamptz not null default now(),
  constraint capabilities_key_key unique (key),
  constraint capabilities_key_format_check check (key ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$')
);

create index if not exists capabilities_module_idx on public.capabilities(module);

create table if not exists public.role_capabilities (
  role_id uuid not null references public.roles(id) on delete restrict,
  capability_id uuid not null references public.capabilities(id) on delete restrict,
  granted boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (role_id, capability_id)
);

create index if not exists role_capabilities_capability_id_idx on public.role_capabilities(capability_id);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  role_id uuid not null references public.roles(id) on delete restrict,
  workspace_id uuid references public.workspaces(id) on delete restrict,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_roles_unique unique (profile_id, role_id, workspace_id),
  constraint user_roles_status_check check (status in ('active', 'suspended', 'revoked')),
  constraint user_roles_expiry_check check (expires_at is null or expires_at > assigned_at)
);

-- PostgreSQL treats NULLs as distinct in a unique constraint. This index prevents
-- duplicated global roles where workspace_id is intentionally NULL.
create unique index if not exists user_roles_unique_global_idx
on public.user_roles(profile_id, role_id)
where workspace_id is null;

create index if not exists user_roles_profile_id_idx on public.user_roles(profile_id);
create index if not exists user_roles_role_id_idx on public.user_roles(role_id);
create index if not exists user_roles_workspace_id_idx on public.user_roles(workspace_id);
create index if not exists user_roles_active_idx
on public.user_roles(profile_id, role_id, workspace_id)
where status = 'active';

drop trigger if exists set_user_roles_updated_at on public.user_roles;
create trigger set_user_roles_updated_at
before update on public.user_roles
for each row execute function public.set_updated_at();
