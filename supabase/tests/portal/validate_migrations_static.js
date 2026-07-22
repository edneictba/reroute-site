const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..', '..', '..');
const migrationsDir = path.join(rootDir, 'supabase', 'migrations');

const expectedFiles = [
  '20260715090000_portal_core_foundation.sql',
  '20260715091000_portal_roles_capabilities.sql',
  '20260715092000_portal_investors.sql',
  '20260715093000_portal_audit.sql',
  '20260715094000_portal_authorization_functions.sql',
  '20260715095000_portal_rls.sql',
  '20260715100000_portal_seed.sql',
  '20260715110000_portal_finance_schema.sql',
  '20260715111000_portal_finance_rls.sql',
  '20260715112000_portal_finance_seed.sql'
];

const expectedTables = [
  'organizations',
  'profiles',
  'workspaces',
  'workspace_members',
  'roles',
  'capabilities',
  'role_capabilities',
  'user_roles',
  'investors',
  'audit_logs',
  'financial_summaries',
  'financial_transactions',
  'financial_budgets',
  'financial_cash_flows'
];

const expectedFunctions = [
  'set_updated_at',
  'handle_new_auth_user_profile',
  'record_audit_log',
  'current_profile_id',
  'is_profile_active',
  'current_profile_organization_id',
  'is_organization_member',
  'is_workspace_member',
  'has_role',
  'has_capability',
  'enforce_profile_update_scope',
  'can_read_finance_workspace'
];

const expectedPolicies = [
  'organizations_select_member_or_admin',
  'organizations_manage_admin',
  'profiles_select_own_or_admin',
  'profiles_update_own_or_admin',
  'workspaces_select_member_or_admin',
  'workspaces_manage_admin',
  'workspace_members_select_own_or_admin',
  'workspace_members_manage_admin',
  'roles_select_own_or_admin',
  'roles_manage_admin',
  'capabilities_select_effective_or_admin',
  'role_capabilities_select_own_or_admin',
  'role_capabilities_manage_admin',
  'user_roles_select_own_or_admin',
  'user_roles_manage_admin',
  'investors_select_own_or_admin',
  'investors_manage_admin',
  'audit_logs_select_authorized',
  'audit_logs_insert_authorized',
  'financial_summaries_select_authorized',
  'financial_transactions_select_authorized',
  'financial_budgets_select_authorized',
  'financial_cash_flows_select_authorized'
];

const errors = [];
const allMigrationFiles = fs.existsSync(migrationsDir)
  ? fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort()
  : [];
const files = expectedFiles.filter((file) => allMigrationFiles.includes(file));

const sqlByFile = Object.fromEntries(
  files.map((file) => [file, fs.readFileSync(path.join(migrationsDir, file), 'utf8')])
);
const allSql = Object.values(sqlByFile).join('\n');

const expect = (condition, message) => {
  if (!condition) {
    errors.push(message);
  }
};

expect(JSON.stringify(files) === JSON.stringify(expectedFiles), 'Unexpected migration file order or missing file.');

for (const table of expectedTables) {
  expect(new RegExp(`create table if not exists public\\.${table}\\b`, 'i').test(allSql), `Missing table: ${table}`);
  expect(new RegExp(`alter table public\\.${table} enable row level security`, 'i').test(allSql), `Missing RLS enable: ${table}`);
}

for (const fn of expectedFunctions) {
  expect(new RegExp(`function public\\.${fn}\\b`, 'i').test(allSql), `Missing function: ${fn}`);
}

for (const policy of expectedPolicies) {
  expect(new RegExp(`create policy ${policy}\\b`, 'i').test(allSql), `Missing policy: ${policy}`);
}

expect(!/using\s*\(\s*true\s*\)/i.test(allSql), 'Open USING (true) policy found.');
expect(!/with\s+check\s*\(\s*true\s*\)/i.test(allSql), 'Open WITH CHECK (true) policy found.');
expect(!/public\.leads/i.test(allSql), 'Portal migration references public.leads.');
expect(!/SUPABASE_SERVICE_ROLE|service_role/i.test(allSql), 'Service role reference found.');
expect(/references auth\.users\(id\)/i.test(allSql), 'profiles.id is not linked to auth.users(id).');
expect(/investor_number between 1 and 20/i.test(allSql), 'investor_number range check missing.');
expect(/unique \(organization_id, investor_number\)/i.test(allSql), 'investor number uniqueness missing.');
expect(/unique \(workspace_id, profile_id\)/i.test(allSql), 'workspace_members duplicate guard missing.');
expect(/unique \(profile_id, role_id, workspace_id\)/i.test(allSql), 'user_roles duplicate guard missing.');
expect(/unique \(key\)/i.test(allSql), 'capabilities key uniqueness missing.');
expect(/primary key \(role_id, capability_id\)/i.test(allSql), 'role_capabilities composite key missing.');
expect(/not exists \(select 1 from effective_role_capabilities where granted = false\)/i.test(allSql), 'Explicit false grant precedence missing.');
expect(/'finance\.read'/i.test(allSql), 'finance.read capability missing.');
expect(/'finance\.manage'/i.test(allSql), 'finance.manage capability missing.');
expect(/grant select on public\.financial_summaries to authenticated/i.test(allSql), 'Finance read grant missing.');
expect(!/grant (insert|update|delete).*public\.financial_/i.test(allSql), 'Finance write grant found in read-only sprint.');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Portal migration static validation passed.');
