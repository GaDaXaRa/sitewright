import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

/**
 * Cabeceras de seguridad para todas las respuestas.
 *
 * `Strict-Transport-Security` **no está aquí**: Vercel ya la manda
 * (`max-age=63072000`) y repetirla solo daría pie a que las dos se contradigan.
 *
 * Tampoco hay una CSP completa, y es una decisión, no un olvido: para restringir
 * `script-src` de verdad harían falta nonces por petición, y eso obliga a renderizar en
 * cada visita —adiós a la home estática con ISR—. Una CSP con `'unsafe-inline'`, que es la
 * alternativa, no frena el XSS que dice frenar. Lo que sí se puede fijar sin ese coste es
 * `frame-ancestors`, que es lo que protege del clickjacking: sin ella, `/admin` se puede
 * meter en un iframe de otro sitio y engañar a quien lo usa para que pulse donde no cree.
 */
const cabecerasDeSeguridad = [
  // El navegador respeta el Content-Type declarado en vez de adivinarlo: una imagen subida
  // al panel no puede acabar interpretándose como script.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Al salir del sitio se manda el origen, nunca la ruta completa.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  // Lo mismo para navegadores que no entienden `frame-ancestors`.
  { key: 'X-Frame-Options', value: 'DENY' },
  // La web no usa ninguna de las tres; negarlas evita que nada las pida en su nombre.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: cabecerasDeSeguridad }]
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    // En producción las imágenes se sirven desde Vercel Blob.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
