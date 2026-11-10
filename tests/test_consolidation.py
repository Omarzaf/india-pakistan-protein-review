"""Consolidation contract: this repository is the single companion to the South Asia report.

Written before the consolidation files were added (7 Nov 2026). It checks that the
desk-research record, the halal evidence and the Pakistan scale check live here, that
each file is in the release allowlist with a matching hash, and that the README names
the report and no longer points readers to the archived research library.
"""

from __future__ import annotations

import csv
import hashlib
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ALLOWLIST = json.loads(
    (ROOT / "provenance/release-allowlist.json").read_text(encoding="utf-8")
)
LISTED = {entry["path"]: entry for entry in ALLOWLIST["files"]}

REQUIRED = [
    "desk-research/README.md",
    "desk-research/evidence-ledger-2026-10-13.csv",
    "desk-research/raw-file-manifest-2026-10-13.csv",
    "desk-research/india-pakistan-source-register-2026-09-14.json",
    "desk-research/survey-studies-2026-09-30.csv",
    "desk-research/survey-findings-2026-09-30.csv",
    "desk-research/literature-query-log-2026-09-12.md",
    "desk-research/comparative-research-log-2026-09-13.md",
    "desk-research/halal-phase1-research-log-2026-09-30.md",
    "desk-research/halal-search-log-2026-10-02.json",
    "desk-research/public-data-search-log-2026-10-11.json",
    "desk-research/purchase-literature-queries-2026-10-20.json",
    "desk-research/purchase-literature-screening-2026-10-20.json",
    "halal/README.md",
    "halal/phase1-review.md",
    "halal/institution-matrix.md",
    "data/pakistan-topdown/README.md",
    "data/pakistan-topdown/sources.json",
    "build/pakistan-topdown/pakistan_topdown.csv",
    "scripts/pakistan_topdown.py",
]


class ConsolidationTests(unittest.TestCase):
    def test_required_files_exist_and_are_allowlisted(self) -> None:
        for rel in REQUIRED:
            with self.subTest(path=rel):
                path = ROOT / rel
                self.assertTrue(path.is_file(), f"missing {rel}")
                self.assertIn(rel, LISTED, f"{rel} not in release allowlist")
                digest = hashlib.sha256(path.read_bytes()).hexdigest()
                self.assertEqual(LISTED[rel]["sha256"], digest, f"stale hash for {rel}")
                self.assertEqual(LISTED[rel]["bytes"], path.stat().st_size)

    def test_ledger_counts_match_report_statements(self) -> None:
        rows = list(
            csv.DictReader(
                (ROOT / "desk-research/evidence-ledger-2026-10-13.csv").open(
                    encoding="utf-8"
                )
            )
        )
        self.assertEqual(len(rows), 916)
        tiers = {t: sum(1 for r in rows if r["tier"] == t) for t in "ABCD"}
        self.assertEqual(tiers, {"A": 147, "B": 114, "C": 472, "D": 183})
        self.assertEqual(len({r["url"] for r in rows if r["url"]}), 773)

    def test_scale_check_range_matches_report(self) -> None:
        text = (ROOT / "build/pakistan-topdown/pakistan_topdown.csv").read_text(
            encoding="utf-8"
        )
        self.assertIn("2035", text)

    def test_readme_points_to_report_not_archive(self) -> None:
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn("desk-research/", readme)
        self.assertIn("halal/", readme)
        self.assertNotIn("sentient-futures-research", readme)
        self.assertNotIn("docs.google.com", readme)

    def test_desk_research_index_lists_every_file(self) -> None:
        index = (ROOT / "desk-research/README.md").read_text(encoding="utf-8")
        for path in sorted((ROOT / "desk-research").iterdir()):
            if path.name != "README.md":
                with self.subTest(file=path.name):
                    self.assertIn(path.name, index)


if __name__ == "__main__":
    unittest.main()
