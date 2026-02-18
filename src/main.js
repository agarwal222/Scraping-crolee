import { PlaywrightCrawler, RequestQueue } from "crawlee"
import express from "express"
import { insertLeads } from "./db.js"
import { clutchHandler } from "./routes/clutch.js"

const app = express()
app.use(express.json())

const requestQueue = await RequestQueue.open()

const crawler = new PlaywrightCrawler({
  requestQueue,
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
async function startCrawlerLoop() {
  while (true) {
    console.log("Crawler waiting for jobs...")

    await crawler.run()

    // wait before checking queue again
    await new Promise((r) => setTimeout(r, 5000))
  }
}

startCrawlerLoop()

app.post("/job", async (req, res) => {
  const { url, label } = req.body

  await requestQueue.addRequest({
    url,
    userData: { label },
  })

  console.log("Job added:", url)

  res.send({ status: "queued" })
})

app.listen(3000, () => {
  console.log("Worker listening on port 3000")
})
