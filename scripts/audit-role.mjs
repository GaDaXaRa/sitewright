#!/usr/bin/env node
// Un rol de Postgres que sólo puede leer `payload_migrations`, y su cadena guardada como
// secreto del repositorio de la web.
//
// Con él, la auditoría de despliegue comprueba la base de producción —marcas de modo
// desarrollo, migraciones sin aplicar— sin que nada más de la base quede al alcance de la
// CI. Ejecutarlo otra vez cambia la contraseña y regraba el secreto: es también la forma
// de rotarla, y la única, porque la contraseña no se guarda en ninguna parte.
//
//   npm run audit-role -- --project <neon-project-id> --repo GaDaXaRa/<sitio>
import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// `pg` es dependencia de desarrollo del núcleo, que es lo más estable que hay aquí cerca.
const require = createRequire(join(root, 'core/package.json'))
const { Client } = require('pg')

const say = (...args) => console.log(...args)
const stop = (why) => {
  console.error(`\n  ${why}\n`)
  process.exit(1)
}

const arg = (name) => {
  const i = process.argv.lastIndexOf(`--${name}`)
  return i === -1 ? undefined : process.argv[i + 1]
}

const project = arg('project')
const repo = arg('repo')
const org = arg('org') ?? process.env.NEON_ORG_ID ?? 'org-dawn-wave-82111054'
const branch = arg('branch') ?? 'main'
const database = arg('database') ?? 'neondb'

if (!project || !repo) {
  stop('Uso: npm run audit-role -- --project <neon-project-id> --repo <owner/repo>')
}

const neon = (...args) =>
  execFileSync('npx', ['--yes', 'neonctl@latest', ...args, '--org-id', org], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()

say(`\n  ${repo}  ·  proyecto ${project}, rama ${branch}\n`)

const ownerUrl = neon(
  'connection-string', branch,
  '--project-id', project,
  '--role-name', `${database}_owner`,
  '--database-name', database,
)

// Sin caracteres que haya que escapar: esta contraseña viaja dentro de una URL.
const password = randomBytes(24).toString('base64url')

const owner = new Client({ connectionString: ownerUrl })
await owner.connect()

// No vale borrarlo y rehacerlo: un rol con permisos concedidos no se puede tirar. Y así
// esto sirve para las dos cosas, crearlo y cambiarle la contraseña.
const { rows: existing } = await owner.query("SELECT 1 FROM pg_roles WHERE rolname = 'auditoria'")
await owner.query(
  existing.length
    ? `ALTER ROLE auditoria LOGIN PASSWORD '${password}'`
    : `CREATE ROLE auditoria LOGIN PASSWORD '${password}'`,
)
say(`  rol auditoria: ${existing.length ? 'contraseña cambiada' : 'creado'}`)

await owner.query(`GRANT CONNECT ON DATABASE ${database} TO auditoria`)
await owner.query('GRANT USAGE ON SCHEMA public TO auditoria')
await owner.query('GRANT SELECT ON TABLE payload_migrations TO auditoria')

// Neon mete a los roles creados con `neonctl roles create` dentro de `neon_superuser`, y el
// dueño de la base no puede sacarlos —«permission denied to revoke role»—. Por eso este se
// crea con SQL corriente. Si algún día perteneciera a algo, «sólo lectura» sería mentira.
const { rows: groups } = await owner.query(
  `SELECT r.rolname AS name FROM pg_auth_members m
     JOIN pg_roles r ON r.oid = m.roleid
     JOIN pg_roles u ON u.oid = m.member
    WHERE u.rolname = 'auditoria'`,
)
say(`  grupos: ${groups.map((r) => r.name).join(', ') || '(ninguno)'}`)
await owner.end()

const url = new URL(ownerUrl)
url.username = 'auditoria'
url.password = password
// La agrupada: cada ejecución de la CI abre su propia conexión.
url.hostname = url.hostname.replace(/^(ep-[^.]*?)(-pooler)?\./, '$1-pooler.')

// Lo único que importa de un rol llamado «de sólo lectura» es qué NO puede hacer, y eso se
// comprueba intentándolo. Decirlo sin probarlo sería la clase de afirmación que este
// proyecto ya no se permite.
const probe = new Client({ connectionString: url.toString() })
await probe.connect()

const can = async (what, sql) => {
  try {
    await probe.query(sql)
    say(`  ${what}: SÍ`)
    return true
  } catch (err) {
    say(`  ${what}: no (${String(err.message).split('\n')[0]})`)
    return false
  }
}

const allowed = {
  readMigrations: await can('leer payload_migrations', 'SELECT count(*) FROM payload_migrations'),
  readSettings: await can('leer site_settings', 'SELECT * FROM site_settings LIMIT 1'),
  delete: await can('borrar migraciones', 'DELETE FROM payload_migrations WHERE false'),
  create: await can('crear una tabla', 'CREATE TABLE prueba_auditoria (id int)'),
}
await probe.end()

if (!allowed.readMigrations || allowed.readSettings || allowed.delete || allowed.create) {
  stop('Esto no es un rol de sólo lectura. No se guarda nada.')
}

// La contraseña no se enseña ni se escribe en disco: va por la entrada de `gh` y ahí queda.
// Nadie más tiene copia, ni siquiera Neon, porque un rol creado con SQL no lo gestiona su
// consola. Se rota volviendo a ejecutar esto.
execFileSync('gh', ['secret', 'set', 'AUDIT_DATABASE_URL', '--repo', repo], {
  input: url.toString(),
  stdio: ['pipe', 'inherit', 'inherit'],
})

say(`
  Rol de sólo lectura verificado y guardado en ${repo} como AUDIT_DATABASE_URL.

  La contraseña no existe en ningún otro sitio. Para rotarla, vuelve a ejecutar esto.
`)
