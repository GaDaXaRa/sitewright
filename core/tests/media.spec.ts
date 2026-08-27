import { describe, it, expect } from 'vitest'
import { mediaAbsoluteUrl, mediaAlt, mediaFocal, mediaUrl } from '../src/lib/media.js'

const SITE = 'https://ejemplo.es'

/**
 * A relationship to an image arrives loaded (an object) or as a bare id, depending on the
 * depth of the query. Every helper has to survive the second case without throwing.
 */
describe('reading an image field', () => {
  it('reads the url of a loaded image', () => {
    expect(mediaUrl({ url: '/api/media/file/foto.webp' })).toBe('/api/media/file/foto.webp')
  })

  it('returns null for an id, a null or anything that is not an object', () => {
    expect(mediaUrl(7)).toBeNull()
    expect(mediaUrl(null)).toBeNull()
    expect(mediaUrl(undefined)).toBeNull()
    expect(mediaAlt('foto.webp')).toBeNull()
  })

  it('returns null when the object has no url', () => {
    expect(mediaUrl({ alt: 'sin fichero' })).toBeNull()
  })
})

describe('mediaAbsoluteUrl', () => {
  it('prefixes the site to a relative address, which schema.org requires', () => {
    expect(mediaAbsoluteUrl({ url: '/api/media/file/foto.webp' }, SITE)).toBe(
      'https://ejemplo.es/api/media/file/foto.webp',
    )
  })

  it('leaves an address that is already absolute alone', () => {
    // In production images are served straight from the blob store, already absolute.
    const blob = 'https://abc.public.blob.vercel-storage.com/foto.webp'
    expect(mediaAbsoluteUrl({ url: blob }, SITE)).toBe(blob)
  })

  it('has nothing to make absolute when there is no image', () => {
    expect(mediaAbsoluteUrl(null, SITE)).toBeNull()
  })
})

describe('mediaAlt and mediaFocal', () => {
  it('reads the alternative text', () => {
    expect(mediaAlt({ alt: 'El colectivo en la sala' })).toBe('El colectivo en la sala')
  })

  it('reads the focal point when the client marked one', () => {
    expect(mediaFocal({ focalX: 30, focalY: 70 })).toEqual({ x: 30, y: 70 })
  })

  it('says nothing rather than centring by itself: that decision belongs to the layout', () => {
    expect(mediaFocal({})).toEqual({ x: null, y: null })
    expect(mediaFocal(null)).toEqual({ x: null, y: null })
  })

  it('keeps a zero, which is a corner and not a missing value', () => {
    expect(mediaFocal({ focalX: 0, focalY: 0 })).toEqual({ x: 0, y: 0 })
  })
})
