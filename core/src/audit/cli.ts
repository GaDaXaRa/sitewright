#!/usr/bin/env node
import { arg as readArg } from './args.js'
import { runAudit } from './run.js'
import { renderReport, exitCode } from './report.js'

/**
 * `sitewright-audit --url http://localhost:3000 --css src/app/(frontend)/styles.css`
 *
 * Everything is optional except the URL, and every gate that cannot run says so rather than
 * passing quietly — a green report that skipped half the checks is worse than a red one.
 */
const arg = (name: string) => readArg(process.argv, name)

const baseUrl = arg('url')
if (!baseUrl) {
  console.error('Falta --url (dónde está respondiendo la web).')
  process.exit(2)
}

const findings = await runAudit({
  baseUrl,
  siteUrl: arg('site-url'),
  siteName: arg('name'),
  pages: arg('pages')?.split(',').filter(Boolean),
  legalPages: arg('legal')?.split(',').filter(Boolean),
  cssPath: arg('css'),
  contrastPairs: arg('contrast-pairs')
    ?.split(',')
    .map((pair) => pair.split(':') as [string, string]),
  databaseUrl: arg('db') ?? process.env.DATABASE_URL,
  migrationsDir: arg('migrations'),
})

console.log(renderReport(findings))
process.exit(exitCode(findings))
