import React from 'react'
import type { Metadata } from 'next'
import LegalPage from '../components/LegalPage'
import { loadSettings } from '@/lib/data'
import { pageMetadata } from '@/lib/metadata'
import { cookiePolicy } from 'sitewright-core'

export const revalidate = 3600

// Estas páginas también se comparten —un enlace a la política de privacidad en un correo,
// en un pie— y eran las únicas que salían sin imagen. Su texto sí es suyo: describe lo que
// hay dentro mejor que la descripción del sitio.
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Política de cookies',
    description: 'Qué se carga en tu navegador, cuándo y cómo cambiar de opinión.',
    canonical: '/cookies',
    settings: await loadSettings(),
  })
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
