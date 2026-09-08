import { describe, it, expect } from 'vitest'
import { timetableNodes } from './jsonld'
import { timetableSection } from './llms'
import { className, enrolLink, formatDays, sortByWhen } from './classes'
import type { ClassItem } from './Section'

/**
 * Las decisiones del cuadrante, probadas donde viven.
 *
 * Las pruebas viajan con el módulo: se copian al sitio y las corre su `npm run test:int`.
 * Un módulo es del sitio y se puede editar sin pedir permiso —`schedule/Row.tsx` y
 * `faq/Section.tsx` ya se han tocado en webs vivas—, así que quien lo toque se entera ahí
 * mismo de lo que ha roto, sin tener que volver a la fábrica.
 */
const conTarifa: ClassItem = {
  id: 7,
  title: 'Etiqueta del panel',
  belongsTo: { id: 3, name: 'Yoga Hatha-Vinyasa' },
  days: ['wednesday', 'monday'],
  startTime: '18:00',
  endTime: '19:30',
  teacher: 'Lucía',
  description: 'Secuencias coordinadas con la respiración.',
}
const sinTarifa: ClassItem = {
  id: 8,
  title: 'Jornada abierta',
  days: ['saturday'],
  startTime: '11:00',
}

describe('el nombre público', () => {
  it('lo pone la tarifa, no el título del panel', () => {
    // Escribirlo en dos sitios es lo que separó «Yoga Hatha-Vinyasa» de «Hatha - Vinyasa
    // Yoga» en la primera web que tuvo las dos listas.
    expect(className(conTarifa)).toBe('Yoga Hatha-Vinyasa')
  })

  it('y sin tarifa lo pone el título, que para eso sigue existiendo', () => {
    // Vaciarlo era lo natural, y deja la lista del panel mostrando identificadores: Payload
    // titula cada ficha por él.
    expect(className(sinTarifa)).toBe('Jornada abierta')
  })

  it('con la tarifa sin cargar, no inventa: cae al título', () => {
    // Con `depth: 0` la relación llega como identificador y no hay nombre que leer.
    expect(className({ ...conTarifa, belongsTo: 3 })).toBe('Etiqueta del panel')
  })
})

describe('los días', () => {
  it('se leen de lunes a domingo, venga como venga la multiselección', () => {
    expect(formatDays(conTarifa)).toBe('Lunes y miércoles')
  })

  it('con tres, la coma y la ye en su sitio', () => {
    expect(formatDays({ ...conTarifa, days: ['friday', 'monday', 'wednesday'] })).toBe(
      'Lunes, miércoles y viernes',
    )
  })

  it('ordenan el cuadrante por el primer día, y a igual día por la hora', () => {
    expect(sortByWhen([sinTarifa, conTarifa]).map((c) => c.id)).toEqual([7, 8])
  })

  it('y lo que no tiene día no se cuela el lunes', () => {
    const sinDias = { ...sinTarifa, id: 9, days: [] }
    expect(sortByWhen([sinDias, conTarifa]).map((c) => c.id)).toEqual([7, 9])
  })
})

describe('el enlace al formulario', () => {
  it('lleva la tarifa ya elegida', () => {
    expect(enrolLink(conTarifa, '/#contacto')).toBe('/#contacto?tarifa=3')
  })

  it('y no existe sin tarifa: no hay nada que preseleccionar', () => {
    expect(enrolLink(sinTarifa, '/#contacto')).toBeNull()
  })
})

describe('los datos estructurados', () => {
  it('es un Course, no un Event: esto se repite, no ocurre una vez', () => {
    expect(timetableNodes([conTarifa], '/horario')[0]!['@type']).toBe('Course')
  })

  it('dice qué días con el vocabulario de schema.org', () => {
    const [nodo] = timetableNodes([conTarifa], '/horario')
    expect(nodo!.hasCourseInstance.courseSchedule).toMatchObject({
      '@type': 'Schedule',
      repeatFrequency: 'P1W',
      byDay: ['https://schema.org/Monday', 'https://schema.org/Wednesday'],
      startTime: '18:00',
      endTime: '19:30',
    })
  })

  it('nombra a quien la imparte, y dónde cuando es en línea', () => {
    const [nodo] = timetableNodes([conTarifa], '/horario', 'online')
    expect(nodo!.hasCourseInstance.instructor).toEqual({ '@type': 'Person', name: 'Lucía' })
    expect(nodo!.hasCourseInstance.location['@type']).toBe('VirtualLocation')
  })

  it('usa el nombre de la tarifa también aquí, para no decir dos cosas', () => {
    expect(timetableNodes([conTarifa], '/horario')[0]!.name).toBe('Yoga Hatha-Vinyasa')
  })
})

describe('llms.txt', () => {
  it('escribe cada clase entera, que es lo que se pregunta', () => {
    const seccion = timetableSection([conTarifa, sinTarifa], {
      title: 'Horario',
      route: '/horario',
      now: Date.now(),
      settings: null,
    })

    expect(seccion.lines).toEqual([
      '- Yoga Hatha-Vinyasa — Lunes y miércoles, 18:00–19:30 · Lucía',
      '- Jornada abierta — Sábado, 11:00',
    ])
  })
})
