-- REROUTE Portal Sprint 3 - roles and capabilities validation.
-- Requires fictitious role assignments.

begin;

select set_config('request.jwt.claim.sub', (select id::text from public.profiles where email = 'investor01@example.test'), true);
set local role authenticated;

do $$
begin
  if public.has_capability('portal.access') is not true then
    raise exception 'Investor lacks portal.access';
  end if;

  if public.has_capability('investor.view_own') is not true then
    raise exception 'Investor lacks investor.view_own';
  end if;

  if public.has_capability('investor.manage') is true then
    raise exception 'Investor has investor.manage';
  end if;

  if public.has_capability('users.manage') is true then
    raise exception 'Investor has users.manage';
  end if;

  if public.has_capability('capability.missing') is true then
    raise exception 'Missing capability returned true';
  end if;

  if public.has_role('missing_role') is true then
    raise exception 'Missing role returned true';
  end if;
end;
$$;

rollback;
