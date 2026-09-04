import type { Endpoint, PayloadRequest } from 'payload'
import sharp from 'sharp'
import {
  NO_BACKDROP,
  TOO_MUCH_BACKDROP,
  backdropShare,
  clearBackdrop,
  flatBackdrop,
  type Rgb,
} from '../lib/backdrop.js'

/**
 * Las dos operaciones que se pueden hacerle a una imagen desde el panel.
 *
 * Van por su propio endpoint y no por un hook al guardar, por la misma razón que
 * `restoreOriginal`: un intento anterior lo hizo al guardar y colgó el panel, porque la
 * escritura anidada esperaba a la transacción que la estaba ejecutando.
 *
 * Son seguras porque la copia original ya se guarda al subir: cualquiera de las dos se
 * deshace con «Volver al original», que es lo que permite ofrecerlas sin miedo.
 */

/** Cuánto puede alejarse un píxel del color de las esquinas y seguir contando como fondo. */
const TOLERANCE = 12

/** Si el fondo se come más que esto, algo va mal y no se toca. */
const MAX_SHARE = 0.97

export const OPS_ERROR = 'No se pudo editar la imagen. Inténtalo de nuevo.'

/** Invierte los colores. El canal alfa no se toca: lo transparente sigue transparente. */
export async function invertImage(input: Buffer): Promise<Buffer> {
  return sharp(input).negate({ alpha: false }).png().toBuffer()
}

export type BackdropResult = { image: Buffer } | { error: string }

/**
 * Quita el fondo, si es plano.
 *
 * Mira las cuatro esquinas; si no coinciden, se niega y lo dice. No es un recorte: no
 * entiende lo que ve, y con una foto la respuesta correcta es no hacer nada.
 *
 * Sale siempre en PNG, porque un JPEG no tiene dónde guardar la transparencia que acabamos
 * de calcular.
 */
export async function clearImageBackdrop(input: Buffer): Promise<BackdropResult> {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const at = (x: number, y: number): Rgb => {
    const i = (y * width + x) * channels
    return [data[i]!, data[i + 1]!, data[i + 2]!]
  }

  const backdrop = flatBackdrop(
    [at(0, 0), at(width - 1, 0), at(0, height - 1), at(width - 1, height - 1)],
    TOLERANCE,
  )
  if (!backdrop) return { error: NO_BACKDROP }

  if (backdropShare(data, backdrop, TOLERANCE) > MAX_SHARE) return { error: TOO_MUCH_BACKDROP }

  clearBackdrop(data, backdrop, TOLERANCE)

  const image = await sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer()
  return { image }
}

/**
 * El endpoint que las expone: `POST /api/<colección>/:id/edit/:op`.
 *
 * Toma el slug porque no todas las webs llaman «media» a sus subidas.
 */
export function imageOpsEndpoint(collection = 'media'): Endpoint {
  return {
    path: '/:id/edit/:op',
    method: 'post',
    handler: async (req: PayloadRequest) => {
      const { payload, user } = req
      const id = req.routeParams?.id as string | undefined
      const op = req.routeParams?.op as string | undefined

      if (!user) return Response.json({ error: 'Hay que iniciar sesión.' }, { status: 401 })
      if (!id) return Response.json({ error: 'Falta la imagen.' }, { status: 400 })
      if (op !== 'invert' && op !== 'backdrop') {
        return Response.json({ error: 'Esa edición no existe.' }, { status: 400 })
      }

      try {
        const doc = (await payload.findByID({
          collection: collection as never,
          id,
          depth: 0,
          req,
        })) as { id: string | number; url?: string | null; filename?: string | null }

        if (!doc?.url) return Response.json({ error: 'La imagen no tiene fichero.' }, { status: 404 })

        const res = await fetch(doc.url.startsWith('http') ? doc.url : `${req.origin}${doc.url}`)
        if (!res.ok) throw new Error(`la imagen no responde (${res.status})`)
        const input = Buffer.from(await res.arrayBuffer())

        let output: Buffer
        if (op === 'invert') {
          output = await invertImage(input)
        } else {
          const result = await clearImageBackdrop(input)
          // No es un error del programa: es que a esta imagen no se le puede hacer eso.
          if ('error' in result) return Response.json({ error: result.error }, { status: 422 })
          output = result.image
        }

        // Sale en PNG en los dos casos, así que el nombre tiene que acompañar o el
        // navegador servirá un PNG diciendo que es un JPEG.
        const name = (doc.filename ?? 'imagen').replace(/\.[^.]+$/, '') + '.png'

        await payload.update({
          collection: collection as never,
          id: doc.id,
          data: {},
          file: { data: output, name, mimetype: 'image/png', size: output.byteLength },
          req,
        })

        payload.logger.info(`[images] "${doc.filename}" editada (${op})`)
        return Response.json({ ok: true })
      } catch (err) {
        payload.logger.error(`[images] no se pudo editar: ${err}`)
        return Response.json({ error: OPS_ERROR }, { status: 500 })
      }
    },
  }
}
