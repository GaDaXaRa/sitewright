/**
 * Decidir qué es fondo en una imagen que tiene el fondo plano.
 *
 * Es lo que hace falta para quitarle el recuadro blanco a un logo, y no es recortar de
 * verdad: aquí no hay modelo ni entiende nada de lo que ve. Mira las esquinas, y si las
 * cuatro son del mismo color decide que ese color es el fondo. Con una foto, con un
 * degradado o con un logo que llega hasta el borde, se niega — que es mejor que estropear
 * la imagen y dejar a alguien preguntándose qué ha pasado.
 *
 * Todo esto es aritmética sobre píxeles, así que se prueba sin abrir un solo fichero.
 */

export type Rgb = [number, number, number]

/**
 * Cuánto se diferencian dos colores, de 0 a 255.
 *
 * La mayor de las tres diferencias, y no la media: un rojo y un negro se parecen en dos
 * canales de tres, y promediando saldrían casi iguales.
 */
export function colourDistance(a: Rgb, b: Rgb): number {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]))
}

/** Si un píxel es fondo, con el margen que se le dé. */
export function isBackdrop(pixel: Rgb, backdrop: Rgb, tolerance: number): boolean {
  return colourDistance(pixel, backdrop) <= tolerance
}

/**
 * El color de fondo de una imagen, o `null` si no tiene uno plano.
 *
 * Recibe las cuatro esquinas. Si alguna se sale del margen respecto a la primera, esta
 * imagen no tiene un fondo que quitar: puede ser una foto, un degradado, o un logo que
 * llega hasta el borde. En los tres casos la respuesta correcta es no tocarla.
 */
export function flatBackdrop(corners: Rgb[], tolerance: number): Rgb | null {
  if (corners.length < 4) return null

  const [first, ...rest] = corners as [Rgb, ...Rgb[]]
  return rest.every((corner) => isBackdrop(corner, first, tolerance)) ? first : null
}

/**
 * Cuántos píxeles de una imagen son fondo, contados sobre sus bytes RGBA.
 *
 * Sirve para negarse cuando el resultado sería absurdo: si «el fondo» es casi toda la
 * imagen, lo que hay debajo no es un logo sino un color liso, y dejaríamos una imagen en
 * blanco. La proporción la decide quien llama.
 */
export function backdropShare(pixels: Uint8Array | Uint8ClampedArray, backdrop: Rgb, tolerance: number): number {
  const total = Math.floor(pixels.length / 4)
  if (!total) return 0

  let matches = 0
  for (let i = 0; i < pixels.length; i += 4) {
    const pixel: Rgb = [pixels[i]!, pixels[i + 1]!, pixels[i + 2]!]
    if (isBackdrop(pixel, backdrop, tolerance)) matches += 1
  }

  return matches / total
}

/**
 * Vuelve transparente lo que sea fondo, sobre los propios bytes.
 *
 * El borde de un logo está suavizado —píxeles a medio camino entre la tinta y el fondo— y
 * ahí no hay respuesta binaria buena: si se dejan opacos queda un halo del color viejo, y
 * si se borran, el contorno se come. Se les da transparencia proporcional a lo cerca que
 * están del fondo, que es lo que hace que el resultado no parezca recortado con tijeras.
 */
export function clearBackdrop(
  pixels: Uint8Array | Uint8ClampedArray,
  backdrop: Rgb,
  tolerance: number,
): void {
  // El doble del margen es donde la transparencia deja de bajar: dentro del margen es
  // fondo del todo, y a partir del doble es tinta del todo.
  const fade = Math.max(1, tolerance * 2)

  for (let i = 0; i < pixels.length; i += 4) {
    const pixel: Rgb = [pixels[i]!, pixels[i + 1]!, pixels[i + 2]!]
    const distance = colourDistance(pixel, backdrop)

    if (distance <= tolerance) {
      pixels[i + 3] = 0
      continue
    }

    // El tope importa: un array de bytes no recorta lo que se sale, le da la vuelta, y un
    // píxel opaco de más acabaría casi transparente.
    const opacity = Math.min(1, (distance - tolerance) / (fade - tolerance))
    pixels[i + 3] = Math.round(pixels[i + 3]! * opacity)
  }
}

/** Lo que se le dice a una persona cuando la imagen no tiene un fondo que quitar. */
export const NO_BACKDROP =
  'Esta imagen no tiene un fondo liso que quitar: las esquinas no son del mismo color. ' +
  'Pasa con las fotos y con los logos que llegan hasta el borde.'

/** Y cuando quitarlo la dejaría casi vacía. */
export const TOO_MUCH_BACKDROP =
  'Casi toda la imagen es de ese color, así que quitarlo la dejaría en blanco. ' +
  'Comprueba que has subido el logo y no un fondo.'
