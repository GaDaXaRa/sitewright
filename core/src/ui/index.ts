// Client components. Kept apart from the rest so a server file never pulls React in by
// accident, and so Payload's importMap can point at a single, stable path.
//
// They render fixed class names (`consent`, `embed`, `embed-blocked`…) and bring no styles
// of their own: how they look belongs to each site's stylesheet, which is the half a client
// asks to change.
export { ImageButtons } from './ImageButtons.js'
export { ConsentProvider, useConsent } from './Consent.js'
export { default as ConsentedAnalytics } from './Analytics.js'
export { default as Embed } from './Embed.js'
