const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { renderAdminDashboard } = require('../server/admin/dashboard-template');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const vercelConfig = JSON.parse(fs.readFileSync(path.join(rootDir, 'vercel.json'), 'utf8'));
const securityHeaders = Object.fromEntries(
  (vercelConfig.headers?.[0]?.headers || []).map(({ key, value }) => [key, value])
);
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

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const requestedPath = path.resolve(distDir, relativePath);

  for (const [key, value] of Object.entries(securityHeaders)) {
    res.setHeader(key, value);
  }

  if (pathname === '/dashboard-preview') {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(renderAdminDashboard());
    return;
  }
  if (pathname === '/login-preview') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    fs.createReadStream(path.join(distDir, 'admin/login/index.html')).pipe(res);
    return;
  }
  if (pathname === '/api/admin/session') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ success: true, user: { email: 'admin@reroute.com.br' } }));
    return;
  }
  if (pathname === '/api/admin/leads') {
    const leads = [
      { id: '1', name: 'Maria Silva', email: 'maria@example.com', whatsapp: '+5511999999999', created_at: '2026-07-22T12:00:00Z' },
      { id: '2', name: 'João Santos', email: 'joao@example.com', whatsapp: '+51999999999', created_at: '2026-07-21T17:30:00Z' }
    ];
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ success: true, data: {
      metrics: { total: 128, today: 7, last7Days: 34, currentMonth: 82 },
      daily: Array.from({ length: 30 }, (_, index) => ({ date: `2026-07-${String(index + 1).padStart(2, '0')}`, count: (index * 3) % 11 })),
      leads,
      pagination: { page: 1, pageSize: 25, total: 2, totalPages: 1 }
    } }));
    return;
  }

  if (!requestedPath.startsWith(`${distDir}${path.sep}`) || !fs.existsSync(requestedPath) || fs.statSync(requestedPath).isDirectory()) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }

  res.setHeader('Content-Type', contentTypes[path.extname(requestedPath)] || 'application/octet-stream');
  fs.createReadStream(requestedPath).pipe(res);
});

server.listen(4175, '127.0.0.1', () => {
  console.log('Production test server: http://127.0.0.1:4175');
});
