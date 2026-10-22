# Reproduced tables

Units: million US dollars at constant 2025 prices unless stated. Proxy and panel categories differ; these are separate result families.

## Conditional proxy scenarios

| Country | Year | P10 | Median | P90 |
|---|---:|---:|---:|---:|
| India | 2026 | 68.6 | 93.2 | 125 |
| India | 2030 | 102 | 188 | 334 |
| India | 2035 | 166 | 448 | 1,142 |
| Pakistan | 2026 | 1.47 | 3.64 | 6.62 |
| Pakistan | 2030 | 2.28 | 5.98 | 13.7 |
| Pakistan | 2035 | 3.59 | 11.8 | 36.1 |

These are percentiles of 10,000 assumption-driven draws, not calibrated probability intervals.

## Separate panel: percentiles of accepted run medians

| Model | Region | Year | P10 across runs | Median | P90 across runs |
|---|---|---:|---:|---:|---:|
| gpt-6-astra | us | 2026 | 7,550 | 7,600 | 7,650 |
| gpt-6-astra | us | 2030 | 8,200 | 8,300 | 8,500 |
| gpt-6-astra | us | 2035 | 10,500 | 10,650 | 11,000 |
| gpt-6-astra | india | 2026 | 65.0 | 70.0 | 75.5 |
| gpt-6-astra | india | 2030 | 138 | 155 | 167 |
| gpt-6-astra | india | 2035 | 324 | 370 | 422 |
| gpt-6-astra | pakistan | 2026 | 5.00 | 6.00 | 7.20 |
| gpt-6-astra | pakistan | 2030 | 10.9 | 14.5 | 18.4 |
| gpt-6-astra | pakistan | 2035 | 27.6 | 37.0 | 60.0 |
| claude-opus-5-5 | us | 2026 | 7,595 | 7,600 | 7,655 |
| claude-opus-5-5 | us | 2030 | 7,090 | 7,200 | 7,300 |
| claude-opus-5-5 | us | 2035 | 6,880 | 7,000 | 7,320 |
| claude-opus-5-5 | india | 2026 | 30.9 | 50.0 | 65.0 |
| claude-opus-5-5 | india | 2030 | 49.8 | 91.0 | 108 |
| claude-opus-5-5 | india | 2035 | 84.2 | 158 | 191 |
| claude-opus-5-5 | pakistan | 2026 | 2.45 | 3.35 | 5.23 |
| claude-opus-5-5 | pakistan | 2030 | 4.44 | 5.50 | 9.01 |
| claude-opus-5-5 | pakistan | 2035 | 7.96 | 9.35 | 15.3 |

Ten accepted runs per model/region. These percentiles describe model-output variation; they are not human-expert votes or calibrated sales uncertainty.

## Material sensitivities

| Quantity | Median (million USD_2025) |
|---|---:|
| India 2035, drift-overlap adjustment | 215 |
| Pakistan 2035, omit urban/animal multipliers | 8.32 |
