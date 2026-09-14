import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { appendFileSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

/**
 * La puerta del eje 1: **aplicar el blueprint encima tiene que dar la misma web que
 * generarla entera**.
 *
 * Es lo único que hace confiable «añadir una sección editando un fichero». Si la vía
 * incremental y la inicial divergen aunque sea en un byte, lo que queda son dos webs
 * distintas según por dónde se haya llegado, y la que está en producción es siempre la que
 * nadie ha comparado.
 *
 * Estas pruebas ejecutan el generador de verdad —no hay forma honesta de comprobar esto con
 * una fábrica de mentira— y por eso viven aparte de las de `drift.test.js`, que son puras.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORTAFOLIO = join(ROOT, 'generator/blueprints/ejemplo-portafolio.json')

const run = (script, args) =>
  execFileSync('node', [join(ROOT, script), ...args], { cwd: ROOT, stdio: 'pipe' }).toString()

const generate = (blueprint, out) =>
  run('generator/generate.js', ['--blueprint', blueprint, '--out', out, '--force'])

const syncWritten = (site, ...flags) => run('scripts/sync-written.mjs', [site, ...flags])

/** Todos los ficheros de una web, en rutas relativas. */
function filesIn(dir, prefix = '') {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) out.push(...filesIn(join(dir, entry.name), rel))
    else out.push(rel)
  }
  return out.sort()
}

/**
 * En qué se diferencian dos webs, fichero a fichero.
 *
 * `sitewright.json` se excluye cuando se pide: es **la entrada**, no algo que el generador
 * redacte para la web, y una generación entera lo reescribe normalizado —rellenando los
 * títulos que el blueprint no daba—. Comparar la receta con la receta normalizada diría
 * algo cierto sobre el generador y nada sobre las dos webs.
 */
function differences(a, b, skip = []) {
  const ficheros = new Set([...filesIn(a), ...filesIn(b)].filter((rel) => !skip.includes(rel)))
  const out = []
  for (const rel of [...ficheros].sort()) {
    let uno, otro
    try { uno = readFileSync(join(a, rel)) } catch { out.push(`sólo en la segunda: ${rel}`); continue }
    try { otro = readFileSync(join(b, rel)) } catch { out.push(`sólo en la primera: ${rel}`); continue }
    if (!uno.equals(otro)) out.push(`distinto: ${rel}`)
  }
  return out
}

const treeHash = (dir) => {
  const h = createHash('sha256')
  for (const rel of filesIn(dir)) h.update(rel).update(readFileSync(join(dir, rel)))
  return h.digest('hex')
}

/** Enciende un módulo más en el blueprint de una web, como lo haría una persona. */
function enable(site, id, module) {
  const path = join(site, 'sitewright.json')
  const bp = JSON.parse(readFileSync(path, 'utf8'))
  bp.modules[id] = module
  writeFileSync(path, JSON.stringify(bp, null, 2) + '\n')
}

const EQUIPO = { labels: { singular: 'Persona', plural: 'Equipo' }, route: '/equipo' }

function escenario() {
  const base = mkdtempSync(join(tmpdir(), 'sitewright-regen-'))
  return {
    dir: (nombre) => join(base, nombre),
    limpia: () => rmSync(base, { recursive: true, force: true }),
  }
}

test('aplicarlo encima de una web recién generada no cambia nada', () => {
  const { dir, limpia } = escenario()
  try {
    const viva = dir('viva')
    const fresca = dir('fresca')
    generate(PORTAFOLIO, viva)
    generate(PORTAFOLIO, fresca)

    const salida = syncWritten(viva, '--apply')

    assert.match(salida, /exactamente lo que su blueprint dice/)
    // Incluido el sello: si sellar por segunda vez moviera un hash, la vuelta siguiente
    // vería personalizado algo que nadie ha tocado.
    assert.deepEqual(differences(viva, fresca), [])
  } finally {
    limpia()
  }
})

