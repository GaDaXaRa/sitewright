/**
 * What every Sitewright site gets for free.
 *
 * Grouped by what it is for, not by file, because that is how it gets looked up. Nothing
 * here knows about a particular business: names of collections, labels and routes are
 * always passed in.
 */

// Identity of the site
export { resolveSiteUrl } from './lib/site.js'

// Reading the CMS
export { mediaUrl, mediaAbsoluteUrl, mediaAlt, mediaFocal, mediaSize } from './lib/media.js'
export { relationId } from './lib/relations.js'
export type { MediaLike, LegalSettings } from './lib/types.js'

// Writing for people
export { slugify } from './lib/slug.js'
export { escapeHtml } from './lib/html.js'

// The site's icon
export { buildIcons, defaultIconSvg, type IconSettings, type IconDescriptor } from './lib/icons.js'

// Colour, where it has a right answer
export { bestTextOn, buttonColors, type ButtonColors } from './lib/color.js'

// Consent, and whether a banner is needed at all
export {
  needsCookieBanner,
  BANNER_OFF_WARNING,
  type CookieBannerMode,
} from './lib/consent.js'

// Laying out a page
export { alternateTones, type Tone } from './lib/sectionTones.js'

// Dated content
export {
  isUpcoming,
  splitEvents,
  groupByYear,
  formatEventDate,
  formatLineup,
  type DatedEvent,
} from './lib/events.js'

// Embedded media, behind consent
export { parseEmbed, type Embed, type EmbedProvider } from './lib/embeds.js'

// Brakes on a public form
export {
  requestIp,
  recordSubmission,
  countSince,
  exceedsGlobalCeiling,
  IP_WINDOW_MS,
  TOO_MANY_ERROR,
} from './lib/rateLimit.js'

// The legal pages, from what the client filled in
export {
  legalNotice,
  privacyPolicy,
  cookiePolicy,
  type LegalSection,
} from './lib/legalTexts.js'

// Lo que **no** sale por aquí, y por qué.
//
// Un símbolo exportado es una promesa de compatibilidad con quien instale el paquete, y la
// regla para hacerla es que alguien la esté usando. Se comprueba mirando: las tres webs en
// producción, la plantilla, los módulos y el generador —que también instala el paquete, y
// de ahí salen `buttonColors`, `bestTextOn` y `defaultIconSvg`—. Lo que no aparece ahí, no
// sale.
//
// Se quedan fuera, entonces, las piezas que el propio paquete cablea por dentro y ninguna
// web nombra: quitar el fondo de una imagen y las decisiones de la copia original —las usa
// `mediaCollection`— y `contrastRatio` —la usan `buttonColors` y la auditoría—,
// `joinWithAnd` —la usa `formatLineup`—, `PROVIDER_NAMES` —lo usa `<Embed>`—,
// `initials` y `CMS_ICON_ROUTE` —los usa `buildIcons`— y los topes del freno del
// formulario, que aplican `countSince` y `exceedsGlobalCeiling`. De ese grupo sí sale
// `IP_WINDOW_MS`, porque el módulo de contacto purga con él su propio mapa de IPs.
//
// Y contar versiones se fue a `scripts/lib/`, que es de la fábrica y no de ninguna web.
