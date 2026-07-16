-- REROUTE Portal - idempotent foundation seed.
-- Does not create users, real profiles, real investors, personal data or passwords.

insert into public.organizations (name, slug, status)
values ('REROUTE', 'reroute', 'active')
on conflict (slug) do update
set name = excluded.name,
    status = excluded.status,
    updated_at = now();

with org as (
  select id from public.organizations where slug = 'reroute'
)
insert into public.workspaces (organization_id, name, slug, description, status, display_order)
select org.id, seed.name, seed.slug, seed.description, 'active', seed.display_order
from org
cross join (
  values
    ('Investor Workspace', 'investor', 'Area privada para investidores acompanharem informacoes autorizadas.', 10),
    ('Admin Workspace', 'admin', 'Area administrativa para operacao e governanca do Portal.', 20),
    ('Team Workspace', 'team', 'Area futura para equipe interna.', 30),
    ('Advisor Workspace', 'advisor', 'Area futura para conselheiros e advisors.', 40),
    ('Finance Workspace', 'finance', 'Area futura para financeiro e contabilidade.', 50),
    ('Legal Workspace', 'legal', 'Area futura para juridico.', 60)
) as seed(name, slug, description, display_order)
on conflict (organization_id, slug) do update
set name = excluded.name,
    description = excluded.description,
    status = excluded.status,
    display_order = excluded.display_order,
    updated_at = now();

with org as (
  select id from public.organizations where slug = 'reroute'
)
insert into public.roles (organization_id, name, slug, description, is_system_role, status)
select org.id, seed.name, seed.slug, seed.description, true, 'active'
from org
cross join (
  values
    ('Super Admin', 'super_admin', 'Acesso administrativo maximo. Nao deve ser concedido automaticamente.'),
    ('Admin', 'admin', 'Administracao operacional do Portal.'),
    ('Investor', 'investor', 'Acesso restrito ao proprio workspace e dados de investidor.'),
    ('Employee', 'employee', 'Acesso interno basico conforme workspace.'),
    ('Manager', 'manager', 'Gestao interna conforme workspace.'),
    ('Advisor', 'advisor', 'Acesso consultivo autorizado.'),
    ('Accountant', 'accountant', 'Acesso futuro ao contexto financeiro/contabil.'),
    ('Legal', 'legal', 'Acesso futuro ao contexto juridico.'),
    ('Auditor', 'auditor', 'Consulta de auditoria e conformidade.'),
    ('Support', 'support', 'Suporte operacional limitado.')
) as seed(name, slug, description)
on conflict (organization_id, slug) do update
set name = excluded.name,
    description = excluded.description,
    is_system_role = excluded.is_system_role,
    status = excluded.status,
    updated_at = now();

insert into public.capabilities (key, module, action, description)
values
  ('portal.access', 'portal', 'access', 'Acessar o Portal autenticado.'),
  ('profile.view_own', 'profile', 'view_own', 'Visualizar o proprio perfil.'),
  ('profile.edit_own', 'profile', 'edit_own', 'Editar campos permitidos do proprio perfil.'),
  ('workspace.access', 'workspace', 'access', 'Acessar workspace autorizado.'),
  ('investor.view_own', 'investor', 'view_own', 'Visualizar o proprio registro de investidor.'),
  ('investor.view_general', 'investor', 'view_general', 'Visualizar informacoes gerais de investidores.'),
  ('investor.manage', 'investor', 'manage', 'Gerenciar registros de investidores.'),
  ('users.view', 'users', 'view', 'Visualizar usuarios autorizados.'),
  ('users.manage', 'users', 'manage', 'Gerenciar usuarios autorizados.'),
  ('roles.view', 'roles', 'view', 'Visualizar roles e capabilities.'),
  ('roles.manage', 'roles', 'manage', 'Gerenciar roles e capabilities.'),
  ('workspaces.view', 'workspaces', 'view', 'Visualizar workspaces administrativos.'),
  ('workspaces.manage', 'workspaces', 'manage', 'Gerenciar workspaces e membros.'),
  ('audit.view', 'audit', 'view', 'Visualizar auditoria.'),
  ('audit.export', 'audit', 'export', 'Exportar auditoria.')
on conflict (key) do update
set module = excluded.module,
    action = excluded.action,
    description = excluded.description;

with role_capability_seed(role_slug, capability_key) as (
  values
    ('super_admin', 'portal.access'),
    ('super_admin', 'profile.view_own'),
    ('super_admin', 'profile.edit_own'),
    ('super_admin', 'workspace.access'),
    ('super_admin', 'investor.view_own'),
    ('super_admin', 'investor.view_general'),
    ('super_admin', 'investor.manage'),
    ('super_admin', 'users.view'),
    ('super_admin', 'users.manage'),
    ('super_admin', 'roles.view'),
    ('super_admin', 'roles.manage'),
    ('super_admin', 'workspaces.view'),
    ('super_admin', 'workspaces.manage'),
    ('super_admin', 'audit.view'),
    ('super_admin', 'audit.export'),
    ('admin', 'portal.access'),
    ('admin', 'profile.view_own'),
    ('admin', 'profile.edit_own'),
    ('admin', 'workspace.access'),
    ('admin', 'investor.view_general'),
    ('admin', 'investor.manage'),
    ('admin', 'users.view'),
    ('admin', 'users.manage'),
    ('admin', 'roles.view'),
    ('admin', 'workspaces.view'),
    ('admin', 'workspaces.manage'),
    ('admin', 'audit.view'),
    ('investor', 'portal.access'),
    ('investor', 'profile.view_own'),
    ('investor', 'profile.edit_own'),
    ('investor', 'workspace.access'),
    ('investor', 'investor.view_own'),
    ('employee', 'portal.access'),
    ('employee', 'profile.view_own'),
    ('employee', 'profile.edit_own'),
    ('employee', 'workspace.access'),
    ('manager', 'portal.access'),
    ('manager', 'profile.view_own'),
    ('manager', 'profile.edit_own'),
    ('manager', 'workspace.access'),
    ('manager', 'workspaces.view'),
    ('advisor', 'portal.access'),
    ('advisor', 'profile.view_own'),
    ('advisor', 'profile.edit_own'),
    ('advisor', 'workspace.access'),
    ('accountant', 'portal.access'),
    ('accountant', 'profile.view_own'),
    ('accountant', 'profile.edit_own'),
    ('accountant', 'workspace.access'),
    ('legal', 'portal.access'),
    ('legal', 'profile.view_own'),
    ('legal', 'profile.edit_own'),
    ('legal', 'workspace.access'),
    ('auditor', 'portal.access'),
    ('auditor', 'profile.view_own'),
    ('auditor', 'workspace.access'),
    ('auditor', 'audit.view'),
    ('auditor', 'audit.export'),
    ('support', 'portal.access'),
    ('support', 'profile.view_own'),
    ('support', 'workspace.access'),
    ('support', 'users.view')
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
