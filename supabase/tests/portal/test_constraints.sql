-- REROUTE Portal Sprint 3 - constraints validation.
-- Run only in a local/isolated Supabase database with fictitious test users.

begin;

do $$
declare
  org_id uuid := (select id from public.organizations where slug = 'reroute');
  profile_a uuid := gen_random_uuid();
  profile_b uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  values
    (profile_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'investor01@example.test', 'test', now(), now(), now()),
    (profile_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'investor02@example.test', 'test', now(), now(), now())
  on conflict (id) do nothing;

  update public.profiles set status = 'active' where id in (profile_a, profile_b);

  insert into public.investors (organization_id, profile_id, investor_number, status)
  values (org_id, profile_a, 1, 'active');

  begin
    insert into public.investors (organization_id, profile_id, investor_number, status)
    values (org_id, profile_b, 1, 'active');
    raise exception 'Duplicate investor_number was not blocked';
  exception when unique_violation then null;
  end;

  begin
    insert into public.investors (organization_id, profile_id, investor_number, status)
    values (org_id, profile_b, 21, 'active');
    raise exception 'Out-of-range investor_number was not blocked';
  exception when check_violation then null;
  end;
end;
$$;

rollback;
