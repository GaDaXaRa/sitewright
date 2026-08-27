import React from 'react'
import RequestForm from './Form'

/**
 * The form, and the reason to fill it in.
 *
 * The email address goes next to it on purpose: some people will never use a form, and
 * making them hunt for an address is how an enquiry is lost.
 */
export default function ContactSection({
  title,
  text,
  email,
  kinds,
  askDate,
  askCity,
  privacyHref = '/privacidad',
  submitLabel,
}: {
  title: string
  text?: string | null
  email?: string | null
  kinds?: Record<string, string>
  askDate?: boolean
  askCity?: boolean
  privacyHref?: string
  submitLabel?: string
}) {
  return (
    <section className="section booking" id="contacto">
      <div className="container booking-grid">
        <div className="section-head">
          <h2>{title}</h2>
          {text ? <p>{text}</p> : null}
          {email ? (
            <p className="booking-mail">
              O escríbenos directamente a <a href={`mailto:${email}`}>{email}</a>.
            </p>
          ) : null}
        </div>
        <div className="booking-card">
          <RequestForm
            kinds={kinds}
            askDate={askDate}
            askCity={askCity}
            privacyHref={privacyHref}
            submitLabel={submitLabel}
          />
        </div>
      </div>
    </section>
  )
}
