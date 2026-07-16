const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..', '..', '..');
const seedPath = path.join(rootDir, 'supabase', 'seeds', 'staging', 'finance.sql');
const rlsTestPath = path.join(rootDir, 'supabase', 'tests', 'portal', 'test_finance_staging_read_rls.sql');
const errors = [];

if (!fs.existsSync(seedPath)) {
  console.error('Finance staging seed is missing.');
  process.exit(1);
}

const sql = fs.readFileSync(seedPath, 'utf8');
const rlsSql = fs.existsSync(rlsTestPath) ? fs.readFileSync(rlsTestPath, 'utf8') : '';
const expect = (condition, message) => {
  if (!condition) errors.push(message);
};

expect(/where slug = 'reroute'/i.test(sql), 'Seed is not scoped to the REROUTE organization.');
expect(/where organization_id = reroute_organization_id/i.test(sql), 'Workspace is not scoped by organization.');
expect(/generate_series\(1, 40\)/i.test(sql), 'Expected 40 transactions.');
expect(/generate_series\(1, 12\)/i.test(sql), 'Expected 12 cash-flow timeline events.');
expect(/% 8/i.test(sql), 'Expected 8 transaction categories.');
expect(/% 10/i.test(sql), 'Expected 10 fictitious account references.');
expect((sql.match(/Produto e MVP 2026|Operacao 2026|Go-to-market 2026/g) || []).length === 3, 'Expected 3 budgets.');
expect(/on conflict \(id\) do update/ig.test(sql), 'Seed is not idempotent.');
expect(!/service_role|SUPABASE_SERVICE_ROLE/i.test(sql), 'Service role reference found.');
expect(!/public\.leads|resend|auth\.users/i.test(sql), 'Out-of-scope table or integration found.');
expect(/finance\.read/i.test(rlsSql), 'finance.read RLS scenario is missing.');
expect(/finance\.manage/i.test(rlsSql), 'finance.manage RLS scenario is missing.');
expect(/without finance capability/i.test(rlsSql), 'No-permission RLS scenario is missing.');
expect(/different workspace/i.test(rlsSql), 'Different-workspace RLS scenario is missing.');
expect(/different organization/i.test(rlsSql), 'Different-organization RLS scenario is missing.');
expect(/ownership scope/i.test(rlsSql), 'Ownership assertion is missing.');
expect(/rollback;/i.test(rlsSql), 'RLS test does not roll back fixtures.');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Finance staging seed static validation passed.');
