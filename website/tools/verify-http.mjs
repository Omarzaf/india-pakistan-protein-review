import fs from 'node:fs';
import path from 'node:path';
import {website, sha256} from './verify.mjs';
const origin = process.argv[2];
if (!origin || !/^https?:\/\//.test(origin)) throw new Error('Usage: node website/tools/verify-http.mjs BASE_URL [RECEIPT_PATH]');
const base = origin.replace(/\/$/, '');
const publicRoot = path.join(website, 'public');
const releaseBytes = fs.readFileSync(path.join(publicRoot, 'release.json'));
const release = JSON.parse(releaseBytes);
const checks = [], queue = [...release.files, {path: 'release.json', bytes: releaseBytes.length, sha256: sha256(releaseBytes)}];
const check = (name, pass) => checks.push({name, pass});
await Promise.all(Array.from({length: 4}, async () => {
  while (queue.length) {
    const file = queue.shift();
    const response = await fetch(base + '/' + file.path, {redirect: 'follow', signal: AbortSignal.timeout(30000)});
    const bytes = Buffer.from(await response.arrayBuffer());
    check(file.path + ' status/hash', response.status === 200 && bytes.length === file.bytes && sha256(bytes) === file.sha256);
    check(file.path + ' nosniff', response.headers.get('x-content-type-options') === 'nosniff');
    if (file.path.startsWith('dashboard/')) check(file.path + ' dashboard CSP', (response.headers.get('content-security-policy') ?? '').includes("script-src 'self'"));
  }
}));
for (const route of ['/AGENTS.md', '/.env', '/.git/config', '/.governor/', '/WORKSPACE-STATE.json', '/SESSION-LOG.md', '/catalogue.json', '/inventory.json', '/dashboard/catalogue.json', '/api/source', '/api/focus-document?id=scope-review', '/tools/verify.mjs', '/provenance/existing-edition.json']) {
  const response = await fetch(base + route, {signal: AbortSignal.timeout(30000)});
  check(route + ' excluded', response.status === 404);
}
for (const route of ['/', '/dashboard/', '/dashboard', '/original/index.html']) {
  const response = await fetch(base + route, {signal: AbortSignal.timeout(30000)});
  check(route + ' opens', response.status === 200);
}
const result = {status: checks.every(item => item.pass) ? 'PASS' : 'FAIL', base, verifiedAt: new Date().toISOString(), releaseId: release.releaseId, publicFiles: release.files.length + 1, checks: checks.length, failures: checks.filter(item => !item.pass)};
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify({...result, results: checks}, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.status !== 'PASS') process.exitCode = 1;
