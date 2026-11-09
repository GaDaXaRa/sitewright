import type { Access } from 'payload'

/**
 * Read access for a collection whose items can be switched off with an `active` box.
 *
 * The public site only paints active items, but that was a filter in the page query, not a
 * rule: `/api/reviews` handed the switched-off ones to anyone who asked. Switching a review
 * off is often exactly the decision to stop showing it, so the API has to agree with the page.
 * The panel's users still see everything — that is where they switch them back on.
 */
export const activeOrSignedIn: Access = ({ req }) =>
  req.user ? true : { active: { equals: true } }
