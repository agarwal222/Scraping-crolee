export async function clutchHandler({ page, request, crawler }) {
  await page.waitForSelector(".provider-row")

  const leads = await page.$$eval(".provider-row", (rows) =>
    rows.map((row) => ({
      name: row.querySelector(".provider__title")?.innerText?.trim(),
      website: row.querySelector("a.website-link__item")?.href,
      location: row.querySelector(".locality")?.innerText?.trim(),
      source: "clutch",
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
        userData: { label: "CLUTCH" },
      },
    ])
  }

  await page.waitForTimeout(3000 + Math.random() * 3000)

  return leads.filter((l) => l.website)
}
