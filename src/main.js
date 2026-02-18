import { PlaywrightCrawler } from "crawlee"
import { insertLeads } from "./db.js"
import { clutchHandler } from "./routes/clutch.js"

const crawler = new PlaywrightCrawler({
  maxConcurrency: 1,
  async requestHandler({ page, request }) {
    console.log("Processing:", request.url)

    let leads = []

    if (request.userData.label === "CLUTCH") {
      leads = await clutchHandler({ page })
    }

    await insertLeads(leads)

    console.log(`Inserted ${leads.length} leads`)
  },
})

await crawler.run([
  {
    url: "https://clutch.co/agencies/video-production",
    userData: { label: "CLUTCH" },
  },
])
