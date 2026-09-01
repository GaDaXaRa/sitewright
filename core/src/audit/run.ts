import { readFileSync } from 'node:fs'
import type { Fetched, Finding } from './types.js'
import { skip } from './types.js'
import {
  checkCanonicalAnswers,
  checkIdentity,
  checkSecurityHeaders,
  checkSitemapAndRobots,
  checkStructuredData,
} from './checks.js'
import {
  checkConsentGating,
  checkContrast,
  checkImages,
  checkLegalPages,
  checkLlmsTxt,
  checkPlaceholders,
  checkReachable,
  checkWeight,
  internalLinks,
} from './checks2.js'
import { checkMigrations, checkPooled } from './migrations.js'

export type AuditOptions = {
  /** Where the site is answering right now: a dev server or the real thing. */
  baseUrl: string
  /** What the site says it is. Defaults to `baseUrl`. */
  siteUrl?: string
  siteName?: string
  /** Extra pages to look at besides the home and the legal ones. */
  pages?: string[]
  legalPages?: string[]
  /** The stylesheet whose colour tokens get measured. */
  cssPath?: string
  /** Token pairs to measure, when the palette names them differently. */
  contrastPairs?: [string, string][]
  databaseUrl?: string
  migrationsDir?: string
}

async function get(url: string, redirect: RequestRedirect = 'follow'): Promise<Fetched> {
  try {
    const res = await fetch(url, { redirect, headers: { 'user-agent': 'sitewright-audit' } })
    const headers: Record<string, string> = {}
    res.headers.forEach((value, key) => (headers[key.toLowerCase()] = value))
    return { url, status: res.status, finalUrl: res.url || url, headers, body: await res.text() }
  } catch (err) {
    return { url, status: 0, finalUrl: url, headers: {}, body: `` + err }
  }
}

/**
 * Runs every gate and returns the findings, in the order a person reads them: what the site
 * claims to be first, then what protects it, then what it says to machines.
 */
export async function runAudit(options: AuditOptions): Promise<Finding[]> {
  const base = options.baseUrl.replace(/\/$/, '')
  const siteUrl = (options.siteUrl ?? base).replace(/\/$/, '')
  const legal = options.legalPages ?? ['/aviso-legal', '/privacidad', '/cookies']

  const [home, sitemap, robots, llms] = await Promise.all([
    get(`${base}/`),
    get(`${base}/sitemap.xml`),
    get(`${base}/robots.txt`),
    get(`${base}/llms.txt`),
  ])

  const legalPages = await Promise.all(legal.map((path) => get(`${base}${path}`)))
  const extraPages = await Promise.all((options.pages ?? []).map((path) => get(`${base}${path}`)))
  const allPages = [home, ...extraPages]

  // The canonical is fetched **without following redirects**, which is the whole point: a
  // host that redirects to itself answers 308 forever and every page still names it.
  const canonical = await get(`${siteUrl}/`, 'manual')

  // A short crawl from the home page: what a person could reach by clicking, which is the
  // only honest way to tell an indexed page from an orphan one.
  const reachable = new Set<string>(['/'])
  const queue = internalLinks(home.body, base)
  const seen = new Set<string>(['/'])
  let budget = 25
  while (queue.length && budget > 0) {
    const path = queue.shift()!
    reachable.add(path)
    if (seen.has(path)) continue
    seen.add(path)
    budget -= 1
    const page = await get(`${base}${path}`)
    if (page.status === 200) {
      for (const link of internalLinks(page.body, base)) {
        reachable.add(link)
        if (!seen.has(link)) queue.push(link)
      }
    }
  }

  const sitemapUrls = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!)

  const findings: Finding[] = [
    ...checkIdentity(home, siteUrl),
    ...checkCanonicalAnswers(canonical),
    ...checkSitemapAndRobots(sitemap, robots, siteUrl),
    ...checkSecurityHeaders(home),
    ...checkStructuredData(home, siteUrl),
    ...checkLlmsTxt(llms, options.siteName),
    ...checkLegalPages(legalPages, home),
    ...checkConsentGating([...allPages, ...legalPages]),
    ...checkImages(allPages),
    ...checkPlaceholders(allPages),
    ...checkWeight(allPages),
    ...checkReachable(sitemapUrls, reachable),
  ]

  if (options.cssPath) {
    try {
      findings.push(...checkContrast(readFileSync(options.cssPath, 'utf8'), options.contrastPairs))
    } catch (err) {
      findings.push(skip('contraste', 'Contraste de la paleta', `No se pudo leer el CSS: ${err}`))
    }
  } else {
    findings.push(skip('contraste', 'Contraste de la paleta', 'Sin --css no hay paleta que medir.'))
  }

  findings.push(...checkPooled(options.databaseUrl))
  findings.push(
    ...(await checkMigrations({
      databaseUrl: options.databaseUrl,
      migrationsDir: options.migrationsDir,
    })),
  )

  return findings
}
