-- REROUTE Portal Sprint 3 - profiles RLS validation.
-- Run only in local Supabase after creating fictitious auth.users.

begin;

-- Expected manual fixture:
-- investor01@example.test active profile
-- investor02@example.test active profile
-- suspended@example.test suspended profile
-- admin@example.test active profile with users.view/users.manage capability

-- As investor 01, own profile must be visible.
select set_config('request.jwt.claim.sub', (select id::text from public.profiles where email = 'investor01@example.test'), true);
set local role authenticated;

do $$
begin
  if (select count(*) from public.profiles where email = 'investor01@example.test') <> 1 then
    raise exception 'Investor 01 cannot view own profile';
  end if;

  if exists (select 1 from public.profiles where email = 'investor02@example.test') then
    raise exception 'Investor 01 can view Investor 02 profile';
  end if;
end;
$$;

-- Administrative fields must not be editable by owner.
do $$
begin
  update public.profiles
  set status = 'active'
  where email = 'investor01@example.test';
  raise exception 'Owner changed administrative profile status';
exception when others then
  if sqlerrm not like '%Administrative profile fields%' then
    raise;
  end if;
end;
$$;

rollback;
