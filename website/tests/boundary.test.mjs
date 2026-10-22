import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {website, verify, inventory, sensitiveCategories} from '../tools/verify.mjs';

test('committed public allowlist, document hashes and preserved edition verify', () => {
  const result = verify();
  assert.equal(result.status, 'PASS', JSON.stringify(result.errors));
});

test('privacy detector returns categories without echoing sensitive values', () => {
  for (const text of ['/' + 'Users' + '/synthetic/private', 'https://' + 'docs.google.com/document/d/synthetic', 'sk-' + 'x'.repeat(35)]) {
    const categories = sensitiveCategories(text);
    assert(categories.length > 0);
    assert(!categories.join(' ').includes(text));
  }
});

test('public inventory refuses symlinks', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'protein-boundary-'));
  try {
    fs.symlinkSync(path.join(website, 'vercel.json'), path.join(temporary, 'linked.json'));
    assert.throws(() => inventory(temporary), /Symlink rejected/);
  } finally {fs.rmSync(temporary, {recursive: true});}
});

test('extra files and altered publication bytes fail the committed receipt', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'protein-boundary-'));
  try {
    for (const item of ['public', 'provenance', 'vercel.json']) fs.cpSync(path.join(website, item), path.join(temporary, item), {recursive: true});
    fs.writeFileSync(path.join(temporary, 'public', 'unreviewed.txt'), 'Unexpected payload');
    let result = verify(temporary, {syntax: false});
    assert(result.errors.includes('Public allowlist differs from actual files'));
    fs.appendFileSync(path.join(temporary, 'public/dashboard/app.mjs'), '\n// changed\n');
    result = verify(temporary, {syntax: false});
    assert(result.errors.some(error => error.includes('Hash/size mismatch: dashboard/app.mjs')));
  } finally {fs.rmSync(temporary, {recursive: true});}
});
