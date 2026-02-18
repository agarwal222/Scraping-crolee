import { PlaywrightCrawler } from "crawlee"
import express from "express"
import { insertLeads } from "./db.js"
import { clutchHandler } from "./routes/clutch.js"

const app = express()
app.use(express.json())

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

console.log("Crawler ready...")

/**
 * HTTP endpoint for n8n
 */
app.post("/job", async (req, res) => {
  const { url, label } = req.body

  if (!url || !label) {
    return res.status(400).send("Missing url or label")
  }

  await crawler.addRequests([
    {
      url,
      userData: { label },
    },
  ])

  console.log("Job added:", url)

  res.send({ status: "queued" })
})

app.listen(3000, () => {
  console.log("Worker listening on port 3000")
})
