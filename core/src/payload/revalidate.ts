import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  Payload,
} from 'payload'
import { revalidatePath } from 'next/cache'

/**
 * On-demand ISR revalidation: regenerates the affected pages the moment the client edits
 * content in the CMS.
 *
 * Which pages go stale is a decision of each site, so this builds the hooks rather than
 * exporting them. Two things it does know, because both were bugs: the home page is always
 * included (nearly everything surfaces there), and so is the AI summary, which is generated
 * from the same content and would otherwise keep saying yesterday's prices.
 */
function revalidate(paths: string[], payload?: Payload) {
  for (const path of paths) {
    try {
      revalidatePath(path)
      payload?.logger?.info(`[revalidate] ${path}`)
    } catch (err) {
      // Outside a Next request (seed, migrations) there is nothing to revalidate; skip it
      // without breaking the operation.
      payload?.logger?.info(`[revalidate] skipped (${path}), outside Next context: ${err}`)
    }
  }
}

export type Revalidator = {
  afterChange: CollectionAfterChangeHook
  afterDelete: CollectionAfterDeleteHook
}

/**
 * Builds the revalidation hooks for a site.
 *
 * `always` is what every edit invalidates — usually the home page and `/llms.txt`.
 */
export function createRevalidation(always: string[] = ['/', '/llms.txt']) {
  /** Hooks for a collection: the always-stale pages plus its own. */
  function revalidator(...routes: string[]): Revalidator {
    const paths = [...always, ...routes]
    return {
      afterChange: (({ doc, req }) => {
        revalidate(paths, req?.payload)
        return doc
      }) as CollectionAfterChangeHook,
      afterDelete: (({ doc, req }) => {
        revalidate(paths, req?.payload)
        return doc
      }) as CollectionAfterDeleteHook,
    }
  }

  /**
   * Hooks for content with a page per document: the route is built from the document, so a
   * renamed slug does not leave the old page cached under the new name.
   */
  function documentRevalidator(route: (doc: Record<string, unknown>) => string | null): Revalidator {
    const paths = (doc: Record<string, unknown>) => {
      const own = doc ? route(doc) : null
      return own ? [...always, own] : always
    }
    return {
      afterChange: (({ doc, req }) => {
        revalidate(paths(doc), req?.payload)
        return doc
      }) as CollectionAfterChangeHook,
      afterDelete: (({ doc, req }) => {
        revalidate(paths(doc), req?.payload)
        return doc
      }) as CollectionAfterDeleteHook,
    }
  }

  /** Settings appear on every page, so a global edit invalidates the lot. */
  function globalRevalidator(...routes: string[]): GlobalAfterChangeHook {
    return ({ doc, req }) => {
      revalidate([...always, ...routes], req?.payload)
      return doc
    }
  }

  return { revalidator, documentRevalidator, globalRevalidator }
}
