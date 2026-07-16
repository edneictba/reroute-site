-- REROUTE Portal - core database foundation.
-- This migration creates only private Portal foundation objects.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_slug_key unique (slug),
  constraint organizations_status_check check (status in ('active', 'suspended', 'disabled'))
);

drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  display_name text,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  status text not null default 'invited',
  preferred_language text not null default 'pt-BR',
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_status_check check (status in ('invited', 'active', 'suspended', 'disabled')),
  constraint profiles_preferred_language_check check (char_length(preferred_language) between 2 and 12),
  constraint profiles_timezone_check check (char_length(timezone) between 3 and 64)
);

create index if not exists profiles_organization_id_idx on public.profiles(organization_id);
create index if not exists profiles_status_idx on public.profiles(status);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null,
  slug text not null,
  description text,
  status text not null default 'active',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_org_slug_key unique (organization_id, slug),
  constraint workspaces_status_check check (status in ('active', 'suspended', 'disabled', 'archived'))
);

create index if not exists workspaces_organization_id_idx on public.workspaces(organization_id);
create index if not exists workspaces_status_idx on public.workspaces(status);

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'invited',
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_members_unique unique (workspace_id, profile_id),
  constraint workspace_members_status_check check (status in ('active', 'invited', 'suspended', 'removed'))
);

create index if not exists workspace_members_profile_id_idx on public.workspace_members(profile_id);
create index if not exists workspace_members_workspace_id_idx on public.workspace_members(workspace_id);
create index if not exists workspace_members_status_idx on public.workspace_members(status);

drop trigger if exists set_workspace_members_updated_at on public.workspace_members;
create trigger set_workspace_members_updated_at
before update on public.workspace_members
for each row execute function public.set_updated_at();

-- Creates a basic profile after Supabase Auth user creation.
-- It never grants roles or workspace membership automatically.
create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  reroute_organization_id uuid;
begin
  select id
    into reroute_organization_id
  from public.organizations
  where slug = 'reroute'
  limit 1;

  if reroute_organization_id is null then
    return new;
  end if;

  insert into public.profiles (
    id,
    organization_id,
    display_name,
    full_name,
    email,
    status
  )
  values (
    new.id,
    reroute_organization_id,
    nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')), ''),
    lower(nullif(trim(new.email), '')),
    'invited'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user_profile();
