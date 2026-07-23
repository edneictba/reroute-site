const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..', '..', '..');
const modules = ['projects', 'updates', 'documents', 'roadmap', 'investors'];
const errors = [];

const read = (relativePath) => fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(rootDir, relativePath));

for (const moduleName of modules) {
  const repositoryPath = `src/portal/repositories/${moduleName}-repository.js`;
  const servicePath = `src/portal/services/${moduleName}-service.js`;
  const providerPath = `src/portal/providers/${moduleName}-provider.js`;

  if (!exists(repositoryPath)) errors.push(`Missing repository: ${repositoryPath}`);
  if (!exists(servicePath)) errors.push(`Missing service: ${servicePath}`);
  if (!exists(providerPath)) errors.push(`Missing provider: ${providerPath}`);

  if (exists(repositoryPath) && !read(repositoryPath).includes(`portal_${moduleName}`)) {
    errors.push(`${repositoryPath} does not reference portal_${moduleName}`);
  }

  if (exists(servicePath) && !read(servicePath).includes(`${moduleName}Repository`)) {
    errors.push(`${servicePath} does not use its repository`);
  }
}

const dtoSource = read('src/portal/dtos/module-dtos.js');
for (const dto of ['ProjectsDTO', 'UpdatesDTO', 'DocumentsDTO', 'RoadmapDTO', 'InvestorsDTO']) {
  if (!dtoSource.includes(`export const ${dto}`)) errors.push(`Missing DTO: ${dto}`);
}

if (!exists('src/portal/dtos/read-model-dtos.js')) errors.push('Missing read-model DTOs.');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Portal read-model architecture validation passed.');
