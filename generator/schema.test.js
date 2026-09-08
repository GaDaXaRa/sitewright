import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { sectionOrder, validateBlueprint, validateWiring } from './schema.js'

/**
 * A blueprint with a typo has to fail in front of a person, not halfway through writing
 * files into a directory. These are the mistakes worth catching there.
 */
const valid = () => ({
  identity: { id: 'raiz', name: 'Raíz', url: 'https://raiz.example', email: 'hola@raiz.example' },
  modules: {
    catalog: { labels: { singular: 'Actividad', plural: 'Actividades' }, route: '/actividades' },
    contact: { labels: { singular: 'Solicitud', plural: 'Contacto' } },
  },
  design: {
    palette: {
      ground: '#f6f4ef',
      surface: '#ffffff',
      ink: '#1b1a17',
      inkSoft: '#4a4741',
      inkFaint: '#6b675f',
      accent: '#1f5f3f',
    },
    fonts: { display: 'Bitter', body: 'Public Sans' },
  },
  legal: { holder: 'Asociación Cultural Raíz' },
})

test('un blueprint completo no tiene nada que decir', () => {
  assert.deepEqual(validateBlueprint(valid()), [])
})

test('caza dos módulos peleándose por la misma ruta', () => {
  const bp = valid()
  bp.modules.schedule = { labels: { singular: 'Fecha', plural: 'Fechas' }, route: '/actividades' }

  // Sale como un 404 misterioso tres días después, y nadie lo relaciona con esto.
  assert.match(validateBlueprint(bp).join(' '), /ya lo usa catalog/)
})

test('caza un módulo que no existe', () => {
  const bp = valid()
  bp.modules.tienda = { labels: { singular: 'Producto', plural: 'Tienda' } }

  assert.match(validateBlueprint(bp).join(' '), /no existen tienda/)
})

test('exige el titular de la web, que es lo que hace legales las páginas legales', () => {
  const bp = valid()
  delete bp.legal.holder

  assert.match(validateBlueprint(bp).join(' '), /RGPD/)
})

test('exige una dirección donde lleguen las solicitudes si hay formulario', () => {
  const bp = valid()
  delete bp.identity.email

  assert.match(validateBlueprint(bp).join(' '), /lleguen a alguien/)
})

test('exige que la URL sea https y de verdad', () => {
  const bp = valid()
  bp.identity.url = 'raiz.example'

  assert.match(validateBlueprint(bp).join(' '), /https/)
})

test('rechaza un identificador con mayúsculas o espacios: acaba en claves y rutas', () => {
  const bp = valid()
  bp.identity.id = 'Raíz Cultural'

  assert.match(validateBlueprint(bp).join(' '), /identity\.id/)
})

