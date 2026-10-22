# Historical household-demand diagnostics

**Public excerpt · retained evidence, human scholarly review pending.** Historical household-model methods, results, scenarios, sensitivity and validation sections only. The broader historical elicitation appendix and private execution/provenance routes are omitted. These diagnostics use a narrower meat-and-liquid-milk estimand and do not supersede the current proxy or 60-response panel. Footnote markers refer to the original report; this excerpt does not claim a complete bibliography.

## 3. Household model and uncertainty

For each country, year and segment-product pair, expected value is the addressable household count multiplied by adoption probability and annual spend per adopter. Addressable households equal population divided by weighted survey household size, multiplied by the survey addressable share scaled by the urban-share path, bounded by all households. Adoption equals US-calibrated conversion times country intention times a relative-price adjustment times the Bass cumulative adoption fraction, bounded to [0,1]. Spending scales US adopter spending by the ratio of target to US real income raised to the measured income elasticity. Price and income terms require finite operands and coefficients: neutral exponent identities never turn absent inputs into known values.

Elasticities come from purchaser-only equations with fixed effects and leave-one-out cell unit values. They describe the intensive margin among recorded purchasers. They neither identify participation by non-purchasers nor remove quality bias or cell-price measurement error. Requiring all equation prices reduces the usable sample. Five hundred actual design/PSU bootstrap draws are recentered on the point estimates; one bootstrap row is sampled per country, preserving dependence among its price, cross-price and income coefficients. Failed coefficients propagate missingness, rather than being dropped from quantiles. Positive own-price coefficients are capped at zero in simulation (R25), leaving India dairy with little or no price response. This does not repair identification, and can materially change scenario response. The main India run caps 29,937 of 60,000 own-price coefficient evaluations.

For vegetarian households, the negative expenditure-weighted chicken-equation cross-price coefficients on paneer, soya and pulses adjust the inverse relative premium. The same substitute basket supplies its price comparison. This is a diagnostic transfer assumption, not an estimated plant-based vegetarian own-price elasticity. The literal signed alternative is reported separately with paired random draws. Halal compliance for sold Pakistan products is assumed; it is not an estimated probability or scenario switch.

No eligible local analog time series survived the registered diffusion screen, so the main path uses the fixed Bass prior p=0.03, q=0.38. South Asian launch dates remain assumptions recorded in the protocol. The US stress scenario uses its fitted shape on each country's launch clock. The fixed prior creates no sampled diffusion uncertainty; a narrow main interval cannot be read as evidence that diffusion speed is known.[^bass]

One joint Monte Carlo uses 10,000 draws and seed 20261018. India and US intention draws use Beta(mean times n, (1 minus mean) times n), with source sample sizes 1024 and 987; a fixed inverse-CDF grid is used. Pakistan uses its registered transfer range. Driver bands are mapped by an assumed piecewise-linear quantile function through low/mid/high at coordinates 0/0.5/1. The endpoints are not claimed to be calibrated tail probabilities. Dependence among these grouped factors is assumed absent except for explicitly shared US intention and joint coefficient draws. These assumptions omit important structural, measurement, source and between-model uncertainty. Reported p10-p90 values therefore describe a conditional simulation distribution, not an 80% guarantee about future markets.

Volumes divide value by projected plant-product prices. Liquid milk uses the explicit one litre equals one kilogram convention; no protein-tonnage claim follows. The meat-eating channel is capped by 2023 FAOSTAT poultry food supply per person scaled with population, with one kilogram plant product assumed to displace one kilogram chicken product. The cap reduces value and volume together; it does not constrain the vegetarian channel. No India main or stress draw binds this ceiling. This is a supply-based plausibility bound, not observed substitution evidence.

## 4. Results and scope coverage

All values in the next table are million USD at 2025 prices. Held cells are not zero. Pakistan proxy values are retained because they come from a separate existing proxy calculation, not from the held household plant-price input.

