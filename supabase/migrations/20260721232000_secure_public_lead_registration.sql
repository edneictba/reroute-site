begin;

do $$
begin
  if exists (
    select 1
    from public.leads
    where name is null
       or email is null
       or whatsapp is null
       or created_at is null
       or char_length(btrim(name)) not between 2 and 80
       or name ~ '[<>]'
       or char_length(email) > 254
       or email <> lower(email)
       or email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
       or whatsapp !~ '^\+[1-9][0-9]{7,14}$'
  ) then
    raise exception 'Existing leads violate the new security constraints. Correct them before applying this migration.';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from public.leads
    group by lower(email)
    having count(*) > 1
  ) then
    raise exception 'Existing leads contain duplicated normalized e-mails. Correct them before applying this migration.';
  end if;
end
$$;

alter table public.leads
  alter column name set not null,
  alter column email set not null,
  alter column whatsapp set not null,
  alter column created_at set not null;

do $$
begin
  alter table public.leads
    add constraint leads_name_length_check
    check (char_length(btrim(name)) between 2 and 80 and name !~ '[<>]');
exception when duplicate_object then null;
end
$$;

do $$
begin
  alter table public.leads
    add constraint leads_email_format_check
    check (
      char_length(email) <= 254
      and email = lower(email)
      and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
    );
exception when duplicate_object then null;
end
$$;

do $$
begin
  alter table public.leads
    add constraint leads_whatsapp_e164_check
    check (
      char_length(whatsapp) between 9 and 16
      and whatsapp ~ '^\+[1-9][0-9]{7,14}$'
    );
exception when duplicate_object then null;
end
$$;

create unique index if not exists leads_email_normalized_key
  on public.leads (lower(email));

create table if not exists public.lead_submission_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null check (char_length(ip_hash) = 64),
  email_hash text not null check (char_length(email_hash) = 64),
  created_at timestamptz not null default now()
);

alter table public.lead_submission_attempts enable row level security;
revoke all on public.lead_submission_attempts from public, anon, authenticated;
revoke all on sequence public.lead_submission_attempts_id_seq from public, anon, authenticated;

create index if not exists lead_submission_attempts_ip_window_idx
  on public.lead_submission_attempts (ip_hash, created_at desc);

create index if not exists lead_submission_attempts_email_window_idx
  on public.lead_submission_attempts (email_hash, created_at desc);

create or replace function public.register_public_lead(
  p_name text,
  p_email text,
  p_whatsapp text,
  p_ip_hash text,
  p_email_hash text
)
returns table(result text)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  inserted_id uuid;
  ip_attempts integer;
  email_attempts integer;
begin
  if p_name is null
    or char_length(btrim(p_name)) not between 2 and 80
    or p_name ~ '[<>]'
    or p_email is null
    or char_length(p_email) > 254
    or p_email <> lower(p_email)
    or p_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
    or p_whatsapp is null
    or p_whatsapp !~ '^\+[1-9][0-9]{7,14}$'
    or char_length(p_ip_hash) <> 64
    or char_length(p_email_hash) <> 64
  then
    raise exception 'Invalid registration payload';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_ip_hash, 0));
  perform pg_advisory_xact_lock(hashtextextended(p_email_hash, 1));

  delete from public.lead_submission_attempts
  where created_at < now() - interval '2 days';

  select count(*) into ip_attempts
  from public.lead_submission_attempts
  where ip_hash = p_ip_hash
    and created_at >= now() - interval '15 minutes';

  select count(*) into email_attempts
  from public.lead_submission_attempts
  where email_hash = p_email_hash
    and created_at >= now() - interval '24 hours';

  if ip_attempts >= 5 or email_attempts >= 3 then
    return query select 'rate_limited'::text;
    return;
  end if;

  insert into public.lead_submission_attempts (ip_hash, email_hash)
  values (p_ip_hash, p_email_hash);

  insert into public.leads (name, email, whatsapp)
  values (btrim(p_name), lower(p_email), p_whatsapp)
  on conflict do nothing
  returning id into inserted_id;

  return query select case when inserted_id is null then 'existing' else 'created' end::text;
end;
$$;

revoke all on function public.register_public_lead(text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.register_public_lead(text, text, text, text, text)
  to service_role;

comment on table public.lead_submission_attempts is
  'Hashed anti-abuse counters cleaned after two days during registration and inaccessible to browser roles.';

commit;
