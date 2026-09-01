// Stryker disable StringLiteral: this file is prose. Mutating each sentence would only
// demand tests that copy the text back, which prove nothing; what has to hold is which
// sections appear and which data is left out, and that is under mutation.
import type { LegalSettings } from './types.js'

/**
 * The legal pages, written from what the client filled in under "Datos legales".
 *
 * They are generated rather than hand-written for one reason: a site that collects
 * personal data through a form needs all three, and the version that gets forgotten is
 * always the one nobody generated. What cannot be generated is the review — these are a
 * solid draft, not legal advice, and the client is told so in their guide.
 *
 * Anything the client has not filled in is **left out**, not invented: a privacy policy
 * naming the wrong data controller is worse than one that names none.
 */

export type LegalSection = { heading: string; paragraphs: string[] }

/** Falls back through the addresses the client may have filled in. */
function contactEmail(settings: LegalSettings | null | undefined): string | null {
  return settings?.legalEmail || settings?.email || null
}

function holderLines(settings: LegalSettings | null | undefined): string[] {
  const holder = settings?.legalHolder
  if (!holder) return []
  const id = settings?.legalId ? ` (NIF ${settings.legalId})` : ''
  const address = settings?.legalAddress ? `, con domicilio en ${settings.legalAddress}` : ''
  const email = contactEmail(settings)
  return [
    `Titular: ${holder}${id}${address}.` + (email ? ` Contacto: ${email}.` : ''),
  ]
}

export function legalNotice(
  settings: LegalSettings | null | undefined,
  siteUrl: string,
): LegalSection[] {
  const name = settings?.siteName || 'este sitio'

  return [
    {
      heading: 'Titular del sitio',
      paragraphs: [
        ...holderLines(settings),
        `Dirección de la web: ${siteUrl}.`,
      ],
    },
    {
      heading: 'Objeto',
      paragraphs: [
        `Esta web informa sobre la actividad de ${name}: sesiones publicadas, fechas anunciadas y la forma de ponerse en contacto para contrataciones. No se venden productos ni servicios a través de ella.`,
      ],
    },
    {
      heading: 'Propiedad intelectual',
      paragraphs: [
        'Los textos, fotografías, grabaciones y demás contenidos de la web pertenecen a sus autores. Puedes enlazarlos y citarlos, pero no reproducirlos ni reutilizarlos con fines comerciales sin permiso.',
        'Los reproductores incrustados muestran contenido alojado en plataformas de terceros, sujeto a sus propias condiciones.',
      ],
    },
    {
      heading: 'Responsabilidad',
      paragraphs: [
        'La información sobre fechas y horarios puede cambiar por causas ajenas a nosotros (cambios de sala, cancelaciones). Confirma siempre en la web de la sala o del promotor antes de desplazarte.',
        'No respondemos del contenido de las webs enlazadas ni de las plataformas donde se alojan las sesiones.',
      ],
    },
    {
      heading: 'Legislación aplicable',
      paragraphs: [
        'Esta web se rige por la legislación española. Para cualquier controversia serán competentes los juzgados y tribunales del domicilio del titular.',
      ],
    },
  ]
}

export function privacyPolicy(settings: LegalSettings | null | undefined): LegalSection[] {
  const email = contactEmail(settings)

  return [
    {
      heading: 'Quién trata tus datos',
      paragraphs: holderLines(settings).length
        ? holderLines(settings)
        : ['Puedes escribirnos a través del formulario de contratación de esta web.'],
    },
    {
      heading: 'Qué datos recogemos y para qué',
      paragraphs: [
        'Solo los que escribes en el formulario de contratación: nombre, email, teléfono si lo pones, tipo de evento, ciudad, fecha y tu mensaje. Los usamos únicamente para contestarte y, si hay acuerdo, para organizar la actuación.',
        'No usamos tus datos para enviarte publicidad ni los cedemos a nadie que no aparezca en esta política.',
      ],
    },
    {
      heading: 'Con qué legitimación',
      paragraphs: [
        'Con tu consentimiento, que das al marcar la casilla antes de enviar el formulario. Guardamos la fecha en que lo diste, y puedes retirarlo cuando quieras.',
      ],
    },
    {
      heading: 'Cuánto tiempo los guardamos',
      paragraphs: [
        'Mientras dure la conversación y, después, el tiempo necesario para atender posibles responsabilidades derivadas de la contratación. Si nos pides que los borremos antes, los borramos.',
      ],
    },
    {
      heading: 'Quién más los ve',
      paragraphs: [
        'Los proveedores que hacen funcionar la web, que actúan como encargados del tratamiento y solo tratan los datos por cuenta nuestra: Vercel (alojamiento), Neon (base de datos) y Resend (envío de los correos de aviso y confirmación).',
        'Tu dirección IP no se almacena: se usa en memoria y de forma pasajera para evitar envíos masivos desde el formulario, y desaparece sola.',
      ],
    },
    {
      heading: 'Tus derechos',
      paragraphs: [
        `Puedes pedirnos acceder a tus datos, rectificarlos, suprimirlos, oponerte al tratamiento, limitarlo o pedir su portabilidad${email ? `, escribiendo a ${email}` : ''}.`,
        'Si crees que no hemos atendido bien tu petición, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).',
      ],
    },
  ]
}

export function cookiePolicy(settings: LegalSettings | null | undefined): LegalSection[] {
  const asksFirst = settings?.analyticsConsent !== false
  const banner = settings?.cookieBanner ?? 'auto'
  // Asking before measuring only works if there is a banner to ask with. Saying otherwise
  // in a legal page is the worst place to be wrong.
  const measuresAtAll = !asksFirst || banner !== 'never'

  return [
    {
      heading: 'Qué usamos',
      paragraphs: [
        'Esta web no usa cookies propias de seguimiento. Para recordar si has aceptado o no, guardamos una marca en el almacenamiento local de tu navegador; no identifica a nadie y no viaja a ningún servidor.',
      ],
    },
    {
      heading: 'Medición de visitas',
      paragraphs: !measuresAtAll
        ? ['No medimos las visitas: no se carga ninguna herramienta de analítica.']
        : asksFirst
          ? [
              'Usamos Vercel Analytics para saber cuántas visitas recibe cada página. No usa cookies ni construye un perfil de quien navega, y aun así no se carga hasta que aceptas.',
            ]
          : [
              'Usamos Vercel Analytics para saber cuántas visitas recibe cada página. No usa cookies, no guarda nada en tu navegador y no construye un perfil de quien navega; por eso se carga sin pedirte permiso.',
            ],
    },
    {
      heading: 'Reproductores de terceros',
      paragraphs: [
        'Las sesiones están alojadas en SoundCloud, Mixcloud, YouTube o Bandcamp. Sus reproductores sí instalan cookies propias cuando se cargan, así que no aparecen hasta que aceptas: mientras tanto verás un aviso con un enlace para escuchar la sesión en la plataforma.',
      ],
    },
    {
      heading: 'Cómo cambiar de opinión',
      paragraphs: [
        'Borra los datos de este sitio en tu navegador (en la configuración de privacidad) y volveremos a preguntarte la próxima vez que entres.',
      ],
    },
  ]
}
