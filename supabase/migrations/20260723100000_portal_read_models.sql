-- REROUTE Portal Sprint 1A - immutable, versioned read models.
-- These tables contain published projections only. No demonstration data is inserted.

create table if not exists public.portal_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  payload jsonb not null,
  version integer not null default 1,
  publication_status text not null default 'draft',
  published_at timestamptz,
  published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_projects_scope_version_key unique (organization_id, workspace_id, version),
  constraint portal_projects_payload_object_check check (jsonb_typeof(payload) = 'object'),
  constraint portal_projects_version_check check (version > 0),
  constraint portal_projects_status_check check (publication_status in ('draft', 'published', 'archived')),
  constraint portal_projects_published_at_check check (publication_status <> 'published' or published_at is not null)
);

create table if not exists public.portal_updates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  payload jsonb not null,
  version integer not null default 1,
  publication_status text not null default 'draft',
  published_at timestamptz,
  published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_updates_scope_version_key unique (organization_id, workspace_id, version),
  constraint portal_updates_payload_object_check check (jsonb_typeof(payload) = 'object'),
  constraint portal_updates_version_check check (version > 0),
  constraint portal_updates_status_check check (publication_status in ('draft', 'published', 'archived')),
  constraint portal_updates_published_at_check check (publication_status <> 'published' or published_at is not null)
);

create table if not exists public.portal_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  payload jsonb not null,
  version integer not null default 1,
  publication_status text not null default 'draft',
  published_at timestamptz,
  published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_documents_scope_version_key unique (organization_id, workspace_id, version),
  constraint portal_documents_payload_object_check check (jsonb_typeof(payload) = 'object'),
  constraint portal_documents_version_check check (version > 0),
  constraint portal_documents_status_check check (publication_status in ('draft', 'published', 'archived')),
  constraint portal_documents_published_at_check check (publication_status <> 'published' or published_at is not null)
);

create table if not exists public.portal_roadmap (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  payload jsonb not null,
  version integer not null default 1,
  publication_status text not null default 'draft',
  published_at timestamptz,
  published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_roadmap_scope_version_key unique (organization_id, workspace_id, version),
  constraint portal_roadmap_payload_object_check check (jsonb_typeof(payload) = 'object'),
  constraint portal_roadmap_version_check check (version > 0),
  constraint portal_roadmap_status_check check (publication_status in ('draft', 'published', 'archived')),
  constraint portal_roadmap_published_at_check check (publication_status <> 'published' or published_at is not null)
);

create table if not exists public.portal_investors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  profile_id uuid references public.profiles(id) on delete restrict,
  payload jsonb not null,
  version integer not null default 1,
  publication_status text not null default 'draft',
  published_at timestamptz,
  published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_investors_scope_profile_version_key unique nulls not distinct (
    organization_id, workspace_id, profile_id, version
  ),
  constraint portal_investors_payload_object_check check (jsonb_typeof(payload) = 'object'),
  constraint portal_investors_version_check check (version > 0),
  constraint portal_investors_status_check check (publication_status in ('draft', 'published', 'archived')),
  constraint portal_investors_published_at_check check (publication_status <> 'published' or published_at is not null)
);

create index if not exists portal_projects_scope_published_idx
on public.portal_projects(organization_id, workspace_id, publication_status, published_at desc);

create index if not exists portal_updates_scope_published_idx
on public.portal_updates(organization_id, workspace_id, publication_status, published_at desc);

create index if not exists portal_documents_scope_published_idx
on public.portal_documents(organization_id, workspace_id, publication_status, published_at desc);

create index if not exists portal_roadmap_scope_published_idx
on public.portal_roadmap(organization_id, workspace_id, publication_status, published_at desc);

create index if not exists portal_investors_scope_profile_published_idx
on public.portal_investors(organization_id, workspace_id, profile_id, publication_status, published_at desc);

drop trigger if exists set_portal_projects_updated_at on public.portal_projects;
create trigger set_portal_projects_updated_at before update on public.portal_projects
for each row execute function public.set_updated_at();

drop trigger if exists set_portal_updates_updated_at on public.portal_updates;
create trigger set_portal_updates_updated_at before update on public.portal_updates
for each row execute function public.set_updated_at();

drop trigger if exists set_portal_documents_updated_at on public.portal_documents;
create trigger set_portal_documents_updated_at before update on public.portal_documents
for each row execute function public.set_updated_at();

drop trigger if exists set_portal_roadmap_updated_at on public.portal_roadmap;
create trigger set_portal_roadmap_updated_at before update on public.portal_roadmap
for each row execute function public.set_updated_at();

drop trigger if exists set_portal_investors_updated_at on public.portal_investors;
create trigger set_portal_investors_updated_at before update on public.portal_investors
for each row execute function public.set_updated_at();
