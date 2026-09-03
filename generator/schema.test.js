import { test } from 'node:test'
import assert from 'node:assert/strict'
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
  const errors = validateWiring('faq', { id: 'faq', variable: null, dataQuery: () => '' })
  assert.match(errors.join(), /`variable` tiene que nombrarlos/)
})

test('elegir entre datos que no se han pedido no tiene sentido', () => {
  const errors = validateWiring('notices', {
    id: 'notices',
    variable: 'notice',
    dataPick: { from: 'notices', empty: 'null', code: '' },
  })
  assert.match(errors.join(), /`dataPick` sin `dataQuery`/)
})

test('los diez módulos reales cumplen su propio contrato', async () => {
  const { readdirSync } = await import('node:fs')
  const dirs = readdirSync(new URL('../modules', import.meta.url), { withFileTypes: true })
  for (const { name: id } of dirs.filter((d) => d.isDirectory())) {
    const { wiring } = await import(`../modules/${id}/wiring.js`)
    assert.deepEqual(validateWiring(id, wiring), [], `modules/${id}`)
  }
})
