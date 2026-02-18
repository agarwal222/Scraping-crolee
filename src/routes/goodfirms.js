export async function goodfirmsHandler({ page }) {
  try {
    await page.waitForSelector("li.firm-wrapper", {
      timeout: 15000,
    })
  } catch {
    console.log("[GOODFIRMS] No firm cards found")
    return []
  }

  const leads = await page.$$eval("li.firm-wrapper", (cards) =>
    cards.map((card) => {
      const name = card.querySelector(".firm-name a")?.innerText?.trim()

      const profileUrl = card.querySelector("a.visit-profile")?.href

      const websiteUrl = card.querySelector("a.visit-website")?.href

      const rating = card.querySelector(".rating-number")?.innerText?.trim()

      const reviewText = card.querySelector(".firm-rating a")?.innerText?.trim()

      const hourlyRate = card
        .querySelector(".firm-pricing span")
        ?.innerText?.trim()

      const employees = card
        .querySelector(".firm-employees span")
        ?.innerText?.trim()

      const founded = card
        .querySelector(".firm-founded span")
        ?.innerText?.trim()

      const location = card
        .querySelector(".firm-location span")
        ?.innerText?.trim()

      const description = card
        .querySelector(".firm-short-description")
        ?.innerText?.trim()

      return {
        name,
        // profileUrl,
        websiteUrl,
        location,
        source: "goodfirms",
        category: "advertising",
      }
    }),
  )

  const cleaned = leads.filter(
    (l) => l.name && l.websiteUrl && l.websiteUrl.startsWith("http"),
  )

  return cleaned
}
