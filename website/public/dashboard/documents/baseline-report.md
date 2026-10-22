# 20 October baseline reconciliation

**Public excerpt · retained evidence, human scholarly review pending.** The original reconciliation findings and acceptance limits are preserved. Private execution references and unpublished operational receipts are omitted. This is a dated review, not a new calculation.

# India–Pakistan baseline reconciliation

20 October 2026. Local research work on `codex/data-acquisition-20261019`.

**Independent arithmetic is reproduced; both official baselines remain held.**
This execution resolved several source-definition gaps and corrected an
overstated method flag. It did not establish the remaining official production
recipes or approve new empirical model inputs.

## Recomputed results

| Measure | Declared reconstruction | Published target | Decision |
|---|---:|---:|---|
| India rural protein, g/person/day | 61.099055 | 61.8 | Outside unchanged ±0.5 |
| India urban protein, g/person/day | 62.692731 | 63.4 | Outside unchanged ±0.5 |
| Pakistan national chicken, kg/person/month | 0.354602 | 0.34 | Outside `[0.335, 0.345)` |
| Pakistan rural chicken, kg/person/month | 0.302954 | 0.29 | Diagnostic sector mismatch |
| Pakistan urban chicken, kg/person/month | 0.436240 | 0.41 | Diagnostic sector mismatch |

India's alternative observed-roster `X+G` diagnostic is still
61.739775 / 63.414554. Its numerical agreement does not establish the official
unadjusted table method. Neither a CPI variant nor a channel exclusion was
selected to force agreement. Pakistan's national target controls its existing
gate; sector comparisons add diagnostics without changing that gate.

The separate India implementation agrees within 1.43×10⁻¹⁴ g/person/day.
Pakistan's independent Python calculation agrees with the declared Python
calculation from Stata files within 5.56×10⁻¹⁷ kg/person/month. A separate R reader
of the official SPSS format also agrees within storage precision. These are
checks of arithmetic and reading paths, not independent populations or proof
of an unpublished official algorithm.

## Resolved during execution

- **India FDQ membership:** the official layout identifies byte 69 as the
  generated food-questionnaire member flag. `original_member=1` counts match
  FDQ household size for all 261,953 households. The 2,162 other roster records
  have missing away-meal fields, so correcting selection leaves the observed
  meal sum unchanged.
- **India parser layout:** 20 critical field offsets match the official layout;
  all 15 cleaned candidate files remain hash-bound. This verifies the inspected
  parser specification, not the unavailable original raw records.
- **Pakistan geography and sample:** ICT PSU prefix 6 and analytical province
  code 2 represent different fields. The complete original social report
  confirms ICT's inclusion in Punjab. Its four-province/ICT covered sample
  matches the release's 30,123 households and 2,153 PSUs; the wider survey's
  AJK/GB sample is separate.
- **Pakistan quarter:** processing-code position V matches the released quarter
  field throughout the sample. The write-up's reference to position VI conflicts
  with its heading and the records. Coded quarter is still distinct from actual
  interview dates.
- **Pakistan method metadata:** the current producer now distinguishes a
  complete declared comparator from a verified Table 23 recipe. All 18
  numerical variants are unchanged. Historical outputs retain their original
  flags; the new reviewed receipt records the correction.

## What still prevents acceptance

India needs the exact unadjusted meal algorithm, CPI family/normalization, and
blank/absent-item rules. Pakistan needs the official monthly quantity-table
recipe, reconciliation of report/workbook/release versions, and sparse-item/
channel-null semantics. These are specific method questions, not missing code.

Original Indian raw lineage and both countries' final variance designs remain
separate research-assurance requirements. The baseline thresholds were not
expanded to require variance certification; passing them would still not
constitute complete research or human scholarly approval.

[Prepared method questions](/dashboard/documents/baseline-questions.md) identify the evidence that would
resolve each hold. They are drafts for review; no message or access application
was sent. New demand, market and forecast estimates remain gated.
