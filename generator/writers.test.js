import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import { sectionOrder } from './schema.js'
import { PlaceholderMismatch, TemplateChanged, fill, replaceOrDie } from './lib/text.js'
import { homePage, siteConfig, siteModules } from './lib/site.js'
import { seedScript, siteSettings } from './lib/panel.js'
import { siteGuide, siteReadme } from './lib/docs.js'
import { applyFonts, applyPalette, moduleStyles, nameStylesheet } from './lib/design.js'

/**
 * Los que escriben la web.
 *
 * Vivían dentro de un guion que se ejecutaba al importarlo, así que **ninguna prueba podía
 * llamarlos**: lo único que los vigilaba era compilar tres webs enteras en la CI, minutos
 * por vuelta y sólo después de subir. Aquí se les pregunta directamente, en milisegundos.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const blueprint = (nombre) =>
  JSON.parse(readFileSync(join(ROOT, 'generator/blueprints', `${nombre}.json`), 'utf8'))

/** Lo mismo que hace `generate.js` antes de pedirle nada a un escritor. */
async function preparar(nombre) {
  const bp = blueprint(nombre)
  const modules = bp.modules
  const wirings = []
  for (const id of Object.keys(modules)) {
    const { wiring } = await import(join(ROOT, 'modules', id, 'wiring.js'))
    wirings.push(wiring)
    modules[id].title = modules[id].title ?? modules[id].labels?.plural ?? id
  }
  return { bp, modules, wirings, order: sectionOrder(bp) }
}

const plantilla = (rel) => readFileSync(join(ROOT, 'template', rel), 'utf8')
const prosa = (rel) => readFileSync(join(ROOT, 'generator/templates', rel), 'utf8')

// ── el reemplazo que tiene que ocurrir ──────────────────────────────────────────────────

test('un patrón que ya no casa se avisa, no se ignora', () => {
  // `String.replace` devuelve el texto intacto cuando no encuentra nada: reindentar un
  // fichero de la plantilla bastaba para que saliera una web aparentemente bien generada a
  // la que le faltaba media configuración.
  assert.throws(
    () => replaceOrDie('hola', /adiós/, 'x', 'el saludo'),
    (err) => err instanceof TemplateChanged && /el saludo/.test(err.message),
  )
})

test('y avisa en vez de matar el proceso, que es lo que impedía probarlo', () => {
  // Llamaba a `process.exit` desde dentro: una prueba que lo tocara se moría con él.
  let vivo = false
  try {
    replaceOrDie('hola', 'adiós', 'x', 'algo')
  } catch {
    vivo = true
  }
  assert.ok(vivo)
})

test('cuando casa, reemplaza', () => {
  assert.equal(replaceOrDie('hola mundo', 'mundo', 'tú', 'algo'), 'hola tú')
})

// ── site.config.ts ──────────────────────────────────────────────────────────────────────

test('las rutas y el menú salen del blueprint', async () => {
  const { bp, modules, wirings } = await preparar('ejemplo-completo')
  const out = siteConfig(bp, modules, wirings)

  assert.match(out, /catalog: '\/sesiones',/)
  assert.match(out, /timetable: '\/horario',/)
  assert.match(out, /\{ href: '\/horario', label: 'Horario' \}/)
})

test('un módulo sin página propia no entra en el menú', async () => {
  const { bp, modules, wirings } = await preparar('ejemplo-completo')
  const out = siteConfig(bp, modules, wirings)

  // `reviews` no tiene ruta: anunciar una página que no existe es un 404 en el menú.
  assert.doesNotMatch(out, /label: 'Prensa'/)
})

// ── site.modules.ts ─────────────────────────────────────────────────────────────────────

test('el registro trae la consulta de cada módulo tal cual la declara su cableado', async () => {
  const { bp, modules, wirings } = await preparar('ejemplo-completo')
  const out = siteModules(bp, modules, wirings)

  // El horario necesita `depth: 1` o el nombre público lo pondría el título del panel en vez
  // de la tarifa, que es justo lo que hace divergir las dos listas.
  assert.match(out, /collection:"timetable".*depth:1/)
})

// ── la portada ──────────────────────────────────────────────────────────────────────────

test('las secciones se pintan en el orden que declara el blueprint', async () => {
  const { bp, modules, wirings, order } = await preparar('ejemplo-completo')
  const out = homePage(bp, modules, wirings, order)

  const posicion = (componente) => out.indexOf(`<${componente}`)
  assert.ok(posicion('AboutSection') < posicion('CatalogSection'))
  assert.ok(posicion('ScheduleSection') < posicion('TimetableSection'))
})

test('sólo importa del núcleo lo que esa web usa', async () => {
  const completo = await preparar('ejemplo-completo')
  const portafolio = await preparar('ejemplo-portafolio')

  // `splitEvents` es de la agenda: importarlo en una web sin agenda deja un import muerto
  // que el linter de esa web marca en rojo.
  assert.match(homePage(completo.bp, completo.modules, completo.wirings, completo.order), /splitEvents/)
  assert.doesNotMatch(
    homePage(portafolio.bp, portafolio.modules, portafolio.wirings, portafolio.order),
    /splitEvents/,
  )
})

// ── el panel y el contenido de ejemplo ──────────────────────────────────────────────────

test('los ajustes del sitio traen los campos que aporta cada módulo', async () => {
  const { bp, modules, wirings } = await preparar('ejemplo-completo')
  const out = siteSettings(plantilla('src/globals/SiteSettings.ts'), bp, modules, wirings)

  // `about` no tiene colección: su texto vive aquí.
  assert.match(out, /name: 'about'/)
})

