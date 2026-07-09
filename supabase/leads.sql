create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  whatsapp text,
  created_at timestamptz default now()
);

do $$
begin
  alter table public.leads
    add constraint leads_email_key unique (email);
exception
  when duplicate_object then null;
end $$;

alter table public.leads enable row level security;

drop policy if exists "Allow public lead inserts" on public.leads;

create policy "Allow public lead inserts"
on public.leads
for insert
to anon
with check (true);

grant usage on schema public to anon;
grant insert on public.leads to anon;
revoke select, update, delete on public.leads from anon;

-- Keep public reads disabled by not creating any SELECT policy for anon.
