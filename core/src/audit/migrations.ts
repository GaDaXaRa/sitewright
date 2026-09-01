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
/**
 * A serverless site needs the **pooled** connection string.
 *
 * Each function instance opens its own connection, and Postgres counts them: with the
 * direct endpoint a busy afternoon exhausts the limit and the site starts answering with
 * database errors, at the worst possible time and without anything having changed.
 *
 * It checks **the string you hand it**, which is worth saying: the value a deployment
 * actually uses cannot be read back from the host (`vercel env pull` redacts it), so pass
 * the same one production has, or this gate is only auditing your own notes.
 */
export function checkPooled(databaseUrl?: string): Finding[] {
  if (!databaseUrl) return []

  let host: string
  try {
    host = new URL(databaseUrl).host
  } catch {
    return []
  }

  // Only Neon names its pooled endpoint this way; elsewhere there is nothing to check.
  if (!host.includes('.neon.tech')) return []

  return [
    host.includes('-pooler')
      ? ok(GATE, 'La conexión es la agrupada', host)
      : fail(
          GATE,
          'La conexión es la agrupada',
          `${host} es el endpoint directo. En producción, cada función abre su propia conexión y se agota el límite.`,
        ),
  ]
}

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
    // A database with no `payload_migrations` table has simply never been deployed: the
    // build is what applies them. Reporting a raw Postgres error there sends someone
    // debugging a problem that does not exist.
    if (String(err).includes('payload_migrations') && String(err).includes('does not exist')) {
      return [
        skip(
          GATE,
          'Migraciones al día',
          'Esta base no tiene migraciones todavía: se aplican en el primer despliegue.',
        ),
      ]
    }
    return [fail(GATE, 'Migraciones al día', `No se pudo consultar la base: ${err}`)]
  } finally {
    await client.end().catch(() => {})
  }
}
