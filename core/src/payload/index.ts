/**
 * The half of the core that knows it is running inside Payload and Next.
 *
 * It is a separate entry point from the pure logic so that a test, a script or a page can
 * import the pure half without dragging Payload in.
 */
export { mediaCollection } from './media.js'
export { usersCollection } from './users.js'
export { createRevalidation, type Revalidator } from './revalidate.js'

// Los ganchos (`saveOriginalCopy`, `versionUrls`) y los endpoints del panel
// (`restoreOriginalEndpoint`, `imageOpsEndpoint`, y con ellos `invertImage`,
// `clearImageBackdrop` y `OPS_ERROR`) no salen: los monta `mediaCollection`, que es lo que
// una web escribe en su `payload.config`. La función del panel no cambia; lo que se deja
// de prometer es la forma de montarla a mano, que ninguna web usaba.
