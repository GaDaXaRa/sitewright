// Stryker disable StringLiteral: this file is prose. Mutating each sentence would only
// demand tests that copy the text back, which prove nothing; what has to hold is which
// sections appear and which data is left out, and that is under mutation.
import { PROVIDER_NAMES } from './embeds.js'
import type { LegalSettings } from './types.js'

/**
 * The legal pages, written from what the client filled in under "Datos legales" and from
 * what the site is made of (see `LegalProfile`).
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

/**
 * What the site is made of, which the client never fills in because the site already
 * knows it: the modules it was generated with and what its form asks.
 *
 * The pages were written for the first site, a DJ collective, and every site after it
 * inherited sessions, venues and bookings it did not have — a policy listing a city and a
 * date the form never asks for. The site builds this from its own module manifest, so
 * what the pages describe is what is really deployed, edits included.
 */
export type LegalProfile = {
  /** The modules the site has enabled, by id: `schedule`, `media`, `contact`… */
  modules: readonly string[]
  /**
   * The names of the fields of the contact form's collection. Only the ones a visitor
   * types are described; the panel's own (`status`, `consentAt`…) are ignored.
   */
  formFields: readonly string[]
}

/** The visitor's fields, in the order the form shows them, as the policy names them. */
const FORM_FIELDS: [string, string][] = [
  ['name', 'nombre'],
  ['email', 'email'],
  ['phone', 'teléfono si lo pones'],
  ['kind', 'qué tipo de petición es'],
  ['interest', 'qué te interesa de lo que ofrecemos'],
  ['city', 'ciudad'],
  ['eventDate', 'fecha'],
  ['message', 'tu mensaje'],
]

/** What a module puts on the site, for the notice's description of it. */
const PUBLISHES: [string, string][] = [
  ['media', 'las grabaciones de audio y vídeo'],
  ['schedule', 'las fechas anunciadas'],
  ['timetable', 'los horarios'],
  ['pricing', 'las tarifas'],
  ['team', 'las personas que forman parte'],
  ['contact', 'la forma de ponerse en contacto'],
]

type Facts = {
  form: boolean
  /** Empty when the form's fields are not known: then the policy does not list them. */
  fields: string[]
  embeds: boolean
  dates: boolean
  publishes: string[]
}

/**
 * Without a profile — a site whose pages were written before it existed — nothing can be
 * told apart, so the pages keep every disclosure they always made, in words that fit any
 * site: a form whose fields go unlisted, players that may be there. Leaving a disclosure
 * out is the mistake that costs; an unlisted field or a general sentence is not.
 */
function facts(profile: LegalProfile | undefined): Facts {
  if (!profile) return { form: true, fields: [], embeds: true, dates: true, publishes: [] }
  const has = (id: string) => profile.modules.includes(id)
  return {
    form: has('contact'),
    fields: FORM_FIELDS.filter(([name]) => profile.formFields.includes(name)).map(([, words]) => words),
    embeds: has('media'),
    dates: has('schedule') || has('timetable'),
    publishes: PUBLISHES.filter(([id]) => has(id)).map(([, words]) => words),
  }
}

