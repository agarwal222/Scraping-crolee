export async function designrushHandler({ page }) {
  try {
    await page.waitForSelector("article.item-box.js-agency-item", {
      timeout: 15000,
    })
  } catch {
    console.log("[DESIGNRUSH] No agency cards found")
    return []
  }

  const leads = await page.$$eval("article.item-box.js-agency-item", (cards) =>
    cards.map((card) => {
      const name = card.querySelector(".item-title a")?.innerText?.trim()

      const websiteUrl = card.querySelector(".item-title a")?.href

      const profileUrl = card.querySelector(".item-logo a")?.href

      const description = card
        .querySelector(".item-description")
        ?.innerText?.trim()

      const location = card.querySelector(".i-region span")?.innerText?.trim()

      const employees = card
        .querySelector(".i-employees span")
        ?.innerText?.trim()

      const hourlyRate = card
        .querySelector(".i-hourly-rate span")
        ?.innerText?.trim()

      const budget = card.querySelector(".i-budget span")?.innerText?.trim()

      const projects = card
        .querySelector(".i-portfolios span")
        ?.innerText?.trim()

      // Ratings
      const rates = card.querySelectorAll(".item-rate .rate")

      let rating = null
      let reviewCount = null

      if (rates[0]) {
        rating = rates[0].querySelector("strong")?.innerText?.trim()

        reviewCount = rates[0].querySelector("small")?.innerText?.trim()
      }

      return {
        name,
        profileUrl,
        websiteUrl,
        source: "designrush",
        category: "video-production",
      }
    }),
  )

  const cleaned = leads.filter(
    (l) => l.name && l.websiteUrl && l.websiteUrl.startsWith("http"),
  )

  return cleaned
}
