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

### 2026-07-20 — Step 2: choosing a data source (not yet decided)
- Candidate sources to evaluate: Google Scholar (scraping, no official API),
  ORCID profile, PubMed/NCBI E-utilities, Semantic Scholar API, DBLP.
- Need Vagisha's ORCID ID / Google Scholar profile URL / PubMed author query
  to proceed.
