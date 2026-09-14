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
 * 2. **The survivors that remain cannot be killed** — twenty-six of them plus two that time
 *    out, gone through one by one on 7 September 2026 by applying each one and running the
 *    battery, and checked again on 14 September against the report: same files, same lines.
 *    They fall into four families, and knowing which is which is what stops the next person
 *    re-deriving them:
 *
 *    - **The code itself undoes the change** (9): the `filter` after `initials`'s `split`
 *      drops the empty words a coarser separator creates; `recordSubmission`'s own filter
 *      discards the injected mark as NaN; a value that is not an object has no `.url` or
 *      `.width`, so `asMedia` ends at the same `?? null`; and in `bestTextOn` an empty
 *      candidate measures -1 and never wins, which also makes the `-1`/`+1` sentinel moot
 *      — the real minimum ratio is 1.
 *    - **Arithmetically indistinguishable** (5): the sRGB curve is continuous at 0.03928,
 *      where both branches give 0.003040 and the channel that would separate them
 *      (10.0164) is not an integer; swapping `>` for `>=` on equal luminances yields the
 *      same pair; at exactly `tolerance` the computed opacity is 0, which is the alpha the
 *      backdrop branch writes anyway; and the two `i <= pixels.length` loops read past the
 *      array (NaN, which never counts as backdrop) and write past a typed array, a no-op.
 *    - **A threshold no pair of colours can hit** (2): `>= 4.5` and `> 4.5` differ only at
 *      a contrast of exactly 4.5:1, a real number no hex pair produces.
 *    - **Guards that cannot fail where they stand** (12): `holderLines` already returned
 *      `[]` when there is no holder, so `settings` is never null below it; `split()` always
 *      yields index 0; `if (!end) return false` where the fallthrough returns false too;
 *      a separator over one item; a default that only has to be neither 'never' nor
 *      'always'; `new URL()` throwing into the same `null`; `URL` trimming what `.trim()`
 *      trimmed; `.toString()` on a string; the `g` flag already stripping both ends; and a
 *      hostname whose only slash is the trailing one.
 *
 *    Three that used to sit here **were real gaps**, and now have tests: `#abc` expanding
 *    to `#aabbcc` and not `#abcabc` (the old case used `#fff`, where both readings agree),
 *    `contrastRatio` returning null when the **second** colour is invalid, and a
 *    `/EmbeddedPlayer` path on a host that is not Bandcamp.
 *
 * **The score is not written here.** It was, and it rotted: this comment claimed 95.56%
 * with a margin of 0.56 over the threshold for a week during which the real figures were
 * 96.49% and 1.49, because the core grew and nobody came back to edit a number in a
 * comment. A number kept by hand is a number that lies, which is the whole point of the
 * table of lying tools in CLAUDE.md — so the figure lives where it is produced:
 *
 *   npm run test:mutacion                        # prints it, and breaks below 95
 *   reports/mutacion/informe.html                # and shows every mutant behind it
 *
 * What is worth writing down is what a rerun cannot tell you. Two things, both of which
 * have already misled someone reading a number in isolation:
 *
 * - **A survivor leaving raises the score without a test being written.** Deleting
 *   `relationPointsTo` — which nothing called, not a site, not the template, not the core —
 *   took 8 mutants with it, 7 killed and one survivor, and the score went up.
 * - **A drop is not always a regression.** Moving `versions.ts` out to `scripts/lib/`,
 *   where it belongs, took 100 mutants with a perfect score with it and the score fell.
 *
 * So read a change in the number against what moved, never on its own. What the threshold
 * is actually for: the next module added without tests breaks the build.
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
