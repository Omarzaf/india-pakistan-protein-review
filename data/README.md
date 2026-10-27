# Data dictionary

All data here are aggregate inputs or quantitative model outputs. No row represents an identified person or household.

| File | Rows / structure | Meaning |
|---|---|---|
| `altprotein_proxy_inputs.csv` | 106 input rows | `input_id` is unique; `country`, `year`, `quantity`, numeric `value` and `unit` define the input. `source_id`, `tier`, `raw_file`, `raw_sha256`, `raw_locator`, `notes` retain lineage. `raw_file` names an excluded capture; it is not a runtime dependency or a path supplied by the recipient. |
| `reference_proxy_scenarios.csv` | 127 rows | Frozen original output. `row_id` uniquely identifies country/year/quantity/statistic. Units and source IDs accompany every row. Includes assumptions, paths, scenarios and sensitivities. |
| `panel_runs.json` | 60 accepted model/region/slot records | Headline retail responses in million USD at 2025 prices. `h2026`, `h2030`, `h2035` each contain elicited `p10`, `p50`, `p90`. `n_sources` is retained answer-source metadata, not an independent credibility score. Requested model labels do not independently establish provider identity. |
| `reference_panel_aggregates.json` | 18 model/region/year rows | `p10`, `p50`, `p90` are percentiles of ten accepted run medians. `run_p10_median` and `run_p90_median` summarize elicited within-answer bounds separately. They are not pooled predictive bounds. |
| `panel-attempts.csv` | 79 recorded attempts | Status is ACCEPTED, REJECTED, EXECUTION_ERROR or RUNNING. Slot is unique only within a model/region accepted set; retries repeat it. Requested and provider-reported identity remain separate. UTC dates may be blank for incomplete records. Reason categories are sanitized. Receipt/parsed SHA-256 values point to privately retained originals, which are excluded. |

`build/proxy_scenarios.csv` and `build/panel_aggregates.json` are reproduced outputs, not additional evidence. `build/tables.md` uses display rounding; use full-precision CSV/JSON for checks. `build/verification.json` reports computational reproduction only.

Price year, observation year and forecast year are different fields in the interpretation. India's 2022 anchor is converted to 2025 prices. Comparisons with the US use its fixed 2025 per-person value. Product categories differ between the fermentation-inclusive proxy and the plant-based regional panel; consult the measurement crosswalk before comparing them.

## 27 October diagnostic and driver inputs

- `gfi_categories.csv`: 20 source cells from physical page 4 of the GFI/Deloitte PDF, preserving the fermentation dash and source locators.
- `driver-evidence.json`: eight scoped factors, dated source records and explicit missing/evidence limits.
- `recommendations.csv`: seven author proposals, linked to driver IDs with proposed baselines, comparators and outcomes.
- `../build/gfi-gap/`: separate deterministic diagnostics; `factor-draws.csv` contains 10,000 draw-level factorizations for offline inspection and is excluded from the website payload.

These additions do not change the retained 106 inputs, 127 reference rows or panel response/reference files. Missing values and unreviewed claims retain their status.
