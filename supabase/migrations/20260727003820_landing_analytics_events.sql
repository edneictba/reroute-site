begin;

create table public.analytics_events (
  id bigint generated always as identity primary key,
  visitor_id uuid not null,
  session_id uuid not null,
  event_name text not null check (event_name in (
    'page_view',
    'page_duration',
    'scroll_depth',
    'cta_click',
    'form_open',
    'form_start',
    'form_abandon',
    'form_submit'
  )),
  page_path text not null check (
    char_length(page_path) between 1 and 300
    and page_path like '/%'
    and page_path !~ '[?#]'
  ),
  referrer_host text check (referrer_host is null or char_length(referrer_host) <= 253),
  utm_source text check (utm_source is null or char_length(utm_source) <= 100),
  utm_medium text check (utm_medium is null or char_length(utm_medium) <= 100),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 150),
  utm_content text check (utm_content is null or char_length(utm_content) <= 150),
  utm_term text check (utm_term is null or char_length(utm_term) <= 150),
  device_type text not null check (device_type in ('desktop', 'tablet', 'mobile', 'unknown')),
  browser text not null check (char_length(browser) between 1 and 50),
  operating_system text not null check (char_length(operating_system) between 1 and 50),
  language text not null check (char_length(language) between 2 and 20),
  screen_width integer not null check (screen_width between 1 and 20000),
  screen_height integer not null check (screen_height between 1 and 20000),
  duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 86400),
  scroll_percent smallint check (scroll_percent is null or scroll_percent between 0 and 100),
  event_data jsonb not null default '{}'::jsonb check (
    jsonb_typeof(event_data) = 'object'
    and pg_column_size(event_data) <= 4096
  ),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.analytics_events is
  'Pseudonymous first-party product analytics. Never stores lead fields or raw IP addresses.';

alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from public, anon, authenticated;
revoke all on sequence public.analytics_events_id_seq from public, anon, authenticated;
grant select, insert on public.analytics_events to service_role;
grant usage, select on sequence public.analytics_events_id_seq to service_role;

create index analytics_events_occurred_at_idx
  on public.analytics_events (occurred_at desc);
create index analytics_events_event_time_idx
  on public.analytics_events (event_name, occurred_at desc);
create index analytics_events_visitor_time_idx
  on public.analytics_events (visitor_id, occurred_at desc);
create index analytics_events_session_time_idx
  on public.analytics_events (session_id, occurred_at desc);
create index analytics_events_utm_source_idx
  on public.analytics_events (utm_source, occurred_at desc)
  where utm_source is not null;

create view public.analytics_daily_metrics
with (security_invoker = true)
as
select
  (occurred_at at time zone 'America/Sao_Paulo')::date as metric_date,
  count(*) filter (where event_name = 'page_view') as visits,
  count(distinct visitor_id) filter (where event_name = 'page_view') as unique_visitors,
  count(*) filter (where event_name = 'form_open') as form_opens,
  count(*) filter (where event_name = 'form_start') as form_starts,
  count(*) filter (where event_name = 'form_abandon') as form_abandons,
  count(*) filter (where event_name = 'form_submit') as form_submits,
  coalesce(round(avg(duration_seconds) filter (where event_name = 'page_duration')), 0) as average_duration_seconds,
  coalesce(round(avg(scroll_percent) filter (where event_name = 'scroll_depth')), 0) as average_scroll_percent
from public.analytics_events
group by 1;

comment on view public.analytics_daily_metrics is
  'Read-only daily aggregate for the protected REROUTE Analytics dashboard.';

revoke all on public.analytics_daily_metrics from public, anon, authenticated;
grant select on public.analytics_daily_metrics to service_role;

