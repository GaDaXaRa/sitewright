import { describe, it, expect } from 'vitest'
import { socialCard, socialDescription } from '../src/lib/social.js'
import { checkSocialCard, metaContent } from '../src/audit/checks/machines.js'
import type { Fetched } from '../src/audit/types.js'

/**
 * Lo que se ve cuando alguien pega el enlace en un chat.
 *
 * Es por donde más llega la gente a una web pequeña, y las páginas de sección salían con
 * sólo un título: un enlace pelado. Lo que se prueba aquí es de dónde sale cada campo
 * cuando la página no lo trae suyo, y que un hueco vacío no cuente como valor.
 */

describe('socialCard', () => {
  it('lo de la página gana a lo del sitio', () => {
    expect(socialCard({ description: 'Esta ficha', image: '/ficha.jpg' }, { description: 'El sitio', image: '/portada.jpg' })).toEqual({
      description: 'Esta ficha',
      image: '/ficha.jpg',
    })
  })

  it('y cada campo cae por su cuenta', () => {
    // Una ficha con resumen propio y sin foto hereda la imagen sin heredar el texto.
    expect(socialCard({ description: 'Esta ficha' }, { description: 'El sitio', image: '/portada.jpg' })).toEqual({
      description: 'Esta ficha',
      image: '/portada.jpg',
    })
  })

  it('una cadena vacía no es un valor', () => {
    // Un campo del panel que alguien abrió y dejó en blanco llega así, y emitir una
    // descripción vacía le dice a un buscador que la página se describe con nada.
    expect(socialCard({ description: '', image: '   ' }, { description: 'El sitio', image: '/portada.jpg' })).toEqual({
      description: 'El sitio',
      image: '/portada.jpg',
    })
  })

  it('ni null, ni undefined, ni una fuente que no está', () => {
    expect(socialCard(null, { description: null }, undefined, { description: 'Al final' })).toEqual({
      description: 'Al final',
    })
  })

  it('lo que no haya en ninguna parte no se emite', () => {
    // Ausente y vacío son cosas distintas: `{}` no escribe la etiqueta.
    expect(socialCard({ description: 'Sólo texto' }, {})).toEqual({ description: 'Sólo texto' })
  })

  it('sin nada que decir devuelve nada', () => {
    expect(socialCard({}, {})).toEqual({})
  })

  it('recorta los espacios de alrededor', () => {
    expect(socialCard({ description: '  Con espacios  ' }, {})).toEqual({ description: 'Con espacios' })
  })
})

describe('socialDescription', () => {
  it('deja en paz lo que ya cabe', () => {
    expect(socialDescription('Corto y claro')).toBe('Corto y claro')
  })

  it('junta los saltos de línea: una tarjeta es una sola línea', () => {
    expect(socialDescription('Dos\n\nlíneas  sueltas')).toBe('Dos líneas sueltas')
  })

  it('corta por palabra entera, no a mitad', () => {
    const texto = 'Palabras que suman bastante y siguen'
    const corto = socialDescription(texto, 20)

    expect(corto).toBe('Palabras que suman…')
    expect(corto!.length).toBeLessThanOrEqual(20)
  })

  it('no deja la puntuación colgando antes de los puntos', () => {
    expect(socialDescription('Uno, dos, tres y cuatro', 12)).toBe('Uno, dos…')
  })

  it('sin texto no inventa uno', () => {
    expect(socialDescription('')).toBeUndefined()
    expect(socialDescription(null)).toBeUndefined()
    expect(socialDescription('   ')).toBeUndefined()
  })

  it('lo que mide justo el máximo pasa entero', () => {
    // El borde exacto: un carácter más y se corta, uno menos y sobra sitio.
    const justo = 'x'.repeat(40)

    expect(socialDescription(justo, 40)).toBe(justo)
    expect(socialDescription(justo + 'y', 40)).toContain('…')
  })

  it('se lleva los puntos suspensivos del texto, no sólo el último', () => {
    // Quedaría «Hola...…», que es lo que pasa si se limpia un carácter en vez de todos.
    expect(socialDescription('Hola... mundo entero', 8)).toBe('Hola…')
  })

  it('una sola palabra más larga que el hueco se corta igual', () => {
    expect(socialDescription('Supercalifragilisticoespialidoso', 10)).toBe('Supercali…')
  })
})

describe('metaContent', () => {
  it('encuentra la etiqueta venga como venga el orden de sus atributos', () => {
    expect(metaContent('<meta name="description" content="Una web"/>', 'name', 'description')).toBe('Una web')
    expect(metaContent('<meta content="Una web" name="description"/>', 'name', 'description')).toBe('Una web')
  })

  it('un contenido vacío es no tenerlo', () => {
    expect(metaContent('<meta name="description" content="  "/>', 'name', 'description')).toBeUndefined()
  })

  it('no confunde una etiqueta con otra', () => {
    const html = '<meta property="og:description" content="Otra"/><meta name="description" content="La buena"/>'
    expect(metaContent(html, 'name', 'description')).toBe('La buena')
  })
})

const page = (path: string, body: string): Fetched => ({
  url: `https://ejemplo.example${path}`,
  status: 200,
  finalUrl: `https://ejemplo.example${path}`,
  headers: {},
  body,
})

const completa = `<title>Equipo · Una web</title><meta name="description" content="Las personas"/><meta property="og:image" content="/og.png"/>`

describe('checkSocialCard', () => {
  it('deja pasar la página que lleva las tres cosas', () => {
    const [finding] = checkSocialCard([page('/equipo', completa)])

    expect(finding!.status).toBe('ok')
  })

  it('avisa, y dice de qué página y qué le falta', () => {
    const [finding] = checkSocialCard([page('/equipo', '<title>Equipo</title>')])

    expect(finding!.status).toBe('warn')
    expect(finding!.detail).toContain('/equipo')
    expect(finding!.detail).toContain('descripción')
    expect(finding!.detail).toContain('imagen')
  })

  it('avisa en vez de fallar: el día que existió, ninguna sección en producción pasaba', () => {
    // Una puerta que pone en rojo lo que nadie ha tenido ocasión de arreglar se desactiva.
    expect(checkSocialCard([page('/x', '')])[0]!.status).not.toBe('fail')
  })

  it('no mira lo que no respondió', () => {
    const rota = { ...page('/rota', ''), status: 404 }
    const [finding] = checkSocialCard([page('/equipo', completa), rota])

    expect(finding!.status).toBe('ok')
    expect(finding!.detail).toContain('1 página')
  })

  it('sin nada descargado no se inventa un aprobado', () => {
    expect(checkSocialCard([])[0]!.status).toBe('skip')
  })
})