| country | year | method | p10 | p50 | p90 | status |
| --- | --- | --- | --- | --- | --- | --- |
| India | 2026 | household_model | 675.554 | 712.415 | 754.481 | DIAGNOSTIC |
| India | 2026 | gfi_proxy | 68.638 | 93.237 | 124.506 | PROXY_SCENARIO |
| India | 2030 | household_model | 1,280.380 | 1,351.182 | 1,431.195 | DIAGNOSTIC |
| India | 2030 | gfi_proxy | 101.825 | 187.812 | 334.480 | PROXY_SCENARIO |
| India | 2035 | household_model | 1,803.716 | 1,909.799 | 2,024.744 | DIAGNOSTIC |
| India | 2035 | gfi_proxy | 165.637 | 447.504 | 1,141.553 | PROXY_SCENARIO |
| Pakistan | 2026 | household_model | held | held | held | HELD_PLACEHOLDER_INPUT |
| Pakistan | 2026 | gfi_proxy | 1.472 | 3.645 | 6.617 | PROXY_SCENARIO |
| Pakistan | 2030 | household_model | held | held | held | HELD_PLACEHOLDER_INPUT |
| Pakistan | 2030 | gfi_proxy | 2.280 | 5.977 | 13.682 | PROXY_SCENARIO |
| Pakistan | 2035 | household_model | held | held | held | HELD_PLACEHOLDER_INPUT |
| Pakistan | 2035 | gfi_proxy | 3.592 | 11.759 | 36.100 | PROXY_SCENARIO |

India component results separate the modelled channels. Their medians need not sum exactly to the median of the joint total.

| year | pair | p10 | p50 | p90 |
| --- | --- | --- | --- | --- |
| 2026 | dairy | 272.975 | 285.977 | 298.920 |
| 2026 | meat | 250.915 | 273.825 | 299.854 |
| 2026 | vegetarian | 138.644 | 152.389 | 167.609 |
| 2030 | dairy | 534.009 | 560.598 | 586.957 |
| 2030 | meat | 465.620 | 507.974 | 555.532 |
| 2030 | vegetarian | 257.164 | 282.836 | 311.057 |
| 2035 | dairy | 781.357 | 823.311 | 865.857 |
| 2035 | meat | 638.748 | 697.462 | 762.334 |
| 2035 | vegetarian | 352.972 | 388.231 | 427.295 |

India product-volume quantiles, tonnes:

| year | p10 | p50 | p90 |
| --- | --- | --- | --- |
| 2026 | 163,833.076 | 170,888.948 | 177,866.629 |
| 2030 | 316,530.274 | 330,640.184 | 345,092.939 |
| 2035 | 456,133.518 | 478,613.339 | 502,049.887 |

Neither country has a complete observed mapped protein-food basket for any household: India 0 of 261,953; Pakistan 0 of 30,123. Missing purchase observations are not assigned zero. Whole-protein monetary spending denominators and spending shares therefore remain null. The supply benchmark's grams of protein per person per day cannot supply a monetary denominator. Likewise the modelled subtotal plus the requested residual remains null. These are identification limits, not failed formatting or a zero-sized category.

### Paired scenario results

Each row below uses the same 10,000 factor draws. `paired_delta_p50` is the median of draw-by-draw differences from main, not a subtraction of marginal medians. AI declines of 2% and 5% annually are illustrative input assumptions; price parity by 2030 is an illustrative date, not a source-backed forecast. AI affects the plant price ratio and its price/volume consequences, rather than adding an arbitrary market-growth premium.

| year | scenario | p10 | p50 | p90 | paired_delta_p50 |
| --- | --- | --- | --- | --- | --- |
| 2026 | main | 675.554 | 712.415 | 754.481 | 0.000 |
| 2030 | main | 1,280.380 | 1,351.182 | 1,431.195 | 0.000 |
| 2035 | main | 1,803.716 | 1,909.799 | 2,024.744 | 0.000 |
| 2026 | us_stress | 34.162 | 36.026 | 38.153 | -676.389 |
| 2030 | us_stress | 497.969 | 525.506 | 556.624 | -825.676 |
| 2035 | us_stress | 1,744.677 | 1,847.288 | 1,958.471 | -62.511 |
| 2026 | ai_2pct | 675.554 | 712.415 | 754.481 | 0.000 |
| 2030 | ai_2pct | 1,308.710 | 1,380.273 | 1,461.371 | 29.363 |
| 2035 | ai_2pct | 1,892.911 | 2,003.502 | 2,121.723 | 93.495 |
| 2026 | ai_5pct | 675.554 | 712.415 | 754.481 | 0.000 |
| 2030 | ai_5pct | 1,354.872 | 1,428.450 | 1,511.409 | 77.346 |
| 2035 | ai_5pct | 2,048.511 | 2,168.125 | 2,297.181 | 258.470 |
| 2026 | parity_2030 | 675.554 | 712.415 | 754.481 | 0.000 |
| 2030 | parity_2030 | 2,022.134 | 2,172.179 | 2,344.281 | 821.832 |
| 2035 | parity_2030 | 2,826.249 | 3,036.787 | 3,277.377 | 1,127.557 |
| 2026 | literal_signed | 703.887 | 744.577 | 791.868 | 32.537 |
| 2030 | literal_signed | 1,333.300 | 1,410.739 | 1,499.654 | 60.302 |
| 2035 | literal_signed | 1,877.851 | 1,991.079 | 2,117.492 | 82.744 |

