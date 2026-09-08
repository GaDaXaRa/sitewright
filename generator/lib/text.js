/**
 * Lo que necesitan todos los que escriben un fichero.
 *
 * Vive aparte porque `generate.js` era un guion de novecientas líneas que se ejecutaba al
 * importarlo: nada de lo que hay aquí se podía llamar desde una prueba, y lo único que
 * vigilaba al generador era compilar tres webs enteras en la CI, minutos por vuelta.
 */

/**
 * Lo que lanza un escritor cuando la plantilla ya no dice lo que él esperaba.
 *
 * Antes de tener nombre, esto llamaba directamente a `process.exit`. Un escritor que puede
 * matar el proceso no se puede probar: la prueba se muere con él. Ahora avisa, y quien
 * dirige —el CLI— decide qué hacer, que es borrar lo escrito a medias y explicarlo.
 */
export class TemplateChanged extends Error {
  constructor(what, pattern) {
    super(
      `la plantilla ha cambiado y el generador ya no sabe escribir ${what}.\n` +
        `  No encuentra:  ${pattern}\n\n` +
        '  Arregla el patrón en generator/lib/, o deshaz el cambio en template/.',
    )
    this.name = 'TemplateChanged'
    this.what = what
  }
}

/**
 * Un reemplazo sobre la plantilla que **tiene** que ocurrir.
 *
 * `String.replace` devuelve el texto intacto cuando el patrón no casa, así que reindentar
 * un fichero de la plantilla bastaba para que saliera un sitio aparentemente bien generado
 * al que le faltaba media configuración. El caso peor no era la paleta: era el `hasEmbeds`
 * del consentimiento, que se pone buscando tres líneas con su sangría exacta —sin él los
 * reproductores dejan de pedir permiso y nadie se entera hasta que lo mira una autoridad—.
 *
 * Aquí se para y se dice cuál falló, que es la regla de la casa: un guion que termina bien
 * tiene que haber hecho su trabajo.
 */
export function replaceOrDie(text, pattern, replacement, what) {
  const matches = typeof pattern === 'string' ? text.includes(pattern) : pattern.test(text)
  if (!matches) throw new TemplateChanged(what, pattern)
  return text.replace(pattern, replacement)
}

export const capitalise = (text) => text.charAt(0).toUpperCase() + text.slice(1)
export const fontImport = (font) =>
  (typeof font === 'string' ? font : font.family).replaceAll(' ', '_')
export const fontWeights = (font, fallback) =>
  typeof font === 'string' ? fallback : (font.weights ?? fallback)
