import { describe, it, expect } from 'vitest'
import { siteGraph } from '../src/lib/jsonLd.js'

const SITE = 'https://ejemplo.es'

/**
 * Se construye **dentro** de cada prueba, no arriba: destructurado a nivel de módulo, el
 * ejecutor de mutación no lo reevalúa por mutante y los cuenta como supervivientes sin
 * serlo. Es la trampa que documenta `stryker.config.mjs`, vista aquí de primera mano.
 */
const graph = () => siteGraph(SITE)

/**
 * El grafo viajaba copiado dentro de cada web, idéntico. Lo que se prueba aquí es lo que se
 * rompe en silencio: un `@id` que apunta a otro dominio, un campo que la clienta no ha
 * rellenado saliendo como cadena vacía, y el tipo de organización cableado.
 */
describe('la organización', () => {
  it('se identifica con la dirección del sitio, no con otra', () => {
    // Apuntar el `@id` al subdominio desechable de la plataforma le dice a un buscador que
    // la versión buena de la web es esa. Le pasó a la primera web durante semanas.
    const { ORG_ID, organizationNode } = graph()
    expect(ORG_ID).toBe('https://ejemplo.es/#organization')
    expect(organizationNode({})['@id']).toBe(ORG_ID)
  })

  it('el tipo lo decide el negocio, y por defecto es una organización', () => {
    const { organizationNode } = graph()
    expect(organizationNode({ schemaType: 'MusicGroup' })['@type']).toBe('MusicGroup')
    expect(organizationNode({})['@type']).toBe('Organization')
    // Vacío no es una elección: es un campo sin rellenar.
    expect(organizationNode({ schemaType: '' })['@type']).toBe('Organization')
  })

  it('no publica lo que la clienta no ha escrito', () => {
    const { organizationNode } = graph()
    const node = organizationNode({ siteName: 'Once' })

    expect(node).not.toHaveProperty('logo')
    expect(node).not.toHaveProperty('description')
    expect(node).not.toHaveProperty('slogan')
    expect(node).not.toHaveProperty('sameAs')
    expect(node).not.toHaveProperty('areaServed')
    expect(node).not.toHaveProperty('contactPoint')
  })

  it('sin nombre no se queda en blanco', () => {
    const { organizationNode } = graph()
    expect(organizationNode({}).name).toBe('Sitio')
    expect(organizationNode(null).name).toBe('Sitio')
    expect(organizationNode(undefined).name).toBe('Sitio')
  })

  it('la descripción sale del SEO, y si no lo hay, del texto de portada', () => {
    const { organizationNode } = graph()
    expect(organizationNode({ seoDescription: 'seo', heroText: 'hero' })).toMatchObject({
      description: 'seo',
    })
    expect(organizationNode({ heroText: 'hero' })).toMatchObject({ description: 'hero' })
  })

  it('el eslogan va sin espacios de sobra', () => {
    const { organizationNode } = graph()
    expect(organizationNode({ tagline: '  Pincha para que se baile  ' })).toMatchObject({
      slogan: 'Pincha para que se baile',
    })
  })

  it('las redes van juntas y sin huecos', () => {
    const { organizationNode } = graph()
    expect(organizationNode({ instagram: 'ig', youtube: 'yt' })).toMatchObject({
      sameAs: ['ig', 'yt'],
    })
  })

  it('el logo se declara en absoluto, que es lo que pide un buscador', () => {
    const { organizationNode } = graph()
    const node = organizationNode({ logo: { url: '/media/logo.png' } })
    expect(node).toMatchObject({ logo: `${SITE}/media/logo.png`, image: `${SITE}/media/logo.png` })
  })

  it('y el correo lleva su punto de contacto entero', () => {
    const { organizationNode } = graph()
    // Entero, campo por campo: un `contactType` vacío deja el punto de contacto sin decir
    // para qué sirve, y nadie lo mira hasta que un buscador lo ignora.
    expect(organizationNode({ email: 'hola@ejemplo.es' })).toMatchObject({
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'hola@ejemplo.es',
        areaServed: 'ES',
        availableLanguage: 'Spanish',
      },
    })
  })

  it('y apunta a la portada de este sitio', () => {
    const { organizationNode } = graph()
    expect(organizationNode({}).url).toBe(`${SITE}/`)
  })

  it('la ciudad se declara como ciudad', () => {
    const { organizationNode } = graph()
    expect(organizationNode({ city: 'Bilbao' })).toMatchObject({
      areaServed: { '@type': 'City', name: 'Bilbao' },
    })
  })
})

describe('el sitio web', () => {
  it('se publica en español y lo firma la organización', () => {
    const { ORG_ID, websiteNode } = graph()
    expect(websiteNode({ siteName: 'Once' })).toEqual({
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: `${SITE}/`,
      name: 'Once',
      inLanguage: 'es-ES',
      publisher: { '@id': ORG_ID },
    })
  })

  it('sin nombre tampoco se queda en blanco', () => {
    const { websiteNode } = graph()
    expect(websiteNode(null).name).toBe('Sitio')
  })
})

describe('las migas', () => {
  it('cuelgan de la portada, con la ruta de la página', () => {
    const { breadcrumbNode } = graph()
    expect(breadcrumbNode('Agenda', '/agenda')).toEqual({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Agenda', item: `${SITE}/agenda` },
      ],
    })
  })
})

describe('el grafo de la portada', () => {
  it('lleva siempre la organización y el sitio, y detrás lo de cada módulo', () => {
    const { buildHomeJsonLd } = graph()
    const home = buildHomeJsonLd({ siteName: 'Once' }, [{ '@type': 'FAQPage' }])

    expect(home['@context']).toBe('https://schema.org')
    expect(home['@graph'].map((n) => (n as { '@type': string })['@type'])).toEqual([
      'Organization',
      'WebSite',
      'FAQPage',
    ])
  })

  it('y sin módulos sigue siendo un grafo válido', () => {
    const { buildHomeJsonLd } = graph()
    expect(buildHomeJsonLd(null)['@graph']).toHaveLength(2)
  })
})

describe('dos sitios distintos', () => {
  it('no comparten identidad', () => {
    // El fallo que esto impide: dos webs con el mismo `@id` porque la URL estaba cableada.
    expect(siteGraph('https://otra.es').ORG_ID).not.toBe(graph().ORG_ID)
  })
})
