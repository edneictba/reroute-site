const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = [
  'index.html',
  'politica-de-privacidade.html',
  'termos-de-uso.html',
  'aviso-legal.html',
  'admin/login/index.html'
];

const requiredIndexSnippets = [
  'REROUTE™',
  'CNPJ nº 67.892.806/0001-02',
  'Fundada em 2026',
  'Construído no Brasil.',
  'Projetado para o mundo.',
  'Política de Privacidade',
  'Termos de Uso',
  'Aviso Legal',
  'REROUTE - Tecnologia de Navegação Humana Ltda.'
];

const errors = [];

const exists = (filePath) => fs.existsSync(path.join(rootDir, filePath));

for (const file of htmlFiles) {
  if (!exists(file)) {
    errors.push(`Arquivo ausente: ${file}`);
    continue;
  }

  const html = fs.readFileSync(path.join(rootDir, file), 'utf8');

  for (const tag of ['<html', '<head>', '<body', '</html>']) {
    if (!html.includes(tag)) {
      errors.push(`${file}: tag obrigatoria ausente: ${tag}`);
    }
  }

  if (!html.includes('<meta name="copyright"')) {
    errors.push(`${file}: meta copyright ausente`);
  }

  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1]);

  for (const ref of refs) {
    if (
      ref.startsWith('http') ||
      ref.startsWith('#') ||
      ref.startsWith('mailto:') ||
      ref.startsWith('tel:')
    ) {
      continue;
    }

    const cleanRef = ref.split('?')[0].split('#')[0];

    if (cleanRef && !exists(cleanRef)) {
      errors.push(`${file}: referencia ausente: ${ref}`);
    }
  }
}

const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

for (const snippet of requiredIndexSnippets) {
  if (!indexHtml.includes(snippet)) {
    errors.push(`index.html: conteudo obrigatorio ausente: ${snippet}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Lint concluido sem erros.');
