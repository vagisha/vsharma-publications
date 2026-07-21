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
  University of Washington Genome Sciences since Aug 2019. Awaiting her
  confirmation this is correct.
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
