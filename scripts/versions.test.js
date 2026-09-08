import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  changelogSections,
  compareVersions,
  diagnose,
  normaliseVersion,
  versionsAfter,
} from './lib/versions.mjs'

describe('comparar versiones', () => {
  it('ordena por número y no por texto', () => {
    assert.equal(compareVersions('0.10.0', '0.9.0'), 1)
    assert.equal(compareVersions('0.9.0', '0.10.0'), -1)
  })

  it('dos iguales son iguales', () => {
    assert.equal(compareVersions('1.2.3', '1.2.3'), 0)
    assert.equal(compareVersions('0.0.1', '0.0.1'), 0)
  })

  it('algo sin un solo número es la versión cero', () => {
    assert.equal(normaliseVersion('latest'), '0.0.0')
    assert.equal(compareVersions('latest', '0.0.0'), 0)
  })

  it('el acento circunflejo no cuenta', () => {
    assert.equal(compareVersions('^0.7.0', '0.7.0'), 0)
  })

  it('sólo cuentan los tres primeros números', () => {
    assert.equal(compareVersions('1.2.3.4', '1.2.3.5'), 0)
  })

  it('un rango se lee como la versión que nombra', () => {
    assert.equal(compareVersions('>=1.0.0', '1.0.0'), 0)
    assert.equal(normaliseVersion('^0.7.0'), '0.7.0')
    assert.equal(normaliseVersion('>=1.2.3-beta.4'), '1.2.3')
    assert.equal(normaliseVersion('2'), '2.0.0')
  })

  it('lo que falta vale cero', () => {
    assert.equal(compareVersions('1', '1.0.0'), 0)
    assert.equal(compareVersions('1.1', '1.0.9'), 1)
  })

  it('la mayor manda antes que la menor y la menor antes que el parche', () => {
    assert.equal(compareVersions('1.0.0', '0.99.99'), 1)
    assert.equal(compareVersions('0.2.0', '0.1.99'), 1)
    assert.equal(compareVersions('0.1.2', '0.1.1'), 1)
  })
})

describe('lo que hay por delante', () => {
  const todas = ['0.1.0', '0.2.0', '0.5.1', '0.7.0', '0.10.0']

  it('deja fuera la que se tiene y las anteriores', () => {
    assert.deepEqual(versionsAfter('0.5.1', todas), ['0.7.0', '0.10.0'])
  })

  it('con la última no queda nada', () => {
    assert.deepEqual(versionsAfter('0.10.0', todas), [])
  })

  it('las devuelve de la más vieja a la más nueva', () => {
    assert.deepEqual(versionsAfter('0.1.0', ['0.10.0', '0.2.0', '0.7.0']), ['0.2.0', '0.7.0', '0.10.0'])
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
    assert.deepEqual([...secciones.keys()], ['0.10.0', '0.6.10', '10.0.0'])
  })

  it('conserva las líneas de cada sección tal cual', () => {
    assert.equal(changelogSections(md).get('0.10.0'), 
      '- el dominio puede faltar\n- y una segunda línea',
    )
  })

  it('sólo una cabecera empieza sección: un ## en mitad de una frase no', () => {
    assert.ok(String(changelogSections(md).get('0.6.10')).includes('## suelto en medio'))
  })

  it('una versión nombrada dentro de una cabecera no es la versión de la sección', () => {
    assert.equal(changelogSections(md).has('0.9.0'), false)
  })

  it('un registro vacío no tiene secciones', () => {
    assert.equal(changelogSections('# Cambios\n').size, 0)
  })

  it('lo que va antes de la primera cabecera no es una sección', () => {
    assert.equal(changelogSections('## 1.0.0\n\n- la primera\n').get('1.0.0'), '- la primera')
  })
})

describe('el diagnóstico de una web', () => {
  const publicadas = ['0.5.0', '0.6.0', '0.7.0']

  it('protesta si la web no usa el núcleo', () => {
    assert.deepEqual(diagnose({ declared: null, installed: null, published: publicadas }), [
      { level: 'fail', title: 'La web usa el núcleo', detail: 'No depende de sitewright-core.' },
    ])
  })

  it('canta cuando lo instalado no es lo declarado', () => {
    const found = diagnose({ declared: '^0.7.0', installed: '0.5.0', published: publicadas })
    assert.deepEqual(found[0], {
      level: 'fail',
      title: 'Lo instalado es lo declarado',
      detail: 'El package.json pide ^0.7.0 y en node_modules hay 0.5.0.',
    })
  })

  it('el acento circunflejo no es una discrepancia', () => {
    const found = diagnose({ declared: '^0.7.0', installed: '0.7.0', published: publicadas })
    assert.equal(found[0].level, 'ok')
  })

  it('calla cuando coinciden', () => {
    const found = diagnose({ declared: '^0.7.0', installed: '0.7.0', published: publicadas })
    assert.deepEqual(found[0], {
      level: 'ok',
      title: 'Lo instalado es lo declarado',
      detail: 'sitewright-core 0.7.0.',
    })
    assert.deepEqual(found[1], {
      level: 'ok',
      title: 'Al día con el núcleo',
      detail: '0.7.0 es la última.',
    })
  })

  it('cuenta cuántas versiones se está perdiendo', () => {
    const found = diagnose({ declared: '^0.5.0', installed: '0.5.0', published: publicadas })
    assert.deepEqual(found[1], {
      level: 'warn',
      title: 'Al día con el núcleo',
      detail: '2 versiones por detrás: 0.5.0 → 0.7.0.',
    })
  })

  it('en singular cuando es una sola', () => {
    const found = diagnose({ declared: '^0.6.0', installed: '0.6.0', published: publicadas })
    assert.ok(String(found[1].detail).includes('1 versión por detrás'))
  })

  it('sin instalar, juzga por lo declarado', () => {
    const found = diagnose({ declared: '^0.5.0', installed: null, published: publicadas })
    assert.equal((found).length, 1)
    assert.equal(found[0].detail, '2 versiones por detrás: 0.5.0 → 0.7.0.')
  })

  it('no afirma nada si no pudo preguntar al registro', () => {
    const found = diagnose({ declared: '^0.7.0', installed: '0.7.0', published: null })
    assert.deepEqual(found[1], {
      level: 'warn',
      title: 'Al día con el núcleo',
      detail: 'No se pudo preguntar al registro.',
    })
  })

  it('en singular cuando falta una, con su nombre completo', () => {
    const found = diagnose({ declared: '^0.6.0', installed: '0.6.0', published: publicadas })
    assert.equal(found[1].detail, '1 versión por detrás: 0.6.0 → 0.7.0.')
  })
})
