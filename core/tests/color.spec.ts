import { describe, it, expect } from 'vitest'
import { bestTextOn, buttonColors, contrastRatio } from '../src/lib/color.js'

/**
 * A palette is taste; the text on top of it is not. What is tested here is the part with a
 * right answer — and it exists because the template used to hardcode a dark ink on the
 * loud button, which reads on a light accent and vanishes on a dark one.
 */
describe('contrastRatio', () => {
  it('mide lo que ya sabemos que suspendía', () => {
    expect(contrastRatio('#6f6a64', '#0b0b0d')!).toBeCloseTo(3.67, 1)
  })

  it('da lo mismo en un sentido que en el otro, y 21 en los extremos', () => {
    expect(contrastRatio('#ffffff', '#000000')!).toBeCloseTo(21, 1)
    expect(contrastRatio('#000000', '#ffffff')!).toBeCloseTo(21, 1)
  })

  it('no inventa una medida con lo que no es un color', () => {
    expect(contrastRatio('verde', '#000000')).toBeNull()
    // Ni con algo que empieza por seis dígitos válidos y sigue: un color de ocho no es
    // este color, y aceptarlo a medias sería medir otra cosa.
    expect(contrastRatio('#ffffffff', '#000000')).toBeNull()
  })

  it('entiende la forma corta de tres dígitos', () => {
    expect(contrastRatio('#fff', '#000')!).toBeCloseTo(21, 1)
    expect(contrastRatio('#fff', '#000000')).toBe(contrastRatio('#ffffff', '#000000'))
  })

  it('mide bien los tonos muy oscuros, que van por otra rama de la fórmula', () => {
    // Por debajo de 0,03928 el canal se divide entre 12,92 en vez de elevarse: sin un color
    // así, esa rama no se ejecuta nunca y podría estar mal sin que nadie se enterase.
    expect(contrastRatio('#080808', '#ffffff')!).toBeCloseTo(20.03, 1)
  })
})

describe('bestTextOn', () => {
  it('elige la tinta del sitio cuando gana', () => {
    // Acento claro (mango): la tinta oscura del sitio es la que se lee.
    expect(bestTextOn('#f0c040', ['#1e2a1a', '#fbfaf7'])).toBe('#1e2a1a')
  })

  it('se pasa al claro cuando el acento es oscuro', () => {
    expect(bestTextOn('#99423b', ['#1e2a1a', '#f3f2e1'])).toBe('#f3f2e1')
  })

  it('recurre a blanco o negro si la paleta no da para tanto', () => {
    // Dos candidatos mediocres sobre un acento medio: gana el blanco de reserva.
    expect(bestTextOn('#777777', ['#808080', '#6f6f6f'])).toBe('#ffffff')
  })
})

describe('buttonColors', () => {
  it('sobre un acento oscuro pone el claro **del sitio**, no un blanco cualquiera', () => {
    const { text } = buttonColors({ accent: '#99423b', ink: '#1e2a1a', ground: '#f3f2e1' })

    // La identidad importa: el crema de la paleta, no el blanco de reserva. Una web que
    // resuelve sus contrastes con blanco y negro deja de parecerse a sí misma.
    expect(text).toBe('#f3f2e1')
    expect(contrastRatio(text, '#99423b')!).toBeGreaterThanOrEqual(4.5)
  })

  it('sobre un acento claro pone la tinta del sitio', () => {
    const { text } = buttonColors({ accent: '#ffd166', ink: '#141312', ground: '#fbfaf7' })

    expect(text).toBe('#141312')
  })

  it('usa el acento suave para el hover solo si el texto sigue leyéndose', () => {
    const legible = buttonColors({
      accent: '#99423b',
      accentSoft: '#7a332e',
      ink: '#1e2a1a',
      ground: '#f3f2e1',
    })

    expect(legible.hover).toBe('#7a332e')
  })

  it('oscurece el propio acento cuando el suave rompería el texto', () => {
    // Rojo ladrillo con amarillo mango al lado: ningún texto sirve para los dos, que es
    // exactamente el caso que apareció en la primera web hecha por otra persona.
    const { hover } = buttonColors({
      accent: '#99423b',
      accentSoft: '#a67800',
      ink: '#1e2a1a',
      ground: '#f3f2e1',
    })

    expect(hover).toContain('color-mix')
    expect(hover).toContain('#99423b')
  })
})
