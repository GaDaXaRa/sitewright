'use client'

import React, { useState } from 'react'
import Link from 'next/link'

/**
 * The public form. It posts to Payload's REST API (`requests`), whose create permission is
 * public and whose hooks do the filtering: honeypot, content checks, consent and rate
 * limits (see `collection.ts`).
 */
export default function RequestForm({
  kinds = {},
  askDate = true,
  askCity = true,
  privacyHref = '/privacidad',
  submitLabel = 'Enviar',
}: {
  /** The kinds of request, in the client's words. Empty hides the field. */
  kinds?: Record<string, string>
  askDate?: boolean
  askCity?: boolean
  privacyHref?: string
  submitLabel?: string
}) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')

    const form = e.currentTarget
    const data = new FormData(form)

    const body = {
      name: data.get('name'),
      email: data.get('email'),
      phone: data.get('phone') || undefined,
      kind: data.get('kind') || undefined,
      city: data.get('city') || undefined,
      eventDate: data.get('eventDate') || undefined,
      message: data.get('message') || undefined,
      consent: data.get('consent') === 'on',
      // Honeypot: only bots fill it in; the server refuses the submission when it arrives
      // with a value.
      website: data.get('website') || undefined,
    }

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Request failed')
      setStatus('ok')
      form.reset()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'ok') {
    return (
      <p className="form-ok">
        Recibido. Te contestamos por correo lo antes posible.
      </p>
    )
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <label>
        Nombre*
        <input type="text" name="name" required autoComplete="name" />
      </label>
      <label>
        Email*
        <input type="email" name="email" required autoComplete="email" />
      </label>
      <label>
        Teléfono
        <input type="tel" name="phone" autoComplete="tel" />
      </label>
      {Object.keys(kinds).length > 0 ? (
        <label>
          Tipo
          <select name="kind" defaultValue="">
            <option value="">— Elige una opción —</option>
            {Object.entries(kinds).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {askCity ? (
        <label>
          Ciudad
          <input type="text" name="city" />
        </label>
      ) : null}
      {askDate ? (
        <label>
          Fecha
          <input type="date" name="eventDate" />
        </label>
      ) : null}
      <label className="field-wide">
        Cuéntanos
        <textarea name="message" rows={4} placeholder="Cuéntanos lo que necesitas" />
      </label>

      <label className="field-consent">
        <input type="checkbox" name="consent" required />
        <span>
          He leído y acepto la <Link href="/privacidad">política de privacidad</Link>. Usaremos
          tus datos solo para contestarte.*
        </span>
      </label>

      {/* Anti-spam trap: invisible and out of the tab order for people, but bots that fill
          every field walk into it. */}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="website">No rellenar este campo</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
        {status === 'sending' ? 'Enviando…' : submitLabel}
      </button>

      {status === 'error' ? (
        <p className="form-error">
          No se ha podido enviar. Inténtalo de nuevo en unos minutos, o escríbenos por correo.
        </p>
      ) : null}
    </form>
  )
}
