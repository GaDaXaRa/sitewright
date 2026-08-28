import React from 'react'
import type { Metadata } from 'next'
import LegalPage from '../components/LegalPage'
import { loadSettings } from '@/lib/data'
import { cookiePolicy } from 'sitewright-core'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Política de cookies',
  description: 'Qué se carga en tu navegador, cuándo y cómo cambiar de opinión.',
  alternates: { canonical: '/cookies' },
}

export default async function CookiesPage() {
  const settings = await loadSettings()
  return (
    <LegalPage
      settings={settings}
      title="Política de cookies"
      intro="Qué se carga en tu navegador y cuándo."
      sections={cookiePolicy(settings)}
    />
  )
}
