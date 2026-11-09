import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { auditSummary, behindTemplate } from './lib/deps.mjs'

describe('el resumen de npm audit', () => {
  const report = {
    vulnerabilities: {
      next: { severity: 'critical', isDirect: true, fixAvailable: { name: 'next', version: '16.4.5', isSemVerMajor: false } },
      payload: { severity: 'high', isDirect: true, fixAvailable: true },
      zod: { severity: 'high', isDirect: false, fixAvailable: { name: '@vercel/blob', version: '2.4.0', isSemVerMajor: true } },
      deepmerge: { severity: 'low', isDirect: false, fixAvailable: false },
    },
  }

  it('cuenta por gravedad, directas o no', () => {
    const { counts, serious } = auditSummary(report)
    assert.deepEqual(counts, { critical: 1, high: 2, moderate: 0, low: 1 })
    assert.equal(serious, 3)
  })

  it('sólo nombra las directas, que son las que arregla la propia web', () => {
    assert.deepEqual(
      auditSummary(report).direct.map((d) => d.name),
      ['next', 'payload'],
    )
  })

  // `fixAvailable: true` no dice a qué versión, y uno que propone otro paquete o un mayor
  // no es un arreglo que se pueda aplicar sin pensarlo.
  it('sólo da versión de arreglo cuando npm la nombra y no cruza un mayor', () => {
    const [next, payload] = auditSummary(report).direct
    assert.equal(next.fix, '16.4.5')
    assert.equal(payload.fix, null)
  })

  it('un informe vacío o roto no es un error', () => {
    assert.equal(auditSummary(null).serious, 0)
    assert.deepEqual(auditSummary({}).direct, [])
  })
})

describe('lo que va por detrás de la plantilla', () => {
  const template = {
    dependencies: { next: '16.4.5', payload: '3.93.0', 'sitewright-core': '^0.20.0' },
    devDependencies: { vitest: '4.1.10' },
  }

  it('nombra lo que la web declara más viejo', () => {
    const site = { dependencies: { next: '16.3.0', payload: '3.93.0', 'sitewright-core': '^0.19.0' } }
    assert.deepEqual(behindTemplate(site, template), [{ name: 'next', site: '16.3.0', template: '16.4.5' }])
  })

  // El núcleo tiene su propio diagnóstico, con el registro de cambios al lado.
  it('deja el núcleo para su propia línea', () => {
    const site = { dependencies: { 'sitewright-core': '^0.1.0' } }
    assert.deepEqual(behindTemplate(site, template), [])
  })

  it('no se queja de lo que va por delante ni de lo que la plantilla no tiene', () => {
    const site = { dependencies: { next: '17.0.0', resend: '1.0.0' }, devDependencies: { vitest: '4.1.10' } }
    assert.deepEqual(behindTemplate(site, template), [])
  })
})
