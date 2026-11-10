# Local 27 October review candidate

The website contains a revised report and source-linked dashboard documents. The 17 research table projections remain the 22 October snapshot. New arithmetic diagnostics are exported separately. All 60 accepted responses and the existing US comparator rows remain unchanged.

After rebuilding the review package's HTML and PDF:

```sh
node website/tools/build-review.mjs
node website/tools/seal.mjs
node website/tools/verify.mjs
node --test website/tests/*.test.mjs
PORT=8833 node website/tools/serve.mjs
```

The builder has an explicit asset list. It does not copy a repository tree or expose private source captures. It archives the six retained report artifacts, keeps their original and published-byte checks, creates the current root reader from `report/review.html`, updates document readers from package sources, and records source/export hashes. The large per-draw CSV remains in the offline review package, outside this public candidate.

`provenance/current-revision.json` binds the current source and export. `provenance/historical-capture.json` preserves the exact prior published bytes; `provenance/existing-edition.json` still checks the underlying earlier edition after reversing its navigation patch. `provenance/release-2026-10-22.json` preserves the prior public inventory receipt.

The current receipt says `LOCAL_REVIEW_CANDIDATE` and `publicationAuthorized: false`. Sealing is an integrity operation, not release approval. A local server may require an environment-approved listening surface. Do not disable browser or OS sandboxing to obtain a preview.

Review the exact diff, human factual/code review, rights, author scope and public inventory before any separately authorized push or deployment. CI verifies the receipt; it does not reseal it.
