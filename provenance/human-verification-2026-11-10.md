# Human verification record, 10 November 2026

On 10 November 2026 the author, Muhammad Umar Zafar, stated that he had verified the contents of this repository: its claims, citations, statistics, data and code. This file records that statement and what was changed because of it.

## What changed

| File | Change |
|---|---|
| [claim-review.csv](claim-review.csv) | 38 of 39 rows now carry the reviewer, the date 2026-11-10 and the disposition `verified`. Row `ALL-RIGHTS` stays `pending`. |
| [claims-by-section-2026-10-30.csv](claims-by-section-2026-10-30.csv) | `human_review` reads `verified by author 2026-11-10` on 432 rows. The 6 rows with status `unresolved` read `reviewed by author 2026-11-10; assumption remains unresolved`. In 89 rows the `notes` text that said human review was pending now gives the same date. |
| [release-allowlist.json](release-allowlist.json) | `human_verification` and each file's `release_status` record the statement. |
| `data/driver-evidence.json` | `review_disposition` reads `verified_by_author_2026-11-10` on all 8 drivers. This field was missed in the first pass and corrected later the same day. |
| README, CITATION.cff, RIGHTS.md, `methods/`, `provenance/sources.md`, `provenance/claims.md`, `provenance/source-map.json`, `data/pakistan-topdown/sources.json`, `halal/phase1-review.md` | Status lines that said human verification was pending now give the date of the author's statement. |

## How it was recorded

An AI agent (Claude) entered these values on the author's instruction of 10 November 2026. The agent did not observe the review. The entries record the author's statement, and the author is the reviewer of record.

## What stays open

- Source-specific rights and release permission. Every `release_permission` cell and [RIGHTS.md](../RIGHTS.md) still say pending.
- Team agreement, joint-report acceptance and the forecast partner's consent to publication.
- Review of the halal readings by a qualified scholar or lawyer.
- Six assumptions the claim register marks `unresolved`: the GFI price basis, the GFI retail basis, and four mappings in the Pakistan scale check.
- The files in `report/` are the 27 October draft and keep their original status line. The South Asia report supersedes them.
- The dated logs in `desk-research/`, the build record `provenance/document-build.json` and the messages printed by the scripts keep their original wording.
- The live dashboard is the 22 October edition. It has not been redeployed, so its pages still show the earlier status.
