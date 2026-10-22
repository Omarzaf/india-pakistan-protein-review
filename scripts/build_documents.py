"""Build an offline readable HTML document from the packaged Markdown sources."""

from __future__ import annotations

import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = (
    "report/chapter.md",
    "methods/proxy.md",
    "methods/measurement-crosswalk.md",
    "methods/panel-supplement.md",
    "report/limitations-and-ai-use.md",
)


def main() -> None:
    """Use optional local Pandoc; numerical reproduction does not require it."""
    pandoc = shutil.which("pandoc")
    if pandoc is None:
        raise SystemExit(
            "Pandoc is optional and not installed. Read the supplied HTML/PDF or Markdown."
        )
    combined = "\n\n".join((ROOT / name).read_text() for name in SOURCES)
    subprocess.run(
        [
            pandoc,
            "--from=markdown",
            "--to=html5",
            "--standalone",
            "--toc",
            "--toc-depth=2",
            "--metadata=lang:en",
            "--metadata=title:Alternative-protein spending in India and Pakistan",
            "--metadata=subtitle:Conditional scenarios, exact methods and a separate elicitation supplement",
            "--metadata=author:Muhammad Umar Zafar",
            "--metadata=date:22 October 2026 · Review draft",
            "--css=report.css",
            "--output=" + str(ROOT / "report/review.html"),
        ],
        input=combined,
        text=True,
        check=True,
    )
    html_path = ROOT / "report/review.html"
    html = html_path.read_text()
    table_index = 0

    def wrap_table(match: re.Match[str]) -> str:
        """Keep wide method tables readable with keyboard-accessible local scroll."""
        nonlocal table_index
        table_index += 1
        return (
            '<p class="table-hint">Scroll the table horizontally on a narrow screen.</p>'
            f'<div class="table-scroll" role="region" aria-label="Data table {table_index}" tabindex="0">'
            + match.group(0)
            + "</div>"
        )

    html_path.write_text(
        re.sub(r"<table\b.*?</table>", wrap_table, html, flags=re.DOTALL)
    )
    record = {
        "status": "AI-assisted review draft; human verification pending",
        "pandoc": subprocess.check_output(
            [pandoc, "--version"], text=True
        ).splitlines()[0],
        "sources": {
            name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
            for name in SOURCES
        },
        "html_sha256": hashlib.sha256(
            (ROOT / "report/review.html").read_bytes()
        ).hexdigest(),
        "pdf_rendering": "The supplied PDF was rendered with sandboxed Chromium from a temporary print copy with inline CSS and local file hyperlinks removed. Re-rendering must repeat those precautions and inspect PDF metadata, text and link annotations for local paths. Rendering is optional; the supplied PDF is ready to read.",
        "limits": "Document rendering is separate from numerical reproduction. PDF visual QA and renderer version are recorded in the external release receipt.",
    }
    (ROOT / "provenance/document-build.json").write_text(
        json.dumps(record, indent=2) + "\n"
    )
    print(
        json.dumps(
            {
                "status": "HTML_BUILT",
                "source_count": len(SOURCES),
                "html_sha256": record["html_sha256"],
            }
        )
    )


if __name__ == "__main__":
    main()
