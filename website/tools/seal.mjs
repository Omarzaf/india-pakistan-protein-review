// Explicit maintainer action after reviewing the entire public file inventory.
// CI verifies the committed receipt; it never refreshes expected hashes.
import fs from 'node:fs';
import path from 'node:path';
import {website, inventory, sha256} from './verify.mjs';
const root = path.join(website, 'public');
const files = inventory(root).filter(file => file !== 'release.json').map(relative => {
  const bytes = fs.readFileSync(path.join(root, relative));
  return {path: relative, bytes: bytes.length, sha256: sha256(bytes)};
});
const receipt = {schemaVersion: 1, releaseId: 'protein-review-2026-10-27-local', snapshotDate: '2026-10-22', manuscriptRevision: '2026-10-27', state: 'LOCAL_REVIEW_CANDIDATE', publicationAuthorized: false, humanFactualCodeReview: 'pending', scholarlyAcceptance: 'pending', files};
fs.writeFileSync(path.join(root, 'release.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`Sealed ${files.length} public files; release.json is the sole self-excluded receipt.`);
