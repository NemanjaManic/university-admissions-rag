import { fetchPage  } from "./ingest/fetchPage.js";
import { writeFile, mkdir } from "node:fs/promises"

  const urls = [
    "https://ftn.uns.ac.rs/upis/",
    "https://ftn.uns.ac.rs/dokumentacija-za-prijavu/",    
    "https://ftn.uns.ac.rs/nacin-polaganja/",
    "https://ftn.uns.ac.rs/konkurs-za-upis-u-i-godinu-svih-stepena-studija-2026/",
    "https://ftn.uns.ac.rs/upis/pracenje-prijave-na-konkurs/",
  ];

for (const url of urls) {
    const doc = await fetchPage(url)
    const filename = new URL(url).pathname.replace(/\/$/, 
  "").split("/").pop() || "index"
    await writeFile(`data/raw/${filename}.json`,
  JSON.stringify(doc, null, 2))
  console.log(`Sacuvano: data/raw/${filename}.json (${doc.text.length} karaktera)`)

}






