import { describe, it, expect } from 'vitest'
import {
  decideOriginalCopy,
  fileToRestore,
  rejectionReason,
  RESTORE_ERROR,
  type UploadedFile,
} from '../src/lib/originalCopy.js'

const file = (extra: Partial<UploadedFile> = {}): UploadedFile => ({
  name: 'foto.webp',
  mimetype: 'image/webp',
  data: Buffer.from('imagen'),
  ...extra,
})

/**
 * Cropping in the panel rewrites the file in place and keeps its name, so the backup only
 * works if it is written **once**. These are the decisions; the hook and the endpoint only
 * write and reply, which is why this is where the bugs were.
 */
describe('deciding whether to keep an original', () => {
  it('copies the first file that arrives, under originales/', () => {
    const decision = decideOriginalCopy({ file: file(), hasStore: true })

    expect(decision).toMatchObject({ copy: true, path: 'originales/foto.webp' })
  })

  it('does not copy again once there is a copy: the second one would be of the crop', () => {
    expect(
      decideOriginalCopy({ file: file(), hasStore: true, previousOriginalUrl: 'https://x/foto' }),
    ).toEqual({ copy: false, reason: 'already-copied' })

    // The same when the address arrives in this very write instead of the stored document.
    expect(
      decideOriginalCopy({ file: file(), hasStore: true, incomingOriginalUrl: 'https://x/foto' }),
    ).toEqual({ copy: false, reason: 'already-copied' })
  })

  it('says why it did nothing, so the log explains itself', () => {
    expect(decideOriginalCopy({ file: null, hasStore: true }).copy).toBe(false)
    expect(decideOriginalCopy({ file: file(), hasStore: false })).toEqual({
      copy: false,
      reason: 'no-store',
    })
    expect(decideOriginalCopy({ file: file({ data: Buffer.alloc(0) }), hasStore: true })).toEqual({
      copy: false,
      reason: 'empty-file',
    })
  })

  it('treats a file with no data at all like an empty one, instead of throwing', () => {
    expect(decideOriginalCopy({ file: file({ data: null }), hasStore: true })).toEqual({
      copy: false,
      reason: 'empty-file',
    })
  })

  it('checks for a file before anything else: no name, nothing to copy', () => {
    expect(decideOriginalCopy({ file: file({ name: null }), hasStore: false })).toEqual({
      copy: false,
      reason: 'no-file',
    })
  })

  it('carries the content type over, so the copy is not served as octet-stream', () => {
    const decision = decideOriginalCopy({ file: file({ mimetype: 'image/png' }), hasStore: true })

    expect(decision).toMatchObject({ copy: true, contentType: 'image/png' })
  })
})

describe('why restoring can be refused', () => {
  it('needs a session, and says so with a 401', () => {
    expect(rejectionReason({ hasSession: false, id: '1', originalUrl: 'https://x' })).toEqual({
      error: 'Hay que iniciar sesión.',
      status: 401,
    })
  })

  it('needs to know which image, with a 400', () => {
    expect(rejectionReason({ hasSession: true, id: null, originalUrl: 'https://x' })).toEqual({
      error: 'Falta la imagen.',
      status: 400,
    })
  })

  it('tells the client what to do when the image predates the backup', () => {
    const rejection = rejectionReason({ hasSession: true, id: '1', originalUrl: null })

    expect(rejection?.status).toBe(409)
    // Not "no se pudo": the client has to know that re-uploading fixes it for good.
    expect(rejection?.error).toContain('Vuelve a subirla')
  })

  it('refuses nothing when the session, the image and the copy are all there', () => {
    expect(rejectionReason({ hasSession: true, id: '1', originalUrl: 'https://x' })).toBeNull()
  })
})

describe('the file that replaces the crop', () => {
  it('keeps name and type: a new name would break every published URL', () => {
    const contents = Buffer.from('original')
    const restored = fileToRestore({ filename: 'foto.webp', mimeType: 'image/webp' }, contents)

    expect(restored).toEqual({
      data: contents,
      name: 'foto.webp',
      mimetype: 'image/webp',
      size: contents.length,
    })
  })

  it('falls back to webp when the document lost its type', () => {
    expect(fileToRestore({ filename: 'foto.webp', mimeType: null }, Buffer.from('x')).mimetype).toBe(
      'image/webp',
    )
  })
})

describe('the message when restoring blows up', () => {
  it('tells the client to try again, because a retry is often all it takes', () => {
    expect(RESTORE_ERROR).toContain('Inténtalo de nuevo')
  })
})