/** "a, b y c". */
function listing(items: string[], conjunction = 'y'): string {
  if (items.length < 2) return items.join('')
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${items[items.length - 1]}`
}

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
  profile?: LegalProfile,
): LegalSection[] {
  const name = settings?.siteName || 'este sitio'
  const subject = settings?.schemaType === 'Person' ? 'el trabajo' : 'la actividad'
  const site = facts(profile)
  const publishes = site.publishes.length ? `: ${listing(site.publishes)}` : ''

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
        `Esta web informa sobre ${subject} de ${name}${publishes}. No se venden productos ni servicios a través de ella.`,
      ],
    },
    {
      heading: 'Propiedad intelectual',
      paragraphs: [
        'Los textos, fotografías y demás contenidos de la web pertenecen a sus autores. Puedes enlazarlos y citarlos, pero no reproducirlos ni reutilizarlos con fines comerciales sin permiso.',
        ...(site.embeds
          ? ['Los reproductores incrustados muestran contenido alojado en plataformas de terceros, sujeto a sus propias condiciones.']
          : []),
      ],
    },
    {
      heading: 'Responsabilidad',
      paragraphs: [
        ...(site.dates
          ? ['Las fechas y los horarios anunciados pueden cambiar por causas ajenas a nosotros. Confírmalos antes de desplazarte.']
          : []),
        `No respondemos del contenido de las webs enlazadas${site.embeds ? ' ni de las plataformas donde se aloja el contenido incrustado' : ''}.`,
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

export function privacyPolicy(
  settings: LegalSettings | null | undefined,
  profile?: LegalProfile,
): LegalSection[] {
  const email = contactEmail(settings)
  const holder = holderLines(settings)
  const site = facts(profile)

  const whoElse = site.form
    ? 'Puedes escribirnos a través del formulario de esta web.'
    : email
      ? `Puedes escribirnos a ${email}.`
      : 'Puedes escribirnos por los medios de contacto que aparecen en esta web.'

  // Consent and how long requests are kept only make sense where something is collected.
  const handling: LegalSection[] = [
    {
      heading: 'Con qué legitimación',
      paragraphs: [
        'Con tu consentimiento, que das al marcar la casilla antes de enviar el formulario. Guardamos la fecha en que lo diste, y puedes retirarlo cuando quieras.',
      ],
    },
    {
      heading: 'Cuánto tiempo los guardamos',
      paragraphs: [
        'Mientras dure la conversación y, después, el tiempo necesario para atender las responsabilidades que puedan derivarse de lo que nos pediste. Si nos pides que los borremos antes, los borramos.',
      ],
    },
  ]

  return [
    {
      heading: 'Quién trata tus datos',
      paragraphs: holder.length ? holder : [whoElse],
    },
    {
      heading: 'Qué datos recogemos y para qué',
      paragraphs: site.form
        ? [
            site.fields.length
              ? `Solo los que escribes en el formulario: ${listing(site.fields)}. Los usamos únicamente para contestarte y para atender lo que nos pidas.`
              : 'Solo los que escribes en el formulario. Los usamos únicamente para contestarte y para atender lo que nos pidas.',
            'No usamos tus datos para enviarte publicidad ni los cedemos a nadie que no aparezca en esta política.',
          ]
        : ['Esta web no tiene formularios ni cuentas para quien la visita: no te pide ningún dato personal.'],
    },
    ...(site.form ? handling : []),
    {
      heading: 'Quién más los ve',
      paragraphs: site.form
        ? [
            'Los proveedores que hacen funcionar la web, que actúan como encargados del tratamiento y solo tratan los datos por cuenta nuestra: Vercel (alojamiento), Neon (base de datos) y Resend (envío de los correos de aviso y confirmación).',
            'Tu dirección IP no se almacena: se usa en memoria y de forma pasajera para evitar envíos masivos desde el formulario, y desaparece sola.',
          ]
        : [
            'Vercel, que aloja la web, actúa como encargado del tratamiento: recibe las peticiones de tu navegador para poder servirte las páginas.',
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

export function cookiePolicy(
  settings: LegalSettings | null | undefined,
  profile?: LegalProfile,
): LegalSection[] {
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
    // Named from the list the embeds are parsed with, so a platform added there cannot be
    // missing here.
    ...(facts(profile).embeds
      ? [
          {
            heading: 'Reproductores de terceros',
            paragraphs: [
              `Algunas páginas muestran contenido alojado en ${listing(Object.values(PROVIDER_NAMES), 'o')}. Sus reproductores sí instalan cookies propias cuando se cargan, así que no aparecen hasta que aceptas: mientras tanto verás un aviso con un enlace para verlo o escucharlo en la propia plataforma.`,
            ],
          },
        ]
      : []),
    {
      heading: 'Cómo cambiar de opinión',
      paragraphs: [
        'Borra los datos de este sitio en tu navegador (en la configuración de privacidad) y volveremos a preguntarte la próxima vez que entres.',
      ],
    },
  ]
}
