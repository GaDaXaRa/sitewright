/**
 * La personalidad de una web: lo que la paleta y las dos tipografías no deciden.
 *
 * Hasta aquí un diseño eran diez colores y dos letras, y todo lo demás —las esquinas, el
 * aire entre secciones, si los titulares gritan en mayúsculas, si las tarjetas flotan, si
 * algo se mueve— era igual en todas las webs. Dos negocios con el mismo acento salían con
 * la misma cara. Esto lo abre en cinco ejes, cada uno con tres o cuatro valores con
 * nombre, y cinco estilos que los combinan para que la entrevista pregunte «¿cuál de
 * estos?» y no veinte cosas sueltas.
 *
 * Son **variables, no reglas**: cada valor se traduce a tokens de `:root` y la hoja usa los
 * tokens. Así una combinación nueva no es CSS nuevo que probar, y el contraste lo sigue
 * midiendo la auditoría sobre la paleta, que no cambia.
 *
 * Funciones puras, como el resto de escritores.
 */

import { replaceOrDie } from './text.js'

/** Los ejes y sus valores, en el vocabulario del blueprint. */
export const AXES = {
  shape: {
    recta: { radius: '0px', 'radius-lg': '0px', 'radius-btn': '0px' },
    suave: { radius: '2px', 'radius-lg': '6px', 'radius-btn': '2px' },
    redonda: { radius: '12px', 'radius-lg': '22px', 'radius-btn': '999px' },
  },
  density: {
    compacta: { 'section-pad': 'clamp(44px, 7vw, 88px)', 'head-gap': 'clamp(22px, 4vw, 36px)' },
    media: { 'section-pad': 'clamp(56px, 9vw, 112px)', 'head-gap': 'clamp(28px, 5vw, 48px)' },
    amplia: { 'section-pad': 'clamp(72px, 12vw, 168px)', 'head-gap': 'clamp(36px, 6vw, 72px)' },
  },
  type: {
    // La de siempre: titulares en mayúsculas, finos y apretados, de cartel de sala.
    mayusculas: {
      weight: 400,
      'display-case': 'uppercase',
      'display-tracking': '-0.02em',
      'display-leading': '1.02',
      'hero-size': 'clamp(40px, 9.5vw, 124px)',
      'hero-leading': '0.88',
      'hero-tracking': '-0.035em',
      'h2-size': 'clamp(30px, 5.5vw, 54px)',
      'label-case': 'uppercase',
      'label-spread': '1',
    },
    // Caja baja, más aire entre líneas: lo que pide una serif o una revista.
    editorial: {
      weight: 400,
      'display-case': 'none',
      'display-tracking': '-0.015em',
      'display-leading': '1.08',
      'hero-size': 'clamp(42px, 8vw, 108px)',
      'hero-leading': '0.98',
      'hero-tracking': '-0.025em',
      'h2-size': 'clamp(30px, 5vw, 52px)',
      'label-case': 'uppercase',
      'label-spread': '1.5',
    },
    // Enorme y pesada: la portada es un cartel.
    cartel: {
      weight: 800,
      'display-case': 'uppercase',
      'display-tracking': '-0.03em',
      'display-leading': '0.95',
      'hero-size': 'clamp(48px, 11vw, 164px)',
      'hero-leading': '0.82',
      'hero-tracking': '-0.05em',
      'h2-size': 'clamp(36px, 7vw, 76px)',
      'label-case': 'uppercase',
      'label-spread': '1.2',
    },
    // Discreta: titulares en caja baja y etiquetas sin espaciar, para quien no quiere gritar.
    sobria: {
      weight: 600,
      'display-case': 'none',
      'display-tracking': '-0.01em',
      'display-leading': '1.12',
      'hero-size': 'clamp(36px, 6.5vw, 80px)',
      'hero-leading': '1.02',
      'hero-tracking': '-0.02em',
      'h2-size': 'clamp(28px, 4.5vw, 44px)',
      'label-case': 'none',
      'label-spread': '0.15',
    },
  },
  surface: {
    plana: { 'card-bg': 'transparent', 'card-border': 'transparent', 'card-border-width': '0px', 'card-pad': '0px', 'card-shadow': 'none', grain: 'none' },
    bordes: { 'card-bg': 'transparent', 'card-border': 'var(--line)', 'card-border-width': '1px', 'card-pad': 'clamp(14px, 2vw, 20px)', 'card-shadow': 'none', grain: 'none' },
    sombras: {
      'card-bg': 'var(--surface)',
      'card-border': 'transparent',
      'card-border-width': '0px',
      'card-pad': 'clamp(14px, 2vw, 20px)',
      'card-shadow': '0 1px 2px rgb(0 0 0 / 0.06), 0 18px 40px -18px rgb(0 0 0 / 0.35)',
      grain: 'none',
    },
    grano: { 'card-bg': 'transparent', 'card-border': 'transparent', 'card-border-width': '0px', 'card-pad': '0px', 'card-shadow': 'none', grain: 'block' },
  },
  motion: {
    ninguno: { reveal: 'none', 'reveal-distance': '0px', 'reveal-scale': '1', intro: 'none' },
    sutil: { reveal: 'reveal', 'reveal-distance': '18px', 'reveal-scale': '1', intro: 'none' },
    expresivo: { reveal: 'reveal', 'reveal-distance': '56px', 'reveal-scale': '0.96', intro: 'intro' },
  },
}

