import { describe, it, expect, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { config, middleware as middleware } from '@/middleware'

const VERCEL = 'sitio-abc123.vercel.app'
// Fijado aquí y no leído del sitio: con el dominio todavía pendiente, la dirección resuelta
// es `localhost`, y lo que se prueba —a dónde manda el middleware— no existiría.
const MARCA = 'www.ejemplo.es'

// Simula una petición entrante con el Host que se quiera probar.
function peticion(host: string, ruta = '/') {
  return new NextRequest(new URL(ruta, `https://${host}`), { headers: { host } })
}

function enProduccion(valor: string | undefined) {
  if (valor === undefined) delete process.env.VERCEL_ENV
  else process.env.VERCEL_ENV = valor
}

/** El middleware, releído con el dominio de marca puesto. */
async function conDominio() {
  vi.resetModules()
  process.env.NEXT_PUBLIC_SITE_URL = `https://${MARCA}`
  return (await import('@/middleware')).middleware
}

describe('Redirección al dominio de marca', () => {
  afterEach(() => {
    enProduccion(undefined)
    delete process.env.NEXT_PUBLIC_SITE_URL
    vi.resetModules()
  })

  it('manda al dominio de marca a quien llega por el subdominio de Vercel', async () => {
    enProduccion('production')
    const res = (await conDominio())(peticion(VERCEL, '/pagina'))

    expect(res.status).toBe(308)
    expect(res.headers.get('location')).toBe(`https://${MARCA}/pagina`)
  })

  it('conserva la ruta y los parámetros, para no romper "Me interesa"', async () => {
    enProduccion('production')
    const res = (await conDominio())(peticion(VERCEL, '/?fecha=3'))

    expect(res.headers.get('location')).toBe(`https://${MARCA}/?fecha=3`)
  })

  it('no toca al dominio de marca', async () => {
    enProduccion('production')
    const res = (await conDominio())(peticion(MARCA, '/pagina'))

    expect(res.headers.get('location')).toBeNull()
  })

  // Las vistas previas de Vercel también viven en *.vercel.app: si se redirigiesen,
  // no habría forma de revisar un despliegue antes de publicarlo.
  it('deja pasar las vistas previa de Vercel', async () => {
    enProduccion('preview')
    const res = (await conDominio())(peticion('sitio-git-rama.vercel.app', '/'))

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
  it('aguanta una petición sin cabecera Host', async () => {
    enProduccion('production')
    const res = (await conDominio())(new NextRequest(new URL(`https://${MARCA}/pagina`)))

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

  it('deja pasar el entorno local', async () => {
    enProduccion(undefined)
    const res = (await conDominio())(peticion('localhost:3000', '/'))

    expect(res.headers.get('location')).toBeNull()
  })
})
