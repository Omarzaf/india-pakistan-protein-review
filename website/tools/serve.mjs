import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {website, verify} from './verify.mjs';
const result = verify();
if (result.status !== 'PASS') throw new Error(JSON.stringify(result));
const root = path.join(website, 'public');
const allowed = new Set(JSON.parse(fs.readFileSync(path.join(root, 'release.json'))).files.map(file => file.path));
allowed.add('release.json');
const config = JSON.parse(fs.readFileSync(path.join(website, 'vercel.json')));
const mime = {'.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.csv': 'text/csv; charset=utf-8', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.py': 'text/plain; charset=utf-8'};
const server = http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {response.writeHead(405); response.end(); return;}
  let route;
  try {route = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\//, '');} catch {response.writeHead(400); response.end(); return;}
  if (!route || route.endsWith('/')) route += 'index.html';
  if (route === 'dashboard') {response.writeHead(308, {Location: '/dashboard/'}); response.end(); return;}
  if (!allowed.has(route)) {response.writeHead(404); response.end('Not found'); return;}
  for (const rule of config.headers) {
    if (rule.source === '/(.*)' || (rule.source.includes('dashboard') && route.startsWith('dashboard/'))) for (const header of rule.headers) response.setHeader(header.key, header.value);
  }
  const target = path.join(root, route);
  if (!fs.realpathSync(target).startsWith(root + path.sep)) {response.writeHead(404); response.end(); return;}
  response.setHeader('Content-Type', mime[path.extname(route)] ?? 'application/octet-stream');
  response.writeHead(200);
  if (request.method === 'HEAD') response.end(); else fs.createReadStream(target).pipe(response);
});
const port = Number(process.env.PORT || 8832);
server.listen(port, '127.0.0.1', () => console.log(`Checked public site: http://127.0.0.1:${port}/`));
