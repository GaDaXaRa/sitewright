import type { Endpoint, PayloadRequest } from 'payload'
import { RESTORE_ERROR, fileToRestore, rejectionReason } from '../lib/originalCopy.js'

/**
 * Puts an image back to its original copy.
 *
 * It is an explicit user action with its own request, and **not a hook**: an earlier
 * attempt did it on save (a checkbox plus a hook that wrote the document again) and that
 * hung the panel, because the nested write waited on the very transaction running it.
 * Nothing is nested here: a request arrives, the file is replaced, a reply goes back.
 *
 * Replacing the file makes Payload regenerate the thumbnails, and the URL versioning (see
 * `images.ts`) makes them show up immediately instead of serving the old ones.
 *
 * Takes the collection slug because not every site calls its uploads "media".
 */
export function restoreOriginalEndpoint(collection = 'media'): Endpoint {
  return {
    path: '/:id/restore-original',
    method: 'post',
    handler: async (req: PayloadRequest) => {
      const { payload, user } = req
      const id = req.routeParams?.id as string | undefined

      try {
        // With no session and no id there is no point in even loading the image.
        const doc =
          user && id
            ? ((await payload.findByID({
                collection: collection as never,
                id,
                depth: 0,
                req,
              })) as Record<string, unknown>)
            : null

        const rejection = rejectionReason({
          hasSession: Boolean(user),
          id,
          originalUrl: doc?.originalUrl as string | undefined,
        })
        if (rejection) {
          return Response.json({ error: rejection.error }, { status: rejection.status })
        }

        // Past the rejection check, both the image and its copy exist.
        const image = doc as { id: string | number; originalUrl: string; filename?: string | null }
        const res = await fetch(image.originalUrl)
        if (!res.ok) throw new Error(`the original copy does not respond (${res.status})`)
        const contents = Buffer.from(await res.arrayBuffer())

        await payload.update({
          collection: collection as never,
          id: image.id,
          data: {},
          file: fileToRestore(image, contents),
          req,
        })

        payload.logger.info(`[images] "${image.filename}" restored to its original`)
        return Response.json({ ok: true })
      } catch (err) {
        payload.logger.error(`[images] could not restore the original: ${err}`)
        return Response.json({ error: RESTORE_ERROR }, { status: 500 })
      }
    },
  }
}
