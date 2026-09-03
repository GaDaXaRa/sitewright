import { describe, it, expect } from 'vitest'
import {
  changelogSections,
  compareVersions,
  diagnose,
  normaliseVersion,
  versionsAfter,
} from '../src/lib/versions.js'

describe('comparar versiones', () => {
  it('ordena por número y no por texto', () => {
    expect(compareVersions('0.10.0', '0.9.0')).toBe(1)
    expect(compareVersions('0.9.0', '0.10.0')).toBe(-1)
  })

  it('dos iguales son iguales', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0)
    expect(compareVersions('0.0.1', '0.0.1')).toBe(0)
  })

  it('algo sin un solo número es la versión cero', () => {
    expect(normaliseVersion('latest')).toBe('0.0.0')
    expect(compareVersions('latest', '0.0.0')).toBe(0)
  })

  it('el acento circunflejo no cuenta', () => {
    expect(compareVersions('^0.7.0', '0.7.0')).toBe(0)
  })

  it('sólo cuentan los tres primeros números', () => {
    expect(compareVersions('1.2.3.4', '1.2.3.5')).toBe(0)
  })

  it('un rango se lee como la versión que nombra', () => {
    expect(compareVersions('>=1.0.0', '1.0.0')).toBe(0)
    expect(normaliseVersion('^0.7.0')).toBe('0.7.0')
    expect(normaliseVersion('>=1.2.3-beta.4')).toBe('1.2.3')
    expect(normaliseVersion('2')).toBe('2.0.0')
  })

  it('lo que falta vale cero', () => {
    expect(compareVersions('1', '1.0.0')).toBe(0)
    expect(compareVersions('1.1', '1.0.9')).toBe(1)
  })

  it('la mayor manda antes que la menor y la menor antes que el parche', () => {
    expect(compareVersions('1.0.0', '0.99.99')).toBe(1)
    expect(compareVersions('0.2.0', '0.1.99')).toBe(1)
    expect(compareVersions('0.1.2', '0.1.1')).toBe(1)
  })
})

describe('lo que hay por delante', () => {
  const todas = ['0.1.0', '0.2.0', '0.5.1', '0.7.0', '0.10.0']

  it('deja fuera la que se tiene y las anteriores', () => {
    expect(versionsAfter('0.5.1', todas)).toEqual(['0.7.0', '0.10.0'])
  })

  it('con la última no queda nada', () => {
    expect(versionsAfter('0.10.0', todas)).toEqual([])
  })

  it('las devuelve de la más vieja a la más nueva', () => {
    expect(versionsAfter('0.1.0', ['0.10.0', '0.2.0', '0.7.0'])).toEqual(['0.2.0', '0.7.0', '0.10.0'])
  })
})

describe('el registro de cambios', () => {
  const md = `# Cambios

## Sin publicar (después de 0.9.0)

- algo que aún no existe

## 0.10.0 — 1 de septiembre

- el dominio puede faltar
- y una segunda línea

## 0.6.10

- rutas huérfanas, con un ## suelto en medio de la frase

##  10.0.0

- con dos espacios en la cabecera
`

  it('parte por versión, y los dos números de una decena se leen enteros', () => {
    const secciones = changelogSections(md)
    expect([...secciones.keys()]).toEqual(['0.10.0', '0.6.10', '10.0.0'])
  })

  it('conserva las líneas de cada sección tal cual', () => {
    expect(changelogSections(md).get('0.10.0')).toBe(
      '- el dominio puede faltar\n- y una segunda línea',
    )
  })

  it('sólo una cabecera empieza sección: un ## en mitad de una frase no', () => {
    expect(changelogSections(md).get('0.6.10')).toContain('## suelto en medio')
  })

  it('una versión nombrada dentro de una cabecera no es la versión de la sección', () => {
    expect(changelogSections(md).has('0.9.0')).toBe(false)
  })

  it('un registro vacío no tiene secciones', () => {
    expect(changelogSections('# Cambios\n').size).toBe(0)
  })

  it('lo que va antes de la primera cabecera no es una sección', () => {
    expect(changelogSections('## 1.0.0\n\n- la primera\n').get('1.0.0')).toBe('- la primera')
  })
})

describe('el diagnóstico de una web', () => {
  const publicadas = ['0.5.0', '0.6.0', '0.7.0']

  it('protesta si la web no usa el núcleo', () => {
    expect(diagnose({ declared: null, installed: null, published: publicadas })).toEqual([
      { level: 'fail', title: 'La web usa el núcleo', detail: 'No depende de sitewright-core.' },
    ])
  })

  it('canta cuando lo instalado no es lo declarado', () => {
    const found = diagnose({ declared: '^0.7.0', installed: '0.5.0', published: publicadas })
    expect(found[0]).toEqual({
      level: 'fail',
      title: 'Lo instalado es lo declarado',
      detail: 'El package.json pide ^0.7.0 y en node_modules hay 0.5.0.',
    })
  })

  it('el acento circunflejo no es una discrepancia', () => {
    const found = diagnose({ declared: '^0.7.0', installed: '0.7.0', published: publicadas })
    expect(found[0]!.level).toBe('ok')
  })

  it('calla cuando coinciden', () => {
    const found = diagnose({ declared: '^0.7.0', installed: '0.7.0', published: publicadas })
    expect(found[0]).toEqual({
      level: 'ok',
      title: 'Lo instalado es lo declarado',
      detail: 'sitewright-core 0.7.0.',
    })
    expect(found[1]).toEqual({
      level: 'ok',
      title: 'Al día con el núcleo',
      detail: '0.7.0 es la última.',
    })
  })

  it('cuenta cuántas versiones se está perdiendo', () => {
    const found = diagnose({ declared: '^0.5.0', installed: '0.5.0', published: publicadas })
    expect(found[1]).toEqual({
      level: 'warn',
      title: 'Al día con el núcleo',
      detail: '2 versiones por detrás: 0.5.0 → 0.7.0.',
    })
  })

  it('en singular cuando es una sola', () => {
    const found = diagnose({ declared: '^0.6.0', installed: '0.6.0', published: publicadas })
    expect(found[1]!.detail).toContain('1 versión por detrás')
  })

  it('sin instalar, juzga por lo declarado', () => {
    const found = diagnose({ declared: '^0.5.0', installed: null, published: publicadas })
    expect(found).toHaveLength(1)
    expect(found[0]!.detail).toBe('2 versiones por detrás: 0.5.0 → 0.7.0.')
  })

  it('no afirma nada si no pudo preguntar al registro', () => {
    const found = diagnose({ declared: '^0.7.0', installed: '0.7.0', published: null })
    expect(found[1]).toEqual({
      level: 'warn',
      title: 'Al día con el núcleo',
      detail: 'No se pudo preguntar al registro.',
    })
  })

  it('en singular cuando falta una, con su nombre completo', () => {
    const found = diagnose({ declared: '^0.6.0', installed: '0.6.0', published: publicadas })
    expect(found[1]!.detail).toBe('1 versión por detrás: 0.6.0 → 0.7.0.')
  })
})
