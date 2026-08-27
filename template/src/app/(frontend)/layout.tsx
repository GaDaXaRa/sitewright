import React from 'react'
import type { Metadata } from 'next'
import { Public_Sans } from 'next/font/google'
import { SITE_URL } from '@/lib/site'
import { loadSettings } from '@/lib/data'
import { site } from '@/site.config'
import { ConsentProvider } from '@sitewright/core/ui'
import { ConsentedAnalytics } from '@sitewright/core/ui'
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  applicationName: site.name,
  alternates: { canonical: '/' },
  // Fixed addresses on purpose. With the icon inside the app folder, Next gives it a hash
  // that changes on every deploy, and Google needs a stable address to associate the
  // favicon with the site — otherwise the results show the generic globe. The .ico is
  // 48x48, the size Google asks for.
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: { type: 'website', locale: 'es_ES', siteName: site.name, url: '/' },
  twitter: { card: 'summary_large_image' },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await loadSettings()

  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body>
        <ConsentProvider storageKey={site.id} cookiesHref={site.routes.cookies}>
          <main>{children}</main>
          {/* Only on the public site: traffic to /admin is the client's own and would
              falsify the numbers. */}
          <ConsentedAnalytics requireConsent={settings?.analyticsConsent !== false} />
        </ConsentProvider>
      </body>
    </html>
  )
}
