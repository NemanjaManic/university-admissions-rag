import type { RawDocument } from "../ingest/fetchPage.js";

export interface Chunk {
    text: string;
    url: string;
    title: string;
}

const TARGET_WORDS = 400;
const OVERLAP_SENTENCES = 2;

export function splitIntoSentences(text: string): string[] {
    return text
        .split(/(?<=[.!?])\s+(?=[A-ZŠĐČĆŽАБВГДЂЕЖЗИЈКЛЉМНЊОПРСТЋУФХЦЧЏШ])/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

function countWords(text: string): number {
    return text.split(/\s+/).filter(w => w.length > 0).length;
}

export function chunkText(doc: RawDocument): Chunk[] {
    const sentences = splitIntoSentences(doc.text);
    const chunks: Chunk[] = [];

    let current: string[] = [];
    let wordCount = 0;

    for (let i = 0; i < sentences.length; i++) {
        current.push(sentences[i]);
        wordCount += countWords(sentences[i]);

        const isLastSentence = i === sentences.length - 1;
        if (wordCount >= TARGET_WORDS || isLastSentence) {
            chunks.push({ text: current.join(" "), url: doc.url, title: doc.title });

            if (!isLastSentence) {
                current = current.slice(-OVERLAP_SENTENCES);
                wordCount = countWords(current.join(" "));
            }
        }
    }

    return chunks;
}
