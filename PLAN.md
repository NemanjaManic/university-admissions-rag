# FTN Upis RAG Chatbot — plan projekta

## Kontekst

Nemanja uči AI inženjering (bootcamp u TypeScript-u) i želi paralelno **lični projekat** koji:
- rešava stvaran problem (informacije o upisu na FTN Novi Sad su razbacane po HTML stranicama i PDF konkursima),
- ima potencijal da postane realan alat (može se pokazati studentskom parlamentu/FTN-u kao gotov prototip),
- ga uči RAG od temelja — **ne** da mu Claude napiše ceo sistem.

**Ključno pravilo saradnje:** Nemanja trenutno nema dovoljno znanja da samostalno piše kod, pa ovo radimo kao vođeni čas kodiranja, ne kao autonomnu implementaciju:
- Pre svake faze objašnjavam koncept (šta radimo i zašto) pre nego što napišemo ijednu liniju.
- Kod pišemo zajedno, malo po malo (funkcija po funkcija, ne ceo fajl odjednom) — ja predlažem/pišem kod uz objašnjenje svake linije/odluke, Nemanja ga otkucava kod sebe (ne copy-paste) da bi mu sintaksa i logika ušle u prste i glavu.
- Posle svake manje celine, pauza za pitanja pre nego što se nastavi dalje.
- Cilj nije da projekat bude gotov najbrže moguće, nego da Nemanja na kraju razume i ume da objasni svaki deo sistema.

**Budžet:** ovo je lični, ne-plaćen projekat — arhitektura mora da radi sa besplatnim/jeftinim opcijama (lokalni embedding model, jeftin ili besplatan LLM tier), a LLM klijent mora biti lako zamenljiv (thin wrapper) da Nemanja kasnije bira provajdera bez prepravljanja celog sistema.

**Domen podataka (MVP):** sekcija "Upis" na ftn.uns.ac.rs — HTML stranice (prijemni ispit, dokumentacija za prijavu, praćenje prijave, statistika upisa, FAQ) **plus** PDF konkursni tekstovi (osnovne/master/specijalističke/doktorske studije, 2026/27). Otkriveni izvori:
- `https://ftn.uns.ac.rs/upis/` (glavna stranica, FAQ)
- `https://ftn.uns.ac.rs/dokumentacija-za-prijavu/`
- `https://ftn.uns.ac.rs/nacin-polaganja/`
- `https://ftn.uns.ac.rs/konkurs-za-upis-u-i-godinu-svih-stepena-studija-2026/` (+ linkovani PDF-ovi konkursa: OAS-OSS, MAS-MSS, SAS, DAS)
- `https://ftn.uns.ac.rs/upis/pracenje-prijave-na-konkurs/`

## Stack (predlog, TypeScript svuda)

- **Runtime:** Node.js + TypeScript, `tsx` za brzo pokretanje skripti bez build koraka.
- **Scraping:** `fetch` (native) + `cheerio` za parsiranje HTML-a.
- **PDF parsing:** `unpdf` ili `pdf-parse` za izvlačenje teksta iz konkursnih PDF-ova.
- **Embeddings:** lokalni multilingual model preko `@xenova/transformers` (npr. `intfloat/multilingual-e5-small`) — radi na CPU, besplatno, dovoljno dobar za srpski. Ovo rešava i budžet i jezik u jednom potezu.
- **Vector store (MVP):** `better-sqlite3` + `sqlite-vec` ekstenzija — fajl-bazirano, nema server za podizanje, a i dalje uči prave koncepte vektorske baze. (Alternativa za kasnije: pgvector, ako poželi pravu bazu.)
- **LLM za generisanje odgovora:** ostavljamo kao izmenljiv modul (`src/llm/client.ts` sa jednim interfejsom). Predlog za start: Claude Haiku (jeftin) ili proveri besplatan starter kredit na Anthropic/OpenAI konzoli — odluka nije blokirajuća, menja se na jednom mestu.
- **Interfejs (faza 1):** CLI/REPL u terminalu — bez web UI-ja dok retrieval ne radi dobro.

## Struktura projekta (predlog)

```
ftn-upis-rag/
  src/
    ingest/        # scraping + PDF ekstrakcija -> raw dokumenti sa metapodacima
    chunk/         # deljenje dokumenata na chunkove
    embed/         # generisanje embeddinga
    store/         # sqlite-vec wrapper (upis/pretraga vektora)
    retrieve/      # top-k pretraga po upitu
    llm/           # klijent za generisanje odgovora (provider-agnostic)
    cli/           # REPL za postavljanje pitanja
    eval/          # test set pitanja + skripta za merenje kvaliteta
  data/
    raw/           # sirov HTML/PDF sadržaj
    processed/     # očišćen tekst + chunkovi (JSON)
```

## Faze (svaka faza = objašnjenje koncepta → Nemanja piše kod → review → provera da radi)

1. **Setup projekta** — `npm init`, TypeScript config, osnovna struktura foldera, git repo. *Provera:* `npm run build`/`tsx src/index.ts` radi bez grešaka.

2. **Ingestion (scraping + PDF)** — funkcije koje preuzimaju svaku HTML stranicu, čiste je (skidaju nav/footer, ostavljaju glavni sadržaj), i posebno preuzimaju/parsiraju PDF konkurse. Svaki dokument čuva `{ url, title, text, fetchedAt }`. *Provera:* pokrenuti skriptu, dobiti N `.json` fajlova u `data/raw/` sa čitljivim tekstom.

3. **Chunking** — deljenje teksta na semantičke delove (~300-500 tokena, sa preklapanjem), svaki chunk nosi metapodatke izvora (URL + naslov sekcije) radi kasnijeg citiranja. *Provera:* ispisati par chunkova i ručno oceniti da li imaju smisla kao samostalne celine.

4. **Embeddings + vector store** — generisanje vektora za svaki chunk lokalnim modelom, upis u sqlite-vec bazu. *Provera:* baza sadrži očekivan broj redova, upit direktno na bazu vraća rezultate.

5. **Retrieval** — funkcija koja embeduje pitanje i vraća top-k najsličnijih chunkova. *Provera:* ručno postaviti par pitanja ("koji je rok za upis", "koliko poena je potrebno za budžet") i proveriti da li se vraćaju relevantni chunkovi.

6. **Generisanje odgovora sa citatima** — prompt koji kombinuje pitanje + retrieved chunkove, poziva LLM, vraća odgovor sa linkom na izvor. *Provera:* CLI REPL postavlja pitanje, dobija odgovor koji zvuči tačno i navodi izvor.

7. **Evaluacija kvaliteta** — set od ~20-30 realnih pitanja o upisu sa očekivanim činjenicama/izvorima; skripta koja proverava da li je pravi izvor u top-k i da li odgovor sadrži očekivane činjenice. *Provera:* eval izveštaj sa % tačnosti, koristi se da se doradi chunking/retrieval (RAG quality iteracija).

8. **(Kasnije, van MVP-a)** — web chat UI, deploy, zaštita od prompt injection-a iz scrape-ovanog sadržaja, keširanje/osvežavanje podataka kad FTN promeni konkurs. Ne radimo ovo dok faze 1-7 ne rade solidno.

## Verifikacija na kraju svake faze

Svaka faza ima konkretnu, runnable proveru (navedeno gore) — pokretanje skripte i pregled izlaza u terminalu/JSON fajlu, bez potrebe za UI dok ne stignemo do faze 8.
