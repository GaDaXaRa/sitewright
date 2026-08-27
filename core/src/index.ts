/**
 * What every Sitewright site gets for free.
 *
 * Grouped by what it is for, not by file, because that is how it gets looked up. Nothing
 * here knows about a particular business: names of collections, labels and routes are
 * always passed in.
 */

// Identity of the site
export { resolveSiteUrl } from './lib/site'

// Reading the CMS
export { mediaUrl, mediaAbsoluteUrl, mediaAlt, mediaFocal } from './lib/media'
export { relationId, relationPointsTo } from './lib/relations'
export type { MediaLike, LegalSettings } from './lib/types'

// Writing for people
export { slugify } from './lib/slug'
export { joinWithAnd } from './lib/list'
export { escapeHtml } from './lib/html'

// Laying out a page
export { alternateTones, type Tone } from './lib/sectionTones'

// Dated content
export {
  isUpcoming,
  splitEvents,
  groupByYear,
  formatEventDate,
  formatLineup,
  type DatedEvent,
} from './lib/events'

// Embedded media, behind consent
export { parseEmbed, PROVIDER_NAMES, type Embed, type EmbedProvider } from './lib/embeds'

// Image backup: deciding, not writing
export {
  decideOriginalCopy,
  rejectionReason,
  fileToRestore,
  RESTORE_ERROR,
  type UploadedFile,
  type CopyDecision,
  type Rejection,
} from './lib/originalCopy'

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
} from './lib/rateLimit'

// The legal pages, from what the client filled in
export {
  legalNotice,
  privacyPolicy,
  cookiePolicy,
  type LegalSection,
} from './lib/legalTexts'
