import { describe, it, expect } from 'vitest'
import { checkAccessibility } from '../src/audit/checks/a11y.js'

/**
 * La puerta que el plan de la v1 daba por hecha y no existía.
 *
 * Lo que se comprueba aquí no es axe —eso ya lo prueban sus autores— sino **lo que hacemos
 * con lo que axe dice**: qué tumba un despliegue, qué sólo avisa, y que un informe nunca
 * dé a entender que ha mirado más de lo que ha mirado.
 */

const pagina = (cuerpo: string, lang = ' lang="es"', titulo = '<title>Una web</title>') =>
  `<!doctype html><html${lang}><head>${titulo}</head><body><main>${cuerpo}</main></body></html>`

const en = (url: string, body: string) => ({ url: `https://ejemplo.example${url}`, body })

const buscar = (findings: Awaited<ReturnType<typeof checkAccessibility>>, what: string) =>
  findings.find((f) => f.what === what)

describe('checkAccessibility', () => {
  it('deja pasar una página que está bien', async () => {
    const findings = await checkAccessibility([en('/', pagina('<h1>Hola</h1><p>Texto</p>'))])

    expect(buscar(findings, 'Accesibilidad (axe)')?.status).toBe('ok')
    expect(buscar(findings, 'Detalles de accesibilidad')).toBeUndefined()
  })

  it('tumba lo que impide usar la página', async () => {
    // Una imagen sin alternativo es un lector de pantalla leyendo un nombre de fichero.
    const findings = await checkAccessibility([en('/', pagina('<h1>Hola</h1><img src="/a.png">'))])

    const gate = buscar(findings, 'Accesibilidad (axe)')
    expect(gate?.status).toBe('fail')
    expect(gate?.detail).toContain('image-alt')
  })

  it('y dice en qué página, que es lo que permite ir a arreglarlo', async () => {
    const findings = await checkAccessibility([en('/equipo', pagina('<h1>Hola</h1><img src="/a.png">'))])

    expect(buscar(findings, 'Accesibilidad (axe)')?.detail).toContain('/equipo')
  })

  it('lo que afea pero no impide sólo avisa: una puerta que grita se acaba apagando', async () => {
    // Un salto de encabezado. Es real y hay que arreglarlo, pero bloquear un despliegue por
    // esto es cómo se consigue que alguien desactive la puerta entera.
    const findings = await checkAccessibility([en('/', pagina('<h1>Hola</h1><h4>Salto</h4>'))])

    expect(buscar(findings, 'Accesibilidad (axe)')?.status).toBe('ok')
    const aviso = buscar(findings, 'Detalles de accesibilidad')
    expect(aviso?.status).toBe('warn')
    expect(aviso?.detail).toContain('heading-order')
  })

  it('mide lo que le den, no sólo la primera', async () => {
    const findings = await checkAccessibility([
      en('/', pagina('<h1>Bien</h1>')),
      en('/mal', pagina('<h1>Hola</h1><img src="/a.png">')),
    ])

    const gate = buscar(findings, 'Accesibilidad (axe)')
    expect(gate?.status).toBe('fail')
    expect(gate?.detail).toContain('/mal')
  })

  it('ve el <html> entero, no sólo el cuerpo', async () => {
    const findings = await checkAccessibility([
      en('/', pagina('<h1>Hola</h1>', '', '<title>Una web</title>')),
    ])

    expect(buscar(findings, 'Accesibilidad (axe)')?.detail).toContain('html-has-lang')
  })

  it('dice siempre lo que no ha podido mirar', async () => {
    // Sin esto, un informe en verde parece cubrir más de lo que cubre.
    const findings = await checkAccessibility([en('/', pagina('<h1>Hola</h1>'))])

    const nota = buscar(findings, 'Lo que axe no puede ver sin navegador')
    expect(nota?.status).toBe('skip')
    expect(nota?.detail).toContain('color-contrast')
  })

  it('sin páginas no se inventa un aprobado', async () => {
    const findings = await checkAccessibility([])

    expect(findings).toHaveLength(1)
    expect(findings[0]!.status).toBe('skip')
  })

  it('una página rota no impide medir las demás', async () => {
    const findings = await checkAccessibility([
      en('/rota', 'esto no es una página'),
      en('/buena', pagina('<h1>Hola</h1>')),
    ])

    // Las dos se miden. Que la rota falle es correcto —una página que sirve eso está rota
    // de verdad— pero no puede dejar sin mirar a la que venía detrás.
    expect(buscar(findings, 'Accesibilidad (axe)')?.detail).toContain('2 páginas')
  })
})
