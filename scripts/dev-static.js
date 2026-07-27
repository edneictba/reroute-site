const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const port = Number(process.env.PORT) || 4174;

const loadedEnv = {};
const loadEnvFile = (filename) => {
  const filePath = path.join(rootDir, filename);
  if (!fs.existsSync(filePath)) return;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    loadedEnv[key] = value;
  }
};

loadEnvFile('.env');
loadEnvFile('.env.local');
loadEnvFile('.env.development.local');
for (const [key, value] of Object.entries(loadedEnv)) {
  process.env[key] ??= value;
}
process.env.NODE_ENV = 'development';
process.env.REROUTE_SITE_URL ||= `http://localhost:${port}`;
process.env.SUPABASE_URL ||= process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
process.env.SUPABASE_ANON_KEY ||= process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const adminAuthHandler = require('../api/admin-auth');
const adminDataHandler = require('../api/admin-data');
const adminPagesHandler = require('../api/admin-pages');
const withRouteParameter = (handler, key, value) => (req, res) => {
  req.query = { ...(req.query || {}), [key]: value };
  return handler(req, res);
};

const apiRoutes = new Map([
  ['/api/admin/login', withRouteParameter(adminAuthHandler, 'action', 'login')],
  ['/api/admin/logout', withRouteParameter(adminAuthHandler, 'action', 'logout')],
  ['/api/admin/session', withRouteParameter(adminAuthHandler, 'action', 'session')],
  ['/api/admin/dashboard', withRouteParameter(adminDataHandler, 'action', 'dashboard')],
  ['/api/admin/leads', withRouteParameter(adminDataHandler, 'action', 'leads')],
  ['/api/admin/analytics', withRouteParameter(adminDataHandler, 'action', 'analytics')],
  ['/api/admin/export', withRouteParameter(adminDataHandler, 'action', 'export')],
  ['/api/analytics', require('../api/analytics')],
  ['/api/register-lead', require('../api/register-lead')]
]);
const adminPageHandler = withRouteParameter(adminPagesHandler, 'page', 'dashboard');
const adminLeadsPageHandler = withRouteParameter(adminPagesHandler, 'page', 'leads');
const adminAnalyticsPageHandler = withRouteParameter(adminPagesHandler, 'page', 'analytics');
const adminSettingsPageHandler = withRouteParameter(adminPagesHandler, 'page', 'settings');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8'
};

const readJsonBody = (req) => new Promise((resolve, reject) => {
  let body = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    body += chunk;
    if (Buffer.byteLength(body) > 4096) reject(new Error('body_too_large'));
  });
  req.on('end', () => {
    if (!body) return resolve({});
    try {
      return resolve(JSON.parse(body));
    } catch {
      return reject(new Error('invalid_json'));
    }
  });
  req.on('error', reject);
});

const serveStatic = (pathname, res) => {
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '').replace(/\/$/, '');
  const candidates = [
    path.resolve(distDir, relativePath),
    path.resolve(distDir, `${relativePath}.html`),
    path.resolve(distDir, relativePath, 'index.html')
  ];
  const requestedPath = candidates.find((candidate) => (
    candidate.startsWith(`${distDir}${path.sep}`)
    && fs.existsSync(candidate)
    && fs.statSync(candidate).isFile()
  ));
  if (!requestedPath) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }
  res.setHeader('Content-Type', contentTypes[path.extname(requestedPath)] || 'application/octet-stream');
  fs.createReadStream(requestedPath).pipe(res);
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `localhost:${port}`}`);
  const pathname = decodeURIComponent(url.pathname).replace(/\/$/, '') || '/';
  req.query = Object.fromEntries(url.searchParams.entries());

  try {
    if (apiRoutes.has(pathname)) {
      if (req.method === 'POST' && String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
        req.body = await readJsonBody(req);
      }
      await apiRoutes.get(pathname)(req, res);
      return;
    }
    if (pathname === '/admin/leads') {
      await adminLeadsPageHandler(req, res);
      return;
    }
    if (pathname === '/admin/analytics') {
      await adminAnalyticsPageHandler(req, res);
      return;
    }
    if (pathname === '/admin/configuracoes') {
      await adminSettingsPageHandler(req, res);
      return;
    }
    if (pathname === '/admin') {
      await adminPageHandler(req, res);
      return;
    }
    serveStatic(url.pathname, res);
  } catch (error) {
    console.error(`[dev] ${req.method} ${pathname}: ${error.message}`);
    if (!res.headersSent) {
      res.statusCode = error.message === 'invalid_json' ? 400 : 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    if (!res.writableEnded) res.end(JSON.stringify({ success: false, message: 'Nao foi possivel concluir esta operacao.' }));
  }
});

server.listen(port, '127.0.0.1', () => {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_AUDIT_SECRET'];
  const missing = required.filter((name) => !process.env[name]);
  console.log(`REROUTE local server available at http://localhost:${port}`);
  console.log(`Admin login: http://localhost:${port}/admin/login/`);
  if (missing.length) console.warn(`Missing server variables: ${missing.join(', ')}`);
});
