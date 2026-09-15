import { extractText, extractTextItems, getDocumentProxy  } from "unpdf";
import type { RawDocument } from "./fetchPage.js"




async function extractLines(pdf: Parameters<typeof extractTextItems>[0]): Promise<string[]>{
    const { items } = await extractTextItems(pdf)
    const lines: string[] = []
    let current = ""

    for (const page of items){ 
        for(const item of page) {
            current += item.str
            if (item.hasEOL) {
                lines.push(current)
                current = ""
            }
        }
    }
    if (current) lines.push(current)

    return lines
}

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

