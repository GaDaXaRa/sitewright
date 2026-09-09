import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'

import { classify, hashOf, readSeal, siteDrift, whatToCopy, writeSeal } from './lib/drift.mjs'

/**
 * Lo que decide si se pisa el trabajo de alguien.
 *
 * `sync-site` copia la fábrica encima de una web viva. Distinguir «se ha quedado atrás» de
 * «alguien lo personalizó aquí» es lo único que separa una puesta al día de borrar una
 * tarde de trabajo, y hasta ahora no lo probaba nada.
 */

test('un fichero que sigue siendo el entregado se ha quedado atrás', () => {
  assert.equal(classify('abc', 'abc'), 'behind')
})

test('un fichero que ya no es el entregado lo personalizó esta web', () => {
  assert.equal(classify('otro', 'abc'), 'customised')
})

test('sin sello no se sabe, y no saberlo no es permiso para pisarlo', () => {
  // Las webs anteriores al sello caen aquí, y tienen que caer del lado seguro.
  assert.equal(classify('abc', undefined), 'unknown')
  assert.notEqual(classify('abc', undefined), 'behind')
})

/** Una fábrica y una web de mentira, con un solo fichero compartido. */
function escenario() {
  const raiz = mkdtempSync(join(tmpdir(), 'drift-fabrica-'))
  const sitio = mkdtempSync(join(tmpdir(), 'drift-sitio-'))

  const escribe = (base, rel, texto) => {
    mkdirSync(dirname(join(base, rel)), { recursive: true })
    writeFileSync(join(base, rel), texto)
  }

  escribe(raiz, 'template/src/comun.ts', 'de la fabrica\n')
  escribe(sitio, 'src/comun.ts', 'de la fabrica\n')
  escribe(sitio, 'package.json', '{"name":"sitio"}\n')

  return { raiz, sitio, escribe, limpia: () => [raiz, sitio].forEach((d) => rmSync(d, { recursive: true, force: true })) }
}

test('sellado y luego cambiado en la fábrica: se puede traer', () => {
  const { raiz, sitio, escribe, limpia } = escenario()
  try {
    writeSeal(sitio, siteDrift(raiz, sitio).pairs)
    escribe(raiz, 'template/src/comun.ts', 'la fabrica avanzo\n')

    const d = siteDrift(raiz, sitio)
    assert.deepEqual(d.behind.map((p) => p.rel), ['src/comun.ts'])
    assert.equal(d.customised.length, 0)
  } finally {
    limpia()
  }
})

test('sellado y luego cambiado en la web: no se toca', () => {
  const { raiz, sitio, escribe, limpia } = escenario()
  try {
    writeSeal(sitio, siteDrift(raiz, sitio).pairs)
    escribe(sitio, 'src/comun.ts', 'esto lo escribio alguien aqui\n')

    const d = siteDrift(raiz, sitio)
    assert.deepEqual(d.customised.map((p) => p.rel), ['src/comun.ts'])
    assert.equal(d.behind.length, 0)
  } finally {
    limpia()
  }
})

test('sin sello, un fichero distinto no se da por atrasado', () => {
  const { raiz, sitio, escribe, limpia } = escenario()
  try {
    escribe(sitio, 'src/comun.ts', 'quien sabe de donde sale esto\n')

    const d = siteDrift(raiz, sitio)
    assert.deepEqual(d.unknown.map((p) => p.rel), ['src/comun.ts'])
    assert.equal(d.behind.length, 0)
  } finally {
    limpia()
  }
})

test('el sello guarda lo entregado, no lo que hay ahora', () => {
  const { raiz, sitio, escribe, limpia } = escenario()
  try {
    writeSeal(sitio, siteDrift(raiz, sitio).pairs)
    const entregado = readSeal(sitio)['src/comun.ts']

    // Alguien personaliza el fichero y se vuelve a sellar: el sello no puede seguirle la
    // corriente, o en la vuelta siguiente su personalización pasaría por «atrasada» y
    // `sync-site` la pisaría sin preguntar.
    escribe(sitio, 'src/comun.ts', 'personalizado\n')
    writeSeal(sitio, siteDrift(raiz, sitio).pairs)

    assert.equal(readSeal(sitio)['src/comun.ts'], entregado)
    assert.notEqual(readSeal(sitio)['src/comun.ts'], hashOf(join(sitio, 'src/comun.ts')))
    assert.equal(siteDrift(raiz, sitio).customised.length, 1)
  } finally {
    limpia()
  }
})

test('lo que falta se trae siempre: no hay nada que destruir', () => {
  const { raiz, sitio, limpia } = escenario()
  try {
    rmSync(join(sitio, 'src/comun.ts'))
    const d = siteDrift(raiz, sitio)
    assert.deepEqual(d.missing.map((p) => p.rel), ['src/comun.ts'])
    assert.equal(d.customised.length, 0)
  } finally {
    limpia()
  }
})

