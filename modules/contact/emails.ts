import type { CollectionAfterChangeHook } from 'payload'
import { confirmationToSender, noticeToOwner, requestSummary } from './texts'

/**
 * On a new request, warns by email:
 *  1) the client (address from "Ajustes del sitio", or EMAIL_NOTIFY)
 *  2) whoever wrote in, with a confirmation.
 *
 * It never blocks the request: if the mail fails, the error is only logged. Losing a
 * notification is bad; losing the request itself is worse.
 */
export const sendRequestEmails: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc

  const { payload } = req

  try {
    const settings = await payload.findGlobal({ slug: 'site-settings' })
    const to = settings?.email || process.env.EMAIL_NOTIFY
    const siteName = settings?.siteName || 'la web'
    const summary = requestSummary(doc)

    if (to) {
      await payload.sendEmail({
        to,
        replyTo: doc.email,
        subject: `Nueva solicitud: ${doc.name}`,
        html: noticeToOwner(doc),
      })
    } else {
      payload.logger.warn(
        'Solicitud recibida pero no hay email de destino (configura el email en Ajustes del sitio o EMAIL_NOTIFY).',
      )
    }

    await payload.sendEmail({
      to: doc.email,
      subject: `Hemos recibido tu solicitud — ${siteName}`,
      html: confirmationToSender(doc.name, siteName, summary),
    })
  } catch (err) {
    payload.logger.error(`Error enviando los correos de la solicitud: ${err}`)
  }

  return doc
}
