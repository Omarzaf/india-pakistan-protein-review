# Desk-research record

These files record the desk research behind the South Asia report, from 12 September to 20 October 2026. They are the logs and registers the report's methodology section describes. They are kept as they were written, apart from removing links to files that are not part of this repository.

| File                                                                                           | Stage                                              | What it holds                                                                                            |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `literature-query-log-2026-09-12.md`                                                           | AI and protein literature foundation, 11 to 12 Sep | 21 logged search strings and the evidence cutoff                                                         |
| `comparative-research-log-2026-09-13.md`                                                       | Comparative protein-transition synthesis, 13 Sep   | Search families and exclusion rules for industry and advocacy sources                                    |
| `india-pakistan-source-register-2026-09-14.json`                                               | India and Pakistan brief, 14 Sep                   | 20 records: official statistics, published consumer studies, policy and standards pages                  |
| `survey-studies-2026-09-30.csv`, `survey-findings-2026-09-30.csv`                              | Consumer survey extraction, 30 Sep                 | 9 studies and 29 retained findings, extracted from published results                                     |
| `halal-phase1-research-log-2026-09-30.md`                                                      | Halal Phase One review, 30 Sep                     | Reading order: English manuals first, Arabic passages next                                               |
| `halal-search-log-2026-10-02.json`                                                             | Halal working paper, 2 Oct                         | 152 logged search entries, some with Arabic terms                                                        |
| `public-data-search-log-2026-10-11.json`                                                       | Public-data search, 11 Oct                         | 27 logged page visits. The log says it is not a complete browser audit                      |
| `evidence-ledger-2026-10-13.csv`                                                               | Evidence edition, 13 Oct                           | 916 source records with tier, access method and access date                                              |
| `raw-file-manifest-2026-10-13.csv`                                                             | Evidence edition, 13 Oct                           | 1,987 raw-file rows behind the ledger. The raw files themselves are not redistributed                    |
| `purchase-literature-queries-2026-10-20.json`, `purchase-literature-screening-2026-10-20.json` | Bounded purchase-literature check, 20 Oct          | 3 PubMed and 3 web queries; 27 records screened, 1 retained. Frozen on 22 Oct and not used in the report |

## Tiers in the evidence ledger

| Tier | Meaning                                                     | Rows |
| ---- | ----------------------------------------------------------- | ---: |
| A    | Official data and peer-reviewed papers with a stated sample |  147 |
| B    | GFI, USDA FAS GAIN, UN agency reports and trackers          |  114 |
| C    | Market summaries, news and company releases                 |  472 |
| D    | Social media, Google Trends and language-model output       |  183 |

Tier D cannot supply headline evidence. The ledger includes discovery records, failed retrievals and held sources, so its row count is a record of what was looked at, not a count of sources the report relies on.

## Limits

No single preregistered search protocol covers all stages. Each stage kept its own log. The core official statistics (FAOSTAT, SOFI, the Joint Child Malnutrition Estimates, HIES and MoSPI) were chosen directly as named series, so they have no search string. Third-party documents are not redistributed; the ledger points to their original addresses.
