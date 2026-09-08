import { describe, it, expect } from 'vitest'
import { pricingNodes } from './jsonld'
import type { Price } from './Section'

/**
 * La regla que gobierna este módulo: **sólo salen al marcado los precios cerrados**. Un
 * buscador descarta una oferta incompleta, así que publicar «a convenir» como `Offer` añade
 * ruido y ninguna respuesta. En la página sigue viéndose, que es donde la lee una persona.
 */
const cerrada = { id: 1, name: 'Completa', price: 35, period: 'al mes' } as Price
const aConvenir = { id: 2, name: 'A medida', priceKind: 'agreed' } as Price

describe('el catálogo de ofertas', () => {
  it('publica la tarifa cerrada, con su moneda y su periodo', () => {
    const [catalogo] = pricingNodes([cerrada], '/tarifas', 'Tarifas')

    expect(catalogo!.itemListElement).toHaveLength(1)
    expect(catalogo!.itemListElement[0]).toMatchObject({
      '@type': 'Offer',
      name: 'Completa',
      price: 35,
      priceCurrency: 'EUR',
      priceSpecification: { '@type': 'UnitPriceSpecification', unitText: 'al mes' },
    })
  })

  it('deja fuera «a convenir», que es el caso que no puede publicarse', () => {
    expect(pricingNodes([cerrada, aConvenir], '/tarifas', 'Tarifas')[0]!.itemListElement).toHaveLength(1)
  })

  it('y sin una sola tarifa cerrada no publica catálogo vacío', () => {
    // Un `OfferCatalog` sin ofertas dentro no dice nada y ocupa sitio en el grafo.
    expect(pricingNodes([aConvenir], '/tarifas', 'Tarifas')).toEqual([])
  })
})
