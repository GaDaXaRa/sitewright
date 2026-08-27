import React from 'react'
import Link from 'next/link'
import type { SiteSetting } from '@/payload-types'

export default function Footer({
  settings,
  links = [],
}: {
  settings: SiteSetting
  /** The site's own pages. The generator adds one per module with a page. */
  links?: { label: string; href: string }[]
}) {
  const social: { label: string; href: string }[] = []
  if (settings.instagram) social.push({ label: 'Instagram', href: settings.instagram })
  if (settings.facebook) social.push({ label: 'Facebook', href: settings.facebook })
  if (settings.youtube) social.push({ label: 'YouTube', href: settings.youtube })

  return (
    <footer className="foot">
      <div className="container">
        <div className="foot-top">
          <div className="foot-col">
            <div className="foot-brand">{settings.siteName}</div>
            {settings.tagline ? <p>{settings.tagline}</p> : null}
          </div>

          {links.length ? (
            <div className="foot-col">
              <h2>La web</h2>
              {links.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="foot-col">
            <h2>Contacto</h2>
            {settings.email ? <a href={`mailto:${settings.email}`}>{settings.email}</a> : null}
            {settings.phone ? <a href={`tel:${settings.phone}`}>{settings.phone}</a> : null}
            {settings.city ? <p>{settings.city}</p> : null}
          </div>

          {social.length ? (
            <div className="foot-col">
              <h2>Síguenos</h2>
              {social.map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noreferrer">
                  {l.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="foot-bottom">
          <span>
            © {new Date().getFullYear()} {settings.siteName}
          </span>
          <span className="foot-legal">
            <Link href="/aviso-legal">Aviso legal</Link>
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/cookies">Cookies</Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
