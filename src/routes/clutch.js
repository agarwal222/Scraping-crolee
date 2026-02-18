export async function clutchHandler({ page }) {
  try {
    // wait for listings or detect empty page
    await page.waitForSelector(".provider-row", {
      timeout: 15000,
    })
  } catch (err) {
    console.log("[CLUTCH] No provider rows found")
    return []
  }

  const leads = await page.$$eval(".provider-row", (rows) =>
    rows.map((row) => {
      const name = row.querySelector(".provider__title")?.innerText?.trim()

      const website = row.querySelector("a.website-link__item")?.href

      const location = row.querySelector(".locality")?.innerText?.trim()

      return {
        name,
        website,
        location,
        source: "clutch",
        category: "video-production",
      }
    }),
  )

  // remove invalid entries
  const cleaned = leads.filter(
    (l) => l.website && l.website.startsWith("http") && l.name,
  )

  return cleaned
}
