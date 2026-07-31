const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const portalProjectId = 'prj_HPDLWrd5xX5dcjTGz3QVYGl9fbaB';
const projectProductionUrl = String(process.env.VERCEL_PROJECT_PRODUCTION_URL || '');
const isPortalProject = (
  process.env.VERCEL_PROJECT_ID === portalProjectId
  || projectProductionUrl.startsWith('reroute-portal')
);
const runNpmScript = (script) => {
  if (process.platform === 'win32') {
    execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `npm.cmd run ${script}`], {
      cwd: rootDir,
      stdio: 'inherit'
    });
    return;
  }

  execFileSync('npm', ['run', script], { cwd: rootDir, stdio: 'inherit' });
};

if (!isPortalProject) {
  runNpmScript('build');
  process.exit(0);
}

runNpmScript('build:portal');

const portalOutput = path.join(rootDir, 'dist-portal');
const vercelOutput = path.join(rootDir, 'dist');

fs.rmSync(vercelOutput, { recursive: true, force: true });
fs.cpSync(portalOutput, vercelOutput, { recursive: true });

console.log('Artefato do Portal preparado para o output compartilhado da Vercel.');
