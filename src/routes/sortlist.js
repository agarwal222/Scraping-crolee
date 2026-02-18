export async function sortlistHandler({ page }) {
  try {
    // wait for agency cards
    await page.waitForSelector(".provider-card", {
      timeout: 15000,
    })
  } catch (err) {
    console.log("[SORTLIST] No provider cards found")
    return []
  }

  const leads = await page.$$eval(".provider-card", (cards) =>
    cards.map((card) => {
      const name = card.querySelector(".provider-name")?.innerText?.trim()

      const website = card.querySelector("a.visit-website")?.href

      const location = card
        .querySelector(".provider-location")
        ?.innerText?.trim()

      return {
        name,
        website,
        location,
        source: "sortlist",
        category: "video-production",
      }
    }),
  )

  // clean invalid entries
  const cleaned = leads.filter(
    (l) => l.website && l.website.startsWith("http") && l.name,
  )

  return cleaned
}
