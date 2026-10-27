import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {website, sha256} from '../tools/verify.mjs';
import {rootReport, reviewAssets} from '../tools/build-review.mjs';

test('root report relocates packaged links without changing external citations or anchors', () => {
  const sample = '<body><a href="../methods/proxy.md">Method</a><img src="figures/gfi-required-growth.svg"><a href="#question">Question</a><a href="https://example.org/source">Source</a></body>';
  const rendered = rootReport(sample);
  assert(rendered.includes('href="/review/methods/proxy.md"'));
  assert(rendered.includes('src="/review/report/figures/gfi-required-growth.svg"'));
  assert(rendered.includes('href="#question"'));
  assert(rendered.includes('href="https://example.org/source"'));
  for (const label of ['Report', 'Dashboard', 'Historical edition', 'Download PDF']) assert(rendered.includes(`>${label}</a>`));
});

test('report export is explicit and excludes private and large per-draw artifacts', () => {
  assert(reviewAssets.includes('data/reference_proxy_scenarios.csv'));
  assert(reviewAssets.includes('methods/drivers.md'));
  assert(!reviewAssets.some(name => /factor-draws|\.env|RECOVERY|drive-archive/.test(name)));
  assert.equal(new Set(reviewAssets).size, reviewAssets.length);
});

test('local revision has no publication authorization and preserves source-linked report bytes', () => {
  const record = JSON.parse(fs.readFileSync(path.join(website, 'provenance/current-revision.json')));
  const release = JSON.parse(fs.readFileSync(path.join(website, 'public/release.json')));
  assert.equal(record.publicationAuthorized, false);
  assert.equal(release.publicationAuthorized, false);
  assert.equal(release.snapshotDate, '2026-10-22');
  assert.equal(record.revision, '2026-10-27');
  const source = fs.readFileSync(path.join(website, '../report/review.html'), 'utf8');
  assert.equal(sha256(source), record.sourceHtmlSha256);
  assert.equal(fs.readFileSync(path.join(website, 'public/index.html'), 'utf8'), rootReport(source));
});

test('GFI source cells, diagnostic units and recommendation links survive publication projection', () => {
  const report = fs.readFileSync(path.join(website, 'public/review/methods/gfi-gap.md'), 'utf8');
  assert(report.includes('2022'));
  assert(/price/i.test(report) && /diagnostic/i.test(report));
  for (const relative of ['data/gfi_categories.csv', 'data/driver-evidence.json', 'data/recommendations.csv', 'build/gfi-gap/required-growth.csv']) {
    assert.equal(sha256(fs.readFileSync(path.join(website, '../', relative))), sha256(fs.readFileSync(path.join(website, 'public/review', relative))));
  }
});
