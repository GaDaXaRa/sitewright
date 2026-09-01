import { describe, it, expect } from 'vitest'
import { buildIcons, CMS_ICON_ROUTE, defaultIconSvg, initials } from '../src/lib/icons.js'

describe('initials', () => {
  it('takes one letter from one word and two from two', () => {
    expect(initials('Subsuelo')).toBe('S')
    expect(initials('Marta Ibáñez')).toBe('MI')
  })

  it('stops at two: more is unreadable at 16 píxeles', () => {
    expect(initials('Asociación Cultural Raíz')).toBe('AC')
  })

  it('ignores what is not a word, and never comes back empty', () => {
    expect(initials('  ·  Raíz')).toBe('R')
    expect(initials('   ')).toBe('?')
    expect(initials('· ·')).toBe('?')
  })
})

describe('defaultIconSvg', () => {
  it('draws the initials on the accent colour', () => {
    const svg = defaultIconSvg({ name: 'Marta Ibáñez', accent: '#b3402c', ground: '#fbfaf7' })

    expect(svg).toContain('#b3402c')
    expect(svg).toContain('>MI<')
    expect(svg).toContain('viewBox="0 0 512 512"')
  })

  it('escapa también las comillas, que romperían el atributo', () => {
    const svg = defaultIconSvg({ name: 'La "Sandunguera"', accent: '#000000', ground: '#ffffff' })

    expect(svg).toContain('aria-label="La &quot;Sandunguera&quot;"')
  })

  it('escapes a name with markup instead of writing broken XML', () => {
    const svg = defaultIconSvg({ name: 'A & <b>', accent: '#000000', ground: '#ffffff' })

    expect(svg).toContain('A &amp; &lt;b&gt;')
    expect(svg).not.toContain('<b>')
  })
})

describe('buildIcons', () => {
  it('declares exactly los ficheros generados cuando no hay subida', () => {
    // La lista entera, no solo el primero: cada tamaño y cada tipo se declaran a un
    // navegador que elige por ellos, así que equivocarse en uno es servir el que no era.
    expect(buildIcons({})).toEqual({
      icon: [
        { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
        { url: '/icon.svg', type: 'image/svg+xml' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    })
  })

  it('aguanta unos ajustes vacíos, que es como nace un sitio', () => {
    expect(buildIcons(null)).toEqual(buildIcons({}))
    expect(buildIcons(undefined)).toEqual(buildIcons({}))
  })

  it('con subida, la pone delante y conserva el resto tal cual', () => {
    expect(buildIcons({ favicon: { url: 'https://blob/x.png' } })).toEqual({
      icon: [
        { url: CMS_ICON_ROUTE, sizes: '512x512', type: 'image/png' },
        { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
        { url: '/icon.svg', type: 'image/svg+xml' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: CMS_ICON_ROUTE, sizes: '180x180', type: 'image/png' }],
    })
  })

  it('puts the uploaded one first, and keeps the files underneath', () => {
    const icons = buildIcons({ favicon: { url: 'https://blob/x.png' } })

    // First because browsers pick the best match and search engines read the first usable
    // one; the files stay declared because an old cache still holds them.
    expect(icons.icon[0]!.url).toBe(CMS_ICON_ROUTE)
    expect(icons.icon.some((i) => i.url === '/favicon.ico')).toBe(true)
    expect(icons.apple[0]!.url).toBe(CMS_ICON_ROUTE)
  })

  it('serves the upload from a fixed route, never from the blob address', () => {
    // The blob URL changes with every re-upload, and a favicon that changes address is a
    // favicon Google stops associating with the site.
    const icons = buildIcons({ favicon: { url: 'https://abc.public.blob.vercel-storage.com/y.png' } })

    expect(JSON.stringify(icons)).not.toContain('blob.vercel-storage.com')
  })
})
