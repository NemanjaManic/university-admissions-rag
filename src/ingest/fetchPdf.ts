import { extractText, getDocumentProxy  } from "unpdf";
import type { RawDocument } from "./fetchPage.js"

export async function fetchPdf(url: string): Promise<RawDocument> {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()

    const pdf = await getDocumentProxy(new Uint8Array(buffer))
    const { text } = await extractText(pdf, {mergePages: true})

    const filename = new URL(url).pathname.split("/").pop() ?? "dokument.pdf";
    return {
        url,
        title: filename,
        text: text.replace(/\s+/g, " ").trim(),
        fetchedAt: new Date().toISOString(),
    }
}