test('añadir un módulo por el blueprint deja la misma web que generarla entera', () => {
  const { dir, limpia } = escenario()
  try {
    const viva = dir('viva')
    generate(PORTAFOLIO, viva)

    // Lo que haría una persona: encender el módulo en la receta y aplicarla.
    enable(viva, 'team', EQUIPO)
    syncWritten(viva, '--apply')

    const desdeCero = dir('desde-cero')
    generate(join(viva, 'sitewright.json'), desdeCero)

    assert.deepEqual(differences(viva, desdeCero, ['sitewright.json']), [])
  } finally {
    limpia()
  }
})

test('y trae el módulo entero, no sólo las referencias a él', () => {
  const { dir, limpia } = escenario()
  try {
    const viva = dir('viva')
    generate(PORTAFOLIO, viva)
    enable(viva, 'team', EQUIPO)

    const salida = syncWritten(viva, '--apply')

    assert.match(salida, /módulo nuevo\s+team/)
    assert.ok(filesIn(join(viva, 'src/modules/team')).includes('collection.ts'))
    assert.match(readFileSync(join(viva, 'src/site.config.ts'), 'utf8'), /equipo/)
  } finally {
    limpia()
  }
})

test('avisa de la migración, que es lo que el guion no puede hacer', () => {
  const { dir, limpia } = escenario()
  try {
    const viva = dir('viva')
    generate(PORTAFOLIO, viva)
    enable(viva, 'team', EQUIPO)

    // Una colección nueva sin migración no rompe el despliegue: revienta el panel más
    // tarde, que es la peor forma de enterarse. Callarlo aquí sería programarlo.
    assert.match(syncWritten(viva, '--apply'), /migrate:create/)
  } finally {
    limpia()
  }
})

test('sin --apply no escribe ni un byte', () => {
  const { dir, limpia } = escenario()
  try {
    const viva = dir('viva')
    generate(PORTAFOLIO, viva)
    enable(viva, 'team', EQUIPO)

    const antes = treeHash(viva)
    syncWritten(viva)

    assert.equal(treeHash(viva), antes)
  } finally {
    limpia()
  }
})

test('lo que alguien escribió en esta web se respeta, y el módulo llega igual', () => {
  const { dir, limpia } = escenario()
  try {
    const viva = dir('viva')
    generate(PORTAFOLIO, viva)

    const hoja = join(viva, 'src/app/(frontend)/styles.css')
    const mio = '\n/* esto lo escribió alguien aquí */\n'
    appendFileSync(hoja, mio)
    enable(viva, 'team', EQUIPO)

    const salida = syncWritten(viva, '--apply')

    assert.match(salida, /PERSONALIZADO AQUÍ\s+src\/app\/\(frontend\)\/styles\.css/)
    assert.ok(readFileSync(hoja, 'utf8').endsWith(mio))
    // Y aun así el módulo entra: lo que no se puede pisar no bloquea lo que sí.
    assert.ok(filesIn(join(viva, 'src/modules/team')).includes('Section.tsx'))
  } finally {
    limpia()
  }
})

test('--force pisa lo personalizado, y sólo con --apply delante', () => {
  const { dir, limpia } = escenario()
  try {
    const viva = dir('viva')
    generate(PORTAFOLIO, viva)

    const hoja = join(viva, 'src/app/(frontend)/styles.css')
    appendFileSync(hoja, '\n/* mío */\n')
    enable(viva, 'team', EQUIPO)

    // El que más duele si se rompe: --force a secas no puede escribir nada.
    const antes = treeHash(viva)
    syncWritten(viva, '--force')
    assert.equal(treeHash(viva), antes)

    syncWritten(viva, '--apply', '--force')
    assert.ok(!readFileSync(hoja, 'utf8').includes('/* mío */'))
  } finally {
    limpia()
  }
})