test('el sello olvida lo que la fábrica ha dejado de entregar', () => {
  const { raiz, sitio, escribe, limpia } = escenario()
  try {
    escribe(raiz, 'template/src/temporal.ts', 'esto no durará\n')
    escribe(sitio, 'src/temporal.ts', 'esto no durará\n')
    writeSeal(sitio, siteDrift(raiz, sitio).pairs)
    assert.ok('src/temporal.ts' in readSeal(sitio))

    // La fábrica lo retira. En la web puede quedarse —`sync-site` copia, nunca borra— pero
    // su hash ya no afirma nada, y guardarlo convertiría el sello en un archivo de restos.
    rmSync(join(raiz, 'template/src/temporal.ts'))
    writeSeal(sitio, siteDrift(raiz, sitio).pairs)

    assert.ok(!('src/temporal.ts' in readSeal(sitio)))
    assert.ok('src/comun.ts' in readSeal(sitio))
  } finally {
    limpia()
  }
})

test('sin pares no se reescribe: un error de invocación no vacía el sello', () => {
  const { raiz, sitio, limpia } = escenario()
  try {
    writeSeal(sitio, siteDrift(raiz, sitio).pairs)
    const antes = readSeal(sitio)

    // Lo que pasaría con una raíz equivocada. Podar aquí borraría de un plumazo lo único
    // que distingue una personalización de un fichero atrasado.
    writeSeal(sitio, [])

    assert.deepEqual(readSeal(sitio), antes)
  } finally {
    limpia()
  }
})

test('el sello se escribe legible y ordenado, que es como se revisa un diff', () => {
  const { raiz, sitio, limpia } = escenario()
  try {
    writeSeal(sitio, siteDrift(raiz, sitio).pairs)
    const crudo = readFileSync(join(sitio, '.sitewright-sync.json'), 'utf8')
    assert.match(crudo, /"files"/)
    assert.ok(crudo.endsWith('\n'))
  } finally {
    limpia()
  }
})

/**
 * La puerta: qué se copia encima de una web viva.
 *
 * Es la línea que separa poner al día de borrar la tarde de alguien, y estaba suelta dentro
 * del guion —un `filter` en medio de doscientas líneas de texto por pantalla— sin nada que
 * la probara.
 */
const escenarioPuerta = {
  behind: [{ rel: 'atrasado' }],
  missing: [{ rel: 'falta' }],
  customised: [{ rel: 'personalizado' }],
  unknown: [{ rel: 'sin-sello' }],
}
const copiados = (opciones) => whatToCopy(escenarioPuerta, opciones).copy.map((p) => p.rel)

test('sin --apply no se escribe nada: el comando enseña, no aplica', () => {
  const decision = whatToCopy(escenarioPuerta, {})

  assert.deepEqual(decision.copy, [])
  assert.equal(decision.seals, false)
})

test('--force sin --apply tampoco escribe: es el que más duele si se rompe', () => {
  // Alguien escribe --force pensando en la vuelta siguiente. Si esto se cae, pisa cuatro
  // ficheros de una web viva sin haber pedido aplicar nada.
  const decision = whatToCopy(escenarioPuerta, { force: true })

  assert.deepEqual(decision.copy, [])
  assert.equal(decision.seals, false)
})

test('con --apply se trae lo atrasado y lo que falta, y nada más', () => {
  assert.deepEqual(copiados({ apply: true }), ['atrasado', 'falta'])
})

test('y lo de esta web se respeta: copiar encima borraría lo que alguien escribió', () => {
  const decision = whatToCopy(escenarioPuerta, { apply: true })

  assert.deepEqual(
    decision.respected.map((p) => p.rel),
    ['personalizado', 'sin-sello'],
  )
})

test('sólo --apply --force pisa lo personalizado, que es una decisión escrita', () => {
  assert.deepEqual(copiados({ apply: true, force: true }), [
    'atrasado',
    'falta',
    'personalizado',
    'sin-sello',
  ])
  assert.deepEqual(whatToCopy(escenarioPuerta, { apply: true, force: true }).respected, [])
})

test('un fichero sin sello se trata como personalizado, no como atrasado', () => {
  // No saber si alguien lo tocó no es permiso para pisarlo: las webs anteriores al sello
  // caen aquí enteras.
  assert.ok(!copiados({ apply: true }).includes('sin-sello'))
})

test('sin nada que traer no se inventa trabajo', () => {
  assert.deepEqual(whatToCopy({}, { apply: true }), { copy: [], respected: [], seals: true })
})
