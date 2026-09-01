/**
 * Whether a site needs a cookie banner at all.
 *
 * The question is not "does this site use third-party things" but **"is there something the
 * visitor must decide before they act?"**. Two cases, and only one of them needs a banner:
 *
 * - **Measurement fires on page load.** If it is gated behind consent, the visitor has to be
 *   asked up front, and that is a banner.
 * - **A player is only loaded when someone wants to hear it.** The placeholder asks right
 *   there, in context, with the thing they came for in front of them. A banner adds nothing
 *   except a banner.
 *
 * That distinction is why a site full of embedded audio can legitimately have no banner,
 * and a site with nothing but a visit counter can need one.
 */
export type CookieBannerMode = 'auto' | 'always' | 'never'

export function needsCookieBanner({
  mode = 'auto',
  analyticsRequiresConsent,
}: {
  mode?: CookieBannerMode | null
  /** Whether measurement waits for consent (the only thing that fires unprompted). */
  analyticsRequiresConsent: boolean
}): boolean {
  if (mode === 'never') return false
  if (mode === 'always') return true
  return analyticsRequiresConsent
}

/**
 * What turning the banner off actually costs, in the client's own terms.
 *
 * It is exported so the panel and the documentation say the same thing: a warning that
 * lives in one place cannot drift from the behaviour it describes.
 */
export const BANNER_OFF_WARNING =
  'Sin banner, la medición de visitas no se carga nunca: nadie puede aceptarla. Los reproductores siguen funcionando, porque cada uno pide permiso al pulsarlo. Quítalo solo si asumes esas dos cosas.'