test('un módulo que el blueprint ya no enciende se dice y no se borra', () => {
  const { dir, limpia } = escenario()
  try {
    const viva = dir('viva')
    generate(PORTAFOLIO, viva)

    const path = join(viva, 'sitewright.json')
    const bp = JSON.parse(readFileSync(path, 'utf8'))
    delete bp.modules.faq
    // Apagar un módulo es apagarlo entero: el validador no deja contenido de uno que ya no
    // está, y hace bien — sería una sección sembrada que no pinta nadie.
    delete bp.content?.faq
    writeFileSync(path, JSON.stringify(bp, null, 2) + '\n')

    const salida = syncWritten(viva, '--apply')

    assert.match(salida, /ya no lo enciende\s+faq/)
    // Borrar un directorio del que alguien puede haber editado la mitad no es ponerla al
    // día: se dice y lo quita una persona.
    assert.ok(filesIn(join(viva, 'src/modules/faq')).length > 0)
  } finally {
    limpia()
  }
})

test('una web sin su blueprint dentro no se puede comparar, y se dice', () => {
  const { dir, limpia } = escenario()
  try {
    const viva = dir('viva')
    generate(PORTAFOLIO, viva)
    rmSync(join(viva, 'sitewright.json'))

    assert.throws(
      () => syncWritten(viva),
      (err) => /no lleva su blueprint/.test(`${err.stderr}`),
    )
  } finally {
    limpia()
  }
})

/**
 * Las dos webs que ya están en producción nacieron **antes** de que el sello cubriera lo
 * redactado, así que para ellas todo esto empieza «sin sello» —y sin sello no se pisa
 * nada—. Lo que decide si el eje sirve de algo en la web de un cliente, o sólo en las que
 * se generen a partir de ahora, son estas dos pruebas.
 */
function despuesDelSello(site) {
  const path = join(site, '.sitewright-sync.json')
  const sello = JSON.parse(readFileSync(path, 'utf8'))
  for (const rel of Object.keys(sello.files)) {
    if (!rel.startsWith('src/modules/')) delete sello.files[rel]
  }
  writeFileSync(path, JSON.stringify(sello, null, 2) + '\n')
}

test('una web anterior al sello, si está al día, se sella sola en la primera vuelta', () => {
  const { dir, limpia } = escenario()
  try {
    const viva = dir('viva')
    generate(PORTAFOLIO, viva)
    despuesDelSello(viva)

    syncWritten(viva, '--apply')

    // Un fichero idéntico a lo que el generador escribe hoy **es** el de la fábrica, así
    // que sellarlo no afirma nada que no se acabe de comprobar. Sin esto, las dos webs de
    // producción se quedarían para siempre en «no se sabe».
    const sello = JSON.parse(readFileSync(join(viva, '.sitewright-sync.json'), 'utf8')).files
    assert.ok('src/site.config.ts' in sello)
    assert.ok('src/app/(frontend)/page.tsx' in sello)
  } finally {
    limpia()
  }
})

test('y lo que ya difería en ella no se pisa: no saberlo no es permiso', () => {
  const { dir, limpia } = escenario()
  try {
    const viva = dir('viva')
    generate(PORTAFOLIO, viva)

    const hoja = join(viva, 'src/app/(frontend)/styles.css')
    const mio = '\n/* de antes de que esto se midiera */\n'
    appendFileSync(hoja, mio)
    despuesDelSello(viva)
    enable(viva, 'team', EQUIPO)

    const salida = syncWritten(viva, '--apply')

    assert.match(salida, /sin sello\s+src\/app\/\(frontend\)\/styles\.css/)
    assert.ok(readFileSync(hoja, 'utf8').endsWith(mio))
  } finally {
    limpia()
  }
})

test('no deja copias de la web en el directorio temporal', () => {
  const { dir, limpia } = escenario()
  try {
    const viva = dir('viva')
    generate(PORTAFOLIO, viva)

    const restos = () => readdirSync(tmpdir()).filter((n) => n.startsWith('sitewright-drift-'))
    const antes = restos().length

    // `process.exit` dentro de un `try` no ejecuta el `finally`, así que cada salida
    // temprana dejaba una web entera en el temporal. Esta es la salida temprana.
    syncWritten(viva)

    assert.equal(restos().length, antes)
  } finally {
    limpia()
  }
})
