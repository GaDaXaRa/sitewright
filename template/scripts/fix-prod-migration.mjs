// Clears the dev-mode mark that stops `payload migrate` in the Vercel build.
//
// Running Payload in dev mode pushes the schema straight to the database and records it as
// a row with `batch = -1` in `payload_migrations`. On the next production build, `payload
// migrate` sees it, asks whether to continue — and a build has nobody to answer, so it
// hangs or fails. This deletes that row.
//
// Usage:
//   node --env-file=.env scripts/fix-prod-migration.mjs
//
// It prefers PROD_DATABASE_URL when the production database is a separate branch, and
// falls back to DATABASE_URL when dev and production share one.
import pg from 'pg'

const url = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL
if (!url) {
  console.error('❌ Falta PROD_DATABASE_URL (o DATABASE_URL) en el entorno (.env).')
  process.exit(1)
}
if (!process.env.PROD_DATABASE_URL) {
  console.warn('⚠️  Sin PROD_DATABASE_URL: se usa DATABASE_URL (dev y producción comparten base).')
}

const client = new pg.Client({ connectionString: url })
await client.connect()

const before = await client.query('SELECT id, name, batch FROM payload_migrations ORDER BY batch')
console.log('Migraciones antes:', before.rows)

const removed = await client.query('DELETE FROM payload_migrations WHERE batch = -1')
console.log(`Filas de dev (batch = -1) borradas: ${removed.rowCount}`)

const after = await client.query('SELECT id, name, batch FROM payload_migrations ORDER BY batch')
console.log('Migraciones después:', after.rows)

await client.end()
console.log('✅ Listo: el build ya puede ejecutar migrate sin preguntar.')
