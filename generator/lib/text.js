/**
 * Lo que necesitan todos los que escriben un fichero.
 *
 * Vive aparte porque `generate.js` era un guion de novecientas líneas que se ejecutaba al
 * importarlo: nada de lo que hay aquí se podía llamar desde una prueba, y lo único que
 * vigilaba al generador era compilar tres webs enteras en la CI, minutos por vuelta.
 */

export class GeneratorStopped extends Error {}

/**
 * Lo que lanza un escritor cuando la plantilla ya no dice lo que él esperaba.
 *
 * Antes de tener nombre, esto llamaba directamente a `process.exit`. Un escritor que puede
 * matar el proceso no se puede probar: la prueba se muere con él. Ahora avisa, y quien
 * dirige —el CLI— decide qué hacer, que es borrar lo escrito a medias y explicarlo.
 */
export class TemplateChanged extends GeneratorStopped {
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

/**
 * Lo que lanza `fill` cuando la plantilla y los datos han dejado de cuadrar.
 *
 * Va aparte de `TemplateChanged` porque el arreglo está en otro sitio: aquella habla del
 * chasis en `template/`, y ésta de un `.md` en `generator/templates/`.
 */
export class PlaceholderMismatch extends GeneratorStopped {
  constructor(what, detail) {
    super(`${what}: la plantilla y los datos no cuadran.\n  ${detail}\n\n  Míralo en generator/templates/ y en quien la rellena, en generator/lib/docs.js.`)
    this.name = 'PlaceholderMismatch'
    this.what = what
  }
}

/**
 * Rellenar una plantilla de texto: cada `{{hueco}}` por su valor.
 *
 * La prosa que lee una clienta —el README y la guía de su web— vivía dentro de plantillas
 * literales de JavaScript, con cada comilla invertida escapada a mano. Eso ya se subió roto
 * una vez en `provision.js`, y volvió a pasar escribiendo el módulo del horario: una
 * comilla sin escapar y el fichero deja de cargar. En un `.md` no hay nada que escapar.
 *
 * Comprueba **las dos direcciones**, porque las dos han fallado en algún sitio: un hueco sin
 * valor le entrega a la clienta un README que dice literalmente `{{name}}`, y un valor sin
 * hueco es alguien que renombró el hueco en el `.md` y dejó de llegar el dato sin que nada
 * lo dijera.
 */
export function fill(template, values, what) {
  const huecos = new Set([...template.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))

  const sinValor = [...huecos].filter((h) => !(h in values))
  if (sinValor.length) {
    throw new PlaceholderMismatch(what, `La plantilla pide ${sinValor.map((h) => `{{${h}}}`).join(', ')} y nadie los rellena.`)
  }

  const sinHueco = Object.keys(values).filter((k) => !huecos.has(k))
  if (sinHueco.length) {
    throw new PlaceholderMismatch(what, `Se rellena ${sinHueco.join(', ')} y la plantilla no lo pide en ninguna parte.`)
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, hueco) => values[hueco])
}
