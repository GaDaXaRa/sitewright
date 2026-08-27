import type { CollectionConfig, CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { saveOriginalCopy, versionUrls } from './images.js'
import { restoreOriginalEndpoint } from './restoreOriginal.js'

/**
 * The uploads collection, with the whole image story attached: versioned URLs so an edit is
 * visible at once, an untouched copy kept on first upload, and a button to go back to it.
 *
 * Labels and the alt-text example belong to the site — they are what the client reads — so
 * they come in as arguments. Everything else is the same everywhere.
 */
export function mediaCollection({
  altExample,
  revalidation,
  slug = 'media',
  saveButton = '@sitewright/core/ui#ImageButtons',
}: {
  /** Concrete example for the alt field, in the client's own words. */
  altExample: string
  revalidation?: { afterChange: CollectionAfterChangeHook; afterDelete: CollectionAfterDeleteHook }
  slug?: string
  saveButton?: string
}): CollectionConfig {
  return {
    slug,
    labels: { singular: 'Imagen', plural: 'Imágenes' },
    access: { read: () => true },
    admin: {
      components: {
        // Adds "Volver al original" next to Save. The path has to exist in the site's
        // importMap: regenerate it after wiring this up, or /admin renders blank.
        edit: { SaveButton: saveButton },
      },
    },
    hooks: {
      beforeChange: [saveOriginalCopy],
      afterRead: [versionUrls],
      ...(revalidation
        ? { afterChange: [revalidation.afterChange], afterDelete: [revalidation.afterDelete] }
        : {}),
    },
    endpoints: [restoreOriginalEndpoint(slug)],
    fields: [
      {
        name: 'alt',
        label: 'Texto alternativo',
        type: 'text',
        required: true,
        admin: {
          description: `Describe brevemente la imagen (ej.: "${altExample}"). Ayuda al posicionamiento y a las personas con lectores de pantalla.`,
        },
      },
      {
        // Filled in by the hook on upload; the "Volver al original" button reads it.
        name: 'originalUrl',
        label: 'Copia sin recortar',
        type: 'text',
        admin: {
          position: 'sidebar',
          readOnly: true,
          description:
            'Se guarda sola al subir la imagen. Mientras exista, el botón "Volver al original" puede deshacer cualquier recorte.',
        },
      },
    ],
    upload: {
      // Lets the client mark which part of the photo must survive cropping.
      focalPoint: true,
      // Reduced versions are generated on upload so phones never fetch the multi-megabyte
      // original.
      imageSizes: [
        { name: 'thumbnail', width: 400, height: undefined, position: 'centre' },
        { name: 'card', width: 900, height: undefined, position: 'centre' },
        { name: 'hero', width: 1920, height: undefined, position: 'centre' },
      ],
      formatOptions: { format: 'webp', options: { quality: 82 } },
      mimeTypes: ['image/*'],
    },
  }
}
