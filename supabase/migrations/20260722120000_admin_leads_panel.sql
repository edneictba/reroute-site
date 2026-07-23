begin;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  authorized_at timestamptz not null default now(),
  authorized_by uuid references auth.users(id) on delete set null
);

alter table public.admin_users enable row level security;
revoke all on public.admin_users from public, anon, authenticated;

create table if not exists public.admin_access_logs (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in (
    'login_success', 'login_failure', 'access_denied', 'session_expired', 'logout'
  )),
  user_id uuid,
  email_hash text check (email_hash is null or char_length(email_hash) = 64),
  ip_hash text not null check (char_length(ip_hash) = 64),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_access_logs enable row level security;
revoke all on public.admin_access_logs from public, anon, authenticated;
revoke all on sequence public.admin_access_logs_id_seq from public, anon, authenticated;

create index if not exists admin_access_logs_created_at_idx
  on public.admin_access_logs (created_at desc);

create table if not exists public.admin_login_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null check (char_length(ip_hash) = 64),
  email_hash text not null check (char_length(email_hash) = 64),
  created_at timestamptz not null default now()
);

alter table public.admin_login_attempts enable row level security;
revoke all on public.admin_login_attempts from public, anon, authenticated;
revoke all on sequence public.admin_login_attempts_id_seq from public, anon, authenticated;

create index if not exists admin_login_attempts_ip_idx
  on public.admin_login_attempts (ip_hash, created_at desc);
create index if not exists admin_login_attempts_email_idx
  on public.admin_login_attempts (email_hash, created_at desc);

create or replace function public.check_admin_login_rate_limit(
  p_ip_hash text,
  p_email_hash text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  ip_attempts integer;
  email_attempts integer;
begin
  if char_length(p_ip_hash) <> 64 or char_length(p_email_hash) <> 64 then
    raise exception 'Invalid rate limit identifier';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_ip_hash, 2));
  perform pg_advisory_xact_lock(hashtextextended(p_email_hash, 3));

  delete from public.admin_login_attempts
  where created_at < now() - interval '2 days';

  select count(*) into ip_attempts
  from public.admin_login_attempts
  where ip_hash = p_ip_hash
    and created_at >= now() - interval '15 minutes';

  select count(*) into email_attempts
  from public.admin_login_attempts
  where email_hash = p_email_hash
    and created_at >= now() - interval '1 hour';

  if ip_attempts >= 5 or email_attempts >= 10 then
    return false;
  end if;

  insert into public.admin_login_attempts (ip_hash, email_hash)
  values (p_ip_hash, p_email_hash);

  return true;
end;
$$;

create or replace function public.record_admin_access_event(
  p_event_type text,
  p_user_id uuid,
  p_email_hash text,
  p_ip_hash text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_event_type not in ('login_success', 'login_failure', 'access_denied', 'session_expired', 'logout')
    or char_length(p_ip_hash) <> 64
    or (p_email_hash is not null and char_length(p_email_hash) <> 64)
    or jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object'
  then
    raise exception 'Invalid audit event';
  end if;

  insert into public.admin_access_logs (event_type, user_id, email_hash, ip_hash, metadata)
  values (p_event_type, p_user_id, p_email_hash, p_ip_hash, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

create or replace function public.get_admin_leads_dashboard(
  p_search text default '',
  p_page integer default 1,
  p_page_size integer default 25
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  normalized_search text := left(btrim(coalesce(p_search, '')), 100);
  safe_page integer := greatest(coalesce(p_page, 1), 1);
  safe_page_size integer := least(greatest(coalesce(p_page_size, 25), 10), 100);
  today_sp date := (now() at time zone 'America/Sao_Paulo')::date;
  filtered_total bigint;
  result_rows jsonb;
  daily_rows jsonb;
begin
  select count(*) into filtered_total
  from public.leads l
  where normalized_search = ''
     or l.name ilike '%' || normalized_search || '%'
     or l.email ilike '%' || normalized_search || '%'
     or l.whatsapp ilike '%' || normalized_search || '%';

  select coalesce(jsonb_agg(to_jsonb(page_rows) order by page_rows.created_at desc), '[]'::jsonb)
  into result_rows
  from (
    select l.id, l.name, l.email, l.whatsapp, l.created_at
    from public.leads l
    where normalized_search = ''
       or l.name ilike '%' || normalized_search || '%'
       or l.email ilike '%' || normalized_search || '%'
       or l.whatsapp ilike '%' || normalized_search || '%'
    order by l.created_at desc
    limit safe_page_size
    offset (safe_page - 1) * safe_page_size
  ) page_rows;

  select coalesce(jsonb_agg(jsonb_build_object('date', days.day, 'count', coalesce(counts.total, 0)) order by days.day), '[]'::jsonb)
  into daily_rows
  from generate_series(today_sp - 29, today_sp, interval '1 day') as days(day)
  left join (
    select (created_at at time zone 'America/Sao_Paulo')::date as day, count(*) as total
    from public.leads
    where created_at >= ((today_sp - 29)::timestamp at time zone 'America/Sao_Paulo')
    group by 1
  ) counts on counts.day = days.day::date;

  return jsonb_build_object(
    'metrics', jsonb_build_object(
      'total', (select count(*) from public.leads),
      'today', (select count(*) from public.leads where (created_at at time zone 'America/Sao_Paulo')::date = today_sp),
      'last7Days', (select count(*) from public.leads where created_at >= now() - interval '7 days'),
      'currentMonth', (select count(*) from public.leads where date_trunc('month', created_at at time zone 'America/Sao_Paulo') = date_trunc('month', today_sp::timestamp))
    ),
    'daily', daily_rows,
    'leads', result_rows,
    'pagination', jsonb_build_object(
      'page', safe_page,
      'pageSize', safe_page_size,
      'total', filtered_total,
      'totalPages', greatest(ceil(filtered_total::numeric / safe_page_size)::integer, 1)
    )
  );
end;
$$;

create or replace function public.export_admin_leads()
returns table(name text, email text, whatsapp text, created_at timestamptz)
language sql
security definer
set search_path = pg_catalog, public
as $$
  select l.name, l.email, l.whatsapp, l.created_at
  from public.leads l
  order by l.created_at desc;
$$;

revoke all on function public.check_admin_login_rate_limit(text, text) from public, anon, authenticated;
revoke all on function public.record_admin_access_event(text, uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.get_admin_leads_dashboard(text, integer, integer) from public, anon, authenticated;
revoke all on function public.export_admin_leads() from public, anon, authenticated;

grant execute on function public.check_admin_login_rate_limit(text, text) to service_role;
grant execute on function public.record_admin_access_event(text, uuid, text, text, jsonb) to service_role;
grant execute on function public.get_admin_leads_dashboard(text, integer, integer) to service_role;
grant execute on function public.export_admin_leads() to service_role;

commit;
