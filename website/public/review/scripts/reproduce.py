"""Reproduce the released numerical summaries using the Python standard library."""

from __future__ import annotations

import csv
import hashlib
import json
import math
import subprocess
import sys
from pathlib import Path

from build_panel import aggregate, display

ROOT = Path(__file__).resolve().parents[1]


def read_rows(path: Path) -> list[dict[str, str]]:
    """Read a UTF-8 CSV without silently converting missing values to zero."""
    with path.open(newline="", encoding="utf-8-sig") as stream:
        return list(csv.DictReader(stream))


def main() -> None:
    """Verify reference agreement and produce readable, source-bound tables."""
    build = ROOT / "build"
    build.mkdir(exist_ok=True)
    inputs = read_rows(ROOT / "data/altprotein_proxy_inputs.csv")
    if len({row["input_id"] for row in inputs}) != len(inputs):
        raise ValueError("Duplicate proxy input IDs")
    if any(
        not row["value"] or not math.isfinite(float(row["value"])) for row in inputs
    ):
        raise ValueError("Missing or nonfinite proxy inputs")
    subprocess.run(
        [sys.executable, str(ROOT / "scripts/build_altprotein_proxy.py")], check=True
    )
    proxy = build / "proxy_scenarios.csv"
    reference = ROOT / "data/reference_proxy_scenarios.csv"
    if proxy.read_bytes() != reference.read_bytes():
        raise ValueError("Proxy reproduction differs from the preserved reference")
    subprocess.run([sys.executable, str(ROOT / "scripts/gfi_gap.py")], check=True)
    panel = aggregate(json.loads((ROOT / "data/panel_runs.json").read_text()))
    expected = json.loads((ROOT / "data/reference_panel_aggregates.json").read_text())
    if len(panel) != len(expected):
        raise ValueError("Panel aggregate count changed")
    checked = 0
    for actual, prior in zip(panel, expected, strict=True):
        for key in actual:
            if isinstance(actual[key], (float, int)):
                if not math.isclose(actual[key], prior[key], rel_tol=0, abs_tol=1e-12):
                    raise ValueError(f"Panel aggregate mismatch: {key}")
                checked += 1
            elif actual[key] != prior[key]:
                raise ValueError("Panel key or ordering mismatch")
    (build / "panel_aggregates.json").write_text(json.dumps(panel, indent=2) + "\n")
    rows = read_rows(proxy)
    lookup = {row["row_id"]: row for row in rows}
    lines = [
        "# Reproduced tables",
        "",
        "Units: million US dollars at constant 2025 prices unless stated. Proxy and panel categories differ; these are separate result families.",
        "",
        "## Conditional proxy scenarios",
        "",
        "| Country | Year | P10 | Median | P90 |",
        "|---|---:|---:|---:|---:|",
    ]
    for country in ("India", "Pakistan"):
        for year in (2026, 2030, 2035):
            values = [
                float(lookup[f"{country.lower()}_{year}_market_value_{q}"]["value"])
                for q in ("p10", "p50", "p90")
            ]
            lines.append(
                f"| {country} | {year} | "
                + " | ".join(display(v) for v in values)
                + " |"
            )
    lines += [
        "",
        "These are percentiles of 10,000 assumption-driven draws, not calibrated probability intervals.",
        "",
        "## Separate panel: percentiles of accepted run medians",
        "",
        "| Model | Region | Year | P10 across runs | Median | P90 across runs |",
        "|---|---|---:|---:|---:|---:|",
    ]
    for row in panel:
        lines.append(
            f"| {row['model']} | {row['region']} | {row['year']} | "
            + " | ".join(display(row[q]) for q in ("p10", "p50", "p90"))
            + " |"
        )
    lines += [
        "",
        "Ten accepted runs per model/region. These percentiles describe model-output variation; they are not human-expert votes or calibrated sales uncertainty.",
        "",
        "## Material sensitivities",
        "",
        "| Quantity | Median (million USD_2025) |",
        "|---|---:|",
    ]
    for label, key in (
        (
            "India 2035, drift-overlap adjustment",
            "india_2035_market_value_drift_overlap_adjusted_p50",
        ),
        (
            "Pakistan 2035, omit urban/animal multipliers",
            "pakistan_2035_market_value_without_urban_animal_p50",
        ),
    ):
        lines.append(f"| {label} | {display(float(lookup[key]['value']))} |")
    (build / "tables.md").write_text("\n".join(lines) + "\n")
    receipt = {
        "status": "PASS_computational_reproduction_only",
        "proxy_rows": len(rows),
        "proxy_byte_parity": True,
        "accepted_panel_runs": 60,
        "panel_rows": len(panel),
        "numeric_panel_checks": checked,
        "panel_tolerance": 1e-12,
        "outputs": {
            p.name: hashlib.sha256(p.read_bytes()).hexdigest()
            for p in (proxy, build / "panel_aggregates.json", build / "tables.md")
        },
        "limits": "No raw-source reacquisition, model rerun, human verification or empirical calibration is established.",
    }
    (build / "verification.json").write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps(receipt, indent=2))


if __name__ == "__main__":
    main()
