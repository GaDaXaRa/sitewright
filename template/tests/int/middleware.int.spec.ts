import { describe, it, expect, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { config, middleware } from '@/middleware'
import { site } from '@/site.config'

const VERCEL = 'sitio-abc123.vercel.app'
// Del sitio, no escrito a mano: una web generada nacía con estas pruebas en rojo
// porque seguían hablando del dominio de la plantilla.
const MARCA = new URL(site.url).host

// Simula una petición entrante con el Host que se quiera probar.
function peticion(host: string, ruta = '/') {
  return new NextRequest(new URL(ruta, `https://${host}`), { headers: { host } })
}

function enProduccion(valor: string | undefined) {
  if (valor === undefined) delete process.env.VERCEL_ENV
  else process.env.VERCEL_ENV = valor
}

describe('Redirección al dominio de marca', () => {
  afterEach(() => enProduccion(undefined))

  it('manda al dominio de marca a quien llega por el subdominio de Vercel', () => {
    enProduccion('production')
    const res = middleware(peticion(VERCEL, '/pagina'))

    expect(res.status).toBe(308)
    expect(res.headers.get('location')).toBe(`https://${MARCA}/pagina`)
  })

  it('conserva la ruta y los parámetros, para no romper "Me interesa"', () => {
    enProduccion('production')
    const res = middleware(peticion(VERCEL, '/?fecha=3'))

    expect(res.headers.get('location')).toBe(`https://${MARCA}/?fecha=3`)
  })

  it('no toca al dominio de marca', () => {
    enProduccion('production')
    const res = middleware(peticion(MARCA, '/pagina'))

    expect(res.headers.get('location')).toBeNull()
  })

  // Las vistas previas de Vercel también viven en *.vercel.app: si se redirigiesen,
  // no habría forma de revisar un despliegue antes de publicarlo.
  it('deja pasar las vistas previa de Vercel', () => {
    enProduccion('preview')
    const res = middleware(peticion('sitio-git-rama.vercel.app', '/'))

    expect(res.headers.get('location')).toBeNull()
  })

  // Antes de comprar el dominio, SITE_URL ES una dirección *.vercel.app. Redirigirla a sí
  // misma es un bucle infinito que tumba el sitio entero, y era lo que hacía la versión
  // heredada: miraba el sufijo del host en vez del host.
  it('no redirige el dominio canónico aunque sea un *.vercel.app', async () => {
    enProduccion('production')
    vi.resetModules()
    process.env.NEXT_PUBLIC_SITE_URL = 'https://sitio.vercel.app'
    const { middleware: recargado } = await import('@/middleware')

    const res = recargado(peticion('sitio.vercel.app', '/pagina'))

    expect(res.headers.get('location')).toBeNull()
    delete process.env.NEXT_PUBLIC_SITE_URL
    vi.resetModules()
  })

  // Una petición sin Host (una sonda, un cliente mal hecho) no puede tumbar el sitio:
  // el middleware se ejecuta en todas las rutas.
  it('aguanta una petición sin cabecera Host', () => {
    enProduccion('production')
    const res = middleware(new NextRequest(new URL(`${site.url}/pagina`)))

    expect(res.headers.get('location')).toBeNull()
  })

  // El middleware corre en todas las peticiones que case el matcher: si dejase de
  // excluir los estáticos, cada imagen y cada fichero de Next pasarían por aquí.
  it('se aplica a las páginas y no a los recursos internos de Next', () => {
    const casa = (ruta: string) => new RegExp(`^${config.matcher[0]}$`).test(ruta)

    expect(casa('/')).toBe(true)
    expect(casa('/pagina')).toBe(true)
    expect(casa('/_next/static/chunks/main.js')).toBe(false)
    expect(casa('/_next/image')).toBe(false)
    expect(casa('/favicon.ico')).toBe(false)
  })

  it('deja pasar el entorno local', () => {
    enProduccion(undefined)
    const res = middleware(peticion('localhost:3000', '/'))

    expect(res.headers.get('location')).toBeNull()
  })
})
