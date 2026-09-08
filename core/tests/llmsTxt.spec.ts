import { describe, it, expect } from 'vitest'
import { llmsTxt } from '../src/lib/llmsTxt.js'

/**
 * Se construye dentro de cada prueba: atado a nivel de módulo, el ejecutor de mutación no
 * reevalúa el módulo por mutante y cuenta como supervivientes cosas que no lo son.
 */
const build = () => llmsTxt('https://ejemplo.es')

/**
 * Lo que un asistente repite como un hecho. La regla que gobierna este fichero es que
 * **aquí no se inventa nada**: un dato que la clienta no ha escrito no se imprime, porque
 * un teléfono inventado en `/llms.txt` es peor que uno que falta.
 */
describe('/llms.txt', () => {
  it('abre con el nombre y la dirección de esta web', () => {
    const out = build()({ settings: { siteName: 'Once' } })

    expect(out).toMatch(/^# Once/)
    expect(out).toContain('Web: https://ejemplo.es/')
  })

  it('sin nombre no se queda en blanco', () => {
    expect(build()({ settings: null })).toMatch(/^# Sitio/)
  })

  it('la entradilla junta lo que haya, en orden, y sin espacios de sobra', () => {
    const out = build()({
      settings: { siteName: 'Once', tagline: '  Colectivo  ', seoDescription: 'Descripción' },
    })

    expect(out.split('\n').slice(0, 5)).toEqual(['# Once', '', 'Colectivo', 'Descripción', ''])
  })

  it('una sección sin líneas no escribe su encabezado', () => {
    // Un «## Agenda» sobre nada es ruido para quien lo lee, y una web a medio llenar lo tiene.
    const out = build()({
      settings: { siteName: 'Once' },
      sections: [{ title: 'Agenda', lines: [] }, { title: 'Preguntas', lines: ['- Una'] }],
    })

    expect(out).not.toContain('## Agenda')
    expect(out).toContain('## Preguntas')

    // Y no aporta **nada**, ni una línea suelta: comprobar sólo que falta el encabezado
    // dejaba pasar una sección vacía que igualmente escribía en el fichero.
    const sinLaVacia = build()({
      settings: { siteName: 'Once' },
      sections: [{ title: 'Preguntas', lines: ['- Una'] }],
    })
    expect(out).toBe(sinLaVacia)
  })

  it('y la que sí tiene se escribe con su hueco delante y detrás del título', () => {
    // El maquetado importa: pegado al párrafo anterior, un lector de markdown se come el
    // encabezado y la sección deja de existir para quien la lee.
    const out = build()({
      settings: { siteName: 'Once' },
      sections: [{ title: 'Preguntas', lines: ['- Una', '- Otra'] }],
    })

    expect(out).toContain('\n\n## Preguntas\n\n- Una\n- Otra')
  })

  it('las secciones de los módulos van en el orden que llegan', () => {
    const out = build()({
      settings: { siteName: 'Once' },
      sections: [
        { title: 'Primera', lines: ['- a'] },
        { title: 'Segunda', lines: ['- b'] },
      ],
    })

    expect(out.indexOf('## Primera')).toBeLessThan(out.indexOf('## Segunda'))
  })

  it('el contacto sólo dice lo que está escrito', () => {
    const out = build()({ settings: { siteName: 'Once', email: 'hola@ejemplo.es' } })

    expect(out).toContain('- Email: hola@ejemplo.es')
    expect(out).not.toContain('- Teléfono:')
    expect(out).not.toContain('- Dónde:')
  })

  it('y dice los tres cuando los tres están', () => {
    const out = build()({
      settings: { siteName: 'Once', email: 'a@b.es', phone: '600 000 000', city: 'Bilbao' },
    })

    expect(out).toContain('- Email: a@b.es')
    expect(out).toContain('- Teléfono: 600 000 000')
    expect(out).toContain('- Dónde: Bilbao')
  })

  it('y sin ningún dato de contacto, ni siquiera abre la sección', () => {
    expect(build()({ settings: { siteName: 'Once' } })).not.toContain('## Contacto')
  })

  it('los enlaces, igual: los que haya', () => {
    const out = build()({
      settings: { siteName: 'Once', instagram: 'https://ig/once', youtube: 'https://yt/once' },
    })

    expect(out).toContain('- Instagram: https://ig/once')
    expect(out).toContain('- YouTube: https://yt/once')
    expect(out).not.toContain('- Facebook:')
  })

  it('y Facebook cuando lo hay', () => {
    expect(build()({ settings: { facebook: 'https://fb/once' } })).toContain(
      '- Facebook: https://fb/once',
    )
  })

  it('sin enlaces no hay sección de enlaces', () => {
    expect(build()({ settings: { siteName: 'Once' } })).not.toContain('## Enlaces')
  })

  it('el contacto va antes que los enlaces, y los dos al final', () => {
    const out = build()({
      settings: { siteName: 'Once', email: 'a@b.es', instagram: 'ig' },
      sections: [{ title: 'Agenda', lines: ['- Una'] }],
    })

    expect(out.indexOf('## Agenda')).toBeLessThan(out.indexOf('## Contacto'))
    expect(out.indexOf('## Contacto')).toBeLessThan(out.indexOf('## Enlaces'))
  })

  it('termina en salto de línea, como cualquier fichero de texto', () => {
    expect(build()({ settings: { siteName: 'Once' } })).toMatch(/\n$/)
  })

  it('cada web declara la suya', () => {
    expect(llmsTxt('https://otra.es')({ settings: null })).toContain('Web: https://otra.es/')
  })
})
