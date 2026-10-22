"""Check meaningful negative cases for the curated release and receipt boundary."""

import csv
import hashlib
import io
import json
import sys
import tempfile
import unittest
from collections import Counter
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import check_release
from check_release import Links, scan_text


class BoundaryTests(unittest.TestCase):
    """Reject metadata leaks and active or network-dependent HTML embeddings."""

    def test_sensitive_paths_and_values_are_detected_without_echo(self) -> None:
        """Synthetic strings exercise categories without retaining real credentials."""
        examples = [
            "/" + "Users" + "/synthetic/private-note",
            "https://" + "docs.google.com/" + "document/d/synthetic",
            "sk-" + "x" * 35,
            "Bearer " + "x" * 35,
        ]
        for example in examples:
            with self.subTest(kind=example[:2]):
                findings = scan_text(example)
                self.assertTrue(findings)
                self.assertNotIn(example, str(findings))

    def test_network_and_active_embeds_are_rejected(self) -> None:
        """Protocol-relative embeds and indirect navigation must also fail."""
        for markup in (
            '<img src="//example.invalid/image.png">',
            '<meta http-equiv="refresh" content="0;url=https://example.invalid">',
            '<img srcset="example.png 1x">',
            '<base href="https://example.invalid/">',
            '<a onclick="alert(1)">unsafe</a>',
            '<iframe src="frame.html"></iframe>',
        ):
            parser = Links()
            parser.feed(markup)
            self.assertTrue(parser.unsafe, markup)

    def test_public_citations_are_passive(self) -> None:
        """A normal external citation is permitted without being fetched."""
        parser = Links()
        parser.feed('<a href="https://gfi.org/marketresearch/">Source</a>')
        self.assertEqual(parser.unsafe, [])
        self.assertEqual(scan_text("Muhammad Umar Zafar; GFI India; 2026 review"), [])

    def test_accepted_receipts_match_numeric_cohort(self) -> None:
        """Every packaged response has exactly one accepted receipt; retries stay visible."""
        with (ROOT / "data/panel-attempts.csv").open(newline="") as stream:
            attempts = list(csv.DictReader(stream))
        self.assertEqual(
            Counter(row["status"] for row in attempts),
            {"ACCEPTED": 60, "REJECTED": 15, "EXECUTION_ERROR": 3, "RUNNING": 1},
        )
        accepted = [
            (row["model"], row["region"], int(row["slot"]))
            for row in attempts
            if row["status"] == "ACCEPTED"
        ]
        runs = json.loads((ROOT / "data/panel_runs.json").read_text())["runs"]
        self.assertEqual(len(set(accepted)), 60)
        self.assertEqual(
            set(accepted), {(row["model"], row["region"], row["slot"]) for row in runs}
        )
        for row in attempts:
            if row["status"] == "ACCEPTED" and row["model"] == "gpt-6-astra":
                self.assertEqual(row["provider_reported_models"], "")


class ReleaseMainTests(unittest.TestCase):
    """Exercise manifest and cross-file checks through the actual command entry."""

    def check_fixture(self, files: dict[str, str], note: str = "") -> dict:
        """Run an isolated synthetic package and return only the validation report."""
        with tempfile.TemporaryDirectory(prefix="release-check-") as directory:
            root = Path(directory).resolve()
            rows = []
            for name, content in files.items():
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(content)
                rows.append(
                    {
                        "path": name,
                        "bytes": len(target.read_bytes()),
                        "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
                    }
                )
            (root / "provenance").mkdir(exist_ok=True)
            (root / check_release.MANIFEST).write_text(
                json.dumps({"files": rows, "note": note})
            )
            capture = io.StringIO()
            with patch.object(check_release, "ROOT", root), patch.object(
                sys, "argv", ["check_release.py", "--strict"]
            ), redirect_stdout(capture):
                try:
                    check_release.main()
                except SystemExit as error:
                    self.assertEqual(error.code, 1)
            return json.loads(capture.getvalue())

    def test_manifest_metadata_is_scanned(self) -> None:
        """The self-excluded integrity manifest still receives a content check."""
        result = self.check_fixture(
            {"README.md": "Review"}, "/" + "Users" + "/synthetic/private"
        )
        self.assertEqual(result["status"], "FAIL")
        self.assertIn("local home path: manifest", result["errors"])

    def test_css_and_cross_file_anchors_are_checked(self) -> None:
        """A valid file alone is insufficient when its named fragment is absent."""
        files = {
            "index.html": '<a href="other.html#absent">Link</a>',
            "other.html": '<h1 id="present">Title</h1>',
            "style.css": '@import "https://example.invalid/style.css";',
        }
        result = self.check_fixture(files)
        self.assertEqual(result["status"], "FAIL")
        self.assertTrue(any("Missing HTML anchor" in item for item in result["errors"]))
        self.assertTrue(any("CSS resource" in item for item in result["errors"]))
        files["index.html"] = '<a href="other.html#present">Link</a>'
        files["style.css"] = "body { color: black; }"
        self.assertEqual(self.check_fixture(files)["status"], "PASS")


if __name__ == "__main__":
    unittest.main()
