import pkg from "pg"
const { Client } = pkg

export const pg = new Client({
  connectionString: process.env.DATABASE_URL,
})

await pg.connect()

export async function insertLeads(leads) {
  for (const lead of leads) {
    if (!lead.website) continue

    await pg.query(
      `INSERT INTO leads (company_name, website, URL, location, source)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (website) DO NOTHING`,
      [lead.name, lead.website, lead.location, lead.source],
    )
  }
}
