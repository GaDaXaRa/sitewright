/**
 * How many public form submissions are accepted, and at what pace.
 *
 * The booking form creates documents publicly and every submission sends two emails, one
 * of them **to the address typed by whoever filled it in**. With no brake, anyone can use
 * the site to mail third parties: it burns the sender's reputation in Resend and eats the
 * quota. The honeypot and the content checks stop generic bots, not someone who studies
 * the form for two minutes.
 *
 * Two brakes, because neither is enough alone:
 *
 * 1. **Per IP**, in memory. Stops ordinary abuse and costs not a single query. Since each
 *    Vercel instance has its own memory and gets recycled, it is a partial brake: spreading
 *    submissions over many IPs, or hitting cold instances, gets through.
 * 2. **Global ceiling**, counted in the database, which is the only truly shared state. It
 *    is set loose — the collective gets few requests a day — and exists so a mass mailing
 *    hits a cap even when the per-IP brake never sees it.
 *
 * The IP is **not stored**: it lives in memory and expires on its own. It is personal data,
 * and keeping it would bring obligations (legal basis, retention period, a mention in the
 * privacy policy) that are not worth it for this.
 *
 * Everything decided here is pure and tested; the collection hook only reads the header,
 * queries and throws.
 */

export const MAX_PER_IP = 3
export const IP_WINDOW_MS = 15 * 60 * 1000

export const MAX_GLOBAL = 20
export const GLOBAL_WINDOW_MS = 60 * 60 * 1000

/** The same message either way: an abuser needs not know which ceiling they hit. */
export const TOO_MANY_ERROR =
  'Hemos recibido varias solicitudes seguidas. Espera unos minutos e inténtalo de nuevo.'

/**
 * The sender's IP, according to the proxy headers.
 *
 * `x-forwarded-for` arrives as "client, proxy1, proxy2" and the first one is the client.
 * With no header (local development) there is nobody to count: it returns null and the
 * per-IP brake is skipped, which is correct — the global ceiling still stands.
 */
export function requestIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return headers.get('x-real-ip')?.trim() || null
}

/**
 * Decides whether that IP may submit again, from its previous submissions.
 *
 * Returns the marks to store: those inside the current window, plus now if accepted. Stale
 * ones are dropped here, so the list never grows without bound.
 */
export function recordSubmission(
  previous: number[] | undefined,
  now: number,
): { allowed: boolean; marks: number[] } {
  const current = (previous ?? []).filter((t) => now - t < IP_WINDOW_MS)

  if (current.length >= MAX_PER_IP) return { allowed: false, marks: current }
  return { allowed: true, marks: [...current, now] }
}

/** How far back to count submissions for the global ceiling. */
export function countSince(now: number): Date {
  return new Date(now - GLOBAL_WINDOW_MS)
}

export function exceedsGlobalCeiling(recent: number): boolean {
  return recent >= MAX_GLOBAL
}
