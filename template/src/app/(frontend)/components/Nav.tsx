'use client'

import React, { useState } from 'react'
import Link from 'next/link'

export type NavLink = { href: string; label: string }

export default function Nav({
  name,
  logoUrl,
  links = [],
  cta,
}: {
  name: string
  logoUrl?: string | null
  /** One per module with a page of its own. The generator fills this in. */
  links?: NavLink[]
  cta?: NavLink
}) {
  const [open, setOpen] = useState(false)

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          {logoUrl ? (
            /* The logo is uploaded by the client at unknown dimensions and shown small in
               the bar, so a plain <img> is enough here. */
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={`Logo de ${name}`} />
          ) : (
            name
          )}
        </Link>

        {links.length > 0 || cta ? (
          <button
            className="nav-toggle"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        ) : null}

        <div className={`nav-links ${open ? 'open' : ''}`}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          {cta ? (
            <Link href={cta.href} className="nav-cta" onClick={() => setOpen(false)}>
              {cta.label}
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  )
}
