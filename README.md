# FTN Upis RAG

A personal RAG (Retrieval-Augmented Generation) chatbot that answers questions about admissions ("upis") at the Faculty of Technical Sciences in Novi Sad (FTN), based on official HTML pages and PDF konkurs (admissions competition) texts from `ftn.uns.ac.rs`.

The project has a dual purpose: it solves a real problem (admissions info is scattered across the site and various PDFs) and serves as a hands-on exercise for learning RAG systems from first principles, alongside a parallel TypeScript AI-engineering bootcamp.

The full project plan, phase breakdown, and collaboration rules live in [`PLAN.md`](./PLAN.md).

## Status

- **Phase 1 — Setup** ✅ done
- **Phase 2 — Ingestion (scraping + PDF)** ✅ done
  - `src/ingest/fetchPage.ts` — fetches and cleans HTML pages (cheerio), strips nav/footer/script/style and WordPress-specific artifacts (e.g. escaped `<eng>` tags leaking into excerpt text)
  - `src/ingest/fetchPdf.ts` — extracts text from konkurs PDFs (`unpdf`), with an `extractLines()` helper that reconstructs real line breaks from the PDF (via the `hasEOL` metadata) — the foundation for accurately parsing the enrollment-quota tables
  - All sources are saved as `{ url, title, text, fetchedAt }` in `data/raw/*.json`
- **Phase 3 — Chunking** 🚧 in progress
  - In progress: a dedicated parser (`src/chunk/parseTableRows.ts`) that turns the enrollment-quota tables (number of spots per study program, found in the PDF konkurs texts) into standalone sentences per row, instead of letting a generic chunker slice them at arbitrary points

## Running it

```bash
npm install
npx tsx src/index.ts
```

This fetches all HTML sources and konkurs PDFs and saves them into `data/raw/`.

## Stack

Node.js + TypeScript (`tsx`), `cheerio` for HTML, `unpdf` for PDF, a local multilingual embedding model (`@xenova/transformers`), pgvector as the vector store, CLI/REPL interface. Details in [`PLAN.md`](./PLAN.md).
