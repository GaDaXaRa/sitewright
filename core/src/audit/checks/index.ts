/**
 * Las puertas, como funciones puras.
 *
 * Cada una existe porque algo salió mal de verdad, en producción, en una web que alguien
 * estaba pagando. Ese es el listón para añadir otra: no «estaría bien comprobar esto»
 * sino «esto nos mordió y no lo vio nadie hasta que lo vio un cliente».
 *
 * Reciben lo que se descargó y devuelven hallazgos; nada de aquí toca la red, así que
 * todo se puede probar sin una web delante.
 */
export { canonicalOf, checkIdentity, checkCanonicalAnswers, checkSitemapAndRobots, internalLinks, checkReachable, checkAdvertisedEmpty, isEmptyPage } from './indexing.js'
export { jsonLdOf, graphOf, checkStructuredData, checkLlmsTxt } from './machines.js'
export { checkSecurityHeaders, checkLegalPages, checkConsentGating } from './compliance.js'
export { checkImages, checkPlaceholders, cssTokens, checkContrast, checkWeight } from './presentation.js'
export { checkCoreVersion } from './maintenance.js'
