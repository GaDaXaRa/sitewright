/**
 * Everything the core cannot know, in one file.
 *
 * Extracting the core made the list short and concrete: the site's **identity**, its
 * **routes** (which drive revalidation, the sitemap and the menu) and the **labels** the
 * client reads. The generator writes this file from the blueprint; a developer can edit it
 * by hand and nothing else needs to move.
 */
export const site = {
  /** Stable identifier: storage keys, email subjects, admin title. No spaces. */
  id: 'template',

  /** What the business is called, until the client edits it in the panel. */
  name: 'Sitio',

  /** The address the site is really served from. Overridden by NEXT_PUBLIC_SITE_URL. */
  url: 'https://example.com',

  /**
   * Pages that exist besides the home page. Each module the site enables adds its own; the
   * three legal ones are always there because a site with a form needs them.
   */
  routes: {
    legalNotice: '/aviso-legal',
    privacy: '/privacidad',
    cookies: '/cookies',
  } as Record<string, string>,

  /** The menu: one entry per module with a page of its own. */
  nav: [] as { href: string; label: string }[],

  /** The one loud action, when the site has one. */
  cta: null as { href: string; label: string } | null,
} as const

/** Routes whose content is generated and therefore goes stale with any edit. */
export const ALWAYS_STALE = ['/', '/llms.txt']
