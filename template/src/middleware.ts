import { NextResponse, type NextRequest } from 'next/server'
import { SITE_URL } from '@/lib/site'

const CANONICAL_HOST = new URL(SITE_URL).host

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
export function middleware(request: NextRequest) {
  if (process.env.VERCEL_ENV !== 'production') return NextResponse.next()

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
