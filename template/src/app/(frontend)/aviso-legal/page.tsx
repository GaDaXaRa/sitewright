import React from 'react'
import type { Metadata } from 'next'
import LegalPage from '../components/LegalPage'
import { loadSettings } from '@/lib/data'
import { legalNotice } from 'sitewright-core'
import { SITE_URL } from '@/lib/site'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Aviso legal',
  description: 'Titular de la web, condiciones de uso y propiedad intelectual.',
  alternates: { canonical: '/aviso-legal' },
}

export default async function LegalNoticePage() {
  const settings = await loadSettings()
  return <LegalPage settings={settings} title="Aviso legal" sections={legalNotice(settings, SITE_URL)} />
}
