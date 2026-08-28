import { createRevalidation } from 'sitewright-core/payload'
import { ALWAYS_STALE } from '@/site.config'

/**
 * Which pages each collection makes stale.
 *
 * The machinery is in the core; this is the map of this site. Every module the generator
 * adds registers its own routes here.
 */
export const { revalidator, documentRevalidator, globalRevalidator } =
  createRevalidation(ALWAYS_STALE)

// Content that only shows on the home page (and images, which can show anywhere).
const home = revalidator()
export const revalidateHomeAfterChange = home.afterChange
export const revalidateHomeAfterDelete = home.afterDelete
export const mediaRevalidation = { afterChange: home.afterChange, afterDelete: home.afterDelete }

// Settings appear on every page, so a global edit invalidates the lot.
export const revalidateSiteGlobal = globalRevalidator()
