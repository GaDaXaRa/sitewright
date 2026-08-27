/**
 * The decisions behind the image backup: when an untouched copy is kept, and when it can
 * be restored.
 *
 * They live here, outside the hook and the endpoint, for a practical reason: in
 * development there is no blob store (`BLOB_READ_WRITE_TOKEN` is empty), so uploading and
 * restoring can only be exercised once deployed. What *can* be exercised locally is what
 * gets decided, and that is where the bugs were: copying twice and overwriting the
 * original, or leaving the client in front of an error that explains nothing. Hence this
 * module is pure and tested, while the hook and the endpoint only write and reply.
 *
 * See `collections/hooks/images.ts` and `collections/endpoints/restoreOriginal.ts`.
 */

/** A freshly uploaded file, as it arrives in `req.file`. */
export type UploadedFile = {
  name?: string | null
  mimetype?: string | null
  data?: Buffer | null
}

export type CopyDecision =
  | { copy: false; reason: 'no-file' | 'already-copied' | 'no-store' | 'empty-file' }
  | { copy: true; path: string; contents: Buffer; contentType?: string }

/**
 * The copy is written **once**. A later crop must not overwrite it — that is exactly what
 * makes it useful, because cropping rewrites the file in place and keeps its name, so the
 * second copy would already be of the cropped image.
 */
export function decideOriginalCopy({
  file,
  previousOriginalUrl,
  incomingOriginalUrl,
  hasStore,
}: {
  file: UploadedFile | null | undefined
  previousOriginalUrl?: string | null
  incomingOriginalUrl?: string | null
  hasStore: boolean
}): CopyDecision {
  if (!file?.name) return { copy: false, reason: 'no-file' }
  if (previousOriginalUrl || incomingOriginalUrl) return { copy: false, reason: 'already-copied' }
  if (!hasStore) return { copy: false, reason: 'no-store' }
  if (!file.data?.length) return { copy: false, reason: 'empty-file' }

  return {
    copy: true,
    path: `originales/${file.name}`,
    contents: file.data,
    contentType: file.mimetype || undefined,
  }
}

export type Rejection = { error: string; status: number }

/**
 * Why restoring is not possible, when it is not. The case that matters to the client is
 * the last one: images uploaded before the backup existed have no copy, and the message
 * has to tell them what to do, not merely that it failed. Messages stay in Spanish because
 * they surface in the admin panel.
 */
export function rejectionReason({
  hasSession,
  id,
  originalUrl,
}: {
  hasSession: boolean
  id?: string | null
  originalUrl?: string | null
}): Rejection | null {
  if (!hasSession) return { error: 'Hay que iniciar sesión.', status: 401 }
  if (!id) return { error: 'Falta la imagen.', status: 400 }
  if (!originalUrl) {
    return {
      error:
        'Esta imagen no tiene copia original guardada: se subió antes de que existiera el respaldo. Vuelve a subirla y a partir de ahí podrás deshacer los recortes.',
      status: 409,
    }
  }
  return null
}

export const RESTORE_ERROR = 'No se pudo recuperar la imagen original. Inténtalo de nuevo.'

/**
 * The file the image is replaced with. It keeps the document's name and type: changing the
 * name would break every URL already published.
 */
export function fileToRestore(
  doc: { filename?: string | null; mimeType?: string | null },
  contents: Buffer,
) {
  return {
    data: contents,
    name: doc.filename as string,
    mimetype: doc.mimeType || 'image/webp',
    size: contents.length,
  }
}
