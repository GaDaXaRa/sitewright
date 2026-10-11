import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { isCoreOnly } from './lib/drift.mjs'

/**
 * Una web que sólo usa el núcleo no es una web generada.
 *
 * Organic Yoga adoptó `sitewright-core` por npm sin salir nunca del generador: no lleva
 * blueprint y sus secciones no son módulos. `doctor` le contaba veinte ficheros del chasis
 * «por traer» y le sugería `sync-site --apply`, que le habría añadido el aviso legal, la
 * privacidad, las cookies y un `[seccion]` capaz de tapar sus propias rutas — a una web
 * pública. `sync-written` ya se negaba sin blueprint; `sync-site` no.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// No registry in tests: doctor asks npm for published versions, and a test that depends on
// the network fails for reasons unrelated to what it checks. An unreachable registry makes
// npm fail fast, which doctor already handles by saying it could not ask.
const OFFLINE = {
  ...process.env,
  npm_config_registry: 'http://127.0.0.1:9/',
  npm_config_fetch_retries: '0',
  npm_config_fetch_timeout: '1000',
}

/** Runs a script and returns its exit code and both outputs, without throwing on failure. */
function run(script, args) {
  try {
    const stdout = execFileSync('node', [join(ROOT, script), ...args], {
      cwd: ROOT,
      env: OFFLINE,
      stdio: 'pipe',
    }).toString()
    return { code: 0, stdout, stderr: '' }
  } catch (err) {
    return { code: err.status, stdout: `${err.stdout ?? ''}`, stderr: `${err.stderr ?? ''}` }
  }
}

function filesIn(dir, prefix = '') {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) out.push(...filesIn(join(dir, entry.name), rel))
    else out.push(rel)
  }
  return out.sort()
}

const treeHash = (dir) => {
  const h = createHash('sha256')
  for (const rel of filesIn(dir)) h.update(rel).update(readFileSync(join(dir, rel)))
  return h.digest('hex')
}

/** Una web que consume el núcleo por npm, con una ruta propia, y sin blueprint. */
function webDeSoloNucleo() {
  const sitio = mkdtempSync(join(tmpdir(), 'core-only-'))
  const escribe = (rel, texto) => {
    mkdirSync(dirname(join(sitio, rel)), { recursive: true })
    writeFileSync(join(sitio, rel), texto)
  }

  escribe('package.json', JSON.stringify({ name: 'yoga', dependencies: { 'sitewright-core': '^0.18.0' } }))
  escribe('node_modules/sitewright-core/package.json', JSON.stringify({ name: 'sitewright-core', version: '0.18.0' }))
  escribe('src/app/(frontend)/clases/page.tsx', 'export default function Clases() {}\n')

  return { sitio, escribe, limpia: () => rmSync(sitio, { recursive: true, force: true }) }
}

test('sin blueprint es una web de sólo núcleo; con él, una generada', () => {
  const { sitio, escribe, limpia } = webDeSoloNucleo()
  try {
    assert.equal(isCoreOnly(sitio), true)
    escribe('sitewright.json', '{}\n')
    assert.equal(isCoreOnly(sitio), false)
  } finally {
    limpia()
  }
})

test('sync-site --apply se niega a escribir en ella, y no escribe ni un byte', () => {
  const { sitio, limpia } = webDeSoloNucleo()
  try {
    const antes = treeHash(sitio)
    const { code, stderr } = run('scripts/sync-site.mjs', [sitio, '--apply'])

    assert.notEqual(code, 0)
    assert.match(stderr, /no salió del generador/)
    assert.equal(treeHash(sitio), antes)
    // Los que habrían cambiado la web pública.
    assert.ok(!existsSync(join(sitio, 'src/app/(frontend)/aviso-legal/page.tsx')))
    assert.ok(!existsSync(join(sitio, 'src/app/(frontend)/[seccion]/page.tsx')))
    // Ni el sello: escribirlo afirmaría que la fábrica le entregó algo.
    assert.ok(!existsSync(join(sitio, '.sitewright-sync.json')))
  } finally {
    limpia()
  }
})

test('y también sin --apply: una lista de «falta» acabada en «para aplicarlo» es una invitación', () => {
  const { sitio, limpia } = webDeSoloNucleo()
  try {
    const { code, stdout, stderr } = run('scripts/sync-site.mjs', [sitio])

    assert.notEqual(code, 0)
    assert.match(stderr, /no salió del generador/)
    assert.doesNotMatch(stdout, /falta\s/)
    assert.doesNotMatch(`${stdout}${stderr}`, /sync-site -- .* --apply/)
  } finally {
    limpia()
  }
})

test('la negativa dice qué es lo único que le aplica', () => {
  const { sitio, limpia } = webDeSoloNucleo()
  try {
    assert.match(run('scripts/sync-site.mjs', [sitio, '--apply']).stderr, /npm run sync-core -- /)
  } finally {
    limpia()
  }
})

test('doctor la da por web de sólo núcleo, sin ficheros por traer ni sync-site', () => {
  const { sitio, limpia } = webDeSoloNucleo()
  try {
    const { code, stdout } = run('scripts/doctor.mjs', [sitio])

    assert.equal(code, 0)
    assert.match(stdout, /Sólo núcleo\s+no salió del generador/)
    assert.doesNotMatch(stdout, /Ficheros de la fábrica/)
    assert.doesNotMatch(stdout, /por traer/)
    assert.doesNotMatch(stdout, /sync-site/)
  } finally {
    limpia()
  }
})

test('y sigue diciendo qué núcleo tiene, que es lo que sí le importa', () => {
  const { sitio, limpia } = webDeSoloNucleo()
  try {
    const { stdout } = run('scripts/doctor.mjs', [sitio])

    assert.match(stdout, /Lo instalado es lo declarado\s+sitewright-core 0\.18\.0/)
    assert.match(stdout, /Al día con el núcleo/)
  } finally {
    limpia()
  }
})

test('una web con su blueprint sigue comparándose con la fábrica', () => {
  // La puerta no puede tragarse a las webs generadas: son las que sí tienen chasis atrasado.
  const { sitio, escribe, limpia } = webDeSoloNucleo()
  try {
    escribe('sitewright.json', '{}\n')

    assert.match(run('scripts/doctor.mjs', [sitio]).stdout, /Ficheros de la fábrica/)
    const antes = treeHash(sitio)
    const { code, stdout } = run('scripts/sync-site.mjs', [sitio])
    assert.equal(code, 0)
    assert.match(stdout, /falta\s/)
    assert.equal(treeHash(sitio), antes)
  } finally {
    limpia()
  }
})
