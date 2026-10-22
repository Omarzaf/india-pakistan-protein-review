"""Reconstruct model-specific panel summaries from retained numerical runs."""

from __future__ import annotations

import json
import math
from collections import Counter
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MODELS = ("gpt-6-astra", "claude-opus-5-5")
REGIONS = ("us", "india", "pakistan")
YEARS = (2026, 2030, 2035)


def quantile(values: list[float], probability: float) -> float:
    """Interpolate order statistics at (n-1)p, retaining decimal input precision."""
    if not values or not 0 <= probability <= 1:
        raise ValueError("Nonempty values and probability in [0,1] required")
    ordered = sorted(Decimal(str(value)) for value in values)
    if any(not value.is_finite() for value in ordered):
        raise ValueError("Finite observations required")
    position = Decimal(len(values) - 1) * Decimal(str(probability))
    lower = int(position)
    upper = min(lower + 1, len(values) - 1)
    return float(
        ordered[lower] + (position - lower) * (ordered[upper] - ordered[lower])
    )


def display(value: float) -> str:
    """Use three significant digits below 1000 with decimal half-up rounding."""
    number = Decimal(str(value))
    if abs(number) >= 1000:
        return format(number.quantize(Decimal(1), rounding=ROUND_HALF_UP), ",f")
    exponent = number.adjusted() - 2 if number else -2
    return format(
        number.quantize(Decimal(1).scaleb(exponent), rounding=ROUND_HALF_UP), ",f"
    )


def validate(data: dict[str, Any]) -> list[dict[str, Any]]:
    """Reject missing, duplicate, invalid or incompatible numerical observations."""
    if data.get("unit") != "million US dollars, 2025 prices":
        raise ValueError("Unexpected panel unit or price year")
    rows = data["runs"]
    if len(rows) != 60:
        raise ValueError("Exactly 60 accepted run records required")
    seen: set[tuple[str, str, int]] = set()
    counts: Counter[tuple[str, str]] = Counter()
    for row in rows:
        model, region, slot = row["model"], row["region"], row["slot"]
        if (
            model not in MODELS
            or region not in REGIONS
            or type(slot) is not int
            or not 1 <= slot <= 10
        ):
            raise ValueError("Unknown model, region or slot")
        key = (model, region, slot)
        if key in seen:
            raise ValueError("Duplicate accepted slot")
        seen.add(key)
        counts[(model, region)] += 1
        for year in YEARS:
            forecast = row[f"h{year}"]
            values = [forecast[name] for name in ("p10", "p50", "p90")]
            if any(
                type(value) not in (int, float) or not math.isfinite(value) or value < 0
                for value in values
            ):
                raise ValueError("Nonnegative finite numeric quantiles required")
            if values != sorted(values):
                raise ValueError("Unordered within-response quantiles")
    if any(counts[(model, region)] != 10 for model in MODELS for region in REGIONS):
        raise ValueError("Ten accepted runs per model and region required")
    return rows


def aggregate(data: dict[str, Any]) -> list[dict[str, Any]]:
    """Keep model/region cells and stated versus across-run quantiles separate."""
    rows = validate(data)
    output = []
    for model in MODELS:
        for region in REGIONS:
            group = [
                row for row in rows if row["model"] == model and row["region"] == region
            ]
            for year in YEARS:
                medians = [row[f"h{year}"]["p50"] for row in group]
                output.append(
                    {
                        "model": model,
                        "region": region,
                        "year": year,
                        "n": len(group),
                        **{
                            name: quantile(medians, p)
                            for name, p in (("p10", 0.1), ("p50", 0.5), ("p90", 0.9))
                        },
                        "run_p10_median": quantile(
                            [row[f"h{year}"]["p10"] for row in group], 0.5
                        ),
                        "run_p90_median": quantile(
                            [row[f"h{year}"]["p90"] for row in group], 0.5
                        ),
                    }
                )
    return output


def main() -> None:
    """Write deterministic panel aggregates without calling a model provider."""
    data = json.loads((ROOT / "data/panel_runs.json").read_text())
    destination = ROOT / "build/panel_aggregates.json"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(aggregate(data), indent=2) + "\n")


if __name__ == "__main__":
    main()
