const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'dist-portal');
const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};
const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const absolutePath = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
});

assert(fs.existsSync(outputDir), 'dist-portal ausente.');

if (fs.existsSync(outputDir)) {
  const files = walk(outputDir).map((file) => path.relative(outputDir, file).replaceAll('\\', '/'));
  const portalSourceDir = path.join(rootDir, 'portal');
  const portalRoutes = walk(portalSourceDir)
    .filter((file) => path.basename(file) === 'index.html')
    .map((file) => path.relative(rootDir, file).replaceAll('\\', '/'));
  const required = [
    'portal/login/index.html',
    'portal/dashboard/index.html',
    'portal/roadmap/index.html',
    'portal/recuperar-senha/index.html',
    'portal/redefinir-senha/index.html',
    'portal/acesso-negado/index.html',
    'src/portal/core/portal.js',
    'src/portal/core/runtime-config.js',
    'src/portal/styles/portal.css'
  ];
  required.forEach((file) => assert(files.includes(file), `Arquivo obrigatório ausente: ${file}`));
  portalRoutes.forEach((file) => assert(files.includes(file), `Rota do Portal ausente no build: ${file}`));

  const forbidden = [/\.sql$/i, /\.md$/i, /(^|\/)\.env/i, /^supabase\//, /^server\//, /^api\//];
  files.forEach((file) => assert(!forbidden.some((pattern) => pattern.test(file)), `Arquivo interno publicado: ${file}`));

  const publicSource = files
    .filter((file) => /\.(?:js|html|css)$/i.test(file))
    .map((file) => fs.readFileSync(path.join(outputDir, file), 'utf8'))
    .join('\n');
  for (const secret of ['SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'TURNSTILE_SECRET_KEY', 'ADMIN_AUDIT_SECRET']) {
    assert(!publicSource.includes(secret), `Nome de segredo exposto no artefato: ${secret}`);
  }

  const runtime = fs.readFileSync(path.join(outputDir, 'src/portal/core/runtime-config.js'), 'utf8');
  assert(runtime.includes('"environment": "production"'), 'Runtime do Portal não está em produção.');
  assert(!runtime.includes('service_role'), 'Service role exposta no runtime.');
}

const config = JSON.parse(fs.readFileSync(path.join(rootDir, 'vercel.portal.json'), 'utf8'));
const csp = config.headers
  .flatMap((item) => item.headers || [])
  .find((header) => header.key === 'Content-Security-Policy')?.value || '';
assert(csp.includes('https://cdn.jsdelivr.net'), 'CSP não permite o CDN necessário.');
assert(csp.includes('https://lfubkmzwahfuvngegdhg.supabase.co'), 'CSP não permite o Supabase configurado.');
assert(config.outputDirectory === 'dist-portal', 'Output do Portal incorreto.');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Portal production readiness checks passed.');
