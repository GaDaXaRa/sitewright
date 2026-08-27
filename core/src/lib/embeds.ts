/**
 * Turns the address of a mix or a video into what the page needs to embed it.
 *
 * Two reasons for this to be pure and to live apart from the component:
 *
 * 1. **Consent.** Every one of these players sets cookies, so the iframe cannot be
 *    rendered until the visitor accepts (see `components/Consent.tsx`). The component
 *    decides *whether* to paint; this module decides *what* would be painted, and can be
 *    tested without a browser.
 * 2. **The client pastes whatever the platform gave them** — a share link, a browser URL,
 *    sometimes with tracking parameters. Normalising here means the panel accepts all of
 *    them and the page never receives an address it cannot use.
 */

export type EmbedProvider = 'soundcloud' | 'mixcloud' | 'youtube' | 'bandcamp'

export type Embed = {
  provider: EmbedProvider
  /** What goes in the iframe's `src`, once consent is given. */
  embedUrl: string
  /** Where the visitor is sent if they would rather not accept: the platform's own page. */
  canonicalUrl: string
}

/** Human name of each platform, for the placeholder shown before consent. */
export const PROVIDER_NAMES: Record<EmbedProvider, string> = {
  soundcloud: 'SoundCloud',
  mixcloud: 'Mixcloud',
  youtube: 'YouTube',
  bandcamp: 'Bandcamp',
}

function youtubeId(url: URL): string | null {
  if (url.hostname.endsWith('youtu.be')) return url.pathname.slice(1) || null
  if (url.pathname === '/watch') return url.searchParams.get('v')
  const embedded = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)
  return embedded?.[1] ?? null
}

/**
 * Reads an address and returns how to embed it, or `null` when it is not a platform we
 * support — the caller then shows a plain link instead of a broken player.
 */
export function parseEmbed(raw: string | null | undefined): Embed | null {
  if (!raw) return null

  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:') return null

  const host = url.hostname.replace(/^www\./, '')

  if (host === 'soundcloud.com' || host === 'on.soundcloud.com') {
    // SoundCloud's widget takes the track address itself as a parameter.
    const clean = `https://soundcloud.com${url.pathname}`
    return {
      provider: 'soundcloud',
      embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(clean)}&color=%23ff4d2e&hide_related=true&show_comments=false&show_teaser=false`,
      canonicalUrl: clean,
    }
  }

  if (host === 'mixcloud.com') {
    const feed = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`
    return {
      provider: 'mixcloud',
      embedUrl: `https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&light=0&feed=${encodeURIComponent(feed)}`,
      canonicalUrl: `https://www.mixcloud.com${feed}`,
    }
  }

  if (host === 'youtube.com' || host === 'youtu.be' || host === 'music.youtube.com') {
    const id = youtubeId(url)
    if (!id) return null
    return {
      provider: 'youtube',
      // The -nocookie domain still stores things once the video plays; consent is required
      // all the same. It only spares the visitor who never presses play.
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
      canonicalUrl: `https://www.youtube.com/watch?v=${id}`,
    }
  }

  if (host === 'bandcamp.com' && url.pathname.startsWith('/EmbeddedPlayer')) {
    // Bandcamp only gives the player address inside its own embed code; the release page
    // cannot be derived from it, so the player address doubles as the link.
    return { provider: 'bandcamp', embedUrl: url.toString(), canonicalUrl: url.toString() }
  }

  return null
}
