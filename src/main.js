import { PlaywrightCrawler } from "crawlee"
import express from "express"
import { insertLeads } from "./db.js"

import { clutchHandler } from "./routes/clutch.js"
import { designrushHandler } from "./routes/designrush.js"
import { goodfirmsHandler } from "./routes/goodfirms.js"
import { sortlistHandler } from "./routes/sortlist.js"

const app = express()
app.use(express.json())

// ===============================
// STATE
// ===============================
let pendingJobs = []
let debounceTimer = null
let isRunning = false

// ===============================
// BLOCK DETECTION
// ===============================
async function detectBlock(page) {
  const title = await page.title()

  if (
    title.includes("Access Denied") ||
    title.includes("Just a moment") ||
    title.includes("Attention Required") ||
    title.includes("Cloudflare")
  ) {
    return "Cloudflare / Access Denied"
  }

  const captcha = await page.$('iframe[src*="captcha"]')
  if (captcha) return "Captcha detected"

  return null
}

// ===============================
// BUILD URLS FROM N8N JOB
// ===============================
function buildUrls({ source, category, startPage, endPage }) {
  const urls = []

  for (let page = startPage; page <= endPage; page++) {
    switch (source) {
      case "CLUTCH":
        urls.push({
          url: `https://clutch.co/agencies/${category}?page=${page}`,
          label: "CLUTCH",
        })
        break

      case "DESIGNRUSH":
        urls.push({
          url: `https://www.designrush.com/agency/${category}?page=${page}`,
          label: "DESIGNRUSH",
        })
        break

      case "GOODFIRMS":
        urls.push({
          url: `https://www.goodfirms.co/directory/marketing-services/${category}?page=${page}`,
          label: "GOODFIRMS",
        })
        break

      case "SORTLIST":
        urls.push({
          url: `https://www.sortlist.com/${category}?page=${page}`,
          label: "SORTLIST",
        })
        break

      default:
        console.log(`[WARN] Unknown source ${source}`)
    }
  }

  return urls
}

// ===============================
// ROUTER
// ===============================
async function routeHandler({ page, request }) {
  try {
    const blocked = await detectBlock(page)

    if (blocked) {
      console.log(`[BLOCKED] ${request.url} → ${blocked}`)
      return []
    }

    let leads = []

    switch (request.userData.label) {
      case "CLUTCH":
        leads = await clutchHandler({ page })
        break

      case "DESIGNRUSH":
        leads = await designrushHandler({ page })
        break

      case "GOODFIRMS":
        leads = await goodfirmsHandler({ page })
        break

      case "SORTLIST":
        leads = await sortlistHandler({ page })
        break

      default:
        console.log(`[WARN] Unknown label ${request.userData.label}`)
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

// ===============================
// RUNNER
// ===============================
async function runCrawler() {
  if (isRunning || pendingJobs.length === 0) return

  isRunning = true

  const jobsToRun = [...pendingJobs]
  pendingJobs = []

  console.log(`Starting crawler with ${jobsToRun.length} pages`)

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

// ===============================
// DEBOUNCE EXECUTION
// ===============================
function scheduleRun() {
  if (debounceTimer) clearTimeout(debounceTimer)

  debounceTimer = setTimeout(() => {
    runCrawler()
  }, 20000)
}

// ===============================
// API FOR N8N
// ===============================
app.post("/job", (req, res) => {
  const { jobs } = req.body

  if (!Array.isArray(jobs)) {
    return res.status(400).json({
      error: "jobs must be an array",
    })
  }

  let added = 0

  for (const job of jobs) {
    const expanded = buildUrls(job)
    pendingJobs.push(...expanded)
    added += expanded.length
  }

  console.log(`[QUEUED] ${added} pages queued`)
  scheduleRun()

  res.json({
    status: "queued",
    pages: added,
  })
})

app.listen(3000, () => {
  console.log("Crawler ready on port 3000")
})