test('rechaza un color que no es un color', () => {
  const bp = valid()
  bp.design.palette.accent = 'verde'

  assert.match(validateBlueprint(bp).join(' '), /#rrggbb/)
})

/**
 * Los colores propios del diseño. La plantilla trae diez con papel fijo y una web real usa
 * más —Organic Yoga pinta sus bandas con un índigo y sus detalles con un ocre—, así que lo
 * que se valida aquí es lo único comprobable sin ver la hoja: que se puedan escribir como
 * token y que no tapen a uno del sistema.
 */
test('acepta los colores propios de un diseño', () => {
  const bp = valid()
  bp.design.palette.extras = { indigo: '#274257', ocre: '#c19a4b' }

  assert.deepEqual(validateBlueprint(bp), [])
})

test('rechaza un color propio que no es un color', () => {
  const bp = valid()
  bp.design.palette.extras = { indigo: 'índigo' }

  assert.match(validateBlueprint(bp).join(' '), /extras\.indigo.*#rrggbb/)
})

test('rechaza un color propio que se llama como uno del sistema', () => {
  // Se escriben después de la paleta, así que ganaría éste: la web saldría con el fondo
  // donde iba el acento y ninguna puerta lo diría.
  const bp = valid()
  bp.design.palette.extras = { accent: '#274257' }

  assert.match(validateBlueprint(bp).join(' '), /ya es del sistema/)
})

test('rechaza un color propio llamado "on-algo", que taparía a la tinta medida', () => {
  const bp = valid()
  bp.design.palette.extras = { 'on-indigo': '#274257' }

  assert.match(validateBlueprint(bp).join(' '), /"on-" lo reserva/)
})

test('rechaza un nombre de color que no se puede escribir como token', () => {
  const bp = valid()
  bp.design.palette.extras = { 'Índigo Profundo': '#274257' }

  assert.match(validateBlueprint(bp).join(' '), /minúsculas/)
})

test('el orden de las secciones respeta el declarado y añade el resto detrás', () => {
  const bp = valid()
  bp.design.sections = ['contact']

  assert.deepEqual(sectionOrder(bp), ['contact', 'catalog'])
})

test('el orden ignora una sección de un módulo que no está activo', () => {
  const bp = valid()
  bp.design.sections = ['pricing', 'contact']

  assert.deepEqual(sectionOrder(bp), ['contact', 'catalog'])
})

// ── el contrato de los módulos ──────────────────────────────────────────────────────────

test('un cableado con una clave que el generador no lee se rechaza', () => {
  const errors = validateWiring('faq', { id: 'faq', variable: 'faqs', sectionRnder: 'x' })
  assert.equal(errors.length, 1)
  assert.match(errors[0], /sectionRnder/)
})

test('el id del cableado tiene que ser el del directorio', () => {
  const errors = validateWiring('faq', { id: 'faqs', variable: 'faqs' })
  assert.match(errors.join(), /su id dice "faqs"/)
})

test('no declarar `variable` es distinto de declararla nula', () => {
  assert.match(validateWiring('about', { id: 'about' }).join(), /falta `variable`/)
  assert.deepEqual(validateWiring('about', { id: 'about', variable: null }), [])
})

test('quien consulta datos tiene que nombrarlos', () => {
  const errors = validateWiring('faq', { id: 'faq', variable: null, query: { collection: 'faqs' } })
  assert.match(errors.join(), /`variable` tiene que nombrarlos/)
})

test('elegir entre datos que no se han pedido no tiene sentido', () => {
  const errors = validateWiring('notices', {
    id: 'notices',
    variable: 'notice',
    pickImport: "import { pickNotice } from '…'",
    pickName: 'pickNotice',
  })
  assert.match(errors.join(), /`pickName` sin `query`/)
})

test('los diez módulos reales cumplen su propio contrato', async () => {
  const { readdirSync } = await import('node:fs')
  const dirs = readdirSync(new URL('../modules', import.meta.url), { withFileTypes: true })
  for (const { name: id } of dirs.filter((d) => d.isDirectory())) {
    const { wiring } = await import(`../modules/${id}/wiring.js`)
    assert.deepEqual(validateWiring(id, wiring), [], `modules/${id}`)
  }
})

// ── las clases de CSS, que no las comprueba ningún compilador ───────────────────────────

test('cada clase que define un módulo la usa su componente', async () => {
  // Un renombrado masivo cambió `className="partners"` por `className="items"` y la tira
  // de logos perdió su maquetación en producción sin que fallara nada: TypeScript no mira
  // dentro de una cadena, y el CSS no se queja de una regla que no encaja con nadie.
  const { readdirSync, readFileSync, existsSync } = await import('node:fs')
  const raiz = new URL('../modules/', import.meta.url)

  for (const { name: id } of readdirSync(raiz, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const hoja = new URL(`${id}/section.css`, raiz)
    if (!existsSync(hoja)) continue

    const clases = [...readFileSync(hoja, 'utf8').matchAll(/^\.([a-z][a-z0-9-]*)/gm)].map((m) => m[1])
    const componentes = readdirSync(new URL(`${id}/`, raiz))
      .filter((f) => f.endsWith('.tsx'))
      .map((f) => readFileSync(new URL(`${id}/${f}`, raiz), 'utf8'))
      .join(' ')

    for (const clase of new Set(clases)) {
      assert.match(
        componentes,
        new RegExp(`(?<![\\w-])${clase.replace(/-/g, '\\-')}(?![\\w-])`),
        `modules/${id}: el CSS define .${clase} y ningún componente la usa`,
      )
    }
  }
})

test('un campo del panel que nadie pinta es una promesa que la web no cumple', async () => {
  // Ha pasado tres veces: el cartel de un evento, su dirección y «Destacado en la portada».
  // Ninguna falla nada — el campo existe, se guarda, y la web sigue sin usarlo — así que
  // sólo se descubre cuando un cliente sube algo y no lo ve.
  const { readdirSync, readFileSync, existsSync } = await import('node:fs')
  const raiz = new URL('../modules/', import.meta.url)

  // Los que ordenan o filtran, y no se pintan.
  const ESTRUCTURALES = new Set(['order', 'active', 'slug'])
  // El formulario guarda lo que llega de fuera: nada de eso sale en la web, a propósito.
  const SOLO_PANEL = new Set(['contact'])
  // Y los contados casos que lee otro módulo: el precio se enlaza desde el catálogo.
  const LOS_LEE_OTRO = new Set(['pricing.belongsTo'])

  for (const { name: id } of readdirSync(raiz, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    if (SOLO_PANEL.has(id)) continue
    const coleccion = new URL(`${id}/collection.ts`, raiz)
    if (!existsSync(coleccion)) continue

    // Se busca **en su propio módulo**: mirar en todos deja que el uso de uno tape el
    // huérfano de otro, y `featured` existe en dos módulos distintos.
    const suyo = readdirSync(new URL(`${id}/`, raiz))
      .filter((f) => /\.(ts|tsx|js)$/.test(f) && f !== 'collection.ts')
      .map((f) => readFileSync(new URL(`${id}/${f}`, raiz), 'utf8'))
      .join(' ')

    // Y los que **no se publican a propósito**, que se reconocen solos: un campo con su
    // propio `access.read` es privado por decisión —el enlace de una clase de pago, por
    // ejemplo—, y pintarlo sería el fallo, no dejarlo sin pintar. Se mira el cuerpo de cada
    // campo, de su `name` al siguiente, en vez de apuntarlo en una lista que hay que
    // acordarse de mantener.
    const fuente = readFileSync(coleccion, 'utf8')
    const declaraciones = [...fuente.matchAll(/name: '([a-zA-Z][a-zA-Z0-9]*)'/g)]

    const campos = declaraciones
      .filter(({ index }, i) => {
        const cuerpo = fuente.slice(index, declaraciones[i + 1]?.index ?? fuente.length)
        return !/access:\s*\{\s*read:/.test(cuerpo)
      })
      .map((m) => m[1])
      .filter((campo) => !ESTRUCTURALES.has(campo) && !LOS_LEE_OTRO.has(`${id}.${campo}`))

    for (const campo of new Set(campos)) {
      assert.match(
        suyo,
        // Sin excluir el punto: un campo se usa precisamente así, `item.campo`.
        new RegExp(`(?<![\\w])${campo}(?![\\w])`),
        `modules/${id}: el panel pide "${campo}" y ningún componente lo usa`,
      )
    }
  }
})

test('lo que el generador escribe por web está declarado como tal', async () => {
  // `sync-site` copia sobre una web viva todo lo que NO esté en esta lista. Si el
  // generador escribe un fichero más y nadie lo declara, la próxima puesta al día
  // sobrescribe el contenido de un cliente con el de la plantilla.
  const { WRITTEN } = await import('./generated.js')
  const source = await readFile(new URL('./generate.js', import.meta.url), 'utf8')

  // Sólo las rutas escritas a pelo: las de las páginas de cada módulo salen de una
  // variable y no existen en la plantilla, así que nunca se comparan.
  const written = [...source.matchAll(/\bwrite\(\s*'([^']+)'/g)].map((m) => m[1])
  assert.ok(written.length >= WRITTEN.length, 'no se han leído todas las escrituras')

  for (const path of written) {
    assert.ok(
      WRITTEN.includes(path),
      `generate.js escribe "${path}" y generated.js no lo declara: sync-site lo pisaría.`,
    )
  }

  for (const path of WRITTEN) {
    assert.ok(
      source.includes(`'${path}'`),
      `generated.js declara "${path}" y generate.js ya no lo escribe: sobra en la lista.`,
    )
  }
})

test('cada campo del blueprint lo lee alguien', async () => {
  // `design.altExample` estuvo en el blueprint de una web real sin que nadie lo leyera: el
  // panel seguía enseñando el ejemplo de la plantilla. Un campo que se rellena y no hace
  // nada es peor que no tenerlo, porque quien lo rellena cree que ha configurado algo.
  // Todo el generador, no sólo su guion: quien lee un campo del blueprint vive en `lib/`
  // desde que se partió, y buscar sólo en `generate.js` daba por huérfano lo que sí se lee.
  // Se listan por glob para que un escritor nuevo entre sin tocar esta prueba.
  const { readdirSync } = await import('node:fs')
  const enLib = readdirSync(new URL('./lib/', import.meta.url)).map((f) => `./lib/${f}`)
  const source = (
    await Promise.all(
      ['./generate.js', './schema.js', ...enLib].map((f) =>
        readFile(new URL(f, import.meta.url), 'utf8'),
      ),
    )
  )
    .join('\n')
    // `bp.design?.sections` lee `design.sections`: el encadenamiento opcional no cambia
    // quién lee qué, sólo qué pasa si falta.
    .replaceAll('?.', '.')

  for (const file of ['ejemplo-asociacion', 'ejemplo-portafolio']) {
    const bp = JSON.parse(
      await readFile(new URL(`./blueprints/${file}.json`, import.meta.url), 'utf8'),
    )
    for (const group of ['identity', 'design', 'legal']) {
      for (const key of Object.keys(bp[group] ?? {})) {
        assert.ok(
          source.includes(`${group}.${key}`),
          `${file}: nadie lee ${group}.${key}, así que rellenarlo no hace nada.`,
        )
      }
    }
  }
})
