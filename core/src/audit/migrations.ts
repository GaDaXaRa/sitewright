import { readdirSync } from 'node:fs'
import { type Finding, fail, ok, skip } from './types.js'

const GATE = 'esquema'

/**
 * The state of the database's migrations, which is where a deploy dies silently.
 *
 * Running the site in dev mode pushes the schema straight to the database and records it as
 * `batch = -1`. On the next production build `payload migrate` sees that row, asks whether
 * to continue, and a build has nobody to answer: it hangs or fails. It happened on the first
 * deploy of the first site built this way, and the cause was mundane — development and
 * production sharing one branch.
 */
export async function checkMigrations({
  databaseUrl,
  migrationsDir,
}: {
  databaseUrl?: string
  migrationsDir?: string
}): Promise<Finding[]> {
  if (!databaseUrl) {
    return [skip(GATE, 'Migraciones al día', 'Sin DATABASE_URL: no se puede mirar la base.')]
  }

  // `pg` is optional: it belongs to the site (Payload brings it), not to the core.
  let client: {
    connect: () => Promise<unknown>
    query: (sql: string) => Promise<{ rows: Record<string, unknown>[] }>
    end: () => Promise<unknown>
  }
  try {
    const pg = await import('pg')
    const Client = (pg.default ?? pg).Client
    client = new Client({ connectionString: databaseUrl })
  } catch {
    return [skip(GATE, 'Migraciones al día', 'No está instalado `pg` en este sitio.')]
  }
  try {
    await client.connect()
    const { rows } = await client.query(
      'SELECT name, batch FROM payload_migrations ORDER BY batch',
    )

    const findings: Finding[] = []
    const devMarks = rows.filter((row) => String(row.batch) === '-1')
    findings.push(
      devMarks.length
        ? fail(
            GATE,
            'Sin marcas de modo dev en la base',
            `${devMarks.length} filas con batch = -1: el build se quedará preguntando. Límpialas con scripts/fix-prod-migration.mjs.`,
          )
        : ok(GATE, 'Sin marcas de modo dev en la base'),
    )

    if (migrationsDir) {
      const files = readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
        .map((f) => f.replace(/\.ts$/, ''))
      const applied = new Set(rows.map((row) => String(row.name)))
      const pending = files.filter((file) => !applied.has(file))

      findings.push(
        pending.length
          ? fail(
              GATE,
              'Todas las migraciones están aplicadas',
              `Faltan ${pending.length}: ${pending.join(', ')}.`,
            )
          : ok(GATE, 'Todas las migraciones están aplicadas', `${files.length} aplicadas.`),
      )
    }

    return findings
  } catch (err) {
    return [fail(GATE, 'Migraciones al día', `No se pudo consultar la base: ${err}`)]
  } finally {
    await client.end().catch(() => {})
  }
}
