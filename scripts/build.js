const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const localPortalEnabled = process.argv.includes('--local-portal');

const loadLocalEnv = () => {
  const envPath = path.join(rootDir, '.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const normalized = line.trim();

    if (!normalized || normalized.startsWith('#')) {
      continue;
    }

    const separatorIndex = normalized.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const key = normalized.slice(0, separatorIndex).trim();
    const value = normalized.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
};

loadLocalEnv();

const entries = [
  'index.html',
  'politica-de-privacidade.html',
  'termos-de-uso.html',
  'aviso-legal.html',
  'admin/login',
  'assets',
  'robots.txt',
  'sitemap.xml',
  'site.webmanifest'
];

const publicSourceEntries = [
  'src/scripts/i18n.js',
  'src/scripts/script.js',
  'src/styles/style.css'
];

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

for (const entry of entries) {
  const source = path.join(rootDir, entry);
  const target = entry === 'admin/login'
    ? path.join(distDir, 'admin/login')
    : path.join(distDir, entry);

  if (!fs.existsSync(source)) {
    continue;
  }

  fs.cpSync(source, target, { recursive: true });
}

for (const entry of publicSourceEntries) {
  const source = path.join(rootDir, entry);
  const target = path.join(distDir, entry);

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

if (localPortalEnabled) {
  const localPortalEntries = [
    ['portal/login', 'portal/login'],
    ['portal/dashboard', 'portal/dashboard'],
    ['portal/recuperar-senha', 'portal/recuperar-senha'],
    ['portal/redefinir-senha', 'portal/redefinir-senha'],
    ['portal/acesso-negado', 'portal/acesso-negado'],
    ['src/portal', 'src/portal']
  ];

  for (const [sourceEntry, targetEntry] of localPortalEntries) {
    const source = path.join(rootDir, sourceEntry);
    const target = path.join(distDir, targetEntry);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.cpSync(source, target, { recursive: true });
  }

  const portalRuntimeConfigPath = path.join(distDir, 'src', 'portal', 'core', 'runtime-config.js');
  fs.writeFileSync(
    portalRuntimeConfigPath,
    `window.REROUTE_PORTAL_ENV = ${JSON.stringify({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
      environment: 'development'
    }, null, 2)};\n`,
    'utf8'
  );
}

const publicRuntimeConfigPath = path.join(distDir, 'src', 'scripts', 'runtime-config.js');
fs.mkdirSync(path.dirname(publicRuntimeConfigPath), { recursive: true });
fs.writeFileSync(
  publicRuntimeConfigPath,
  `window.REROUTE_PUBLIC_ENV = ${JSON.stringify({
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
  }, null, 2)};\n`,
  'utf8'
);

console.log(`Build concluido em dist/.${localPortalEnabled ? ' Portal local habilitado.' : ''}`);
