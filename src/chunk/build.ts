import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { fetchPdfLines } from "../ingest/fetchPdf.js";
import { splitTableAndProse } from "./splitTableAndProse.js";
import { chunkText, type Chunk } from "./chunkText.js";
import type { RawDocument } from "../ingest/fetchPage.js";

async function chunkPdfDocument(doc: RawDocument): Promise<Chunk[]> {
    const lines = await fetchPdfLines(doc.url);
    const { tableSentences, proseLines } = splitTableAndProse(lines);

    const proseText = proseLines.join(" ").replace(/\s+/g, " ").trim();
    const proseChunks = chunkText({ ...doc, text: proseText });
    const tableChunks: Chunk[] = tableSentences.map(text => ({ text, url: doc.url, title: doc.title }));

    return [...proseChunks, ...tableChunks];
}

async function main() {
    const files = (await readdir("data/raw")).filter(f => f.endsWith(".json"));
    const allChunks: Chunk[] = [];

    for (const file of files) {
        const doc: RawDocument = JSON.parse(await readFile(`data/raw/${file}`, "utf8"));
        const chunks = doc.url.endsWith(".pdf") ? await chunkPdfDocument(doc) : chunkText(doc);

        console.log(`${file}: ${chunks.length} chunkova`);
        allChunks.push(...chunks);
    }

    await mkdir("data/processed", { recursive: true });
    await writeFile("data/processed/chunks.json", JSON.stringify(allChunks, null, 2));
    console.log(`\nUkupno: ${allChunks.length} chunkova -> data/processed/chunks.json`);
}

main();
