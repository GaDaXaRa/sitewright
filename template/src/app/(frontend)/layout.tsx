import React from 'react'
import type { Metadata } from 'next'
import { Public_Sans } from 'next/font/google'
import { SITE_URL } from '@/lib/site'
import { buildIcons, needsCookieBanner } from 'sitewright-core'
import { loadSettings } from '@/lib/data'
import { site } from '@/site.config'
import { ConsentProvider } from 'sitewright-core/ui'
import { ConsentedAnalytics } from 'sitewright-core/ui'
import './styles.css'

// The blueprint picks the real pair; the template starts on one neutral face for both, so
// an empty site still looks deliberate rather than unstyled.
const body = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body-google',
  display: 'swap',
})

const display = body

/**
 * Everything in the metadata that does not depend on the CMS.
 *
 * It is not exported: Next refuses a segment that exports both `metadata` and
 * `generateMetadata`, and the icons have to be resolved per request because the client can
 * change them from the panel.
 */
const base: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  applicationName: site.name,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'es_ES', siteName: site.name, url: '/' },
  twitter: { card: 'summary_large_image' },
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await loadSettings()
  return { ...base, icons: buildIcons(settings) }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await loadSettings()

  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body>
        <ConsentProvider
        storageKey={site.id}
        cookiesHref={site.routes.cookies}
        showBanner={needsCookieBanner({
          mode: settings?.cookieBanner,
          analyticsRequiresConsent: settings?.analyticsConsent !== false,
        })}
      >
          <main>{children}</main>
          {/* Only on the public site: traffic to /admin is the client's own and would
              falsify the numbers. */}
          <ConsentedAnalytics requireConsent={settings?.analyticsConsent !== false} />
        </ConsentProvider>
      </body>
    </html>
  )
}
