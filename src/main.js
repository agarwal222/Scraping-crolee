import { PlaywrightCrawler } from "crawlee"
import express from "express"
import { insertLeads } from "./db.js"

import { clutchHandler } from "./routes/clutch.js"
import { designrushHandler } from "./routes/designrush.js"
import { goodfirmsHandler } from "./routes/goodfirms.js"
import { sortlistHandler } from "./routes/sortlist.js"

const app = express()
app.use(express.json())

let pendingJobs = []
let debounceTimer = null
let isRunning = false

// ---------- BLOCK DETECTION ----------
async function detectBlock(page) {
  const title = await page.title()

  if (
    title.includes("Access Denied") ||
    title.includes("Just a moment") ||
    title.includes("Attention Required") ||
    title.includes("Cloudflare")
  ) {
    return "Cloudflare or Access Denied"
  }

  const captcha = await page.$('iframe[src*="captcha"]')
  if (captcha) return "Captcha detected"

  return null
}

// ---------- ROUTER ----------
async function routeHandler({ page, request, crawler }) {
  const label = request.userData.label

  try {
    const blocked = await detectBlock(page)
    if (blocked) {
      console.log(`[BLOCKED] ${request.url} → ${blocked}`)
      return []
    }

    let leads = []

    switch (label) {
      case "CLUTCH":
        leads = await clutchHandler({ page, request, crawler })
        break

      case "DESIGNRUSH":
        leads = await designrushHandler({ page, request, crawler })
        break

      case "GOODFIRMS":
        leads = await goodfirmsHandler({ page, request, crawler })
        break

      case "SORTLIST":
        leads = await sortlistHandler({ page, request, crawler })
        break

      default:
        console.log(`[WARN] Unknown label ${label}`)
        return []
    }

    await insertLeads(leads)

    console.log(`[SUCCESS] ${request.url} → ${leads.length} leads`)

    // human delay
    await page.waitForTimeout(3000 + Math.random() * 4000)

    return leads
  } catch (err) {
    console.log(`[ERROR] ${request.url}`)
    console.log(err.message)
    return []
  }
}

// ---------- RUNNER ----------
async function runCrawler() {
  if (isRunning || pendingJobs.length === 0) return

  isRunning = true

  const jobsToRun = [...pendingJobs]
  pendingJobs = []

  console.log(`Starting crawler with ${jobsToRun.length} jobs`)

  const crawler = new PlaywrightCrawler({
    maxConcurrency: 1,
    maxRequestRetries: 2,

    async requestHandler(ctx) {
      await routeHandler(ctx)
    },

    failedRequestHandler({ request, error }) {
      console.log(`[FAILED] ${request.url} → ${error.message}`)
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

// ---------- DEBOUNCE ----------
function scheduleRun() {
  if (debounceTimer) clearTimeout(debounceTimer)

  debounceTimer = setTimeout(() => {
    runCrawler()
  }, 20000)
}

// ---------- API ----------
app.post("/job", (req, res) => {
  const { url, label } = req.body

  pendingJobs.push({ url, label })

  console.log(`[QUEUED] ${label} → ${url}`)

  scheduleRun()

  res.send({ status: "queued" })
})

app.listen(3000, () => {
  console.log("Crawler ready on port 3000")
})
