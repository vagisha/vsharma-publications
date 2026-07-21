#!/usr/bin/env python
"""Filter the raw OpenAlex works list into a clean dataset.

Applies two rules, decided with Vagisha on 2026-07-20:
  1. Drop any work listed in data/manual_exclusions.json (confirmed not hers,
     e.g. name collisions with other people sharing her name/ORCID).
  2. When a preprint and a later published version of the same paper both
     appear (matched by normalized title), keep only the published version
     and drop the preprint. Preprints with no corresponding published
     version are kept as-is.

Reads data/openalex_works.json (+ data/manual_exclusions.json), writes
data/openalex_works_filtered.json and data/openalex_works_filtered.xlsx.

Usage:
  python -X utf8 scripts/filter_works.py

Re-run any time after re-fetching (fetch_openalex_works.py) to reapply the
same exclusion/dedup rules to fresh data.
"""

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_openalex_works import write_json, write_xlsx  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data"


def normalize_title(title):
    return re.sub(r"[^a-z0-9]+", " ", (title or "").lower()).strip()


def apply_manual_exclusions(works, exclusions):
    excluded_ids = {e["openalex_id"] for e in exclusions}
    kept = [w for w in works if w["openalex_id"] not in excluded_ids]
    dropped = [w for w in works if w["openalex_id"] in excluded_ids]
    return kept, dropped


def dedupe_preprints(works):
    by_title = {}
    for w in works:
        by_title.setdefault(normalize_title(w["title"]), []).append(w)

    kept = []
    dropped = []
    for group in by_title.values():
        if len(group) == 1:
            kept.extend(group)
            continue
        published = [w for w in group if w["type"] != "preprint"]
        preprints = [w for w in group if w["type"] == "preprint"]
        if published and preprints:
            kept.extend(published)
            dropped.extend(preprints)
        else:
            # Ambiguous (e.g. multiple preprints, no published version, or
            # multiple published versions) - keep everything for manual review.
            kept.extend(group)
    return kept, dropped


def main():
    works = json.loads((DATA_DIR / "openalex_works.json").read_text(encoding="utf-8"))
    exclusions = json.loads((DATA_DIR / "manual_exclusions.json").read_text(encoding="utf-8"))

    works, excluded = apply_manual_exclusions(works, exclusions)
    works, deduped_preprints = dedupe_preprints(works)

    works.sort(key=lambda w: (w["year"] or 0), reverse=True)

    write_json(works, DATA_DIR / "openalex_works_filtered.json")
    write_xlsx(works, DATA_DIR / "openalex_works_filtered.xlsx")

    print(f"Started with works from data/openalex_works.json")
    print(f"Excluded (manual, not hers): {len(excluded)}")
    for w in excluded:
        print(f"  - {w['title']}")
    print(f"Dropped preprints (published version exists): {len(deduped_preprints)}")
    for w in deduped_preprints:
        print(f"  - {w['title']} ({w['year']})")
    print(f"\nClean filtered dataset: {len(works)} works")
    print(f"Saved: {DATA_DIR / 'openalex_works_filtered.json'}")
    print(f"Saved: {DATA_DIR / 'openalex_works_filtered.xlsx'}")


if __name__ == "__main__":
    main()