test('el seed escribe los ejemplos de cada módulo activo', async () => {
  const { bp, modules, wirings } = await preparar('ejemplo-completo')
  const out = seedScript(bp, modules, wirings)

  assert.match(out, /collection: 'timetable'/)
  assert.match(out, /collection: 'faqs'/)
})

// ── lo que se lee ───────────────────────────────────────────────────────────────────────

test('el README y la guía hablan de esta web, no de la plantilla', async () => {
  const { bp, modules } = await preparar('ejemplo-completo')
  const readme = siteReadme(prosa('site-README.md'), bp, modules)

  assert.match(readme, /^# Once/m)
  assert.match(siteGuide(prosa('site-CLAUDE.md'), bp, modules), /Once/)
  // Apuntaba a `../core`, un directorio que no existe al lado de un sitio generado.
  assert.doesNotMatch(readme, /\.\.\/core/)
})

test('sin eslogan, el README no empieza con una línea en blanco de más', async () => {
  const { bp, modules } = await preparar('ejemplo-completo')
  const sinEslogan = { ...bp, identity: { ...bp.identity, tagline: undefined } }

  assert.match(siteReadme(prosa('site-README.md'), sinEslogan, modules), /^# Once\n\nWeb y gestor/)
})

test('la prosa no lleva ni un hueco sin rellenar', async () => {
  // Un `{{name}}` que sobreviva llega literal al repositorio de una clienta.
  const { bp, modules } = await preparar('ejemplo-completo')

  for (const texto of [
    siteReadme(prosa('site-README.md'), bp, modules),
    siteGuide(prosa('site-CLAUDE.md'), bp, modules),
  ]) {
    assert.doesNotMatch(texto, /\{\{/)
  }
})

// ── rellenar una plantilla de texto ─────────────────────────────────────────────────────

test('un hueco sin valor se avisa: llegaría literal al repositorio de una clienta', () => {
  assert.throws(
    () => fill('# {{name}}', {}, 'el README'),
    (err) => err instanceof PlaceholderMismatch && /\{\{name\}\}/.test(err.message),
  )
})

test('y un valor sin hueco también, que es alguien renombrando el hueco en el .md', () => {
  assert.throws(
    () => fill('# hola', { name: 'Once' }, 'el README'),
    (err) => err instanceof PlaceholderMismatch && /name/.test(err.message),
  )
})

test('rellena todas las apariciones del mismo hueco', () => {
  assert.equal(fill('{{a}} y {{a}}', { a: 'x' }, 'algo'), 'x y x')
})

// ── el diseño ───────────────────────────────────────────────────────────────────────────

test('la paleta se escribe entera, y el texto del botón se mide', async () => {
  const { bp } = await preparar('ejemplo-completo')
  const out = applyPalette(plantilla('src/app/(frontend)/styles.css'), bp.design)

  assert.match(out, /--ground: #0b0b0d;/)
  assert.match(out, /--accent: #ff6b4a;/)
  // No se elige a ojo: sale de medir el contraste sobre el acento de esta web.
  assert.match(out, /--on-accent: #[0-9a-f]{6};/)
  assert.match(out, /color-scheme: dark;/)
})

test('los colores propios entran con su tinta, y sin ellos no se toca la hoja', () => {
  const css = plantilla('src/app/(frontend)/styles.css')
  const design = {
    scheme: 'light',
    palette: {
      ground: '#f4efe4', surface: '#ffffff', ink: '#262019', inkSoft: '#4a4238',
      inkFaint: '#6b6357', accent: '#b8452e',
      extras: { indigo: '#274257' },
    },
  }
  const conExtras = applyPalette(css, design)
  assert.match(conExtras, /--indigo: #274257;/)
  assert.match(conExtras, /--on-indigo: #[0-9a-f]{6};/)

  const sinExtras = applyPalette(css, { ...design, palette: { ...design.palette, extras: undefined } })
  assert.doesNotMatch(sinExtras, /colores propios/)
})

test('una hoja que ya no declara un token de la paleta no pasa en silencio', async () => {
  // El caso de verdad no es un blueprint incompleto —eso lo para `validateBlueprint`— sino
  // que alguien toque la plantilla: sin este aviso la web sale con el color de la plantilla
  // en ese sitio, que es el de otra web.
  const { bp } = await preparar('ejemplo-completo')
  const sinLinea = plantilla('src/app/(frontend)/styles.css').replace(/^\s*--line:.*$/m, '')

  assert.throws(
    () => applyPalette(sinLinea, bp.design),
    (err) => err instanceof TemplateChanged && /--line/.test(err.message),
  )
})

test('las tipografías del blueprint se declaran en el layout', async () => {
  const { bp } = await preparar('ejemplo-completo')
  const out = applyFonts(plantilla('src/app/(frontend)/layout.tsx'), bp.design)

  assert.match(out, /Space_Grotesk/)
  assert.match(out, /Public_Sans/)
})

test('los estilos de un módulo viajan con él', async () => {
  const { modules } = await preparar('ejemplo-completo')
  const out = moduleStyles('/* base */', join(ROOT, 'modules'), modules)

  // Una sección sin sus clases sale en producción como una lista de enlaces sin maquetar.
  assert.match(out, /\.cards \{/)
})

test('la hoja firma de quién es', () => {
  const out = nameStylesheet(plantilla('src/app/(frontend)/styles.css'), 'Once')
  assert.match(out, /Once — sistema de diseño/)
})
