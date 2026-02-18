export async function sortlistHandler({ page }) {
  try {
    await page.waitForSelector("a.agency-card-content", {
      timeout: 15000,
    })
  } catch {
    console.log("[SORTLIST] No agency cards found")
    return []
  }

  const leads = await page.$$eval("a.agency-card-content", (cards) =>
    cards.map((card) => {
      const name = card.querySelector(".agency-name p")?.innerText?.trim()

      const location = card
        .querySelector(
          ".agency-info-cell svg[data-testid='LocationOnTwoToneIcon']",
        )
        ?.parentElement?.innerText?.replace("Located in", "")
        .trim()

      const profileUrl = card.getAttribute("href")

      return {
        name,
        profileUrl: profileUrl ? `https://www.sortlist.com${profileUrl}` : null,
        profileUrl: profileUrl ? `https://www.sortlist.com${profileUrl}` : null,
        location,
        source: "sortlist",
        category: "video-production",
      }
    }),
  )

  const cleaned = leads.filter(
    (l) =>
      l.name &&
      l.profileUrl &&
      l.profileUrl.startsWith("https://www.sortlist.com"),
  )

  return cleaned
}
