import * as cheerio from "cheerio"

export interface RawDocument {
    url: string, 
    title: string,
    text: string,
    fetchedAt: string,
}

export async function fetchPage(url: string): Promise<RawDocument> {
    const response = await fetch(url)
    const html = await response.text()

    const $ = cheerio.load(html)
    $("nav, footer, script, style").remove()

    const title = $("title").text().trim()
    const container = $("main").length > 0
    ? $("main")
    : $(".elementor-widget-theme-post-content").length > 0      ? $(".elementor-widget-theme-post-content")
      : $("body");

  const text = container.text().replace(/\s+/g, " ").trim();
    
    return {
        url,
        title,
        text,
        fetchedAt: new Date().toISOString(),
    }
}