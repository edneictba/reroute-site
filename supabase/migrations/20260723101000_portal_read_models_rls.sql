-- REROUTE Portal Sprint 1A - read-only RLS for published projections.

alter table public.portal_projects enable row level security;
alter table public.portal_updates enable row level security;
alter table public.portal_documents enable row level security;
alter table public.portal_roadmap enable row level security;
alter table public.portal_investors enable row level security;

revoke all on public.portal_projects from anon, authenticated;
revoke all on public.portal_updates from anon, authenticated;
revoke all on public.portal_documents from anon, authenticated;
revoke all on public.portal_roadmap from anon, authenticated;
revoke all on public.portal_investors from anon, authenticated;

grant select on public.portal_projects to authenticated;
grant select on public.portal_updates to authenticated;
grant select on public.portal_documents to authenticated;
grant select on public.portal_roadmap to authenticated;
grant select on public.portal_investors to authenticated;

create or replace function public.can_read_portal_workspace(
  p_organization_id uuid,
  p_workspace_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.workspaces w
    join public.workspace_members wm
      on wm.workspace_id = w.id
     and wm.profile_id = auth.uid()
     and wm.status = 'active'
    where w.id = p_workspace_id
      and w.organization_id = p_organization_id
      and w.status = 'active'
      and p_organization_id = public.current_profile_organization_id()
      and public.has_capability('portal.access', w.slug)
      and public.has_capability('workspace.access', w.slug)
  );
$$;

revoke all on function public.can_read_portal_workspace(uuid, uuid) from public;
grant execute on function public.can_read_portal_workspace(uuid, uuid) to authenticated;

drop policy if exists portal_projects_select_authorized on public.portal_projects;
create policy portal_projects_select_authorized
on public.portal_projects for select to authenticated
using (
  publication_status = 'published'
  and public.can_read_portal_workspace(organization_id, workspace_id)
);

drop policy if exists portal_updates_select_authorized on public.portal_updates;
create policy portal_updates_select_authorized
on public.portal_updates for select to authenticated
using (
  publication_status = 'published'
  and public.can_read_portal_workspace(organization_id, workspace_id)
);

drop policy if exists portal_documents_select_authorized on public.portal_documents;
create policy portal_documents_select_authorized
on public.portal_documents for select to authenticated
using (
  publication_status = 'published'
  and public.can_read_portal_workspace(organization_id, workspace_id)
);

drop policy if exists portal_roadmap_select_authorized on public.portal_roadmap;
create policy portal_roadmap_select_authorized
on public.portal_roadmap for select to authenticated
using (
  publication_status = 'published'
  and public.can_read_portal_workspace(organization_id, workspace_id)
);

drop policy if exists portal_investors_select_authorized on public.portal_investors;
create policy portal_investors_select_authorized
on public.portal_investors for select to authenticated
using (
  publication_status = 'published'
  and public.can_read_portal_workspace(organization_id, workspace_id)
  and (
    profile_id = auth.uid()
    or (
      profile_id is null
      and (
        public.has_capability('investor.view_general')
        or public.has_capability('investor.manage')
      )
    )
  )
);
