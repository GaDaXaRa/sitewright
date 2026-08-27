/**
 * The half of the core that knows it is running inside Payload and Next.
 *
 * It is a separate entry point from the pure logic so that a test, a script or a page can
 * import the pure half without dragging Payload in.
 */
export { versionUrls, saveOriginalCopy } from './images.js'
export { restoreOriginalEndpoint } from './restoreOriginal.js'
export { mediaCollection } from './media.js'
export { usersCollection } from './users.js'
export { createRevalidation, type Revalidator } from './revalidate.js'
