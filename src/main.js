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

// 🚀 start crawler once and keep alive
crawler.run()

console.log("Crawler ready...")

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
