-- REROUTE Portal - audit foundation.
-- Do not store passwords, tokens, signed URLs, CPF/RG or secrets in metadata.

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete restrict,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_check check (char_length(action) between 3 and 120),
  constraint audit_logs_entity_type_check check (char_length(entity_type) between 2 and 80),
  constraint audit_logs_metadata_object_check check (jsonb_typeof(metadata) = 'object'),
  constraint audit_logs_metadata_size_check check (pg_column_size(metadata) <= 8192)
);

create index if not exists audit_logs_organization_created_at_idx
on public.audit_logs(organization_id, created_at desc);

create index if not exists audit_logs_actor_created_at_idx
on public.audit_logs(actor_profile_id, created_at desc);

create index if not exists audit_logs_entity_idx
on public.audit_logs(entity_type, entity_id);

create or replace function public.record_audit_log(
  p_organization_id uuid,
  p_actor_profile_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_audit_id uuid;
begin
  if p_metadata is null or jsonb_typeof(p_metadata) <> 'object' or pg_column_size(p_metadata) > 8192 then
    raise exception 'Invalid audit metadata';
  end if;

  insert into public.audit_logs (
    organization_id,
    actor_profile_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    p_organization_id,
    p_actor_profile_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_metadata
  )
  returning id into new_audit_id;

  return new_audit_id;
end;
$$;
