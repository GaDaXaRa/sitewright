import { describe, it, expect } from 'vitest'
import {
  backdropShare,
  clearBackdrop,
  colourDistance,
  flatBackdrop,
  isBackdrop,
  type Rgb,
} from '../src/lib/backdrop.js'

const BLANCO: Rgb = [255, 255, 255]
const NEGRO: Rgb = [0, 0, 0]
const ROJO: Rgb = [220, 40, 40]

/** Una imagen como bytes RGBA, para no escribirlos a mano. */
function imagen(pixeles: [Rgb, number][]): Uint8Array {
  const out = new Uint8Array(pixeles.length * 4)
  pixeles.forEach(([[r, g, b], a], i) => {
    out.set([r, g, b, a], i * 4)
  })
  return out
}

describe('cuánto se diferencian dos colores', () => {
  it('el mismo color no se diferencia', () => {
    expect(colourDistance(BLANCO, BLANCO)).toBe(0)
  })

  it('manda el canal que más difiere, no la media', () => {
    // Un rojo y un negro coinciden en dos canales de tres: promediando saldrían parecidos.
    expect(colourDistance(ROJO, NEGRO)).toBe(220)
  })

  it('el orden no cambia la respuesta', () => {
    expect(colourDistance(BLANCO, ROJO)).toBe(colourDistance(ROJO, BLANCO))
  })

  it('el margen decide qué cuenta como fondo', () => {
    const casiBlanco: Rgb = [250, 250, 250]
    expect(isBackdrop(casiBlanco, BLANCO, 5)).toBe(true)
    expect(isBackdrop(casiBlanco, BLANCO, 4)).toBe(false)
  })
})

describe('si la imagen tiene un fondo plano', () => {
  it('cuatro esquinas iguales son un fondo', () => {
    expect(flatBackdrop([BLANCO, BLANCO, BLANCO, BLANCO], 8)).toEqual(BLANCO)
  })

  it('una esquina distinta y no hay fondo que quitar', () => {
    // Una foto, un degradado, o un logo que llega hasta el borde.
    expect(flatBackdrop([BLANCO, BLANCO, ROJO, BLANCO], 8)).toBeNull()
  })

  it('el margen también vale aquí: un JPG no da cuatro blancos exactos', () => {
    const casi: Rgb = [252, 253, 251]
    expect(flatBackdrop([BLANCO, casi, BLANCO, casi], 8)).toEqual(BLANCO)
    expect(flatBackdrop([BLANCO, casi, BLANCO, casi], 1)).toBeNull()
  })

  it('con menos de cuatro esquinas no se afirma nada', () => {
    expect(flatBackdrop([BLANCO, BLANCO, BLANCO], 8)).toBeNull()
    expect(flatBackdrop([], 8)).toBeNull()
  })
})

describe('cuánto de la imagen es fondo', () => {
  it('lo cuenta sobre el total', () => {
    const px = imagen([
      [BLANCO, 255],
      [BLANCO, 255],
      [NEGRO, 255],
      [NEGRO, 255],
    ])
    expect(backdropShare(px, BLANCO, 8)).toBe(0.5)
  })

  it('una imagen entera del color del fondo es toda fondo', () => {
    expect(backdropShare(imagen([[BLANCO, 255]]), BLANCO, 8)).toBe(1)
  })

  it('una imagen vacía no es nada', () => {
    expect(backdropShare(new Uint8Array(), BLANCO, 8)).toBe(0)
  })
})

describe('quitar el fondo', () => {
  it('lo que es fondo se vuelve transparente y la tinta no se toca', () => {
    const px = imagen([
      [BLANCO, 255],
      [NEGRO, 255],
    ])
    clearBackdrop(px, BLANCO, 8)
    expect(px[3]).toBe(0)
    expect(px[7]).toBe(255)
  })

  it('el color de la tinta se conserva: sólo cambia la transparencia', () => {
    const px = imagen([[ROJO, 255]])
    clearBackdrop(px, BLANCO, 8)
    expect([px[0], px[1], px[2]]).toEqual([220, 40, 40])
  })

  it('el borde suavizado queda a medias, que es lo que evita el halo', () => {
    // A mitad de camino entre el margen y su doble: media transparencia.
    const medio: Rgb = [255 - 15, 255 - 15, 255 - 15]
    const px = imagen([[medio, 200]])
    clearBackdrop(px, BLANCO, 10)
    expect(px[3]).toBeGreaterThan(0)
    expect(px[3]).toBeLessThan(200)
  })

  it('un píxel justo en el margen es fondo, no borde', () => {
    const justo: Rgb = [245, 245, 245]
    const px = imagen([[justo, 255]])
    clearBackdrop(px, BLANCO, 10)
    expect(px[3]).toBe(0)
  })

  it('la transparencia del borde sale de una cuenta con respuesta exacta', () => {
    // margen 10, desvanecido hasta 20; a distancia 15 es justo la mitad del camino.
    const medio: Rgb = [240, 240, 240]
    const px = imagen([[medio, 200]])
    clearBackdrop(px, BLANCO, 10)
    expect(px[3]).toBe(100)
  })

  it('más allá del doble del margen, la tinta queda intacta', () => {
    const px = imagen([[[255 - 21, 255 - 21, 255 - 21] as Rgb, 200]])
    clearBackdrop(px, BLANCO, 10)
    expect(px[3]).toBe(200)
  })

  it('con margen cero, sólo desaparece el color exacto', () => {
    const px = imagen([
      [BLANCO, 255],
      [[254, 255, 255] as Rgb, 255],
    ])
    clearBackdrop(px, BLANCO, 0)
    expect(px[3]).toBe(0)
    expect(px[7]).toBeGreaterThan(0)
  })
})