/**
 * Los estilos con nombre: cinco combinaciones que se pueden enseñar y elegir con los ojos.
 * Cualquier eje se puede cambiar suelto encima de uno de ellos.
 */
export const PRESETS = {
  // Es la plantilla tal como fue siempre: una web sin `style` sale así y no cambia de cara.
  nocturno: { shape: 'suave', density: 'media', type: 'mayusculas', surface: 'plana', motion: 'ninguno' },
  editorial: { shape: 'recta', density: 'amplia', type: 'editorial', surface: 'bordes', motion: 'sutil' },
  cartel: { shape: 'recta', density: 'compacta', type: 'cartel', surface: 'grano', motion: 'expresivo' },
  sereno: { shape: 'redonda', density: 'amplia', type: 'sobria', surface: 'sombras', motion: 'sutil' },
  cercano: { shape: 'redonda', density: 'media', type: 'editorial', surface: 'sombras', motion: 'sutil' },
}

export const DEFAULT_PRESET = 'nocturno'

/** Las composiciones de la portada; la primera es la de siempre. Las ve `Hero.tsx`. */
export const HERO_LAYOUTS = ['foto', 'partida', 'enmarcada', 'tipografica']

/** Los ejes ya resueltos: el estilo de partida y, encima, lo que se haya pedido suelto. */
export function resolveStyle(style = {}) {
  return { ...PRESETS[style.preset ?? DEFAULT_PRESET], ...pickAxes(style) }
}

function pickAxes(style) {
  return Object.fromEntries(Object.keys(AXES).filter((axis) => style[axis] !== undefined).map((axis) => [axis, style[axis]]))
}

/**
 * El peso de los titulares, ajustado a lo que de verdad se descarga.
 *
 * Pedir un 800 a una letra que sólo se carga en 400 hace que el navegador lo invente
 * engordando los trazos, que es peor que no pedirlo. Y añadir el peso a la descarga no es
 * seguro: hay familias que no lo tienen, y `next/font` tumba el build. Así que se elige el
 * más cercano de los que el blueprint ya carga.
 */
export function displayWeight(wanted, loaded) {
  const available = (loaded ?? ['400']).map(Number).filter(Number.isFinite)
  if (!available.length) return wanted
  return available.reduce((best, w) => (Math.abs(w - wanted) < Math.abs(best - wanted) ? w : best))
}

/** Los tokens de la personalidad, en el orden en que la hoja los declara. */
export function styleTokens(style, displayWeights) {
  const axes = resolveStyle(style)
  const { weight, ...type } = AXES.type[axes.type]
  return {
    ...AXES.shape[axes.shape],
    ...AXES.density[axes.density],
    'display-weight': String(displayWeight(weight, displayWeights)),
    ...type,
    ...AXES.surface[axes.surface],
    ...AXES.motion[axes.motion],
  }
}

const BLOCK = /(  \/\* ── personalidad ─+[\s\S]*?\*\/\n)[\s\S]*?(  \/\* ── fin de la personalidad ── \*\/)/

/**
 * Escribe la personalidad en la hoja, sustituyendo el bloque entero.
 *
 * De una vez y no token a token: el generador ya parchea la paleta con una expresión por
 * color, y cada eje nuevo así habría sido una expresión más contra la plantilla.
 */
export function applyStyle(css, design) {
  const weights = typeof design.fonts?.display === 'object' ? design.fonts.display.weights : undefined
  const lines = Object.entries(styleTokens(design.style, weights))
    .map(([token, value]) => `  --${token}: ${value};`)
    .join('\n')
  return replaceOrDie(css, BLOCK, (_, head, tail) => `${head}${lines}\n${tail}`, 'la personalidad del diseño')
}

/** Lo que se le dice a quien escribe mal un eje, con lo que sí vale. */
export function styleErrors(style) {
  if (style === undefined) return []
  if (typeof style !== 'object' || style === null || Array.isArray(style)) {
    return ['design.style: un objeto con preset y, si hace falta, ejes sueltos']
  }
  const errors = []
  if (style.preset !== undefined && !(style.preset in PRESETS)) {
    errors.push(`design.style.preset: uno de ${Object.keys(PRESETS).join(', ')}`)
  }
  for (const [axis, values] of Object.entries(AXES)) {
    if (style[axis] !== undefined && !(style[axis] in values)) {
      errors.push(`design.style.${axis}: uno de ${Object.keys(values).join(', ')}`)
    }
  }
  if (style.hero !== undefined && !HERO_LAYOUTS.includes(style.hero)) {
    errors.push(`design.style.hero: uno de ${HERO_LAYOUTS.join(', ')}`)
  }
  for (const key of Object.keys(style)) {
    if (key !== 'preset' && key !== 'hero' && !(key in AXES)) errors.push(`design.style.${key}: no es un eje`)
  }
  return errors
}
