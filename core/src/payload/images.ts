import type { CollectionAfterReadHook, CollectionBeforeChangeHook } from 'payload'
import { put } from '@vercel/blob'
import { decideOriginalCopy, type UploadedFile } from '../lib/originalCopy.js'

/**
 * Everything needed for editing an image to be safe and to show up immediately.
 *
 * Two rules, one hook each, with no nested writes and no checkbox that depends on saving
 * (that combination is what hung the admin panel and left fields half-written):
 *
 * 1. **On read**, every URL carries the modification date. Cropping does not change the
 *    file name and the file is served with a year of cache, so without this the browser —
 *    and the panel's own thumbnails — kept showing the previous image.
 * 2. **On write**, when a new file arrives and no copy exists yet, an untouched one is
 *    stored. It runs in `beforeChange` so the copy's address is part of the same save and
 *    appears on screen without leaving the page and coming back.
 *
 * Restoring the original is **not** a hook: it is an explicit user action with its own
 * endpoint and button (see `endpoints/restoreOriginal.ts`).
 */

// Appends the version to a URL, respecting any query string already there.
function versioned(url: unknown, version: number): unknown {
  if (typeof url !== 'string' || !url) return url
  return `${url}${url.includes('?') ? '&' : '?'}v=${version}`
}

/**
 * Gives every image a fresh URL on each edit so no cache serves the previous one. Done
 * here, at the source, rather than in each place that paints an image: that way the admin
 * thumbnails benefit too, which is where it hurt most.
 */
export const versionUrls: CollectionAfterReadHook = ({ doc }) => {
  const version = doc?.updatedAt ? Date.parse(doc.updatedAt) : null
  if (!version) return doc

  doc.url = versioned(doc.url, version)
  doc.thumbnailURL = versioned(doc.thumbnailURL, version)
  for (const size of Object.values(doc.sizes ?? {})) {
    const s = size as { url?: unknown }
    if (s && typeof s === 'object') s.url = versioned(s.url, version)
  }
  return doc
}

/**
 * Stores an untouched copy the first time a file arrives. Written once: a later crop does
 * not overwrite it, which is what makes it useful.
 */
export const saveOriginalCopy: CollectionBeforeChangeHook = async ({ data, req, originalDoc }) => {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  const decision = decideOriginalCopy({
    file: req.file as UploadedFile | undefined,
    previousOriginalUrl: originalDoc?.originalUrl,
    incomingOriginalUrl: data.originalUrl,
    hasStore: Boolean(token),
  })

  if (!decision.copy) {
    // In development there is no store: images go to disk and no copy is kept.
    if (decision.reason === 'no-store') {
      req.payload.logger.warn('[images] no BLOB_READ_WRITE_TOKEN: original copy not stored.')
    }
    return data
  }

  try {
    const { url } = await put(decision.path, decision.contents, {
      access: 'public',
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: decision.contentType,
    })

    req.payload.logger.info(`[images] original copy stored at "${decision.path}"`)
    return { ...data, originalUrl: url }
  } catch (err) {
    // This must never block an upload: warn and carry on without a copy.
    req.payload.logger.error(`[images] could not store the original copy: ${err}`)
    return data
  }
}
