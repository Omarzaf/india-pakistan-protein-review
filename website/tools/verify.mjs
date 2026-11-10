import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

export const website = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

export function inventory(root, prefix = '') {
  return fs.readdirSync(path.join(root, prefix), {withFileTypes: true}).flatMap(entry => {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink rejected: ${relative}`);
    return entry.isDirectory() ? inventory(root, relative) : [relative];
  }).sort();
}

export function sensitiveCategories(text) {
  const patterns = [
    ['home path', /\/(?:Users|home)\/[A-Za-z0-9_.-]+\//],
    ['private document URL', /https:\/\/(?:docs|drive)\.google\.com\//],
    ['credential', /(?:sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/],
    ['private key', /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/],
    ['private archive', /(?:drive-archive|RECOVERY\/|\.env\.local|127\.0\.0\.1:\d{4})/],
  ];
  return patterns.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
}

export function verify(root = website, {syntax = true, sourceParity = true} = {}) {
  const publicRoot = path.join(root, 'public'), errors = [];
  const require = (condition, message) => {if (!condition) errors.push(message);};
  const load = relative => JSON.parse(fs.readFileSync(path.join(publicRoot, relative), 'utf8'));
  const receipt = load('release.json');
  const actual = inventory(publicRoot), declared = receipt.files.map(file => file.path).sort();
  require(new Set(declared).size === declared.length, 'Duplicate public allowlist path');
  require(JSON.stringify(actual) === JSON.stringify([...declared, 'release.json'].sort()), 'Public allowlist differs from actual files');
  for (const file of receipt.files) {
    require(!file.path.startsWith('/') && !file.path.split('/').some(part => part.startsWith('.') || part === '..'), `Unsafe public path: ${file.path}`);
    const target = path.resolve(publicRoot, file.path);
    if (!target.startsWith(publicRoot + path.sep) || !fs.existsSync(target)) {errors.push(`Missing/outside file: ${file.path}`); continue;}
    const bytes = fs.readFileSync(target);
    require(bytes.length === file.bytes && sha256(bytes) === file.sha256, `Hash/size mismatch: ${file.path}`);
    if (file.path.startsWith('dashboard/') || file.path.startsWith('review/') || file.path === 'index.html') {
      for (const category of sensitiveCategories(bytes.toString())) errors.push(`${category}: ${file.path}`);
      require(!/catalogue\.json|inventory\.json|sessions\.json/.test(file.path), `Private Atlas artifact: ${file.path}`);
      if (file.path.endsWith('.html')) {
        const html = bytes.toString();
        require(!/<(?:iframe|object|embed|form)\b|\son\w+\s*=|<script(?![^>]*src=)/i.test(html), `Unsafe candidate markup: ${file.path}`);
        require(!/<(?:script|link)[^>]*(?:src|href)=["'](?:https?:)?\/\//i.test(html), `External runtime dependency: ${file.path}`);
      }
    }
    if (syntax && file.path.endsWith('.mjs')) {
      try {execFileSync(process.execPath, ['--check', target], {stdio: 'pipe'});} catch {errors.push(`JavaScript syntax: ${file.path}`);}
    }
  }
  const manifest = load('dashboard/pakistan-india-manifest.json');
  require(Object.keys(manifest.datasets).length === 17, 'Expected 17 focused datasets');
  for (const [key, binding] of Object.entries(manifest.datasets)) {
    const relative = `dashboard/tables/${binding.id}.json`, bytes = fs.readFileSync(path.join(publicRoot, relative));
    const table = JSON.parse(bytes);
    require(sha256(bytes) === binding.projectionSha256, `Dataset hash: ${key}`);
    require(table.rows.length === binding.rowCount, `Dataset row count: ${key}`);
    require(Array.isArray(table.columns) && table.rows.every(row => Object.keys(row).every(column => table.columns.includes(column))), `Table fields: ${key}`);
    for (const document of binding.documents ?? []) require(manifest.documents.some(doc => doc.id === (document.id ?? document)), `Missing document binding: ${key}`);
  }
  require(new Set(manifest.documents.map(doc => doc.id)).size === manifest.documents.length, 'Duplicate document ID');
  for (const doc of manifest.documents) {
    require(doc.path.startsWith('/dashboard/documents/'), `Document path: ${doc.id}`);
    const bytes = fs.readFileSync(path.join(publicRoot, doc.path.slice(1)));
    require(sha256(bytes) === doc.sha256, `Document hash: ${doc.id}`);
    if (doc.kind !== 'pdf') {
      const reader = load(doc.readerPath.slice(1));
      require(sha256(reader.text) === doc.sha256, `Reader/source parity: ${doc.id}`);
    }
  }
  const preserved = JSON.parse(fs.readFileSync(path.join(root, 'provenance/existing-edition.json')));
  const patch = JSON.parse(fs.readFileSync(path.join(root, 'provenance/navigation-patch.json')));
  const currentPath = path.join(root, 'provenance/current-revision.json');
  const current = fs.existsSync(currentPath) ? JSON.parse(fs.readFileSync(currentPath)) : null;
  const historicalRoot = current ? path.join(publicRoot, current.historicalArchive) : publicRoot;
  let original = fs.readFileSync(path.join(historicalRoot, 'index.html'), 'utf8');
  for (const change of [...patch.patches].reverse()) {
    require(original.split(change.after).length === 2, 'Navigation patch must occur exactly once');
    original = original.replace(change.after, change.before);
  }
  for (const file of preserved.files) {
    const bytes = file.path === 'index.html' ? original : fs.readFileSync(path.join(historicalRoot, file.path));
    require(sha256(bytes) === file.sha256, `Existing edition altered outside navigation: ${file.path}`);
  }
  if (current) {
    const historical = JSON.parse(fs.readFileSync(path.join(root, 'provenance/historical-capture.json')));
    for (const file of historical.files) require(sha256(fs.readFileSync(path.join(publicRoot, file.path))) === file.sha256, `Historical published bytes changed: ${file.path}`);
    require(receipt.publicationAuthorized === false && current.publicationAuthorized === false, 'Local candidate cannot inherit publication approval');
    require(manifest.publication.publicationAuthorized === false, 'Dashboard cannot inherit prior manuscript approval');
    require(receipt.snapshotDate === '2026-10-22' && manifest.manuscriptRevision === current.revision, 'Retained data and manuscript dates must remain distinct');
    require(sha256(fs.readFileSync(path.join(publicRoot, 'index.html'))) === current.rootHtmlSha256, 'Current root report hash');
    const repository = path.resolve(root, '..');
    for (const item of current.assets) {
      require(sha256(fs.readFileSync(path.join(publicRoot, item.path))) === item.exportSha256, `Current export hash: ${item.path}`);
      const source = path.join(repository, item.source);
      if (sourceParity) {
        require(fs.existsSync(source), `Missing current report source: ${item.source}`);
        if (fs.existsSync(source)) require(sha256(fs.readFileSync(source)) === item.sourceSha256, `Current source/export drift: ${item.source}`);
      }
    }
    for (const relative of ['index.html', 'review/report/review.html']) {
      const html = fs.readFileSync(path.join(publicRoot, relative), 'utf8');
      const ownIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
      for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
        const href = match[1].replaceAll('&amp;', '&');
        if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) continue;
        const parsed = new URL(href, `https://report.invalid/${relative}`);
        let target = decodeURIComponent(parsed.pathname).replace(/^\//, '');
        if (!target || target.endsWith('/')) target += 'index.html';
        require(declared.includes(target), `Unexported local report link: ${relative} -> ${target}`);
        if (target === relative && parsed.hash) require(ownIds.has(decodeURIComponent(parsed.hash.slice(1))), `Missing report anchor: ${relative} ${parsed.hash}`);
      }
    }
  }
  const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json')));
  require(config.outputDirectory === 'public', 'Deploy only public/');
  require(config.headers.some(rule => rule.source.includes('dashboard') && rule.headers.some(header => header.key === 'Content-Security-Policy' && header.value.includes("script-src 'self'"))), 'Dashboard CSP missing');
  const result = {status: errors.length ? 'FAIL' : 'PASS', files: actual.length, datasets: 17, documents: manifest.documents.length, releaseId: receipt.releaseId, errors};
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = verify();
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'PASS') process.exitCode = 1;
}
