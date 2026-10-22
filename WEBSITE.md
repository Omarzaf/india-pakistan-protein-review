# Public dashboard and preserved research edition

The [Dashboard tab](https://pakistan-india-protein.vercel.app/dashboard/) connects consumption, conditional spending projections, model-run records and reviews. The existing report and its original edition remain available on the same site. The dashboard is a retained 22 October 2026 snapshot; it does not run models or fetch new research.

`website/public/` is the entire publication surface. The private repository's other files are not deployed. Its explicit inventory and hashes are in `website/public/release.json`. The original website bytes are recorded in `website/provenance/existing-edition.json`; the main page differs only by the reversible navigation patch.

## Verify and preview

No production dependency installation is required. Use Node.js 22 or newer:

```sh
node website/tools/verify.mjs
node --test website/tests/*.test.mjs
node website/tools/serve.mjs
```

Open `http://127.0.0.1:8832/`. The preview serves only allowlisted public files and applies the dashboard's production security policy. Missing or private paths return 404.

The original review-package checker remains unchanged and intentionally rejects active website content. Export exactly its 37 files before running it:

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

Publication of this dashboard was authorized on 22 October 2026. Human factual/code review, scholarly acceptance and source-specific reuse licensing are separate states. No blanket licence is granted. Aggregate rows retain their denominators, periods, source IDs, uncertainty meanings and missing values. Public summaries identify transformations and original-source hashes; they do not claim to be complete internal reports. The site excludes the private Atlas catalogue, file inventory, operational logs, raw provider transcripts, collaborator planning material and household microdata.

Releasing changed data requires reviewing the full inventory and updating its hashes with `node website/tools/seal.mjs`, then rerunning verification. CI never reseals the receipt. `website/vercel.json` builds through verification and exposes only `public/`.

Deployments use the existing Vercel project through an explicit reviewed release. This repository has no automatic production deployment integration; a Git push alone does not change the live site. The deployment receipt records the exact reviewed Git revision.