The large early sensitivity to the transferred US diffusion shape shows why the fixed-prior main interval is incomplete as a total uncertainty account. The vegetarian sign comparison isolates a consequential transfer assumption. An AI price change can affect product volume even when the own-price response is capped; the inferred value response remains conditional on that cap and the cross-price mapping.

### Global sensitivity on actual model cells

Saltelli first-order and squared-difference total indices were computed from the shared deterministic evaluator for each country-year at base n=8192 and 2n=16384, eight unit-cube factors and 81,920/163,840 model evaluations per cell. Each country-year is evaluated independently with all required components retained. The largest total-effect factors for India at 2n are:[^saltelli]

| year | parameter | first_order | total | rank_total |
| --- | --- | --- | --- | --- |
| 2026 | us_intent | 0.400 | 0.403 | 2 |
| 2026 | India:elasticities | 0.460 | 0.463 | 1 |
| 2030 | us_intent | 0.377 | 0.379 | 2 |
| 2030 | India:elasticities | 0.402 | 0.406 | 1 |
| 2035 | us_intent | 0.329 | 0.332 | 1 |
| 2035 | India:elasticities | 0.319 | 0.324 | 2 |

- India 2026: top-two set stable = True; full uncertain-factor order stable = True; maximum total-index change = 0.003588.
- India 2030: top-two set stable = True; full uncertain-factor order stable = True; maximum total-index change = 0.002901.
- India 2035: top-two set stable = True; full uncertain-factor order stable = True; maximum total-index change = 0.002102.

The complete CSV retains both sample sizes, negative estimates and any first-order estimate above its total. The JSON sidecar preserves split-half differences, exact estimator settings, source hashes, fixed/inactive factors and rank diagnostics. Fixed Bass factors and degenerate urban bands have zero sensitivity by construction. Income and population effects are conditional on their chosen bands. The joint elasticity factor measures combined coefficient uncertainty; it cannot identify separate causal contributions for each coefficient. n/2n agreement is a numerical stability check, not a convergence certificate or validation of the input distributions. Pakistan calculations and their diagnostics remain in the separate placeholder-derived research directory; no Pakistan numerical sensitivity is copied into this report.

## 5. Validation and falsification limits

Leave-one-state-out validation evaluates observed-item animal spending per person per month, in survey-price INR, using demographics only: household size, urban/rural sector, religion and caste. Training-only weighted log1p regression, centering, scaling and smearing prevent heldout outcome leakage. MPCE, food quantities, unit values, segments and state effects are excluded. Within each training fold, nested heldout-state log errors supply the empirical 10th/90th interval; no outer heldout outcome calibrates its own interval.

The real run evaluates 254,364 households across 36 states; 7,589 households have no valid animal-item observation. All eight animal groups are observed together for zero households. State MAE is INR203.569486 per person per month; median absolute percentage error is 25.438567%; measured coverage is 75.0% (27/36) against nominal 80%. The model compresses state differences and nine states miss their interval. This is informative evidence of imperfect geographic transfer.

These intervals are empirical state-transfer predictive intervals, not survey-design confidence intervals. Observed-item sums vary in coverage and cannot validate complete spending totals. The separately refitted training-fold elasticities diagnose coefficient stability; they do not drive the demographic predictions. This exercise does not validate plant adoption, the structural price response or future alternative-protein value. Temporal validation against earlier harmonized HCES rounds remains unrun pending the author's microdata registration and compatible data.
