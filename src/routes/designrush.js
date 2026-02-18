export async function designrushHandler({ page, request, crawler }) {
  await page.waitForSelector(".agency-card")

  const leads = await page.$$eval(".agency-card", (cards) =>
    cards.map((card) => ({
      name: card.querySelector(".agency-card__title")?.innerText?.trim(),
      website: card.querySelector("a.agency-card__visit-btn")?.href,
      location: card.querySelector(".agency-card__location")?.innerText?.trim(),
      source: "designrush",
      category: "video-production",
    })),
  )

  // pagination
  const nextPage = await page.$('a[rel="next"]')
  if (nextPage) {
    const nextUrl = await nextPage.getAttribute("href")

    await crawler.addRequests([
      {
        url: new URL(nextUrl, request.url).href,
        userData: { label: "DESIGNRUSH" },
      },
    ])
  }

  await page.waitForTimeout(3000 + Math.random() * 3000)

  return leads.filter((l) => l.website)
}
