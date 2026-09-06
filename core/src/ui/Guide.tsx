import React from 'react'

/**
 * La guía completa del panel, dentro del propio panel.
 *
 * Vive aquí y no en un documento aparte porque un PDF se queda viejo el día que cambia
 * algo y nadie vuelve a abrirlo. Aquí está donde se trabaja, y habla de **su** web: dice
 * «Bolos» si su sección se llama así, no «agenda».
 *
 * Documenta todo, la parte legal incluida. Esconder lo peligroso no lo hace más seguro:
 * lo hace más probable, porque alguien acabará tocándolo sin saber qué hace.
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

/** Qué es cada colección y qué campos importan de verdad. */
const MODULES: Record<string, { what: string; fields: [string, string][] }> = {
  about: {
    what: 'La presentación que sale en la portada. No es una colección: se escribe en Ajustes del sitio.',
    fields: [],
  },
  catalog: {
    what: 'Lo que ofrecéis o habéis hecho. Cada ficha tiene su propia página.',
    fields: [
      ['Título y Resumen', 'El resumen es lo que se lee en la portada y en los buscadores. Una frase.'],
      ['Descripción', 'El texto largo de su página, por bloques. Cada bloque puede llevar subtítulo.'],
      ['Puntos destacados', 'La lista corta de lo que incluye. Sale como viñetas.'],
      ['Destacado en la portada', 'Lo marcado sale primero cuando la portada sólo enseña unos pocos.'],
    ],
  },
  schedule: {
    what: 'Las fechas. Lo que ya pasó se guarda solo en el archivo: no hay que borrar nada.',
    fields: [
      ['Empieza y Termina', 'Algo deja de ser «próximo» cuando **termina**, no cuando empieza.'],
      ['Lugar, Ciudad y Dirección', 'Los tres se ven en la web, uno debajo de otro.'],
      ['Imagen o cartel', 'Sale a la izquierda de la fila. Cuadrado o vertical queda mejor.'],
      ['Descripción', 'Deja una línea en blanco entre párrafos: se respetan.'],
      ['Entrada libre / Precio', 'Si no pones ninguno, no se dice nada. Un precio vacío no es «gratis».'],
    ],
  },
  pricing: {
    what: 'Las tarifas.',
    fields: [
      ['Tipo de precio', 'Si aún no está cerrado, marca «A convenir». Nunca pongas un número provisional.'],
      ['Qué incluye', 'La lista de viñetas de cada tarifa.'],
    ],
  },
  team: {
    what: 'Las personas, cada una con su ficha propia.',
    fields: [
      ['Foto', 'Vertical y de buena resolución. Marca el punto focal sobre la cara.'],
      ['Papel', 'La línea corta bajo el nombre: lo que hace, su estilo, su instrumento.'],
      ['Biografía', 'Por párrafos. El primero es el que se ve en el listado.'],
      ['Enlaces', 'Instagram, SoundCloud, lo que sea. Nombre y dirección.'],
    ],
  },
  media: {
    what: 'Sesiones, vídeos y mezclas. Se pega la dirección y se incrusta el reproductor.',
    fields: [
      ['Dirección del audio o del vídeo', 'La de la plataforma. Se reconoce sola.'],
      ['Portada', 'Si no pones una, se usa la que traiga la plataforma.'],
      ['Destacada', 'Sale primero.'],
    ],
  },
  reviews: {
    what: 'Lo que dicen de vosotras: prensa, clientes, apariciones.',
    fields: [
      ['Cita', 'El trozo que se lee. Corto rinde más que largo.'],
      ['Quién lo dice y Medio', 'Quién firma y dónde salió.'],
      ['Enlace al original', 'Se abre en otra pestaña.'],
    ],
  },
  faq: {
    what: 'Preguntas y respuestas. Es lo que más rinde en buscadores y con los asistentes de IA.',
    fields: [['Pregunta', 'Escríbela con las palabras que usaría quien pregunta, no las vuestras.']],
  },
  notices: {
    what: 'El aviso emergente. Se crea apagado a propósito.',
    fields: [
      ['Activo', 'Hasta que no lo marques, no sale.'],
      ['Programación', 'Fechas de inicio y fin. Fuera de esa ventana no aparece aunque esté activo.'],
    ],
  },
  partners: {
    what: 'La tira de logos de quien os apoya.',
    fields: [
      ['Nombre', 'Obligatorio: es lo que lee quien no ve el logo. El logo, en cambio, puede faltar.'],
      ['¿Cómo es este logo?', 'Para que todos se vean parejos sobre el fondo. No modifica el fichero.'],
    ],
  },
  contact: {
    what: 'Las solicitudes que llegan por el formulario. Esto **no sale en la web**: se lee aquí.',
    fields: [
      ['Tipo', 'Lo que marcó quien escribió, para que sepas qué quiere antes de abrirlo.'],
      ['Aceptó la política de privacidad', 'Queda registrado con la fecha. No lo borres: es la prueba.'],
    ],
  },
}

