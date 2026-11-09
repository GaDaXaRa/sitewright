import { NextResponse, type NextRequest } from 'next/server'
import { SITE_URL } from '@/lib/site'

const canonical = new URL(SITE_URL)
const CANONICAL_HOST = canonical.host

/**
 * Only ever redirect towards a real, public address.
 *
 * With no domain bought yet, `SITE_URL` can resolve to localhost — and a production site
 * redirecting every visitor to their own machine is a worse failure than not redirecting at
 * all. In production Vercel provides the project's own address, so this guard should never
 * fire; it exists because the cost of being wrong here is the whole site.
 */
const CANONICAL_IS_PUBLIC = canonical.protocol === 'https:' && !/^localhost|^127\./.test(CANONICAL_HOST)

/**
 * Payload lets whoever arrives first create the first user while the users table is empty.
 *
 * A deployed site always gets its first user from the seed, through the Local API, so on
 * Vercel this door has no legitimate use. It did have an illegitimate one: provisioning
 * deploys before it seeds, and in between `/admin` offered the panel to anyone who found the
 * address. Previews too, because they are public addresses as well.
 */
const FIRST_USER = /^\/(?:admin\/create-first-user|api\/users\/first-register)\/?$/

/**
 * Sends anyone arriving through a Vercel subdomain to the brand domain.
 *
 * The site answers on both, and the *.vercel.app one cannot be removed or redirected from
 * the Vercel dashboard: it has to happen here, or Google indexes the two and they compete.
 *
 * **The canonical host is excluded even when it is itself a vercel.app address.** Before a
 * domain is bought, `SITE_URL` is the project's own vercel.app URL — and redirecting that
 * to itself is an infinite loop that takes the whole site down. The check is on the host,
 * not on the suffix.
 *
 * Only in production: preview deployments also live under *.vercel.app, and redirecting
 * them would leave no way to review a deploy before publishing it.
 */
export function proxy(request: NextRequest) {
  if (process.env.VERCEL_ENV && FIRST_USER.test(request.nextUrl.pathname)) {
    return new NextResponse(null, { status: 404 })
  }

  if (process.env.VERCEL_ENV !== 'production') return NextResponse.next()

  if (!CANONICAL_IS_PUBLIC) return NextResponse.next()

  const host = request.headers.get('host')
  if (!host || host === CANONICAL_HOST) return NextResponse.next()
  if (!host.endsWith('.vercel.app')) return NextResponse.next()

  const destination = new URL(request.nextUrl.pathname + request.nextUrl.search, SITE_URL)
  return NextResponse.redirect(destination, 308)
}

export const config = {
  // Next's internals and static files are left out.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
