-- REROUTE Portal Sprint 17 - capability seed only.
-- No financial records or personal data are inserted.

insert into public.capabilities (key, module, action, description)
values
  ('finance.read', 'finance', 'read', 'Visualizar dados financeiros do workspace autorizado.'),
  ('finance.manage', 'finance', 'manage', 'Gerenciar dados financeiros do workspace autorizado.')
on conflict (key) do update
set module = excluded.module,
    action = excluded.action,
    description = excluded.description;

with role_capability_seed(role_slug, capability_key) as (
  values
    ('super_admin', 'finance.read'),
    ('super_admin', 'finance.manage'),
    ('admin', 'finance.read'),
    ('accountant', 'finance.read'),
    ('accountant', 'finance.manage'),
    ('investor', 'finance.read'),
    ('auditor', 'finance.read')
),
org as (
  select id from public.organizations where slug = 'reroute'
)
insert into public.role_capabilities (role_id, capability_id, granted)
select r.id, c.id, true
from role_capability_seed seed
join org on true
join public.roles r on r.organization_id = org.id and r.slug = seed.role_slug
join public.capabilities c on c.key = seed.capability_key
on conflict (role_id, capability_id) do update
set granted = excluded.granted;

