const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

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
  'portal',
  'investidor',
  'assets',
  'src',
  'robots.txt',
  'sitemap.xml',
  'site.webmanifest'
];

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

for (const entry of entries) {
  const source = path.join(rootDir, entry);
  const target = path.join(distDir, entry);

  if (!fs.existsSync(source)) {
    continue;
  }

  fs.cpSync(source, target, { recursive: true });
}

const portalConfigDir = path.join(distDir, 'src', 'portal', 'core');
fs.mkdirSync(portalConfigDir, { recursive: true });
fs.writeFileSync(
  path.join(portalConfigDir, 'runtime-config.js'),
  `window.REROUTE_PORTAL_ENV = ${JSON.stringify({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
    environment: process.env.NODE_ENV || 'development'
  }, null, 2)};\n`,
  'utf8'
);

console.log('Build concluido em dist/.');