const STYLE = `
.sw-guide { max-width: 60rem; padding: 0 0 5rem; line-height: 1.6; }
.sw-guide h1 { margin: 0 0 .35rem; }
.sw-guide .sw-lede { color: var(--theme-elevation-600); margin: 0 0 2rem; font-size: 1.05rem; }
.sw-guide h2 {
  margin: 3rem 0 .5rem; font-size: 1.2rem;
  padding-top: 1rem; border-top: 1px solid var(--theme-elevation-100);
}
.sw-guide h3 { margin: 1.5rem 0 .35rem; font-size: 1rem; }
.sw-guide p { margin: 0 0 .75rem; }
.sw-guide ul { margin: 0 0 .75rem; padding-left: 1.15rem; }
.sw-guide li { margin-bottom: .35rem; }
.sw-guide dl { margin: 0 0 1rem; }
.sw-guide dt { font-weight: 600; margin-top: .6rem; }
.sw-guide dd { margin: 0; color: var(--theme-elevation-700); }
.sw-guide .sw-note {
  border-left: 3px solid var(--theme-elevation-300); padding: .6rem 0 .6rem 1rem;
  margin: 1rem 0; color: var(--theme-elevation-700);
}
.sw-guide .sw-toc { columns: 2; gap: 2rem; margin-bottom: 1rem; }
@media (max-width: 640px) { .sw-guide .sw-toc { columns: 1; } }
`

