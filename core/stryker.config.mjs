// @ts-check
/**
 * Mutation testing: it changes the code on purpose (a `<` for a `<=`, a `||` for an `&&`,
 * one string for another) and demands that some test fails. What **survives** is code the
 * tests walk through without checking: coverage that proves nothing.
 *
 *   npm run test:mutacion                        # everything
 *   npx stryker run --mutate 'src/lib/events.ts' # a single module
 *
 * It runs **here and only here**. That is the whole point of the core: this logic is
 * exercised once, at this depth, and no site has to pay for it again.
 *
 * Only the pure modules are mutated. The Payload collections, the hooks and the client
 * components need a database or a browser, so they would come out as survivors wholesale
 * and bury what matters.
 *
 * Two things to know when reading the report:
 *
 * 1. **A mutant that breaks the module's import counts as a survivor**, because the vitest
 *    runner only looks at failing tests, not at files that never load. Before believing a
 *    row, apply the change by hand and run the tests.
 * 2. **The fifteen survivors that remain are equivalent mutants**, gone through one by one:
 *    a separator in `join('')` over a single item; `value && typeof value === 'object'`
 *    where the mutated branch produces the same `null`; `?.` where the value can never be
 *    nullish (`split()` always yields an index 0); `if (!end) return false` where the
 *    fallthrough also returns false; `.trim()` that `URL` and `Headers` already do; and the
 *    `+` in `/(^-|-$)+/g`, where the `g` flag already strips both ends. The threshold below
 *    sits just under the achieved score so a real regression shows up.
 *
 * Score when last measured: **96.14%**.
 */
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const configuration = {
  packageManager: 'npm',
  testRunner: 'vitest',
  mutate: ['src/lib/**/*.ts', '!src/lib/types.ts'],
  reporters: ['html', 'json', 'clear-text', 'progress'],
  htmlReporter: { fileName: 'reports/mutacion/informe.html' },
  jsonReporter: { fileName: 'reports/mutacion/informe.json' },
  clearTextReporter: { maxTestsToLog: 0 },
  // 'perTest' porque es lo único que admite `ignoreStatic`, y sin eso los mutantes de una
  // constante de módulo se cuentan como supervivientes sin serlo: el ejecutor no reevalúa
  // el módulo por mutante. Comprobado a mano — cambiando `FALLBACK_INKS`, la batería falla.
  coverageAnalysis: 'perTest',
  // Los mutantes "estáticos" —los que tocan una constante de módulo— se quedan fuera del
  // recuento porque el ejecutor no vuelve a evaluar el módulo por mutante y los da por
  // supervivientes sin serlo. Comprobado a mano: cambiando `FALLBACK_INKS` a mano, la
  // batería falla. Contarlos era medir el ejecutor, no las pruebas.
  ignoreStatic: true,
  timeoutMS: 20000,
  thresholds: { high: 97, low: 95, break: 95 },
}

export default configuration
