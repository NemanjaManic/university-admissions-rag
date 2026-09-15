# FTN Upis RAG Chatbot — Project Plan

## Context

Nemanja is learning AI engineering (a TypeScript bootcamp) and wants a parallel **personal project** that:
- solves a real problem (admissions information for FTN Novi Sad is scattered across HTML pages and PDF konkurs texts),
- has the potential to become a real tool (could be shown to the student parliament/FTN as a working prototype),
- teaches him RAG from first principles — **not** Claude writing the whole system for him.

**Key collaboration rule:** Nemanja currently doesn't have enough knowledge to write this code solo, so we work as guided coding lessons, not as autonomous implementation:
- Before each phase, the concept (what we're doing and why) is explained before a single line of code is written.
- Code is written together, in small pieces (function by function, not a whole file at once) — Claude proposes/explains the code and every line/decision, Nemanja types it himself (not copy-paste) so the syntax and logic actually sink in.
- After each small unit, there's a pause for questions before moving on.
- The goal isn't to finish the project as fast as possible — it's for Nemanja to end up understanding and being able to explain every part of the system.

**Budget:** this is a personal, unpaid project — the architecture has to work with free/cheap options (a local embedding model, a cheap or free LLM tier), and the LLM client must be easily swappable (a thin wrapper) so Nemanja can later choose a provider without rewriting the whole system.

**Data domain (MVP):** the "Upis" (Admissions) section of ftn.uns.ac.rs — HTML pages (entrance exam, application documentation, application tracking, admissions statistics, FAQ) **plus** PDF konkurs (admissions competition) texts (undergraduate/master/specialist/doctoral studies, 2026/27). Discovered sources:
- `https://ftn.uns.ac.rs/upis/` (main page, FAQ)
- `https://ftn.uns.ac.rs/dokumentacija-za-prijavu/`
- `https://ftn.uns.ac.rs/nacin-polaganja/`
- `https://ftn.uns.ac.rs/konkurs-za-upis-u-i-godinu-svih-stepena-studija-2026/` (+ linked konkurs PDFs: OAS-OSS, MAS-MSS, SAS, DAS)
- `https://ftn.uns.ac.rs/upis/pracenje-prijave-na-konkurs/`

## Stack (proposed, TypeScript throughout)

- **Runtime:** Node.js + TypeScript, `tsx` for running scripts quickly without a build step.
- **Scraping:** native `fetch` + `cheerio` for HTML parsing.
- **PDF parsing:** `unpdf` or `pdf-parse` to extract text from konkurs PDFs.
- **Embeddings:** a local multilingual model via `@xenova/transformers` (e.g. `intfloat/multilingual-e5-small`) — runs on CPU, free, good enough for Serbian. This solves both the budget and language constraints at once.
- **Vector store (MVP):** PostgreSQL + the `pgvector` extension, run locally in a Docker container (`pgvector/pgvector` image via `docker-compose.yml`). Node client: `pg` (driver) + SQL queries using the `<->` operator for similarity search. Requires Docker Desktop running before Phase 4.
- **LLM for answer generation:** kept as a swappable module (`src/llm/client.ts` with a single interface). Suggested starting point: Claude Haiku (cheap) or check free starter credit on the Anthropic/OpenAI console — this decision isn't blocking, and changes in one place.
- **Interface (Phase 1):** a terminal CLI/REPL — no web UI until retrieval works well.

## Project structure (proposed)

```
ftn-upis-rag/
  src/
    ingest/        # scraping + PDF extraction -> raw documents with metadata
    chunk/         # splitting documents into chunks
    embed/         # generating embeddings
    store/         # pgvector wrapper over the `pg` client (writing/searching vectors)
    retrieve/       # top-k search by query
    llm/           # answer-generation client (provider-agnostic)
    cli/           # REPL for asking questions
    eval/          # test question set + script for measuring quality
  data/
    raw/           # raw HTML/PDF content
    processed/     # cleaned text + chunks (JSON)
```

## Phases (each phase = concept explanation → Nemanja writes the code → review → verify it works)

1. **Project setup** — `npm init`, TypeScript config, basic folder structure, git repo. *Check:* `npm run build`/`tsx src/index.ts` runs without errors.

2. **Ingestion (scraping + PDF)** — functions that fetch each HTML page, clean it (strip nav/footer, keep the main content), and separately fetch/parse the konkurs PDFs. Every document stores `{ url, title, text, fetchedAt }`. *Check:* run the script, get N `.json` files in `data/raw/` with readable text.

3. **Chunking** — splitting text into semantic pieces (~300-500 tokens, with overlap), each chunk carrying source metadata (URL + section title) for later citation. *Check:* print a few chunks and manually judge whether they make sense as standalone units.

4. **Embeddings + vector store** — generate a vector for each chunk with the local model, write them into a Postgres/pgvector database (started via `docker compose up`). *Check:* `docker compose up` starts the database, the database holds the expected number of rows, querying directly (via `psql` or a script) returns results.

5. **Retrieval** — a function that embeds a question and returns the top-k most similar chunks. *Check:* manually ask a few questions ("what's the admissions deadline," "how many points are needed for a budget spot") and check whether relevant chunks come back.

6. **Answer generation with citations** — a prompt that combines the question + retrieved chunks, calls the LLM, and returns an answer with a link to the source. *Check:* the CLI REPL asks a question, gets back an answer that sounds correct and cites a source.

7. **Quality evaluation** — a set of ~20-30 realistic admissions questions with expected facts/sources; a script that checks whether the right source is in the top-k and whether the answer contains the expected facts. *Check:* an eval report with an accuracy %, used to refine chunking/retrieval (RAG quality iteration).

8. **(Later, out of MVP scope)** — web chat UI, deployment, protection against prompt injection from scraped content, caching/refreshing data when FTN updates a konkurs. Not doing this until phases 1-7 work solidly.

## Verification at the end of each phase

Every phase has a concrete, runnable check (listed above) — running a script and reviewing the output in the terminal/JSON file, no UI needed until phase 8.
