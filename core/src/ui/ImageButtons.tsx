'use client'

import React, { useState } from 'react'
import { SaveButton, useDocumentInfo, toast } from '@payloadcms/ui'

/**
 * Replaces the save button on images with itself plus "Volver al original".
 *
 * Restoring is a separate action, not something that happens on save: it calls its own
 * endpoint (`POST /api/media/:id/restore-original`) and reloads. The earlier attempt used
 * a checkbox and a hook, and it hung the panel.
 */
export const ImageButtons: React.FC = () => {
  const { id } = useDocumentInfo()
  const [restoring, setRestoring] = useState(false)

  async function restore() {
    const confirmed = window.confirm(
      '¿Volver a la imagen original?\n\n' +
        'Se deshacen todos los recortes y la foto vuelve a como la subiste. ' +
        'Esto no se puede deshacer.',
    )
    if (!confirmed) return

    setRestoring(true)
    try {
      const res = await fetch(`/api/media/${id}/restore-original`, {
        method: 'post',
        credentials: 'include',
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(body?.error ?? 'No se pudo recuperar la imagen original.')
        return
      }

      toast.success('Imagen restaurada. Recargando…')
      // A full reload is the only thing that guarantees the preview and the thumbnails are
      // rebuilt from the new file.
      window.location.reload()
    } catch {
      toast.error('No se pudo conectar para recuperar la imagen original.')
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 'var(--base, 8px)', alignItems: 'center' }}>
      {/* Only meaningful on an image that has already been saved. */}
      {id ? (
        <button
          type="button"
          className="btn btn--style-secondary btn--size-medium"
          onClick={restore}
          disabled={restoring}
          title="Deshace los recortes y recupera la foto tal como la subiste"
        >
          {restoring ? 'Restaurando…' : 'Volver al original'}
        </button>
      ) : null}
      <SaveButton />
    </div>
  )
}