export const Guide: React.FC<GuideProps> = ({ siteName, sections, support }) => {
  const known = sections.filter((s) => MODULES[s.id])
  const named = (s: GuideSection) => s.plural ?? s.title

  return (
    <div className="sw-guide gutter--left gutter--right">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />

      <h1>Cómo se maneja {siteName}</h1>
      <p className="sw-lede">
        Todo lo que hay en la web se escribe aquí. Guarda, y en unos minutos está publicado: no hay
        que avisar a nadie ni hacer nada más.
      </p>

      <ul className="sw-toc">
        <li><a href="#secciones">Qué es cada sección</a></li>
        <li><a href="#fotos">Fotos</a></li>
        <li><a href="#ajustes">Ajustes del sitio</a></li>
        <li><a href="#portada">La portada</a></li>
        <li><a href="#legal">Datos legales</a></li>
        <li><a href="#cookies">Cookies y visitas</a></li>
        <li><a href="#buscadores">Buscadores</a></li>
        <li><a href="#problemas">Si algo se ve raro</a></li>
      </ul>

      <h2 id="secciones">Qué es cada sección</h2>
      <div className="sw-note">
        <p>
          <strong>Una sección vacía no aparece.</strong> Ni en el menú ni en los buscadores. En
          cuanto publiques la primera ficha aparece sola, y si borras la última vuelve a
          desaparecer: es a propósito, para que nadie llegue a una página que dice «todavía no hay
          nada».
        </p>
      </div>

      {known.map((section) => {
        const info = MODULES[section.id]!
        return (
          <div key={section.id}>
            <h3>{named(section)}</h3>
            <p>{info.what}</p>
            {info.fields.length ? (
              <dl>
                {info.fields.map(([field, help]) => (
                  <React.Fragment key={field}>
                    <dt>{field}</dt>
                    <dd>{help}</dd>
                  </React.Fragment>
                ))}
              </dl>
            ) : null}
          </div>
        )
      })}

      <h3>Orden y visibilidad</h3>
      <p>
        Casi todas las fichas tienen <strong>Orden</strong> —se muestran de menor a mayor— y{' '}
        <strong>Activa</strong>. Desmarcar «Activa» la quita de la web sin borrarla, que es lo que
        conviene cuando algo vuelve más adelante.
      </p>

      <h2 id="fotos">Fotos</h2>
      <ul>
        <li>
          Cuanto más grandes, mejor: <strong>1920px de ancho</strong> para las horizontales y{' '}
          <strong>1200px de alto</strong> para los retratos.
        </li>
        <li>
          <strong>Texto alternativo</strong>: descríbela en una frase. Lo lee quien no ve la imagen y
          lo leen los buscadores. No lo dejes vacío.
        </li>
        <li>
          Si una foto se recorta mal, marca el <strong>punto focal</strong>: es lo que la web
          respeta al recortar.
        </li>
        <li>
          Al abrir una imagen tienes <strong>Quitar el fondo</strong> —sirve con logos que traen un
          recuadro liso—, <strong>Invertir colores</strong> y <strong>Volver al original</strong>.
        </li>
      </ul>
      <div className="sw-note">
        <p>
          <strong>No se puede estropear una foto.</strong> Al subirla se guarda una copia intacta, y
          «Volver al original» deshace cualquier cosa que le hayas hecho, incluidos los recortes.
        </p>
      </div>

      <h2 id="ajustes">Ajustes del sitio</h2>
      <p>Lo que es común a toda la web. Está agrupado:</p>
      <dl>
        <dt>Nombre, Eslogan, Logo e Icono</dt>
        <dd>
          El nombre y el logo salen en la cabecera; el icono es el dibujito de la pestaña del
          navegador. Si no pones icono, se genera uno con las iniciales y vuestros colores.
        </dd>
        <dt>Qué tipo de negocio es</dt>
        <dd>
          Se lo dice a los buscadores para que os clasifiquen bien: organización, negocio con local,
          persona, grupo musical o asociación.
        </dd>
        <dt>Contacto</dt>
        <dd>
          El correo, el teléfono y la ciudad. El correo es <strong>a donde llegan las solicitudes</strong>{' '}
          del formulario.
        </dd>
        <dt>Redes</dt>
        <dd>Instagram, Facebook y YouTube. Se ponen las direcciones completas y salen en el pie.</dd>
      </dl>

      <h2 id="portada">La portada</h2>
      <p>
        En <b>Ajustes del sitio → Portada</b>: la foto de fondo, el titulillo, el título y el texto
        de entrada. Y tres cosas que conviene mirar juntas, porque el título va encima de la foto:
      </p>
      <dl>
        <dt>Posición y altura del texto</dt>
        <dd>Dónde cae el título sobre la foto: izquierda, centro o derecha; arriba, en medio o abajo.</dd>
        <dt>Oscurecer la foto</dt>
        <dd>
          Entera, sólo detrás del texto, o nada. Entera es lo seguro; «sólo detrás del texto»
          respeta la imagen y suele quedar mejor.
        </dd>
        <dt>Color del texto</dt>
        <dd>
          Claro u oscuro. Si quitas el oscurecimiento sobre una foto clara y dejas el texto claro,{' '}
          <strong>el título desaparece</strong>: es del mismo color que el fondo de la web.
        </dd>
      </dl>
      <p>Cambia, guarda y mira la web. Se ve enseguida y se puede volver atrás.</p>

      <h2 id="legal">Datos legales</h2>
      <p>
        Están en <b>Ajustes del sitio → Datos legales</b>, y son lo que hace legales el aviso legal,
        la política de privacidad y la de cookies: esas tres páginas <strong>se escriben solas</strong>{' '}
        a partir de lo que pongas aquí. Si cambias el domicilio, cambia en las tres.
      </p>
      <dl>
        <dt>Titular de la web</dt>
        <dd>
          Quién responde de ella: la asociación o empresa, o la persona física si no hay forma
          jurídica. Tal como aparezca en su documentación, sin abreviar.
        </dd>
        <dt>NIF / CIF</dt>
        <dd>El del titular. Si el titular es una persona, su NIF.</dd>
        <dt>Domicilio</dt>
        <dd>
          La dirección fiscal completa, con código postal y localidad. Es la dirección a la que
          alguien puede dirigirse formalmente.
        </dd>
        <dt>Email para ejercer derechos (RGPD)</dt>
        <dd>
          A donde escribe quien quiera saber qué datos suyos tenéis, corregirlos o pedir que los
          borréis. Puede ser el mismo de contacto, pero <strong>tiene que estar</strong> y alguien
          tiene que leerlo.
        </dd>
      </dl>
      <div className="sw-note">
        <p>
          <strong>Aquí no se rompe nada visible, y por eso hay que ir con cuidado.</strong> Un dato
          legal equivocado no da error: la web sigue funcionando y las páginas legales siguen ahí,
          diciendo algo que no es cierto. Si cambia el titular, el domicilio o la forma jurídica,
          cámbialo el mismo día y revisa las tres páginas después.
        </p>
      </div>

      <h2 id="cookies">Cookies y visitas</h2>
      <dl>
        <dt>Pedir consentimiento antes de medir visitas</dt>
        <dd>
          Con esto activado, no se cuenta nada hasta que la persona acepta. Es lo que exige la ley
          para la analítica que identifica a alguien.
        </dd>
        <dt>Banner de cookies</dt>
        <dd>
          <strong>Automático</strong> es lo recomendado: sale sólo si hace falta. Si apagas la
          analítica y no hay reproductores incrustados, no hay nada que consentir y el banner
          desaparece solo. «No mostrarlo nunca» te pedirá confirmar que entiendes lo que implica.
        </dd>
      </dl>

      <h2 id="buscadores">Buscadores</h2>
      <p>
        El <strong>título</strong> y la <strong>descripción para buscadores</strong> son lo que sale
        en Google, no en la web. Si los dejas vacíos se usan el nombre y el eslogan. La web genera
        además, sola y siempre al día, el mapa del sitio y un resumen en texto plano para los
        asistentes de IA.
      </p>

      <h2 id="problemas">Si algo se ve raro</h2>
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
