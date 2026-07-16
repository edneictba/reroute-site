-- REROUTE Portal Sprint 3 - workspace access validation.
-- Requires fictitious profiles and workspace_members.

begin;

select set_config('request.jwt.claim.sub', (select id::text from public.profiles where email = 'investor01@example.test'), true);
set local role authenticated;

do $$
begin
  if public.is_workspace_member('investor') is not true then
    raise exception 'Investor 01 is not recognized as investor workspace member';
  end if;

  if public.is_workspace_member('admin') is true then
    raise exception 'Investor 01 is recognized as admin workspace member';
  end if;

  if public.is_workspace_member('finance') is true then
    raise exception 'Investor 01 is recognized as finance workspace member';
  end if;

  if public.is_workspace_member('missing_workspace') is true then
    raise exception 'Missing workspace returned true';
  end if;
end;
$$;

rollback;
