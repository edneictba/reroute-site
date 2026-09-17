// Static, loopback-only review. Never loads env files or forwards API requests.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../dist');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
http.createServer((req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname.startsWith('/api/')) {
    // Local-only fixtures: telemetry is discarded; registration never reports success.
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = pathname === '/api/analytics' ? 200 : pathname === '/api/admin/session' ? 401 : 503;
    res.end(JSON.stringify({ success: pathname === '/api/analytics', localPreview: true }));
    return;
  }
  if (pathname === '/src/scripts/runtime-config.js') {
    res.setHeader('Content-Type', 'text/javascript');
    res.end('window.REROUTE_PUBLIC_ENV = { turnstileSiteKey: "" };');
    return;
  }
  let file;
  try { file = path.resolve(root, '.' + decodeURIComponent(pathname)); } catch { res.writeHead(400).end(); return; }
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end('Not found'); return; }
  res.setHeader('Content-Type', (types[path.extname(file)] || 'application/octet-stream') + (['.html', '.js', '.css'].includes(path.extname(file)) ? '; charset=utf-8' : ''));
  // Keep production tags in source; external scripts are blocked only in review.
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-src 'none'");
  fs.createReadStream(file).pipe(res);
}).listen(4186, '127.0.0.1', () => console.log('Revisão sem serviços externos: http://localhost:4186'));
