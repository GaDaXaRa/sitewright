import type { CollectionConfig, Field } from 'payload'
import { revalidator } from '@/collections/hooks/revalidate'

/**
 * El cuadrante semanal: clases, turnos o actividades que se repiten.
 *
 * No es la agenda (`schedule`), que son fechas que llegan, pasan y se archivan solas. Esto
 * se repite cada semana hasta que alguien lo cambia, así que no caduca y no hay nada que
 * archivar: lo que deja de darse se desmarca.
 */
export function timetableCollection({
  labels,
  route,
  linkedTo,
}: {
  labels: { singular: string; plural: string }
  route: string
  /** Con qué se cobra, si el sitio tiene tarifas. */
  linkedTo?: 'pricing'
}): CollectionConfig {
  const revalidation = revalidator(route)

  return {
    slug: 'timetable',
    labels,
    admin: {
      useAsTitle: 'title',
      defaultColumns: ['title', ...(linkedTo ? ['belongsTo'] : []), 'days', 'startTime', 'active'],
      group: 'Contenido',
    },
    access: { read: () => true },
    defaultSort: 'startTime',
    hooks: { afterChange: [revalidation.afterChange], afterDelete: [revalidation.afterDelete] },
    fields: [
      {
        name: 'title',
        label: 'Título',
        type: 'text',
        required: true,
        admin: {
          description: linkedTo
            ? 'Con el que la reconoces aquí, en el panel. Si le enlazas una tarifa abajo, en la web se muestra el nombre de esa tarifa y no éste: así el horario y la lista de precios nunca dicen nombres distintos. Sin tarifa, éste es el nombre que se ve.'
            : 'El nombre que se ve en la web.',
        },
      },
      ...(linkedTo
        ? ([
            {
              name: 'belongsTo',
              label: 'Tarifa',
              type: 'relationship',
              relationTo: linkedTo,
              admin: {
                description:
                  'Con qué tarifa se paga. Al enlazarla pasan dos cosas: en el horario se muestra el nombre de la tarifa —así no hay que escribirlo en dos sitios ni corregirlo dos veces— y quien pulse la clase llega al formulario con ella ya elegida. Déjalo vacío si no se cobra.',
              },
            },
          ] as Field[])
        : []),
      { name: 'description', label: 'Descripción', type: 'textarea' },
      {
        name: 'level',
        label: 'Nivel',
        type: 'select',
        defaultValue: 'all',
        options: [
          { label: 'Iniciación', value: 'beginner' },
          { label: 'Intermedio', value: 'intermediate' },
          { label: 'Avanzado', value: 'advanced' },
          { label: 'Todos los niveles', value: 'all' },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'days',
            label: 'Días de la semana',
            type: 'select',
            hasMany: true,
            required: true,
            options: [
              { label: 'Lunes', value: 'monday' },
              { label: 'Martes', value: 'tuesday' },
              { label: 'Miércoles', value: 'wednesday' },
              { label: 'Jueves', value: 'thursday' },
              { label: 'Viernes', value: 'friday' },
              { label: 'Sábado', value: 'saturday' },
              { label: 'Domingo', value: 'sunday' },
            ],
            admin: {
              width: '40%',
              description: 'Varios días para lo mismo, si comparten horario.',
            },
          },
          {
            name: 'startTime',
            label: 'Empieza',
            type: 'text',
            required: true,
            admin: { width: '30%', placeholder: '18:00' },
          },
          {
            name: 'endTime',
            label: 'Termina',
            type: 'text',
            admin: { width: '30%', placeholder: '19:30' },
          },
        ],
      },
      { name: 'teacher', label: 'Quién la imparte', type: 'text' },
      {
        name: 'privateLink',
        label: 'Enlace privado (videollamada, sala)',
        type: 'text',
        // El resto de la colección es pública —alimenta el horario—, pero esto no: sin este
        // acceso el enlace se serializa en la API pública y cualquiera entra a la clase sin
        // haberla pagado.
        access: { read: ({ req }) => Boolean(req.user) },
        admin: { description: 'Sólo se ve en el panel. No se publica.' },
      },
      {
        name: 'active',
        label: 'Se da ahora mismo',
        type: 'checkbox',
        defaultValue: true,
        admin: {
          position: 'sidebar',
          description: 'Desmárcala cuando deje de darse. No hace falta borrarla.',
        },
      },
    ],
  }
}
