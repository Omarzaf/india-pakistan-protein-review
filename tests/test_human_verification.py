"""Human-verification contract, 10 November 2026.

The author stated on 10 November 2026 that he had verified this repository. These
checks require the two review registers, the allowlist and the current status lines
to record that statement, and require the states the statement does not cover
(rights, team acceptance, scholarly review, open assumptions) to stay open.
"""

from __future__ import annotations

import csv
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REVIEWER = "Muhammad Umar Zafar"
DATE = "2026-11-10"
RECORD = "provenance/human-verification-2026-11-10.md"

# Files whose status line describes the current state of the repository.
# report/ is the 27 October draft and keeps its original status line.
CURRENT_STATUS_FILES = [
    "README.md",
    "CITATION.cff",
    "RIGHTS.md",
    "provenance/sources.md",
    "provenance/claims.md",
    "methods/proxy.md",
    "methods/gfi-gap.md",
    "methods/drivers.md",
    "methods/dated-context.md",
    "methods/panel-supplement.md",
    "halal/phase1-review.md",
]
STALE = re.compile(
    r"(?i)human[^.\n|]{0,60}(verification|review|fact-checking)[^.\n|]{0,40}"
    r"\b(is|are|remain|remains|still)?\s*(pending|outstanding)"
)


def rows(relative: str) -> list[dict[str, str]]:
    with (ROOT / relative).open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


class HumanVerificationTests(unittest.TestCase):
    def test_claim_review_register_names_reviewer_and_date(self) -> None:
        register = rows("provenance/claim-review.csv")
        self.assertEqual(len(register), 39)
        for row in register:
            with self.subTest(claim=row["claim_id"]):
                if row["claim_id"] == "ALL-RIGHTS":
                    self.assertEqual(row["reviewer"], "")
                    self.assertEqual(row["disposition"], "pending")
                else:
                    self.assertEqual(row["reviewer"], REVIEWER)
                    self.assertEqual(row["reviewed_date"], DATE)
                    self.assertEqual(row["disposition"], "verified")
                self.assertEqual(row["release_permission"], "pending")

    def test_claim_register_records_author_review_on_every_row(self) -> None:
        register = rows("provenance/claims-by-section-2026-10-30.csv")
        self.assertEqual(len(register), 438)
        verified = [r for r in register if r["status"] == "verified"]
        unresolved = [r for r in register if r["status"] == "unresolved"]
        self.assertEqual((len(verified), len(unresolved)), (432, 6))
        for row in verified:
            self.assertEqual(row["human_review"], f"verified by author {DATE}")
        for row in unresolved:
            self.assertIn(DATE, row["human_review"])
            self.assertIn("unresolved", row["human_review"])

    def test_allowlist_records_verification_and_keeps_rights_open(self) -> None:
        allowlist = json.loads(
            (ROOT / "provenance/release-allowlist.json").read_text(encoding="utf-8")
        )
        self.assertIn(DATE, allowlist["human_verification"])
        self.assertNotEqual(allowlist["human_verification"], "pending")
        self.assertIn("pending", allowlist["rights_status"])
        self.assertIs(allowlist["publication_authorized"], False)
        listed = {entry["path"]: entry for entry in allowlist["files"]}
        self.assertIn(RECORD, listed)
        for entry in allowlist["files"]:
            self.assertNotIn("human_and_rights_review_pending", entry["release_status"])
            self.assertIn("rights_review_pending", entry["release_status"])

    def test_record_states_what_was_and_was_not_verified(self) -> None:
        record = (ROOT / RECORD).read_text(encoding="utf-8")
        for phrase in (REVIEWER, "10 November 2026", "AI agent", "rights", "unresolved"):
            self.assertIn(phrase, record)

    def test_current_status_lines_no_longer_say_human_review_is_pending(self) -> None:
        for relative in CURRENT_STATUS_FILES:
            with self.subTest(path=relative):
                text = (ROOT / relative).read_text(encoding="utf-8")
                found = [m.group(0) for m in STALE.finditer(text)]
                self.assertEqual(found, [])

    def test_driver_ledger_records_author_review(self) -> None:
        ledger = json.loads((ROOT / "data/driver-evidence.json").read_text(encoding="utf-8"))
        self.assertEqual(len(ledger["drivers"]), 8)
        for driver in ledger["drivers"]:
            self.assertEqual(driver["review_disposition"], f"verified_by_author_{DATE}")

    def test_scholarly_review_of_halal_readings_stays_open(self) -> None:
        matrix = (ROOT / "halal/institution-matrix.md").read_text(encoding="utf-8")
        self.assertIn("qualified human review remains pending", matrix)


if __name__ == "__main__":
    unittest.main()
