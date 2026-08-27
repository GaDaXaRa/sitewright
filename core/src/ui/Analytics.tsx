'use client'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { useConsent } from './Consent.js'

/**
 * Measurement only once accepted.
 *
 * Vercel Analytics is cookie-less and there is a reading under which it needs no banner,
 * but the AEPD is strict and the safe path is not to load it at all until the visitor
 * says yes. It is a switch in the panel (`analyticsConsent`) rather than a decision buried
 * in the code, so a site that ships without measurement can turn it off entirely.
 */
export default function ConsentedAnalytics({ requireConsent }: { requireConsent: boolean }) {
  const { status } = useConsent()
  if (requireConsent && status !== 'accepted') return null

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
