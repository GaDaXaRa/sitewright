import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

/**
 * ¿Las migraciones tienen lo que dice el código?
 *
 * Añadir un campo a una colección y olvidar `migrate:create` no rompe nada visible: no hay
 * migración pendiente que aplicar, el despliegue pasa, y el panel revienta el día que
 * alguien toca ese campo. Nada lo vigilaba, porque la auditoría mira la base contra las
 * migraciones y esto es un escalón antes: las migraciones contra el código.
 *
 * **No hace falta base de datos.** Payload compara el último `.json` que deja cada
 * migración con el esquema que declara el código; conectarse no es necesario y su propio
 * `migrate:create` arranca con `disableDBConnect`. Por eso esto corre en la CI de cada web
 * sin credenciales de nadie.
 *
 * Se apoya en tripas de Payload que no son API pública, así que **ante la duda calla**: si
 * no encuentra lo que espera, lo dice y sale bien. Sólo falla cuando drizzle ha calculado
 * sentencias de verdad, que es lo único que significa algo.
 */

const done: (code: number, message: string) => never = (code, message) => {
  console.log(`\n  ${message}\n`)
  process.exit(code)
}

const payload = await getPayload({ config: await config, disableDBConnect: true })

// Las cuatro cosas que hacen falta del adaptador. Si alguna falta, esta versión de Payload
// hace las migraciones de otra manera y aquí no hay nada que decir.
const db = payload.db as unknown as {
  migrationDir?: string
  schema?: unknown
  schemaName?: string
  requireDrizzleKit?: () => {
    generateDrizzleJson?: (schema: unknown) => Promise<Record<string, unknown>>
    generateMigration?: (before: unknown, after: unknown) => Promise<string[]>
    upSnapshot?: (snapshot: unknown) => Record<string, unknown>
  }
}

const kit = typeof db.requireDrizzleKit === 'function' ? db.requireDrizzleKit() : null
const { generateDrizzleJson, generateMigration, upSnapshot } = kit ?? {}
if (!generateDrizzleJson || !generateMigration || !db.schema || !db.migrationDir) {
  done(0, 'Sin comprobar: esta base de datos no compara esquemas como se esperaba.')
}

const dir = db.migrationDir
const snapshots = existsSync(dir)
  ? readdirSync(dir)
      .filter((file) => file.endsWith('.json'))
      .sort()
      .reverse()
  : []

// Una web recién generada todavía no tiene ninguna: su esquema entero lo escribe el primer
// despliegue, y compararlo contra la nada diría que «falta todo».
if (!snapshots.length) {
  done(0, 'Sin comprobar: esta web no tiene migraciones todavía.')
}

const after = await generateDrizzleJson(db.schema)
let before = JSON.parse(readFileSync(join(dir, snapshots[0]!), 'utf8'))

// Un snapshot viejo puede estar en un formato anterior al que entiende el drizzle de hoy.
if (upSnapshot && Number(before.version) < Number(after.version)) {
  before = upSnapshot(before)
}

const statements = await generateMigration(before, after)

if (!statements?.length) {
  done(0, `El esquema coincide con las migraciones (${snapshots.length} aplicadas).`)
}

console.log(`\n  El código declara un esquema que las migraciones no tienen.

  Falta una migración con esto:\n`)
for (const statement of statements) console.log(`    ${statement.trim()}`)
console.log(`
  Se escribe con:  npm run migrate:create <nombre-corto>

  Sin ella el despliegue pasa —no hay nada pendiente que aplicar— y el panel falla el día
  que alguien toque ese campo.
`)
process.exit(1)
