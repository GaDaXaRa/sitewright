import React from 'react'
import { createRoot } from 'react-dom/client'
import ContactSection from '../modules/contact/Section'
import PricingSection from '../modules/pricing/Section'
import Nav from '../template/src/app/(frontend)/components/Nav'
import { ConsentProvider, useConsent } from '../core/src/ui/Consent'
import Embed from '../core/src/ui/Embed'
import '../template/src/app/(frontend)/styles.css'
import '../modules/pricing/section.css'

function Preferences() {
  const { decline } = useConsent()
  return <button onClick={decline}>Retirar consentimiento</button>
}
const prices = [{ id: 42, name: 'Clase semanal', price: 25 }]
createRoot(document.getElementById('root')!).render(
  <ConsentProvider storageKey="browser-test" hasEmbeds>
    <Nav
      name="Sitio de prueba"
      links={[{ href: '/#tarifas', label: 'Tarifas' }]}
      cta={{ href: '/#contacto', label: 'Contacto' }}
    />
    <main>
      <h1>Prueba de los recorridos públicos</h1>
      <PricingSection title="Tarifas" items={prices} ctaHref="/#contacto" />
      <ContactSection
        title="Contacto"
        interests={prices}
        interestParam="tarifa"
        askDate={false}
        askCity={false}
        privacyHref="/privacidad"
      />
      <Embed
        title="Vídeo de prueba"
        embed={{
          provider: 'youtube',
          canonicalUrl: 'https://www.youtube.com/watch?v=test',
          embedUrl: 'https://www.youtube-nocookie.com/embed/test',
        }}
      />
      <Preferences />
    </main>
  </ConsentProvider>,
)
