import { describe, it, expect } from 'vitest'
import { serializeJsonLd } from '@/app/(frontend)/components/JsonLd'

// El grafo lleva lo que se escribe en el panel. Una respuesta de las preguntas frecuentes
// con `</script>` cerraba el bloque y lo que venía detrás se ejecutaba como HTML.
describe('El JSON-LD dentro de la página', () => {
  const texto = 'Sí </script><script>alert(1)</script> claro'

  it('no deja cerrar el bloque desde un texto del panel', () => {
    const html = serializeJsonLd({ answer: texto })

    expect(html).not.toContain('</script')
    expect(html).not.toContain('<')
  })

  it('sigue diciendo exactamente lo mismo a quien lo lee como JSON', () => {
    const datos = { answer: texto, linea: 'a\u2028b\u2029c', '@id': 'https://x.es/#org' }

    expect(JSON.parse(serializeJsonLd(datos))).toEqual(datos)
  })
})
