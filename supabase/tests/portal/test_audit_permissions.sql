-- REROUTE Portal Sprint 3 - audit permissions validation.
-- Requires fictitious admin/auditor and ordinary investor fixtures.

begin;

select set_config('request.jwt.claim.sub', (select id::text from public.profiles where email = 'investor01@example.test'), true);
set local role authenticated;

do $$
begin
  if exists (select 1 from public.audit_logs limit 1) then
    raise exception 'Ordinary investor can view audit logs';
  end if;

  update public.audit_logs set metadata = '{}'::jsonb;
  if found then
    raise exception 'Ordinary investor updated audit logs';
  end if;

  delete from public.audit_logs;
  if found then
    raise exception 'Ordinary investor deleted audit logs';
  end if;
end;
$$;

rollback;
