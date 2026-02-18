export async function goodfirmsHandler({ page }) {
  try {
    // wait for firm listings
    await page.waitForSelector(".firm-list", {
      timeout: 15000,
    })
  } catch (err) {
    console.log("[GOODFIRMS] No firm list found")
    return []
  }

  const leads = await page.$$eval(".firm-list li", (items) =>
    items.map((item) => {
      const name = item.querySelector(".firm-name")?.innerText?.trim()

      const website = item.querySelector("a.visit-website")?.href

      const location = item.querySelector(".firm-location")?.innerText?.trim()

      return {
        name,
        website,
        location,
        source: "goodfirms",
        category: "video-production",
      }
    }),
  )

  // clean invalid rows
  const cleaned = leads.filter(
    (l) => l.website && l.website.startsWith("http") && l.name,
  )

  return cleaned
}
