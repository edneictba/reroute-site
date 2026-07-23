const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const failures = [];

const assert = (condition, message) => {
  if (!condition) {
    failures.push(message);
  }
};

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const absolutePath = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
});

assert(fs.existsSync(distDir), 'dist ausente; execute o build antes deste teste.');

if (fs.existsSync(distDir)) {
  const publicFiles = walk(distDir).map((file) => path.relative(distDir, file).replaceAll('\\', '/'));
  const forbiddenPaths = [
    /^api\//,
    /^docs\//,
    /^investidor\//,
    /^portal\//,
    /^server\//,
    /^supabase\//,
    /^src\/emails\//,
    /^src\/portal\//,
    /(^|\/)\.env(?:\.|$)/,
    /\.md$/i,
    /\.sql$/i
  ];

  for (const file of publicFiles) {
    assert(!forbiddenPaths.some((pattern) => pattern.test(file)), `Arquivo interno publicado: ${file}`);
  }

  const runtimePath = path.join(distDir, 'src/scripts/runtime-config.js');
  const runtime = fs.readFileSync(runtimePath, 'utf8');
  const forbiddenRuntimeNames = [
    'RESEND_API_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'TURNSTILE_SECRET_KEY',
    'LEAD_RATE_LIMIT_SECRET',
    'SUPABASE_ANON_KEY',
    'supabaseUrl',
    'supabaseAnonKey'
  ];

  assert(runtime.includes('turnstileSiteKey'), 'Site Key publica do Turnstile ausente no runtime config.');
  for (const name of forbiddenRuntimeNames) {
    assert(!runtime.includes(name), `Variavel sensivel ou desnecessaria exposta no runtime config: ${name}`);
  }

  assert(!publicFiles.includes('admin/index.html'), 'Dashboard administrativo foi publicado como HTML estatico.');
  assert(publicFiles.includes('admin/login/index.html'), 'Login administrativo nao foi publicado.');
  const publicAdminFiles = publicFiles.filter((file) => file.startsWith('assets/admin/'));
  const publicAdminSource = publicAdminFiles
    .filter((file) => file.endsWith('.js'))
    .map((file) => fs.readFileSync(path.join(distDir, file), 'utf8'))
    .join('\n');
  assert(!/(service_role|SUPABASE_|RESEND_|ADMIN_AUDIT_SECRET)/i.test(publicAdminSource), 'Frontend administrativo contem segredo ou acesso direto a servico privado.');
}

const vercelConfig = JSON.parse(fs.readFileSync(path.join(rootDir, 'vercel.json'), 'utf8'));
const registrationFunction = vercelConfig.functions?.['api/register-lead.js'];
assert(
  Number(registrationFunction?.maxDuration) >= 25 && Number(registrationFunction?.maxDuration) <= 60,
  'Duracao da Function incompatível com o fluxo sequencial ou com a Vercel Hobby.'
);
const configuredHeaders = new Map(
  (vercelConfig.headers || [])
    .flatMap((route) => route.headers || [])
    .map(({ key, value }) => [key.toLowerCase(), value])
);
const requiredHeaders = [
  'content-security-policy',
  'strict-transport-security',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
  'x-frame-options',
  'cross-origin-opener-policy'
];

for (const header of requiredHeaders) {
  assert(configuredHeaders.has(header), `Security header ausente: ${header}`);
}

const csp = configuredHeaders.get('content-security-policy') || '';
assert(csp.includes("frame-ancestors 'none'"), 'CSP nao bloqueia framing.');
assert(csp.includes("object-src 'none'"), 'CSP nao bloqueia plugins.');
assert(!csp.includes("script-src 'self' 'unsafe-inline'"), 'CSP permite script inline sem hash.');

const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const inlineStructuredData = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];

assert(Boolean(inlineStructuredData), 'JSON-LD inline nao encontrado para validar o hash CSP.');
if (inlineStructuredData) {
  const hash = `sha256-${crypto.createHash('sha256').update(inlineStructuredData).digest('base64')}`;
  assert(csp.includes(`'${hash}'`), 'Hash CSP do JSON-LD esta desatualizado.');
}

const frontend = fs.readFileSync(path.join(rootDir, 'src/scripts/script.js'), 'utf8');
for (const forbidden of ['SUPABASE_', '/rest/v1/leads', 'send-welcome-email', 'RESEND_API_KEY']) {
  assert(!frontend.includes(forbidden), `Frontend contem integracao proibida: ${forbidden}`);
}
assert(frontend.includes("const REGISTRATION_ENDPOINT = '/api/register-lead'"), 'Frontend nao usa exclusivamente a API de cadastro.');

const setupMigration = fs.readFileSync(
  path.join(rootDir, 'supabase/migrations/20260721232000_secure_public_lead_registration.sql'),
  'utf8'
);
const lockdownMigration = fs.readFileSync(
  path.join(rootDir, 'supabase/migrations/20260721233000_lock_down_public_lead_access.sql'),
  'utf8'
);
assert(!/revoke all on public\.leads/i.test(setupMigration), 'Migration pre-deploy interrompe o fluxo antigo.');
assert(/revoke all on public\.leads from public, anon, authenticated/i.test(lockdownMigration), 'Lockdown final nao revoga o acesso direto a leads.');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Production readiness static checks passed.');
