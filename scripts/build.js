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
  const target = path.join(distDir, entry);

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

const publicRuntimeConfigPath = path.join(distDir, 'src', 'scripts', 'runtime-config.js');
fs.mkdirSync(path.dirname(publicRuntimeConfigPath), { recursive: true });
fs.writeFileSync(
  publicRuntimeConfigPath,
  `window.REROUTE_PUBLIC_ENV = ${JSON.stringify({
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
  }, null, 2)};\n`,
  'utf8'
);

console.log('Build concluido em dist/.');
