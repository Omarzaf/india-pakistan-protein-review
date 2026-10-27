# Local revised report, dashboard and preserved edition

The 27 October local candidate updates the report and source-linked methods and driver documents. Its 17 dataset exports remain the 22 October snapshot. The [public Dashboard tab](https://pakistan-india-protein.vercel.app/dashboard/) still refers to the earlier release; this revision has not been deployed. Neither version runs models or fetches new research in the browser.

`website/public/` is the entire candidate publication surface. Its 147-file inventory is sealed in `website/public/release.json`. The current Report comes from the revised offline package; the earlier published report remains explicitly labelled under `editions/2026-10-22/`. Historical source bytes and navigation transformations are recorded separately in `website/provenance/`. See [the local website build contract](website/README.md).

## Verify and preview

No production dependency installation is required. Use Node.js 22 or newer:

```sh
node website/tools/verify.mjs
node --test website/tests/*.test.mjs
node website/tools/serve.mjs
```

Open `http://127.0.0.1:8832/`. The preview serves only allowlisted public files and applies the dashboard's production security policy. Missing or private paths return 404.

The review-package checker remains unchanged and intentionally rejects active website content. Export the current explicit passive allowlist before running it (61 files for this revision, rather than the historical 37):

```sh
review_export=$(mktemp -d)
node website/tools/export-review.mjs "$review_export"
cd "$review_export"
python3.12 -m venv .venv
. .venv/bin/activate
export PYTHONDONTWRITEBYTECODE=1
python scripts/reproduce.py
python -m unittest discover -s tests -v
python scripts/check_release.py
```

## Publication and evidence

Publication of the earlier dashboard was authorized on 22 October 2026. That authorization does not approve this revision. Human factual/code review, scholarly acceptance and source-specific reuse licensing remain separate states. No blanket licence is granted. Aggregate rows retain their denominators, periods, source IDs, uncertainty meanings and missing values. Public summaries identify transformations and original-source hashes; they do not claim to be complete internal reports. The candidate excludes the private Atlas catalogue, file inventory, operational logs, raw provider transcripts, collaborator planning material and household microdata.

Local browser verification used the supported browser with allowlisted virtual routes because this execution environment denied loopback listeners. It checked rendered pages, navigation, downloads and file hashes, but did not establish live server routing or deployment behavior. The ordinary preview command above remains available in an environment that permits listening.

Releasing changed data requires reviewing the full inventory and updating its hashes with `node website/tools/seal.mjs`, then rerunning verification. CI never reseals the receipt. `website/vercel.json` builds through verification and exposes only `public/`.

Deployments use the existing Vercel project through an explicit reviewed release. This repository has no automatic production deployment integration; a Git push alone does not change the live site. The deployment receipt records the exact reviewed Git revision.
