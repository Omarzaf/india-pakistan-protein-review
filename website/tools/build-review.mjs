// Explicit local report export. This command does not seal, publish or deploy.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {website, sha256} from './verify.mjs';

const repository = path.resolve(website, '..');
const publicRoot = path.join(website, 'public');
const revision = '2026-10-27';
const archivePrefix = 'editions/2026-10-22';

export const reviewAssets = [
  'report/review.html', 'report/review.pdf', 'report/report.css',
  'report/chapter.md', 'report/limitations-and-ai-use.md',
  'report/figures/gfi-required-growth.png', 'report/figures/gfi-required-growth.svg',
  'report/figures/figure-data.json',
  'methods/proxy.md', 'methods/gfi-gap.md', 'methods/drivers.md',
  'methods/dated-context.md', 'methods/measurement-crosswalk.md', 'methods/panel-supplement.md',
  'data/README.md', 'data/altprotein_proxy_inputs.csv', 'data/reference_proxy_scenarios.csv',
  'data/reference_panel_aggregates.json', 'data/panel_runs.json', 'data/panel-attempts.csv',
  'data/gfi_categories.csv', 'data/driver-evidence.json', 'data/recommendations.csv',
  'provenance/claims.md', 'provenance/sources.md', 'provenance/claim-review.csv',
  'provenance/source-map.json', 'provenance/proxy-source-ledger.csv',
  'build/gfi-gap/REPORT.md', 'build/gfi-gap/diagnostics.json',
  'build/gfi-gap/category-growth.csv', 'build/gfi-gap/category-reconciliation.csv',
  'build/gfi-gap/midpoint-factors.csv', 'build/gfi-gap/required-growth.csv',
  'build/gfi-gap/sensitivity-summary.csv', 'build/gfi-gap/target-comparison.csv',
  'build/gfi-gap/reference-checks.csv',
  'scripts/gfi_gap.py', 'scripts/build_altprotein_proxy.py',
  'scripts/reproduce.py', 'scripts/build_panel.py', 'RIGHTS.md',
];

export function rootReport(source) {
  const translated = source.replace(/\b(href|src)="([^"]+)"/g, (match, attr, url) => {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(url)) return match;
    const resolved = new URL(url, 'https://report.invalid/review/report/review.html');
    return `${attr}="${resolved.pathname}${resolved.search}${resolved.hash}"`;
  });
  const nav = '<nav class="report-actions" aria-label="Research site"><a href="/" aria-current="page">Report</a><a href="/dashboard/">Dashboard</a><a href="/editions/2026-10-22/">Historical edition</a><a href="/review/report/review.pdf">Download PDF</a></nav>';
  const note = '<aside class="edition-note">27 October 2026 local review candidate. Historical model results and 22 October data are retained. Human factual/code review and release approval remain pending.</aside>';
  return translated.replace(/<div class="figure-scroll"/g, '<p class="table-hint">Scroll the figure horizontally on a narrow screen.</p><div class="figure-scroll"').replace(/<body[^>]*>/, match => match + '\n' + nav + '\n' + note);
}

function write(relative, bytes) {
  const target = path.join(publicRoot, relative);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, bytes);
}

function preservePreviousEdition() {
  const receiptPath = path.join(website, 'provenance/historical-capture.json');
  if (fs.existsSync(receiptPath)) {
    const prior = JSON.parse(fs.readFileSync(receiptPath));
    for (const file of prior.files) {
      if (sha256(fs.readFileSync(path.join(publicRoot, file.path))) !== file.sha256) throw new Error(`Historical bytes changed: ${file.path}`);
    }
    return prior;
  }
  const prior = JSON.parse(fs.readFileSync(path.join(website, 'provenance/existing-edition.json')));
  const patch = JSON.parse(fs.readFileSync(path.join(website, 'provenance/navigation-patch.json')));
  const files = [];
  for (const item of prior.files) {
    const bytes = fs.readFileSync(path.join(publicRoot, item.path));
    let original = bytes;
    if (item.path === 'index.html') {
      original = bytes.toString();
      for (const change of [...patch.patches].reverse()) {
        if (original.split(change.after).length !== 2) throw new Error('Old navigation does not match preservation record');
        original = original.replace(change.after, change.before);
      }
    }
    if (sha256(original) !== item.sha256) throw new Error(`Old edition disagrees with baseline: ${item.path}`);
    const relative = `${archivePrefix}/${item.path}`;
    write(relative, bytes);
    files.push({path: relative, sha256: sha256(bytes), bytes: bytes.length});
  }
  const record = {capturedFrom: '22 October published artifact retained in repository', archivePrefix, files};
  fs.writeFileSync(receiptPath, JSON.stringify(record, null, 2) + '\n');
  fs.copyFileSync(path.join(publicRoot, 'release.json'), path.join(website, 'provenance/release-2026-10-22.json'));
  return record;
}

