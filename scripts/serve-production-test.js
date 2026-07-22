const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

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
