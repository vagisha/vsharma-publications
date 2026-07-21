#!/usr/bin/env python
"""Build docs/data.js (the published page's data file) from the filtered
OpenAlex dataset.

Usage:
  python -X utf8 scripts/build_site_data.py

Run after fetch_openalex_works.py + filter_works.py to refresh the site,
then commit and push docs/ so GitHub Pages picks up the change.
"""

import json
from datetime import date
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data"
DOCS_DIR = REPO_ROOT / "docs"


def main():
    works = json.loads((DATA_DIR / "openalex_works_filtered.json").read_text(encoding="utf-8"))
    DOCS_DIR.mkdir(exist_ok=True)

    payload = {"generated_at": date.today().isoformat(), "works": works}
    js = "window.SITE_DATA = " + json.dumps(payload, indent=2, ensure_ascii=False) + ";\n"
    (DOCS_DIR / "data.js").write_text(js, encoding="utf-8")

    print(f"Wrote {DOCS_DIR / 'data.js'} with {len(works)} works "
          f"(generated_at {payload['generated_at']}).")


if __name__ == "__main__":
    main()
