import { escapeHtml } from '@sitewright/core'

/**
 * The text of the emails a request sends.
 *
 * They live outside the hook because the hook is only plumbing — read a couple of fields,
 * send two emails — while everything that can read badly is here: what is shown, in what
 * shape, and what is left unsaid when a field arrives empty. Being pure, they are checked
 * without a database or a mail server. Copy stays in Spanish: these reach real people.
 */

export type RequestData = {
  name?: string | null
  email?: string | null
  phone?: string | null
  kind?: string | null
  eventDate?: string | null
  city?: string | null
  message?: string | null
}

/** "Club o sala · Madrid · 14 de marzo de 2027", skipping whatever is missing. */
function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Madrid',
  }).format(new Date(value))
}

/** "Club o sala · Bilbao · 5 de marzo de 2027", skipping whatever is missing. */
export function requestSummary(request: RequestData, kinds: Record<string, string> = {}): string {
  return [
    request.kind ? (kinds[request.kind] ?? request.kind) : '',
    request.city,
    request.eventDate ? formatDate(request.eventDate) : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

function rows(request: RequestData, kinds: Record<string, string>): string {
  return [
    ['Nombre', request.name],
    ['Email', request.email],
    ['Teléfono', request.phone || '—'],
    ['Tipo', request.kind ? (kinds[request.kind] ?? request.kind) : '—'],
    ['Ciudad', request.city || '—'],
    ['Fecha', request.eventDate ? formatDate(request.eventDate) : '—'],
    ['Mensaje', request.message || '—'],
  ]
    .map(
      // Values are escaped here, the one place they all pass through, so no future row can
      // forget. The labels are literals of this file.
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#8a8a8a">${label}</td><td>${escapeHtml(value)}</td></tr>`,
    )
    .join('')
}

/** Notice to whoever runs the site, with the request summarised. */
export function noticeToOwner(request: RequestData, kinds: Record<string, string> = {}): string {
  return `
          <div style="font-family:sans-serif;color:#141414">
            <h2>Nueva solicitud desde la web</h2>
            <table style="border-collapse:collapse">${rows(request, kinds)}</table>
          </div>`
}

/** Confirmation to whoever wrote in. */
export function confirmationToSender(name: string, siteName: string, summary: string): string {
  // The name is typed by whoever fills the form; the rest comes from the CMS. All of it is
  // escaped: the <strong> belongs to this template, not to the data.
  const forWhat = summary ? ` para <strong>${escapeHtml(summary)}</strong>` : ''
  return `
        <div style="font-family:sans-serif;color:#141414">
          <h2>¡Gracias, ${escapeHtml(name)}!</h2>
          <p>Hemos recibido tu solicitud${forWhat}. Te contestamos lo antes posible.</p>
          <p style="color:#8a8a8a">Un saludo,<br/>${escapeHtml(siteName)}</p>
        </div>`
}
