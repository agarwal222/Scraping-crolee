import { PlaywrightCrawler } from "crawlee"
import express from "express"
import { insertLeads } from "./db.js"
import { clutchHandler } from "./routes/clutch.js"

const app = express()
app.use(express.json())

let pendingJobs = []
let debounceTimer = null
let isRunning = false

async function runCrawler() {
  if (isRunning || pendingJobs.length === 0) return

  isRunning = true

  const jobsToRun = [...pendingJobs]
  pendingJobs = []

  console.log(`Starting crawler with ${jobsToRun.length} jobs`)

  const crawler = new PlaywrightCrawler({
    maxConcurrency: 1,

    async requestHandler({ page, request }) {
      const leads = await clutchHandler({ page })
      await insertLeads(leads)
    },
  })

  await crawler.run(
    jobsToRun.map((job) => ({
      url: job.url,
      userData: { label: job.label },
    })),
  )

  console.log("Crawler finished")
  isRunning = false
}

function scheduleRun() {
  if (debounceTimer) clearTimeout(debounceTimer)

  debounceTimer = setTimeout(() => {
    runCrawler()
  }, 20000) // wait 20 seconds after last job
}

app.post("/job", (req, res) => {
  const { url, label } = req.body

  pendingJobs.push({ url, label })

  console.log("Job queued:", url)

  scheduleRun()

  res.send({ status: "queued" })
})

app.listen(3000, () => {
  console.log("Crawler ready on port 3000")
})
