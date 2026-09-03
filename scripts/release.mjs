#!/usr/bin/env node
// Publishing is rare, dangerous and was done by hand twice with the wrong result:
// once with the mutation gate in red, once against a cached registry answer.
// Everything that has to be true before publishing is checked here, not remembered.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const core = join(root, 'core')

const run = (cmd, args, cwd = root) => execFileSync(cmd, args, { stdio: 'inherit', cwd })
const read = (cmd, args, cwd = root) =>
  execFileSync(cmd, args, { encoding: 'utf8', cwd }).trim()
const stop = (why) => {
  console.error(`\n  No se publica: ${why}\n`)
  process.exit(1)
}
const step = (what) => console.log(`\n── ${what} ──`)

const version = JSON.parse(readFileSync(join(core, 'package.json'), 'utf8')).version

step(`sitewright-core ${version}`)

// What gets published must exist in the repo, or nobody can ever reproduce it.
if (read('git', ['status', '--porcelain'])) {
  stop('hay cambios sin confirmar. Publica desde un árbol limpio.')
}

// npm answers from cache by default, and has already told us a version was missing
// when it was there. --prefer-online is the difference between asking and guessing.
let published = ''
try {
  published = read('npm', ['view', `sitewright-core@${version}`, 'version', '--prefer-online'])
} catch {
  published = '' // 404 is the good case: this version is free
}
if (published) stop(`la versión ${version} ya está publicada. Sube la versión primero.`)

// A local .npmrc silently overrode the session token once and cost an hour.
try {
  readFileSync(join(core, '.npmrc'), 'utf8')
  stop('existe core/.npmrc y puede tapar el token de la sesión. Bórralo.')
} catch {}

// npm contesta 404 cuando la credencial no puede publicar, no 401 ni 403: el error dice
// que el paquete no existe cuando lo que pasa es que no te conoce. Preguntarlo antes
// convierte media hora de desconcierto en una línea.
try {
  const who = read('npm', ['whoami'])
  console.log(`  npm te reconoce como ${who}`)
} catch {
  stop(
    'npm no reconoce la credencial. Míralo en este orden: ~/.npmrc (un token revocado ahí\n' +
      '  tapa al bueno), NPM_TOKEN en el perfil, y que el token tenga permiso de publicación.',
  )
}

// The gates live in core's prepublishOnly so they also run when someone publishes
// without this script. npm runs them before it packs anything: a red gate means
// nothing is uploaded. That is why they are not repeated here.
step('Puertas (tipos, pruebas, mutación, build) y publicación')
run('npm', ['publish'], core)

// The template must never point at a version older than the one just published,
// or the next site is born stale.
const templatePath = join(root, 'template', 'package.json')
const template = readFileSync(templatePath, 'utf8')
const updated = template.replace(
  /("sitewright-core":\s*")[^"]+(")/,
  `$1^${version}$2`,
)
// npm contesta `ok` y sale con cero antes de que la versión se pueda instalar: queda
// «preparada» y tarda minutos en propagarse. Sin esperar aquí, lo siguiente que la pida
// falla con un ETARGET que no dice nada de la publicación.
step('Esperando a que el registro la sirva')
const deadline = Date.now() + 10 * 60 * 1000
let live = false
while (!live && Date.now() < deadline) {
  try {
    live = read('npm', ['view', `sitewright-core@${version}`, 'version', '--prefer-online']) === version
  } catch {
    live = false
  }
  if (!live) execFileSync('sleep', ['20'])
}
if (!live) {
  stop(`publicada, pero el registro todavía no la sirve. Reintenta el resto cuando aparezca:
  npm view sitewright-core@${version} version --prefer-online`)
}
console.log(`  disponible`)

if (updated !== template) {
  writeFileSync(templatePath, updated)
  // `npm ci` se niega si el lockfile no cuadra con el package.json, así que cambiar uno
  // sin el otro deja la CI en rojo con un error que no menciona la publicación.
  run('npm', ['install', '--package-lock-only', '--no-audit', '--no-fund'], join(root, 'template'))
  console.log(`\n  template → ^${version}, con su lockfile`)
}

console.log(`
  Publicado sitewright-core ${version}.

  Queda por hacer a mano, porque afecta a sitios en producción:
    node scripts/sync-core.mjs ../<sitio>     actualiza e instala un sitio
    git commit && git tag                       deja constancia de la versión
`)
