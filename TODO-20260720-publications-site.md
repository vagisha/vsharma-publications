# TODO: Publications & citations site

## Goal

Build a web page listing Vagisha's published papers, with charts showing how
her citations have grown over the years, and publish it live so it can be
shared.

This is a multi-step project — wait for approval before moving from one step
to the next. Keep this file up to date as work progresses: log what's done
and what was learned, so the work can be re-run later without redoing
research from scratch.

## Steps

1. **Scaffold the project** — done 2026-07-20.
   - Created this repo, initialized git, pushed as a public GitHub repo.
   - Repo: https://github.com/vagisha/vsharma-publications
2. **Pick a data source for publications + citation counts** — in progress.
3. **Fetch/build the publication + citation dataset** (as a reusable script).
4. **Build the web page** (papers list + citation-growth charts).
5. **Publish it live** and share the URL.

## Log

### 2026-07-20 — Step 3: fetching the publication dataset from OpenAlex
- Decision: use **OpenAlex** (not Semantic Scholar) as the data source,
  filtered by ORCID `author.orcid:0000-0003-1922-439X`. This avoids the
  name-collision problem Semantic Scholar's name-search had (it had merged
  in ~3 unrelated papers by other people named "Vagisha Sharma").
- Wrote `scripts/fetch_openalex_works.py` (reusable — rerun any time to
  refresh citation counts). Uses OpenAlex's "polite pool" (`mailto` param
  with vagisha@gmail.com) for better rate limits, retries on HTTP 429
  (respecting `Retry-After`) and 5xx with backoff instead of failing.
- Output: `data/openalex_works.json` (full data) and
  `data/openalex_works.xlsx` (for manual review — has a "Not mine? (mark X)"
  column since OpenAlex, like Semantic Scholar, can occasionally misattribute
  a work even via ORCID).
- Fetched 32 works: 22 article, 5 preprint, 2 conference-paper, 1 erratum,
  1 data-paper, 1 book-chapter.
- Observations for review:
  - One 2022 conference paper, "A Modified Feature Optimization Approach
    with Convolutional Neural Networks...", looks unrelated to proteomics —
    worth checking/flagging.
  - Several papers appear twice as preprint + published version (Comet
    fragment-ion indexing, quality control framework, senescence atlas,
    phosphoproteomic library) — will need dedup logic when building the
    citation-growth chart later, to avoid double-counting.
- Added `scripts/requirements.txt` (requests, openpyxl).

### 2026-07-20 — Step 3b: filtering to a clean dataset
- Decisions confirmed with Vagisha:
  - The 2022 "Apple Leaf Disease Detection" conference paper is **not
    hers** (name collision) — permanently excluded.
  - When a preprint and its later published version both appear, **keep
    only the published version, drop the preprint**. A preprint with no
    corresponding published version (e.g. piNET) is kept.
- These decisions are recorded as data, not just prose, so they're
  reapplied automatically on every re-fetch:
  - `data/manual_exclusions.json` — list of confirmed-not-hers OpenAlex IDs
    with reason + date decided. Add future exclusions here (from the
    "Not mine? (mark X)" column in the review spreadsheet) rather than
    editing scripts.
  - `scripts/filter_works.py` — reusable script implementing both rules
    (manual exclusion list + preprint/published-version dedup by
    normalized title match). Reads `data/openalex_works.json`, writes
    `data/openalex_works_filtered.json` and
    `data/openalex_works_filtered.xlsx`.
- Result: **27 works** in the clean filtered dataset (32 raw - 1 excluded -
  4 superseded preprints).
- Pipeline going forward: `fetch_openalex_works.py` (raw pull) →
  `filter_works.py` (apply exclusions/dedup) → `openalex_works_filtered.*`
  is the dataset the site/charts should be built from.

### 2026-07-20 — Step 1: scaffolding
- Created `vsharma-publications/` under `C:\Users\Silmaril\Documents\ws`.
- `git init`, initial commit (README + .gitignore).
- Created public GitHub repo via `gh repo create vsharma-publications --public --source=. --remote=origin --push`.
- Live at https://github.com/vagisha/vsharma-publications.
- Git identity had to be set manually by Vagisha (`user.name "Vagisha"`,
  `user.email "vagisha@gmail.com"`) — no global git config existed on this
  machine beforehand.

### 2026-07-20 — Step 2: choosing a data source
- Candidate sources to evaluate: Google Scholar (scraping, no official API),
  ORCID profile, PubMed/NCBI E-utilities, Semantic Scholar API, DBLP.
- Found and verified Vagisha's ORCID: **0000-0003-1922-439X**
  (https://orcid.org/0000-0003-1922-439X) — name "Vagisha Sharma", employment
  University of Washington Genome Sciences since Aug 2019. **Confirmed by
  Vagisha 2026-07-20 — this is her ORCID.**
- Caveat: only 3 works are listed directly on the ORCID record itself (not
  auto-synced), so ORCID alone is likely NOT a complete publication list.
  Likely need to cross-reference with Google Scholar and/or PubMed/Semantic
  Scholar (which can look up by ORCID) to get full paper + citation-count
  data.
- How this was found: pub.orcid.org's `expanded-search` endpoint with
  `q=family-name:Sharma+AND+given-names:Vagisha` returned 4 candidates;
  matched on institution "University of Washington". (A generic web search
  first suggested a different, incorrect ORCID belonging to another
  researcher — always verify an ORCID candidate against the record's own
  employment/institution data before trusting it.)
