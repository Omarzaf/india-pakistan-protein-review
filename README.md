# India and Pakistan: alternative-protein spending scenarios

**Muhammad Umar Zafar · 22 October 2026 · Review edition**

**Public dashboard:** [consumption, projections, runs and reviews](https://pakistan-india-protein.vercel.app/dashboard/). The original report remains in the adjacent Report tab. [Website verification and release instructions](https://github.com/Omarzaf/india-pakistan-protein-review/blob/review/WEBSITE.md) describe the separate publication boundary.

This repository contains a proposed India–Pakistan contribution to a unified research report, its methods, and an offline reproduction of the retained numbers. Team agreement and human factual/code verification are pending. It is ready for a bounded review; it is not a final programme submission or an accepted research finding.

## Read, inspect, reproduce

1. **Read:** [contribution and methods](report/review.html), [PDF](report/review.pdf), or [editable chapter](report/chapter.md).
2. **Inspect:** [measurement crosswalk](methods/measurement-crosswalk.md), [source ledger](provenance/sources.md), [claim review register](provenance/claim-review.csv), and [data dictionary](data/README.md).
3. **Reproduce:** use Python 3.12 (verified on 3.12.13). The numerical path uses the standard library, packaged aggregate inputs and no network or model calls.

The checker verifies a file-only export and deliberately rejects Git metadata. If you cloned this repository, first export its tracked files into a temporary directory; skip this step only when using the original supplied 37-file review ZIP:

```sh
review_export=$(mktemp -d)
node website/tools/export-review.mjs "$review_export"
cd "$review_export"
```

Then run the following commands from the exported directory:

```sh
python3.12 -m venv .venv
. .venv/bin/activate
export PYTHONDONTWRITEBYTECODE=1
python scripts/reproduce.py
python -m unittest discover -s tests -v
python scripts/check_release.py
```

No package installation is needed. These commands regenerate 127 proxy-output rows and 18 panel summaries from 60 retained responses. Reproduction checks byte agreement for the proxy CSV and a maximum absolute difference of 1e-12 for the panel summaries. The tests also reject corrupt runs and check the comparison denominator. Other Python versions have not been certified for byte-identical output.

## The argument

Available evidence supports conditional spending scenarios, not a measured national adoption trajectory. The proxy's 2035 middle scenarios are about **$448m for India** and **$11.8m for Pakistan**, at 2025 prices. Reducing possible overlap in the income and job-advertisement growth assumptions lowers India's midpoint to about **$215m**. These are model outputs under chosen assumptions, not calibrated forecasts. A missing Pakistan sales anchor does not mean zero sales.

The separately authored forecast-elicitation supplement describes repeated model responses. Its regional product scope and uncertainty measure differ from the proxy model. The US arm is retained as methodological context in that supplement; the main chapter remains India and Pakistan. Do not pool these result families.

## Contents and boundaries

| Path | Purpose |
|---|---|
| `report/` | Editable regional chapter, limitations, readable HTML/PDF and print styles. |
| `methods/` | Exact proxy equations, executed panel method and measurement crosswalk. |
| `data/` | Aggregate numerical inputs, retained response quantiles, reference outputs and sanitized attempt metadata. |
| `scripts/` | Offline calculation, document generation and release verification. |
| `tests/` | Data-integrity and scientific-denominator checks. |
| `provenance/` | Sources, claim review, source transformations and explicit release allowlist. |
| `build/` | Regenerated tables and computational verification receipt. |

This file-only edition contains no Git history, raw questionnaire, collaborator draft, interview, provider transcript, household microdata or third-party full-text archive. Numerical reproduction begins at the supplied aggregate input table. It does not reacquire every source or repeat the original elicitation. Hashes establish byte identity, not rights or scientific validity.

[RIGHTS.md](RIGHTS.md) records source-specific boundaries. No blanket content or software licence is granted. Human verification must cover all included AI-produced or AI-edited claims, citations, statistics, quotations, data and code. The [AI-use statement](report/limitations-and-ai-use.md) and blank review register make that remaining work explicit.

To rebuild the readable HTML with the optional Pandoc tool, run `python scripts/build_documents.py`. The checked PDF is supplied; rendering precautions are recorded in `provenance/document-build.json`, and its renderer is identified in the PDF metadata. Document rendering is separate from numerical reproduction.

## Proposed integration

The chapter is modular: place it after the US contribution in a unified report, with exact methods in an appendix. Common definitions remain proposals until authors agree. Retain each strand's actual products, channels, years and uncertainty labels. Write the cross-regional synthesis and abstract only after those contributions are accepted. This package does not imply another contributor's approval.

For a correction, identify the exact sentence or data row, the original source and its date, the proposed change and its effect on the outputs. [CONTRIBUTING.md](CONTRIBUTING.md) explains the review sequence.