function updateDocuments() {
  const manifestPath = path.join(publicRoot, 'dashboard/pakistan-india-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath));
  const definitions = [
    ['chapter', 'report/chapter.md', 'Current India–Pakistan chapter · 27 October', 'report'],
    ['review-pdf', 'report/review.pdf', 'Current chapter and methods PDF · 27 October', 'pdf'],
    ['proxy-method', 'methods/proxy.md', 'Plain-language walkthrough and exact proxy method', 'method'],
    ['limitations', 'report/limitations-and-ai-use.md', 'Current limitations and AI-use statement', 'method'],
    ['claim-review', 'provenance/claim-review.csv', 'Current manuscript human-review register', 'review'],
    ['source-map', 'provenance/source-map.json', 'Current source-to-export map', 'method'],
    ['gfi-gap', 'methods/gfi-gap.md', 'Why the scenarios sit below GFI India', 'method'],
    ['drivers', 'methods/drivers.md', 'Drivers, obstacles and linked proposals', 'report'],
    ['dated-context', 'methods/dated-context.md', 'Dated evidence on earlier sector expectations', 'method'],
    ['recommendations', 'data/recommendations.csv', 'Proposed tests and outcome register', 'report'],
    ['driver-evidence', 'data/driver-evidence.json', 'Country-specific driver evidence ledger', 'method'],
  ];
  for (const [id, source, title, kind] of definitions) {
    const bytes = fs.readFileSync(path.join(repository, source));
    const existing = manifest.documents.find(doc => doc.id === id);
    const suffix = path.extname(source);
    const publicPath = existing?.path ?? `/dashboard/documents/${id}${suffix}`;
    const digest = sha256(bytes);
    const note = 'Exact local review-candidate document, revised 27 October. Publication approval and human factual/code review remain pending.';
    write(publicPath.slice(1), bytes);
    const doc = {id, title, path: publicPath, kind, sha256: digest, originalSourceSha256: digest, exportSha256: digest, publicationProjection: 'exact', publicationNote: note, manuscriptRevision: revision, packagePath: source};
    if (kind !== 'pdf') {
      doc.readerPath = publicPath.replace(/\.[^.]+$/, '.reader.json');
      write(doc.readerPath.slice(1), JSON.stringify({id, title, path: publicPath, sha256: digest, originalSourceSha256: digest, text: bytes.toString(), note}, null, 2) + '\n');
    }
    if (existing) Object.assign(existing, doc); else manifest.documents.push(doc);
    manifest.sourceHashes[`document:${id}`] = digest;
  }
  manifest.manuscriptRevision = revision;
  manifest.freshness = 'Retained 22 October data snapshot; chapter and methods revised 27 October. No new forecasts or source acquisition; new arithmetic diagnostics are separate.';
  manifest.counts.documents = manifest.documents.length;
  manifest.counts.retainedClaimReviewItems = 30;
  manifest.datasets.claims.title = 'Retained 22 October claim inventory';
  manifest.datasets.claims.caveat = 'Historical 30-row inventory. Read the current manuscript review document for the 27 October revision; all human review remains pending.';
  manifest.publication = {...manifest.publication, priorAuthorizedDate: manifest.publication.authorizedDate ?? manifest.publication.priorAuthorizedDate, authorizedDate: null, manuscriptRevision: revision, publicationAuthorized: false, state: 'LOCAL_REVIEW_CANDIDATE', noNewAcquisitionOrModelRun: false, noNewSourceAcquisitionOrElicitation: true, newNumericalDiagnostics: true, originalAndExportDigestsSeparate: true};
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  return definitions.map(([id, source]) => ({id, source}));
}

export function buildReview() {
  for (const relative of reviewAssets) {
    const target = path.join(repository, relative);
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) throw new Error(`Missing approved report asset: ${relative}`);
  }
  const historical = preservePreviousEdition();
  const assets = reviewAssets.map(relative => {
    const bytes = fs.readFileSync(path.join(repository, relative));
    const target = `review/${relative}`;
    write(target, bytes);
    return {source: relative, path: target, sourceSha256: sha256(bytes), exportSha256: sha256(bytes)};
  });
  const original = fs.readFileSync(path.join(repository, 'report/review.html'), 'utf8');
  const current = rootReport(original);
  write('index.html', current);
  const documents = updateDocuments();
  const record = {revision, state: 'LOCAL_REVIEW_CANDIDATE', publicationAuthorized: false, dataSnapshot: '2026-10-22', historicalArchive: historical.archivePrefix, sourceHtmlSha256: sha256(original), rootHtmlSha256: sha256(current), assets, documents, omittedGeneratedArtifact: 'build/gfi-gap/factor-draws.csv (large per-draw data remains in review package)'};
  fs.writeFileSync(path.join(website, 'provenance/current-revision.json'), JSON.stringify(record, null, 2) + '\n');
  console.log(JSON.stringify({status: 'LOCAL_EXPORT_BUILT', assets: assets.length, documents: documents.length, revision, publicationAuthorized: false}));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) buildReview();
