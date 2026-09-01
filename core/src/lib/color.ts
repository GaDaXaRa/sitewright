/**
 * Colour decisions that have a right answer.
 *
 * A palette is taste; the text on top of it is not. Which of two inks reads on a given
 * background is measurable, and measuring it is the difference between a button somebody
 * can read and one nobody complains about because nobody could use it.
 */

function luminance(hex: string): number | null {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  if (!/^[0-9a-f]{6}$/i.test(full)) return null

  const channels = [0, 2, 4].map((i) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
}

/** WCAG contrast between two colours, or null when either is not a hex colour. */
export function contrastRatio(a: string, b: string): number | null {
  const [la, lb] = [luminance(a), luminance(b)]
  if (la === null || lb === null) return null
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** The lightest and darkest inks worth trying when the palette's own two do not work. */
const FALLBACK_INKS = ['#ffffff', '#111111']

/**
 * The text colour to put on a background: whichever candidate reads best.
 *
 * The site's own ink and ground go first, because using the palette's colours keeps a site
 * looking like itself; plain white and near-black are there for the case the palette cannot
 * solve on its own — a mid-tone accent, most often.
 */
export function bestTextOn(background: string, candidates: string[], minimum = 4.5): string {
  const best = (options: string[]) =>
    options
      .map((option) => ({ option, ratio: contrastRatio(option, background) ?? -1 }))
      .sort((a, b) => b.ratio - a.ratio)[0]

  // The palette first: a site that keeps using its own colours keeps looking like itself.
  const own = best(candidates.filter(Boolean))
  if (own && own.ratio >= minimum) return own.option

  // Only when neither of its own reads: plain white or near-black, whichever wins.
  return best(FALLBACK_INKS)!.option
}

export type ButtonColors = {
  /** What goes on the loud button. */
  text: string
  /** The background of its hover state. */
  hover: string
}

/**
 * The colours of the loud button, derived instead of written down.
 *
 * The template used to hardcode a dark ink here, which reads on a light accent and
 * disappears on a dark one — and no gate caught it, because measuring `--ink` against
 * `--ground` says nothing about text on a button.
 *
 * The hover is the second half of the same problem: a palette's `accentSoft` is often a
 * different hue (a mango yellow next to a brick red), and no single text colour clears 4.5:1
 * on both. When that happens the hover stays on the accent and just gets darker, which
 * keeps the text readable through the whole interaction.
 */
export function buttonColors({
  accent,
  accentSoft,
  ink,
  ground,
}: {
  accent: string
  accentSoft?: string
  ink: string
  ground: string
}): ButtonColors {
  const text = bestTextOn(accent, [ground, ink])
  const softWorks =
    accentSoft && (contrastRatio(text, accentSoft) ?? 0) >= 4.5 ? accentSoft : null

  return {
    text,
    hover: softWorks ?? `color-mix(in srgb, ${accent} 85%, black)`,
  }
}
