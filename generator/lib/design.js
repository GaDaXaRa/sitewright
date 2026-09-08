/**
 * La paleta y las tipografías, aplicadas sobre la hoja y el layout de la plantilla.
 *
 * Funciones puras: reciben el blueprint y devuelven el texto del fichero. No leen el disco
 * ni escriben nada — de eso se ocupa `generate.js`—, y por eso se pueden probar sin generar
 * una web entera.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { bestTextOn, buttonColors } from '../../core/dist/index.js'
import { fontImport, fontWeights, replaceOrDie } from './text.js'

// ── design ──────────────────────────────────────────────────────────────────────────────

/** La hoja firma de quién es: en el repositorio de un cliente, «Sistema de diseño» a secas
 * no dice nada, y el nombre de otra web dice algo falso. */
export function nameStylesheet(css, name) {
  return replaceOrDie(
    css,
    /^\/\* =+\n   Sistema de diseño$/m,
    (head) => head.replace('Sistema de diseño', `${name} — sistema de diseño`),
    'el nombre en la cabecera de la hoja de estilos',
  )
}

export function applyPalette(css, design) {
  const { palette } = design
  const map = {
    ground: palette.ground,
    'ground-2': palette.ground2 ?? palette.surface,
    surface: palette.surface,
    'surface-2': palette.surface2 ?? palette.surface,
    ink: palette.ink,
    'ink-soft': palette.inkSoft,
    'ink-faint': palette.inkFaint,
    line: palette.line ?? palette.surface,
    accent: palette.accent,
    'accent-soft': palette.accentSoft ?? palette.accent,
    // The hero darkens a photo and puts light text on top regardless of the site's own
    // scheme — "light" here means whichever token actually reads as light in this palette:
    // --ground in a light site, --ink in a dark one, where ground is the near-black.
    'on-photo': design.scheme === 'light' ? palette.ground : palette.ink,
    // Y el contrario, para quien elija texto oscuro sobre la foto.
    'on-photo-alt': design.scheme === 'light' ? palette.ink : palette.ground,
  }

  // Measured, not chosen: which ink reads on this accent has a right answer.
  const button = buttonColors({
    accent: palette.accent,
    accentSoft: palette.accentSoft,
    ink: palette.ink,
    ground: palette.ground,
  })
  map['on-accent'] = button.text
  map['accent-hover'] = button.hover

  const claro = design.scheme === 'light'
  let out = replaceOrDie(
    css,
    /color-scheme:\s*\w+;/,
    `color-scheme: ${claro ? 'light' : 'dark'};`,
    'el esquema de color',
  )
  // Un logo monocromo oscuro se ve solo sobre fondo claro y hay que invertirlo sobre uno
  // oscuro; un recuadro blanco desaparece con `multiply` sobre claro y con `screen`
  // sobre oscuro, una vez invertido.
  out = replaceOrDie(out, /--logo-invert:\s*[^;]+;/, `--logo-invert: ${claro ? 0 : 1};`, 'el tratamiento del logo')
  out = replaceOrDie(
    out,
    /--logo-box-blend:\s*[^;]+;/,
    `--logo-box-blend: ${claro ? 'multiply' : 'screen'};`,
    'la mezcla del recuadro del logo',
  )
  for (const [token, value] of Object.entries(map)) {
    // The hover can be a `color-mix(...)` rather than a hex, so the old value is matched up
    // to its semicolon instead of assuming six hex digits.
    // Un token que la hoja ya no declara es una paleta a medio escribir: la web saldría con
    // el color de la plantilla en ese sitio, que es el de otra web.
    out = replaceOrDie(out, new RegExp(`(--${token}:\\s*)[^;]+;`), `$1${value};`, `el color --${token}`)
  }
  return extraColours(out, palette.extras ?? {}, palette)
}

/**
 * Los colores que sólo tiene este diseño.
 *
 * Los diez de la paleta tienen papel fijo —fondo, tinta, línea, acento— y con eso se pinta
 * la estructura, que es igual en todas las webs. Pero un diseño de verdad usa más: Organic
 * Yoga pinta sus bandas con un índigo y sus detalles con un ocre, y esos dos colores
 * aparecen en cuarenta y cuatro sitios de su hoja. Sin un hueco donde declararlos, la única
 * salida era escribir el hexadecimal a mano en cada regla, que es como se pierde una paleta.
 *
 * Cada uno viene con su **tinta medida**, no elegida: `--on-<color>` es el texto que se lee
 * encima, calculado igual que el del botón. Sirve para dos cosas, y la segunda es la que
 * importa: la auditoría busca esas parejas sola, así que un color nuevo entra ya medido y
 * no puede quedarse un texto ilegible sobre una banda de color sin que nadie lo diga.
 */
export function extraColours(css, extras, palette) {
  const names = Object.keys(extras)
  if (!names.length) return css

  const lines = names.flatMap((name) => [
    `  --${name}: ${extras[name]};`,
    `  --on-${name}: ${bestTextOn(extras[name], [palette.ink, palette.ground])};`,
  ])

  return replaceOrDie(
    css,
    /\n\n  --radius:/,
    `\n\n  /* Los colores propios de este diseño, con la tinta que se lee sobre cada uno. */\n${lines.join('\n')}\n\n  --radius:`,
    'los colores propios del diseño',
  )
}

/**
 * Each module's own styles, appended to the site's stylesheet.
 *
 * The section belongs to the module, and so do the class names it renders: shipping one
 * without the other is how a catalogue ends up on a live page as an unstyled list of links.
 */
export function moduleStyles(css, modulesDir, modules) {
  const parts = Object.keys(modules)
    .map((id) => join(modulesDir, id, 'section.css'))
    .filter((path) => existsSync(path))
    .map((path) => readFileSync(path, 'utf8'))

  return parts.length ? `${css}\n${parts.join('\n')}` : css
}

export function applyFonts(layout, design) {
  const display = fontImport(design.fonts.display)
  const body = fontImport(design.fonts.body)
  const displayWeights = fontWeights(design.fonts.display, ['400'])
  const bodyWeights = fontWeights(design.fonts.body, ['400', '500', '600'])

  const block = `import { ${[...new Set([display, body])].join(', ')} } from 'next/font/google'`

  const declarations = `const display = ${display}({
  subsets: ['latin'],
  weight: ${JSON.stringify(displayWeights)},
  variable: '--font-display-google',
  display: 'swap',
})

const body = ${body}({
  subsets: ['latin'],
  weight: ${JSON.stringify(bodyWeights)},
  variable: '--font-body-google',
  display: 'swap',
})`

  const imported = replaceOrDie(
    layout,
    /import \{[^}]+\} from 'next\/font\/google'/,
    block,
    'la importación de las tipografías',
  )
  return replaceOrDie(
    imported,
    /\/\/ The blueprint picks[\s\S]*?const display = body/,
    declarations,
    'la declaración de las tipografías',
  )
}
