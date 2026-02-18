export async function goodfirmsHandler({ page, request, crawler }) {
  await page.waitForSelector(".firm-list")

  const leads = await page.$$eval(".firm-list li", (items) =>
    items.map((item) => ({
      name: item.querySelector(".firm-name")?.innerText?.trim(),
      website: item.querySelector("a.visit-website")?.href,
      location: item.querySelector(".firm-location")?.innerText?.trim(),
      source: "goodfirms",
      category: "video-production",
    })),
  )

  // pagination
  const nextPage = await page.$(".pagination-next a")
  if (nextPage) {
    const nextUrl = await nextPage.getAttribute("href")

    await crawler.addRequests([
      {
        url: new URL(nextUrl, request.url).href,
        userData: { label: "GOODFIRMS" },
      },
    ])
  }

  await page.waitForTimeout(3000 + Math.random() * 3000)

  return leads.filter((l) => l.website)
}
