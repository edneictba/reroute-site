const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'dist-portal');

const loadEnvFile = (fileName) => {
  const envPath = path.join(rootDir, fileName);
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const normalized = line.trim();
    if (!normalized || normalized.startsWith('#')) continue;
    const separator = normalized.indexOf('=');
    if (separator < 1) continue;
    const key = normalized.slice(0, separator).trim();
    const value = normalized.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    process.env[key] ||= value;
  }
};

loadEnvFile('.env');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/i.test(supabaseUrl) || supabaseAnonKey.length < 20) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias para o build do Portal.');
}

const publicEntries = [
  ['portal', 'portal'],
  ['assets/icons', 'assets/icons'],
  ['assets/images/logo-reroute-hns-640.png', 'assets/images/logo-reroute-hns-640.png']
];

const sourcePatterns = [
  ['src/portal/auth', '.js'],
  ['src/portal/core', '.js'],
  ['src/portal/dtos', '.js'],
  ['src/portal/guards', '.js'],
  ['src/portal/lib', '.js'],
  ['src/portal/models', '.js'],
  ['src/portal/providers', '.js'],
  ['src/portal/repositories', '.js'],
  ['src/portal/services', '.js'],
  ['src/portal/styles', '.css']
];

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const [sourceEntry, targetEntry] of publicEntries) {
  const source = path.join(rootDir, sourceEntry);
  const target = path.join(outputDir, targetEntry);
  if (!fs.existsSync(source)) continue;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

for (const [sourceDirectory, extension] of sourcePatterns) {
  const source = path.join(rootDir, sourceDirectory);
  const target = path.join(outputDir, sourceDirectory);
  if (!fs.existsSync(source)) continue;
  fs.mkdirSync(target, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(extension)) {
      fs.copyFileSync(path.join(source, entry.name), path.join(target, entry.name));
    }
  }
}

const runtimeConfigPath = path.join(outputDir, 'src/portal/core/runtime-config.js');
fs.writeFileSync(
  runtimeConfigPath,
  `window.REROUTE_PORTAL_ENV = ${JSON.stringify({
    supabaseUrl,
    supabaseAnonKey,
    environment: 'production'
  }, null, 2)};\n`,
  'utf8'
);

console.log('Build de produção do Portal concluído em dist-portal/.');
