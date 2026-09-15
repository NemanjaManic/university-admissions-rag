import * as cheerio from "cheerio"

export interface RawDocument {
    url: string, 
    title: string,
    text: string,
    fetchedAt: string,
}

function loadContainer(html: string) {

    const $ = cheerio.load(html)
    const container = $("main").length > 0
    ? $("main")
    : $(".elementor-widget-theme-post-content").length > 0      ? $(".elementor-widget-theme-post-content")
      : $("body");

    return { $, container }
}

export async function fetchPage(url: string): Promise<RawDocument> {
    const response = await fetch(url)
    const html = await response.text()
    const { $, container } = loadContainer(html)
    
    container.find("nav, footer, script, style").remove()

    const title = $("title").text().trim()
    const text = container.text().replace(/\s+/g, " ").replace(/<\/?eng>/g, "").trim();
    
    return {
        url,
        title,
        text,
        fetchedAt: new Date().toISOString(),
    }
}

export async function findPdfLinks(url: string): Promise<string[]> {
    
    const response = await fetch(url)
    const html = await response.text()
    const { $, container } = loadContainer(html)
    const links = new Set<string>()

    container.find('a[href$=".pdf"]').each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        links.add(new URL(href, url).toString());      
      }
    })

    return [...links];  
}
