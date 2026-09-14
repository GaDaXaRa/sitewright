import React from 'react'
import type { Metadata } from 'next'
import LegalPage from '../components/LegalPage'
import { loadSettings } from '@/lib/data'
import { pageMetadata } from '@/lib/metadata'
import { legalNotice } from 'sitewright-core'
import { SITE_URL } from '@/lib/site'

export const revalidate = 3600

// Estas páginas también se comparten —un enlace a la política de privacidad en un correo,
// en un pie— y eran las únicas que salían sin imagen. Su texto sí es suyo: describe lo que
// hay dentro mejor que la descripción del sitio.
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Aviso legal',
    description: 'Titular de la web, condiciones de uso y propiedad intelectual.',
    canonical: '/aviso-legal',
    settings: await loadSettings(),
  })
}

export default async function LegalNoticePage() {
  const settings = await loadSettings()
  return <LegalPage settings={settings} title="Aviso legal" sections={legalNotice(settings, SITE_URL)} />
}
