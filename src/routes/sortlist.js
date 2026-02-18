export async function sortlistHandler({ page, request, crawler }) {
  await page.waitForSelector(".provider-card")

  const leads = await page.$$eval(".provider-card", (cards) =>
    cards.map((card) => ({
      name: card.querySelector(".provider-name")?.innerText?.trim(),
      website: card.querySelector("a.visit-website")?.href,
      location: card.querySelector(".provider-location")?.innerText?.trim(),
      source: "sortlist",
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
        userData: { label: "SORTLIST" },
      },
    ])
  }

  await page.waitForTimeout(3000 + Math.random() * 3000)

  return leads.filter((l) => l.website)
}
