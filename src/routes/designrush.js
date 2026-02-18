export async function designrushHandler({ page }) {
  try {
    // wait until cards are visible
    await page.waitForSelector(".agency-card", {
      timeout: 15000,
    })
  } catch (err) {
    console.log("[DESIGNRUSH] No agency cards found")
    return []
  }

  const leads = await page.$$eval(".agency-card", (cards) =>
    cards.map((card) => {
      const name = card.querySelector(".agency-card__title")?.innerText?.trim()

      const website = card.querySelector("a.agency-card__visit-btn")?.href

      const location = card
        .querySelector(".agency-card__location")
        ?.innerText?.trim()

      return {
        name,
        website,
        location,
        source: "designrush",
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
