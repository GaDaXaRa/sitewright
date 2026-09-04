#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runAudit } from './run.js'
import { renderReport, exitCode } from './report.js'

/**
 * `sitewright-audit --url http://localhost:3000 --css src/app/(frontend)/styles.css`
 *
 * Everything is optional except the URL, and every gate that cannot run says so rather than
 * passing quietly — a green report that skipped half the checks is worse than a red one.
 */
/**
 * El último gana.
 *
 * El guion `audit` de cada web trae ya un `--url` con el valor por defecto, así que
 * `npm run audit -- --url https://…` pasa dos: quedándose con el primero, la orden de
 * quien la escribe no servía de nada y se auditaba localhost creyendo auditar producción.
 */
function arg(name: string): string | undefined {
  const index = process.argv.lastIndexOf(`--${name}`)
  return index > -1 ? process.argv[index + 1] : undefined
}

const baseUrl = arg('url')
if (!baseUrl) {
  console.error('Falta --url (dónde está respondiendo la web).')
  process.exit(2)
}

/**
 * Qué núcleo usa esta web y qué hay publicado.
 *
 * Se pregunta desde aquí y no desde la auditoría porque depende de la red y del disco: si
 * npm no contesta o no hay `package.json`, la puerta se queda sin comprobar y lo dice, que
 * es mejor que una auditoría que se cuelga o que aprueba sin mirar.
 */
async function coreVersions(root: string) {
  const readVersion = (path: string): string | null => {
    try {
      return JSON.parse(readFileSync(path, 'utf8')).version ?? null
    } catch {
      return null
    }
  }

  let declared: string | null = null
  try {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
    declared = pkg.dependencies?.['sitewright-core'] ?? null
  } catch {
    return null
  }

  let published: string[] | null = null
  try {
    const answer = await fetch('https://registry.npmjs.org/sitewright-core', {
      headers: { accept: 'application/vnd.npm.install-v1+json' },
      signal: AbortSignal.timeout(5000),
    })
    if (answer.ok) published = Object.keys(((await answer.json()) as { versions: object }).versions)
  } catch {
    // Sin registro no se afirma nada: la puerta lo dirá.
  }

  return {
    declared,
    installed: readVersion(join(root, 'node_modules/sitewright-core/package.json')),
    published,
  }
}

const findings = await runAudit({
  core: (await coreVersions(arg('root') ?? process.cwd())) ?? undefined,
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
