import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { describeRenames, pendingRenames } from './schema-renames'

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
 * sentencias de verdad, o cuando para calcularlas tendría que preguntar si un nombre es
 * nuevo o renombrado: eso no es duda, es una migración que falta.
 */

const done: (code: number, message: string) => never = (code, message) => {
  console.log(`\n  ${message}\n`)
  process.exit(code)
}

// Every failure says the same thing: what is missing, how to write it, why it matters.
const missing: (lines: string[], renames: boolean) => never = (lines, renames) => {
  console.log(`\n  El código declara un esquema que las migraciones no tienen.

  Falta una migración con esto:\n`)
  for (const line of lines) console.log(`    ${line.trim()}`)
  console.log(`
  Se escribe con:  npm run migrate:create <nombre-corto>
`)
  if (renames) {
    console.log(`  Ese comando pregunta, por cada nombre, si es nuevo o el de antes renombrado, y
  hay que contestarle en una terminal. Si es un cambio de nombre, elige renombrar: crear
  y borrar tira lo que hubiera guardado.
`)
  }
  console.log(`  Sin ella el despliegue pasa —no hay nada pendiente que aplicar— y el panel falla el día
  que alguien toque ese campo.
`)
  process.exit(1)
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

// A name that vanished next to a new one makes drizzle ask "renamed or created?" on the
// terminal, and CI has none: the job used to hang until it timed out.
const renames = pendingRenames(before, after)
if (renames.length) missing(describeRenames(renames), true)

// Whatever question the check above did not foresee: drizzle's prompts listen for
// keypresses on stdin, so the first such listener means it is about to wait for a human.
// Asking at all means the diff is not empty.
process.stdin.on('newListener', (event) => {
  if (event !== 'keypress') return
  if (process.stdin.isTTY) process.stdin.setRawMode(false)
  missing(['(drizzle quiere preguntar si algún nombre es nuevo o renombrado)'], true)
})

const statements = await generateMigration(before, after)

if (!statements?.length) {
  done(0, `El esquema coincide con las migraciones (${snapshots.length} aplicadas).`)
}

missing(statements, false)
