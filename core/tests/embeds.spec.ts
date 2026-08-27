import { describe, it, expect } from 'vitest'
import { parseEmbed, PROVIDER_NAMES } from '../src/lib/embeds.js'

/**
 * The client pastes whatever the platform handed them. What matters here is that every
 * shape they can plausibly paste ends up as a player, and that anything else fails
 * cleanly instead of producing a broken iframe.
 */
describe('parseEmbed', () => {
  it('turns a SoundCloud track into its widget, keeping the track as the fallback link', () => {
    const embed = parseEmbed('https://soundcloud.com/subsuelo/sesion-012')

    expect(embed?.provider).toBe('soundcloud')
    expect(embed?.embedUrl).toContain('w.soundcloud.com/player')
    expect(embed?.embedUrl).toContain(encodeURIComponent('https://soundcloud.com/subsuelo/sesion-012'))
    expect(embed?.canonicalUrl).toBe('https://soundcloud.com/subsuelo/sesion-012')
  })

  it('drops the tracking parameters a share link carries', () => {
    const embed = parseEmbed('https://soundcloud.com/subsuelo/sesion-012?si=abc123&utm_source=clipboard')

    expect(embed?.canonicalUrl).toBe('https://soundcloud.com/subsuelo/sesion-012')
  })

  it('accepts the three shapes a YouTube link comes in', () => {
    const watch = parseEmbed('https://www.youtube.com/watch?v=abc123')
    const short = parseEmbed('https://youtu.be/abc123')
    const embedded = parseEmbed('https://www.youtube.com/embed/abc123')

    for (const embed of [watch, short, embedded]) {
      expect(embed?.provider).toBe('youtube')
      expect(embed?.embedUrl).toBe('https://www.youtube-nocookie.com/embed/abc123?rel=0')
    }
  })

  it('normalises a Mixcloud feed with and without its trailing slash', () => {
    const withSlash = parseEmbed('https://www.mixcloud.com/subsuelo/sesion-010/')
    const without = parseEmbed('https://www.mixcloud.com/subsuelo/sesion-010')

    expect(withSlash?.provider).toBe('mixcloud')
    expect(withSlash?.embedUrl).toBe(without?.embedUrl)
    expect(withSlash?.canonicalUrl).toBe('https://www.mixcloud.com/subsuelo/sesion-010/')
  })

  it('takes a Bandcamp player address, which is the only thing Bandcamp gives out', () => {
    const embed = parseEmbed('https://bandcamp.com/EmbeddedPlayer/album=123/size=large/')

    expect(embed?.provider).toBe('bandcamp')
    expect(embed?.canonicalUrl).toBe(embed?.embedUrl)
  })

  it('refuses anything else rather than building a broken player', () => {
    expect(parseEmbed('https://example.com/mix.mp3')).toBeNull()
    expect(parseEmbed('not a url')).toBeNull()
    expect(parseEmbed('')).toBeNull()
    expect(parseEmbed(null)).toBeNull()
  })

  it('refuses plain http, which browsers block inside an https page anyway', () => {
    expect(parseEmbed('http://soundcloud.com/subsuelo/sesion-012')).toBeNull()
  })

  it('survives the whitespace a paste leaves behind', () => {
    expect(parseEmbed('  https://soundcloud.com/subsuelo/sesion-012  ')?.provider).toBe(
      'soundcloud',
    )
  })

  it('accepts the short soundcloud host that the app shares', () => {
    expect(parseEmbed('https://on.soundcloud.com/abc123')?.provider).toBe('soundcloud')
  })

  it('accepts youtube music, which is where a mix often lives', () => {
    expect(parseEmbed('https://music.youtube.com/watch?v=abc123')?.provider).toBe('youtube')
  })

  it('is not fooled by a host that merely ends in a platform name', () => {
    expect(parseEmbed('https://notyoutu.be/abc123')).toBeNull()
    expect(parseEmbed('https://falso-soundcloud.com/x')).toBeNull()
  })

  it('refuses a bandcamp address that is not a player, since it cannot be embedded', () => {
    expect(parseEmbed('https://bandcamp.com/subsuelo/album/x')).toBeNull()
  })

  it('refuses a youtube address with no video in it', () => {
    expect(parseEmbed('https://www.youtube.com/@subsuelo')).toBeNull()
    expect(parseEmbed('https://youtu.be/')).toBeNull()
    // "embed" has to be where the path starts, not anywhere in it.
    expect(parseEmbed('https://www.youtube.com/x/embed/abc123')).toBeNull()
  })

  it('builds the exact player address each platform expects', () => {
    expect(parseEmbed('https://www.mixcloud.com/subsuelo/sesion-010/')?.embedUrl).toBe(
      'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&light=0&feed=%2Fsubsuelo%2Fsesion-010%2F',
    )
    expect(parseEmbed('https://youtu.be/abc123')?.canonicalUrl).toBe(
      'https://www.youtube.com/watch?v=abc123',
    )
    // The -nocookie domain is deliberate: it spares the visitor who never presses play.
    expect(parseEmbed('https://youtu.be/abc123')?.embedUrl).toBe(
      'https://www.youtube-nocookie.com/embed/abc123?rel=0',
    )
  })

  it('names each platform for the placeholder shown before consent', () => {
    expect(PROVIDER_NAMES).toEqual({
      soundcloud: 'SoundCloud',
      mixcloud: 'Mixcloud',
      youtube: 'YouTube',
      bandcamp: 'Bandcamp',
    })
  })
})
