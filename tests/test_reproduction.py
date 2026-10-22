"""Exercise data integrity, scientific denominators and numerical failure cases."""

import copy
import csv
import json
import math
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from build_panel import aggregate, quantile, validate


class PanelTests(unittest.TestCase):
    """Reject corruption and distinguish within-response from across-run spread."""

    def setUp(self) -> None:
        """Load only packaged quantitative data."""
        self.data = json.loads((ROOT / "data/panel_runs.json").read_text())

    def test_linear_quantile_known_order_statistics(self) -> None:
        """Check analytical values independently of retained reference outputs."""
        self.assertEqual(quantile(list(range(10)), 0.1), 0.9)
        self.assertEqual(quantile(list(range(10)), 0.5), 4.5)
        self.assertEqual(quantile(list(range(10)), 0.9), 8.1)

    def test_duplicate_slot_is_rejected(self) -> None:
        """A duplicate may not silently replace an independent accepted slot."""
        self.data["runs"][1] = copy.deepcopy(self.data["runs"][0])
        with self.assertRaises(ValueError):
            validate(self.data)

    def test_missing_run_is_rejected(self) -> None:
        """Incomplete cohorts cannot use a fixed ten-run label."""
        self.data["runs"].pop()
        with self.assertRaises(ValueError):
            validate(self.data)

    def test_bad_quantiles_are_rejected(self) -> None:
        """Forbid booleans, nonfinite values, negative sales and crossed quantiles."""
        for value in (True, math.nan, math.inf, -1, 1e12):
            with self.subTest(value=value):
                variant = copy.deepcopy(self.data)
                variant["runs"][0]["h2026"]["p10"] = value
                with self.assertRaises(ValueError):
                    validate(variant)

    def test_price_basis_cannot_change_silently(self) -> None:
        """A nominal or PPP series cannot enter a constant market-dollar table."""
        self.data["unit"] = "nominal PPP dollars"
        with self.assertRaises(ValueError):
            validate(self.data)

    def test_response_quantiles_do_not_set_between_run_spread(self) -> None:
        """Altering elicited P10/P90 leaves the distribution of medians unchanged."""
        before = aggregate(self.data)
        for row in self.data["runs"]:
            for year in (2026, 2030, 2035):
                row[f"h{year}"]["p10"] = 0
                row[f"h{year}"]["p90"] *= 2
        after = aggregate(self.data)
        for first, second in zip(before, after, strict=True):
            self.assertEqual(
                [first[q] for q in ("p10", "p50", "p90")],
                [second[q] for q in ("p10", "p50", "p90")],
            )
        self.assertNotEqual(before[0]["run_p90_median"], after[0]["run_p90_median"])


class ProxyTests(unittest.TestCase):
    """Verify comparison denominators and material sensitivity boundaries."""

    @classmethod
    def setUpClass(cls) -> None:
        """Read regenerated output, requiring reproduction before verification."""
        with (ROOT / "build/proxy_scenarios.csv").open(newline="") as stream:
            cls.rows = {row["row_id"]: row for row in csv.DictReader(stream)}

    def test_per_person_us_comparison(self) -> None:
        """Reconstruct the ratio from totals and population rather than rounded prose."""
        value = lambda key: float(self.rows[key]["value"])
        us = value("united_states_2025_retail_per_capita_value")
        for country in ("india", "pakistan"):
            for year in (2026, 2030, 2035):
                prefix = f"{country}_{year}"
                per_person = value(prefix + "_market_value_p50") / value(
                    prefix + "_population_value"
                )
                self.assertAlmostEqual(
                    per_person / us * 100,
                    value(prefix + "_per_capita_share_of_us_2025_p50"),
                    places=5,
                )

    def test_drift_sensitivity_is_material(self) -> None:
        """The alternative drift assumption changes the midpoint by more than 40%."""
        original = float(self.rows["india_2035_market_value_p50"]["value"])
        adjusted = float(
            self.rows["india_2035_market_value_drift_overlap_adjusted_p50"]["value"]
        )
        self.assertGreater(adjusted, 0)
        self.assertLess(adjusted / original, 0.6)

    def test_no_generated_us_future_market(self) -> None:
        """A historical US denominator must not become an invented future forecast."""
        self.assertFalse(
            any(
                row["country"] == "United States"
                and row["year"] in {"2026", "2030", "2035"}
                for row in self.rows.values()
            )
        )


if __name__ == "__main__":
    unittest.main()
