create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80 and name !~ '[<>]'),
  email text not null unique check (
    char_length(email) <= 254
    and email = lower(email)
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
  ),
  whatsapp text not null check (
    char_length(whatsapp) between 9 and 16
    and whatsapp ~ '^\+[1-9][0-9]{7,14}$'
  ),
  created_at timestamptz not null default now()
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
revoke all on public.leads from public, anon, authenticated;

-- Public registration is accepted only by the server-side register_public_lead RPC.
