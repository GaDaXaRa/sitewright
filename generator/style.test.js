import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import { AXES, PRESETS, applyStyle, displayWeight, resolveStyle, styleErrors, styleTokens } from './lib/style.js'
import { applyPalette } from './lib/design.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const hoja = readFileSync(join(ROOT, 'template/src/app/(frontend)/styles.css'), 'utf8')
/** Los tokens declarados en la hoja, el primero de cada nombre, como los lee el navegador en `:root`. */
const cssTokens = (css) => {
  const out = {}
  for (const [, name, value] of css.matchAll(/^  --([\w-]+):\s*([^;]+);/gm)) if (!(name in out)) out[name] = value
  return out
}
const fuentes = { display: { family: 'Fraunces', weights: ['400', '700'] }, body: 'Inter' }

// Las webs que ya existen no llevan `style`. Si el estilo por defecto no fuera exactamente la
// plantilla, `sync-written` les cambiaría la cara sin que nadie lo hubiera pedido.
test('sin estilo, la hoja sale tal cual: ninguna web cambia de cara', () => {
  assert.equal(applyStyle(hoja, { fonts: { display: 'Anton' } }), hoja)
})

test('cada eje de cada estilo existe', () => {
  for (const [nombre, ejes] of Object.entries(PRESETS)) {
    for (const [eje, valor] of Object.entries(ejes)) {
      assert.ok(AXES[eje]?.[valor], `${nombre}.${eje} = ${valor}`)
    }
    assert.deepEqual(Object.keys(ejes).sort(), Object.keys(AXES).sort(), nombre)
  }
})

// Un valor que no declarase un token dejaría el de la plantilla, que es el de otra web.
test('todos los valores de un eje escriben los mismos tokens', () => {
  for (const [eje, valores] of Object.entries(AXES)) {
    const formas = Object.values(valores).map((v) => Object.keys(v).sort().join())
    assert.equal(new Set(formas).size, 1, eje)
  }
})

test('un estilo con nombre llega a la hoja', () => {
  const out = cssTokens(applyStyle(hoja, { style: { preset: 'sereno' }, fonts: fuentes }))

  assert.equal(out['radius-btn'], '999px')
  assert.equal(out['display-case'], 'none')
  assert.equal(out['card-bg'], 'var(--surface)')
  assert.equal(out.reveal, 'reveal')
})

test('un eje suelto se impone al estilo de partida', () => {
  assert.equal(resolveStyle({ preset: 'cartel', motion: 'ninguno' }).motion, 'ninguno')
  assert.equal(resolveStyle({ preset: 'cartel', motion: 'ninguno' }).type, 'cartel')
  assert.equal(resolveStyle({ shape: 'recta' }).type, 'mayusculas')
})

test('el bloque se sustituye entero y la hoja no gana ni pierde nada más', () => {
  const out = applyStyle(hoja, { style: { preset: 'editorial' }, fonts: fuentes })
  const fuera = (css) => css.replace(/\/\* ── personalidad[\s\S]*?── fin de la personalidad ── \*\//, '')

  assert.equal(fuera(out), fuera(hoja))
  assert.equal(out.match(/── personalidad/g).length, 1)
})

test('el peso de los titulares es uno de los que se descargan', () => {
  assert.equal(displayWeight(800, ['400', '700']), 700)
  assert.equal(displayWeight(600, ['400']), 400)
  assert.equal(displayWeight(400, undefined), 400)
  assert.equal(styleTokens({ preset: 'cartel' }, ['300', '900'])['display-weight'], '900')
})

test('los colores propios siguen entrando, delante de la personalidad', () => {
  const palette = {
    ground: '#ffffff', surface: '#f4f4f4', ink: '#111111', inkSoft: '#444444',
    inkFaint: '#666666', accent: '#0044cc', extras: { indigo: '#2b2f77' },
  }
  const out = applyStyle(applyPalette(hoja, { scheme: 'light', palette }), { style: { preset: 'cartel' }, fonts: fuentes })

  assert.ok(out.indexOf('--indigo:') < out.indexOf('── personalidad'))
  assert.equal(cssTokens(out)['display-case'], 'uppercase')
})

test('lo mal escrito se dice con lo que sí vale', () => {
  assert.deepEqual(styleErrors(undefined), [])
  assert.deepEqual(styleErrors({ preset: 'sereno', shape: 'recta' }), [])
  assert.match(styleErrors({ preset: 'barroco' })[0], /nocturno, editorial, cartel, sereno, cercano/)
  assert.match(styleErrors({ shape: 'ovalada' })[0], /recta, suave, redonda/)
  assert.match(styleErrors({ colour: 'rojo' })[0], /no es un eje/)
  assert.equal(styleErrors('sereno').length, 1)
})

test('la portada de partida se valida contra las que existen', () => {
  assert.deepEqual(styleErrors({ hero: 'partida' }), [])
  assert.match(styleErrors({ hero: 'carrusel' })[0], /foto, partida, enmarcada, tipografica/)
})

// El probador inyecta las cinco páginas como JSON dentro de un <script>, y cada una lleva el
// suyo: sin escapar, el primer </script> cerraba el del probador y la página salía en blanco.
test('el probador enseña los cinco estilos y no rompe su propio script', async () => {
  const { probador } = await import('./probador.js')
  const bp = JSON.parse(readFileSync(join(ROOT, 'generator/blueprints/ejemplo-portafolio.json'), 'utf8'))
  bp.identity.name = 'Nombre </script><b>roto'
  const html = probador(bp)

  for (const preset of Object.keys(PRESETS)) assert.match(html, new RegExp(`data-preset="${preset}"`))
  assert.equal(html.match(/<\/script>/g).length, 1)
  assert.doesNotMatch(html, /<b>roto/)
})
