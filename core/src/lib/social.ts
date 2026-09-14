/**
 * La tarjeta que se ve cuando alguien comparte una página.
 *
 * Hasta aquí, las páginas de sección emitían **sólo un título**: ni descripción ni imagen.
 * Compartir `/equipo` por WhatsApp daba un enlace pelado, y es el sitio por el que más
 * llega la gente a una web pequeña. Las fichas tenían descripción y tampoco imagen, aunque
 * cada una tiene una foto delante.
 *
 * Lo que decide aquí es **de dónde sale cada cosa cuando la página no la trae suya**, y son
 * dos cadenas independientes: una ficha puede tener su propio resumen y ninguna foto, y
 * entonces hereda la imagen del sitio sin heredar el texto.
 */

/** Lo que una página —o el sitio entero— puede aportar a su tarjeta. */
export type SocialSource = {
  description?: string | null
  image?: string | null
}

/** Lo que de verdad se emite, ya resuelto. Un campo ausente es un campo que no se emite. */
export type SocialCard = {
  description?: string
  image?: string
}

/**
 * Una cadena vacía **no** es un valor.
 *
 * Un campo del panel que alguien abrió y dejó en blanco llega como `''`, y emitir
 * `<meta name="description" content="">` es peor que no emitirlo: le dice a un buscador que
 * la página se describe así.
 */
const firstFilled = (...values: (string | null | undefined)[]): string | undefined => {
  for (const value of values) {
    const trimmed = typeof value === 'string' ? value.trim() : ''
    if (trimmed) return trimmed
  }
  return undefined
}

/**
 * Resuelve la tarjeta de una página cayendo hacia lo que tenga el sitio.
 *
 * Los `sources` se leen en orden, del más específico al más general: la ficha, luego su
 * sección, luego el sitio. Cada campo cae por su cuenta.
 */
export function socialCard(...sources: (SocialSource | null | undefined)[]): SocialCard {
  const description = firstFilled(...sources.map((s) => s?.description))
  const image = firstFilled(...sources.map((s) => s?.image))
  return {
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
  }
}

/**
 * El texto de una tarjeta, recortado donde lo recortan ellos.
 *
 * WhatsApp, Telegram y los buscadores cortan sobre los 160–200 caracteres. Cortar aquí, por
 * palabras y con puntos suspensivos, es mejor que dejar que lo corten a mitad de una.
 */
export function socialDescription(text: string | null | undefined, max = 200): string | undefined {
  const clean = firstFilled(text)
  if (!clean) return undefined

  const collapsed = clean.replace(/\s+/g, ' ')
  if (collapsed.length <= max) return collapsed

  // Se corta por la última palabra entera que cabe, dejando sitio para el carácter final.
  // Se pregunta por «no hay ningún espacio» y no por «el espacio está más allá del
  // principio»: `collapsed` viene sin espacios en los extremos, así que un espacio en la
  // posición cero no existe y esa comparación no podía decidir nada.
  const cut = collapsed.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  const word = lastSpace === -1 ? cut : cut.slice(0, lastSpace)
  return `${word.replace(/[.,;:\s]+$/, '')}…`
}
