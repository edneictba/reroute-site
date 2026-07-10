const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const entries = [
  'index.html',
  'politica-de-privacidade.html',
  'termos-de-uso.html',
  'aviso-legal.html',
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

console.log('Build concluido em dist/.');
