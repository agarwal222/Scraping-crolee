export async function clutchHandler({ page }) {
  await page.waitForSelector(".provider-row")

  const companies = await page.$$eval(".provider-row", (rows) =>
    rows.map((row) => ({
      name: row.querySelector(".provider__title")?.innerText,
      website: row.querySelector("a.website-link__item")?.href,
      location: row.querySelector(".locality")?.innerText,
      source: "clutch",
    })),
  )

  return companies
}
