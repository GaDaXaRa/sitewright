import React from 'react'
import type { Metadata } from 'next'
import LegalPage from '../components/LegalPage'
import { loadSettings } from '@/lib/data'
import { pageMetadata } from '@/lib/metadata'
import { privacyPolicy } from 'sitewright-core'

export const revalidate = 3600

// Estas páginas también se comparten —un enlace a la política de privacidad en un correo,
// en un pie— y eran las únicas que salían sin imagen. Su texto sí es suyo: describe lo que
// hay dentro mejor que la descripción del sitio.
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Política de privacidad',
    description: 'Qué datos recogemos por el formulario, para qué, cuánto los guardamos y tus derechos.',
    canonical: '/privacidad',
    settings: await loadSettings(),
  })
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