create or replace function public.get_admin_analytics_dashboard(
  p_days integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  safe_days integer := least(greatest(coalesce(p_days, 30), 1), 365);
  since_at timestamptz := now() - make_interval(days => least(greatest(coalesce(p_days, 30), 1), 365));
  visits_count bigint;
  visitors_count bigint;
  form_open_count bigint;
  form_start_count bigint;
  form_abandon_count bigint;
  form_submit_count bigint;
begin
  select
    count(*) filter (where event_name = 'page_view'),
    count(distinct visitor_id) filter (where event_name = 'page_view'),
    count(*) filter (where event_name = 'form_open'),
    count(*) filter (where event_name = 'form_start'),
    count(*) filter (where event_name = 'form_abandon'),
    count(*) filter (where event_name = 'form_submit')
  into
    visits_count,
    visitors_count,
    form_open_count,
    form_start_count,
    form_abandon_count,
    form_submit_count
  from public.analytics_events
  where occurred_at >= since_at;

  return jsonb_build_object(
    'periodDays', safe_days,
    'metrics', jsonb_build_object(
      'visits', visits_count,
      'uniqueVisitors', visitors_count,
      'conversionRate', case
        when visitors_count = 0 then 0
        else round((form_submit_count::numeric / visitors_count::numeric) * 100, 2)
      end
    ),
    'funnel', jsonb_build_array(
      jsonb_build_object('name', 'Visitas', 'value', visits_count),
      jsonb_build_object('name', 'Formulário aberto', 'value', form_open_count),
      jsonb_build_object('name', 'Preenchimento iniciado', 'value', form_start_count),
      jsonb_build_object('name', 'Cadastro enviado', 'value', form_submit_count),
      jsonb_build_object('name', 'Abandono', 'value', form_abandon_count)
    ),
    'trafficSources', (
      select coalesce(jsonb_agg(to_jsonb(source_rows) order by source_rows.total desc), '[]'::jsonb)
      from (
        select
          coalesce(nullif(utm_source, ''), nullif(referrer_host, ''), 'Direto') as name,
          count(*) as total
        from public.analytics_events
        where event_name = 'page_view' and occurred_at >= since_at
        group by 1
        order by 2 desc
        limit 12
      ) source_rows
    ),
    'devices', (
      select coalesce(jsonb_agg(to_jsonb(device_rows) order by device_rows.total desc), '[]'::jsonb)
      from (
        select device_type as name, count(*) as total
        from public.analytics_events
        where event_name = 'page_view' and occurred_at >= since_at
        group by device_type
      ) device_rows
    ),
    'browsers', (
      select coalesce(jsonb_agg(to_jsonb(browser_rows) order by browser_rows.total desc), '[]'::jsonb)
      from (
        select browser as name, count(*) as total
        from public.analytics_events
        where event_name = 'page_view' and occurred_at >= since_at
        group by browser
        order by 2 desc
        limit 10
      ) browser_rows
    ),
    'operatingSystems', (
      select coalesce(jsonb_agg(to_jsonb(os_rows) order by os_rows.total desc), '[]'::jsonb)
      from (
        select operating_system as name, count(*) as total
        from public.analytics_events
        where event_name = 'page_view' and occurred_at >= since_at
        group by operating_system
        order by 2 desc
        limit 10
      ) os_rows
    ),
    'topEvents', (
      select coalesce(jsonb_agg(to_jsonb(event_rows) order by event_rows.total desc), '[]'::jsonb)
      from (
        select event_name as name, count(*) as total
        from public.analytics_events
        where occurred_at >= since_at
        group by event_name
        order by 2 desc
      ) event_rows
    ),
    'daily', (
      select coalesce(jsonb_agg(to_jsonb(daily_rows) order by daily_rows.metric_date), '[]'::jsonb)
      from (
        select *
        from public.analytics_daily_metrics
        where metric_date >= (now() at time zone 'America/Sao_Paulo')::date - (safe_days - 1)
      ) daily_rows
    )
  );
end;
$$;

revoke all on function public.get_admin_analytics_dashboard(integer)
  from public, anon, authenticated;
grant execute on function public.get_admin_analytics_dashboard(integer)
  to service_role;

commit;
