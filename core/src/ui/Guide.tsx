import React from 'react'

/**
 * La guía que ve la clienta dentro de su propio panel.
 *
 * Vive aquí y no en un documento aparte porque un PDF se queda viejo el día que cambia
 * algo y nadie vuelve a abrirlo. Aquí está donde se trabaja, y habla de **su** web: dice
 * «Bolos» si su sección se llama así, no «agenda».
 *
 * Lo que no explica, a propósito: los datos legales. Cambiarlos mal tiene consecuencias
 * que no se ven hasta que alguien reclama, así que esa parte se queda con quien hizo la
 * web.
 */

export type GuideSection = {
  id: string
  /** Como la llama ella: «Bolos», «Selectas», «Tarifas». */
  title: string
  plural?: string
  route?: string
}

export type GuideProps = {
  siteName: string
  sections: GuideSection[]
  /** A quién escribir cuando algo no cuadra. Sin esto, no se inventa un destinatario. */
  support?: { name?: string | null; email?: string | null } | null
}

/** Qué es cada módulo, en una frase, para quien no lo ha montado. */
const WHAT: Record<string, string> = {
  about: 'La presentación que sale en la portada. Si la dejas vacía, esa sección desaparece.',
  catalog: 'Lo que ofrecéis o habéis hecho. Cada ficha tiene su propia página.',
  schedule: 'Las fechas. Lo que ya pasó se guarda solo en el archivo, no hay que borrarlo.',
  pricing: 'Las tarifas. Si un precio aún no está cerrado, marca «a convenir» en vez de poner un número.',
  team: 'Las personas, cada una con su ficha, su foto y sus enlaces.',
  media: 'Sesiones, vídeos y mezclas. Se pega la dirección y se incrusta el reproductor.',
  reviews: 'Lo que dicen de vosotras: prensa, clientes, apariciones.',
  faq: 'Preguntas y respuestas. Es lo que más rinde en buscadores: contesta con las palabras que usa quien pregunta.',
  notices: 'El aviso emergente. Se crea apagado: hay que marcarlo como activo cuando toque.',
  partners: 'La tira de logos de quien os apoya. El nombre es obligatorio; el logo, no.',
  contact: 'Las solicitudes que llegan por el formulario. Esto no sale en la web: se lee aquí.',
}

const STYLE = `
.sw-guide { max-width: 62rem; padding: 0 0 4rem; line-height: 1.6; }
.sw-guide h1 { margin: 0 0 .35rem; }
.sw-guide .sw-lede { color: var(--theme-elevation-600); margin: 0 0 2.5rem; font-size: 1.05rem; }
.sw-guide h2 { margin: 2.5rem 0 .75rem; font-size: 1.15rem; }
.sw-guide p { margin: 0 0 .75rem; }
.sw-guide ul { margin: 0 0 .75rem; padding-left: 1.15rem; }
.sw-guide li { margin-bottom: .35rem; }
.sw-guide .sw-sections { list-style: none; padding: 0; margin: 0; }
.sw-guide .sw-sections li {
  display: grid; grid-template-columns: minmax(8rem, 12rem) minmax(0, 1fr); gap: .25rem 1.25rem;
  padding: .7rem 0; border-bottom: 1px solid var(--theme-elevation-100);
}
.sw-guide .sw-sections b { font-weight: 600; }
.sw-guide .sw-sections span { color: var(--theme-elevation-600); }
.sw-guide .sw-note {
  border-left: 3px solid var(--theme-elevation-300); padding: .6rem 0 .6rem 1rem;
  margin: 1rem 0; color: var(--theme-elevation-700);
}
@media (max-width: 640px) {
  .sw-guide .sw-sections li { grid-template-columns: minmax(0, 1fr); }
}
`

