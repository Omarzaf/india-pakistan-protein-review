"""Verify the explicit allowlist, local links and selected-content privacy boundary."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = "provenance/release-allowlist.json"
RUNTIME_DIRS = {".venv", "__pycache__"}
BAD_PARTS = {".git", ".vercel", ".governor", "private", "drive-archive", "RECOVERY"}
PATTERNS = (
    ("local home path", re.compile(r"/(?:Users|home)/[A-Za-z0-9_.-]+/")),
    ("private document URL", re.compile(r"https://(?:docs|drive)\.google\.com/")),
    (
        "credential-like value",
        re.compile(
            r"(?:sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})"
        ),
    ),
    ("private key", re.compile(r"-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----")),
    ("bearer credential", re.compile(r"(?i)bearer\s+[A-Za-z0-9._-]{25,}")),
)


class Links(HTMLParser):
    """Collect links and reject active or embedded unreviewed payloads."""

    def __init__(self) -> None:
        """Initialize parser-owned collections without external access."""
        super().__init__()
        self.links: list[str] = []
        self.ids: list[str] = []
        self.unsafe: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        """Record local navigation and forbid executable or remote embed surfaces."""
        values = dict(attrs)
        if tag in {"script", "iframe", "object", "embed", "form", "base"}:
            self.unsafe.append(tag)
        if tag == "meta" and (values.get("http-equiv") or "").lower() == "refresh":
            self.unsafe.append("meta refresh")
        if "srcset" in values:
            self.unsafe.append("srcset")
        if values.get("id"):
            self.ids.append(values["id"])
        for key, value in attrs:
            if key.lower().startswith("on"):
                self.unsafe.append(key)
            if key in {"href", "src"} and value:
                self.links.append(value)
                if value.lower().startswith(("javascript:", "data:", "file:")):
                    self.unsafe.append(value.split(":", 1)[0])
                if tag != "a" and (urlsplit(value).scheme or urlsplit(value).netloc):
                    self.unsafe.append("remote resource")


def scan_text(text: str) -> list[str]:
    """Return pattern names only, never matched credential or private content."""
    return [name for name, pattern in PATTERNS if pattern.search(text)]


def main() -> None:
    """Verify reviewed files; runtime environments are excluded unless strict."""
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Reject runtime caches and environments too",
    )
    args = parser.parse_args()
    record = json.loads((ROOT / MANIFEST).read_text())
    rows = record["files"]
    declared = {row["path"] for row in rows}
    errors: list[str] = []
    for finding in scan_text((ROOT / MANIFEST).read_text()):
        errors.append(f"{finding}: manifest")
    if len(declared) != len(rows):
        errors.append("Duplicate allowlist paths")
    expected = declared | {MANIFEST}
    actual = set()
    for path in ROOT.rglob("*"):
        relative = path.relative_to(ROOT)
        if not args.strict and any(part in RUNTIME_DIRS for part in relative.parts):
            continue
        if path.is_symlink():
            errors.append(f"Symlink: {relative}")
        if path.is_file():
            actual.add(relative.as_posix())
    if actual != expected:
        errors.append(
            "Undeclared or missing files: " + ", ".join(sorted(actual ^ expected))
        )
    link_count = 0
    for row in rows:
        relative = Path(row["path"])
        if (
            relative.is_absolute()
            or ".." in relative.parts
            or any(
                part in BAD_PARTS or part.startswith(".env") for part in relative.parts
            )
        ):
            errors.append("Unsafe allowlist path")
            continue
        path = ROOT / relative
        if not path.resolve().is_relative_to(ROOT):
            errors.append(f"Path resolves outside package: {relative}")
            continue
        if not path.is_file() or path.is_symlink():
            continue
        content = path.read_bytes()
        if (
            len(content) != row["bytes"]
            or hashlib.sha256(content).hexdigest() != row["sha256"]
        ):
            errors.append(f"Hash/size mismatch: {relative}")
        # PDF text/annotation/metadata inspection is a separate recorded build check.
        # Scan its uncompressed dictionary strings here too; do not claim this alone
        # is a comprehensive arbitrary-PDF secret detector.
        text = content.decode("utf-8", errors="replace")
        for finding in scan_text(text):
            errors.append(f"{finding}: {relative}")
        if path.suffix in {".html", ".css"} and re.search(
            r"(?i)@import\b|url\s*\(", text
        ):
            errors.append(f"Unreviewed CSS resource: {relative}")
        links: list[str] = []
        ids: list[str] = []
        if path.suffix == ".html":
            html = Links()
            html.feed(text)
            links, ids = html.links, html.ids
            errors.extend(
                f"Unsafe HTML {finding}: {relative}" for finding in html.unsafe
            )
            if len(ids) != len(set(ids)):
                errors.append(f"Duplicate HTML IDs: {relative}")
        elif path.suffix == ".md":
            links = re.findall(r"\]\(([^)\s]+)\)", text)
        for link in links:
            parts = urlsplit(link)
            if parts.scheme or parts.netloc:
                continue
            link_count += 1
            target = (
                (path.parent / unquote(parts.path)).resolve() if parts.path else path
            )
            if not target.is_relative_to(ROOT) or not target.is_file():
                errors.append(f"Broken/outside local link: {relative}")
            elif parts.fragment and target.suffix == ".html":
                target_ids = ids
                if target != path:
                    other = Links()
                    other.feed(target.read_text())
                    target_ids = other.ids
                if unquote(parts.fragment) not in target_ids:
                    errors.append(f"Missing HTML anchor: {relative}")
    result = {
        "status": "PASS" if not errors else "FAIL",
        "files": len(rows) + 1,
        "local_links": link_count,
        "strict": args.strict,
        "errors": errors,
        "limits": "Allowlist/integrity, selected content patterns and local links only. Human factual, code, rights and release review remain pending; no old-history remediation is established.",
    }
    print(json.dumps(result, indent=2))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
