import { describe, it, expect } from 'vitest'
import { slugify } from '../src/lib/slug.js'

describe('slugify', () => {
  it('lowercases and joins with hyphens', () => {
    expect(slugify('Noche en Bajocero')).toBe('noche-en-bajocero')
  })

  it('strips accents instead of dropping the letter', () => {
    expect(slugify('Sesión de Ondas')).toBe('sesion-de-ondas')
    expect(slugify('Añoranza')).toBe('anoranza')
  })

  it('collapses anything that is not a letter or a digit', () => {
    expect(slugify('Subsuelo 012 — Nea Kore!')).toBe('subsuelo-012-nea-kore')
  })

  it('leaves no hyphen hanging at either end', () => {
    expect(slugify('  ¿Cuánto dura?  ')).toBe('cuanto-dura')
    expect(slugify('---hola---')).toBe('hola')
  })

  it('returns an empty string when there is nothing usable', () => {
    expect(slugify('!!!')).toBe('')
  })
})