export const Guide: React.FC<GuideProps> = ({ siteName, sections, support }) => {
  const withPage = sections.filter((s) => s.route)

  return (
    <div className="sw-guide gutter--left gutter--right">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />

      <h1>Cómo se maneja {siteName}</h1>
      <p className="sw-lede">
        Todo lo que hay en la web se escribe aquí. Guarda, y en unos minutos está publicado:
        no hace falta avisar a nadie ni hacer nada más.
      </p>

      <h2>Qué es cada cosa</h2>
      <ul className="sw-sections">
        {sections.map((section) => (
          <li key={section.id}>
            <b>{section.plural ?? section.title}</b>
            <span>{WHAT[section.id] ?? 'Contenido de la web.'}</span>
          </li>
        ))}
      </ul>

      {withPage.length ? (
        <div className="sw-note">
          <p>
            <strong>Una sección vacía no aparece.</strong> Ni en el menú ni en los buscadores.
            En cuanto publiques la primera ficha, {withPage.length === 1 ? 'la sección aparece' : 'las secciones aparecen'} sola
            {withPage.length === 1 ? '' : 's'}. Y si borras lo último, vuelve a desaparecer: es a
            propósito, para que nadie llegue a una página que dice «todavía no hay nada».
          </p>
        </div>
      ) : null}

      <h2>Fotos</h2>
      <ul>
        <li>
          Cuanto más grandes, mejor: <strong>1920px de ancho</strong> para las horizontales y{' '}
          <strong>1200px de alto</strong> para los retratos. Bajar de ahí se nota en pantallas buenas.
        </li>
        <li>
          Si una foto se recorta mal, marca el <strong>punto focal</strong> en Imágenes: es lo que
          la web respeta al recortar.
        </li>
        <li>
          Al abrir una imagen tienes <strong>Quitar el fondo</strong> —sirve con logos que traen un
          recuadro liso—, <strong>Invertir colores</strong> y <strong>Volver al original</strong>.
        </li>
      </ul>
      <div className="sw-note">
        <p>
          <strong>No se puede estropear una foto.</strong> Al subirla se guarda una copia intacta, y
          «Volver al original» deshace cualquier cosa que le hayas hecho.
        </p>
      </div>

      <h2>La portada</h2>
      <p>
        En <b>Ajustes del sitio</b>: la foto de fondo, el título y el texto de entrada. Y tres cosas
        que conviene mirar juntas, porque el título va encima de la foto:
      </p>
      <ul>
        <li>
          <strong>Oscurecer la foto</strong> — entera, sólo detrás del texto, o nada. Entera es lo
          seguro; «sólo detrás del texto» respeta la imagen y suele quedar mejor.
        </li>
        <li>
          <strong>Color del texto</strong> — claro u oscuro. Si quitas el oscurecimiento sobre una
          foto clara y dejas el texto claro, <strong>el título desaparece</strong>.
        </li>
      </ul>
      <p>Cambia, guarda y mira la web. Se ve al momento y se puede volver atrás.</p>

      <h2>Cookies y visitas</h2>
      <p>
        El banner de cookies sale <strong>sólo si hace falta</strong>. Si apagas la analítica y no
        hay reproductores incrustados, no hay nada que consentir y el banner desaparece. El panel te
        avisa de lo que implica antes de dejarte cambiarlo.
      </p>

      <h2>Lo que no toques</h2>
      <p>
        Los <strong>datos legales</strong> —titular, NIF, domicilio— son lo que hace legales el aviso
        legal y la política de privacidad. Cambiarlos mal no rompe nada visible, y por eso es
        peligroso: si hay que corregirlos, dilo y se hace.
      </p>

      <h2>Si algo se ve raro</h2>
      <p>
        Recarga pasados un par de minutos: la web guarda una copia de cada página para ir rápido y
        tarda un poco en enterarse de un cambio.{' '}
        {support?.email ? (
          <>
            Si sigue mal, escribe a{' '}
            <a href={`mailto:${support.email}`}>
              {support.name ? `${support.name} (${support.email})` : support.email}
            </a>
            .
          </>
        ) : (
          'Si sigue mal, avisa a quien te hizo la web.'
        )}
      </p>
    </div>
  )
}
