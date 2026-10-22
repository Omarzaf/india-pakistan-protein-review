// Preserve the original passive 37-file review package and its strict checker.
import fs from 'node:fs';
import path from 'node:path';
import {website, sha256} from './verify.mjs';
const repository = path.resolve(website, '..');
const target = process.argv[2];
if (!target) throw new Error('Usage: node website/tools/export-review.mjs EMPTY_DESTINATION');
const destination = path.resolve(target);
if (fs.existsSync(destination) && fs.readdirSync(destination).length) throw new Error('Destination must be empty');
const manifestPath = 'provenance/release-allowlist.json';
const manifest = JSON.parse(fs.readFileSync(path.join(repository, manifestPath)));
for (const file of manifest.files) {
  if (file.path.startsWith('/') || file.path.split('/').includes('..')) throw new Error('Unsafe review path');
  const bytes = fs.readFileSync(path.join(repository, file.path));
  if (sha256(bytes) !== file.sha256 || bytes.length !== file.bytes) throw new Error(`Review hash mismatch: ${file.path}`);
}
for (const relative of [...manifest.files.map(file => file.path), manifestPath]) {
  const output = path.join(destination, relative);
  fs.mkdirSync(path.dirname(output), {recursive: true});
  fs.copyFileSync(path.join(repository, relative), output);
}
console.log(`Exported ${manifest.files.length + 1} checked review files.`);
