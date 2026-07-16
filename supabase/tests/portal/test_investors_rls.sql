-- REROUTE Portal Sprint 3 - investors RLS validation.
-- Requires fictitious Investor 01, Investor 02 and Admin fixtures.

begin;

select set_config('request.jwt.claim.sub', (select id::text from public.profiles where email = 'investor01@example.test'), true);
set local role authenticated;

do $$
begin
  if (select count(*) from public.investors where profile_id = auth.uid()) <> 1 then
    raise exception 'Investor 01 cannot view own investor record';
  end if;

  if exists (
    select 1
    from public.investors i
    join public.profiles p on p.id = i.profile_id
    where p.email = 'investor02@example.test'
  ) then
    raise exception 'Investor 01 can view Investor 02';
  end if;

  update public.investors set investor_number = 2 where profile_id = auth.uid();
  if found then
    raise exception 'Investor 01 updated investor_number';
  end if;
end;
$$;

rollback;
