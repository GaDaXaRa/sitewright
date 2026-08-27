import React from 'react'
import type { Metadata } from 'next'
import LegalPage from '../components/LegalPage'
import { loadSettings } from '@/lib/data'
import { privacyPolicy } from '@sitewright/core'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Qué datos recogemos por el formulario, para qué, cuánto los guardamos y tus derechos.',
  alternates: { canonical: '/privacidad' },
}

export default async function PrivacyPage() {
  const settings = await loadSettings()
  return (
    <LegalPage
      settings={settings}
      title="Política de privacidad"
      intro="Qué hacemos con lo que nos escribes en el formulario."
      sections={privacyPolicy(settings)}
    />
  )
}
