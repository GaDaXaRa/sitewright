export type Tone = 'light' | 'mid'

/**
 * Spreads background tones across the sections that are actually painted.
 *
 * **Fixing a colour per section does not work.** Most sections disappear when the client
 * runs out of content (no press quotes, no upcoming dates, no questions…), and two
 * sections that were never neighbours suddenly are. Sharing a background there makes their
 * two paddings read as one large void instead of as a separation — it happened in
 * production between two sections of Organic Yoga when reviews were switched off.
 *
 * Alternating over what is really painted, no two neighbours ever match. Takes, in page
 * order, whether each section renders; returns its tone, or `null` when it does not.
 */
export function alternateTones(rendered: boolean[]): (Tone | null)[] {
  let light = true
  return rendered.map((isRendered) => {
    if (!isRendered) return null
    const tone: Tone = light ? 'light' : 'mid'
    light = !light
    return tone
  })
}
