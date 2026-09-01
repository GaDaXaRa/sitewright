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
export { mediaUrl, mediaAbsoluteUrl, mediaAlt, mediaFocal } from './lib/media.js'
export { relationId, relationPointsTo } from './lib/relations.js'
export type { MediaLike, LegalSettings } from './lib/types.js'

// Writing for people
export { slugify } from './lib/slug.js'
export { joinWithAnd } from './lib/list.js'
export { escapeHtml } from './lib/html.js'

// The site's icon
export {
  buildIcons,
  defaultIconSvg,
  initials,
  CMS_ICON_ROUTE,
  type IconSettings,
  type IconDescriptor,
} from './lib/icons.js'

// Colour, where it has a right answer
export { contrastRatio, bestTextOn, buttonColors, type ButtonColors } from './lib/color.js'

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
export { parseEmbed, PROVIDER_NAMES, type Embed, type EmbedProvider } from './lib/embeds.js'

// Image backup: deciding, not writing
export {
  decideOriginalCopy,
  rejectionReason,
  fileToRestore,
  RESTORE_ERROR,
  type UploadedFile,
  type CopyDecision,
  type Rejection,
} from './lib/originalCopy.js'

// Brakes on a public form
export {
  requestIp,
  recordSubmission,
  countSince,
  exceedsGlobalCeiling,
  MAX_PER_IP,
  IP_WINDOW_MS,
  MAX_GLOBAL,
  GLOBAL_WINDOW_MS,
  TOO_MANY_ERROR,
} from './lib/rateLimit.js'

// The legal pages, from what the client filled in
export {
  legalNotice,
  privacyPolicy,
  cookiePolicy,
  type LegalSection,
} from './lib/legalTexts.js'
