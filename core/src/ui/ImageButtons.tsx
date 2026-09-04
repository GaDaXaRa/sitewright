'use client'

import React, { useState } from 'react'
import { SaveButton, useDocumentInfo, toast } from '@payloadcms/ui'

/**
 * Sustituye el botón de guardar de las imágenes por él mismo más las ediciones.
 *
 * Cada una es una acción aparte, no algo que pase al guardar: llama a su endpoint y
 * recarga. El intento anterior lo hacía con una casilla y un hook, y colgaba el panel.
 *
 * Todas son seguras porque la copia original se guarda al subir, y «Volver al original»
 * deshace cualquiera de ellas.
 */
export const ImageButtons: React.FC = () => {
  const { id } = useDocumentInfo()
  const [restoring, setRestoring] = useState(false)
  const [working, setWorking] = useState<string | null>(null)

  /** Una edición: se aplica, se recarga, y si no se puede se dice por qué. */
  async function edit(op: 'invert' | 'backdrop', label: string) {
    setWorking(op)
    try {
      const res = await fetch(`/api/media/${id}/edit/${op}`, {
        method: 'post',
        credentials: 'include',
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(body?.error ?? `No se pudo ${label.toLowerCase()}.`)
        return
      }

      toast.success('Hecho. Recargando…')
      window.location.reload()
    } catch {
      toast.error('No se pudo conectar para editar la imagen.')
    } finally {
      setWorking(null)
    }
  }

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
      {/* Sólo tienen sentido sobre una imagen ya guardada. */}
      {id ? (
        <>
          <button
            type="button"
            className="btn btn--style-secondary btn--size-medium"
            onClick={() => edit('backdrop', 'quitar el fondo')}
            disabled={working !== null || restoring}
            title="Vuelve transparente el fondo liso. Sólo funciona si las cuatro esquinas son del mismo color"
          >
            {working === 'backdrop' ? 'Quitando…' : 'Quitar el fondo'}
          </button>
          <button
            type="button"
            className="btn btn--style-secondary btn--size-medium"
            onClick={() => edit('invert', 'invertir los colores')}
            disabled={working !== null || restoring}
            title="Lo oscuro se vuelve claro y al revés. Útil con logos de un solo color"
          >
            {working === 'invert' ? 'Invirtiendo…' : 'Invertir colores'}
          </button>
          <button
            type="button"
            className="btn btn--style-secondary btn--size-medium"
            onClick={restore}
            disabled={restoring || working !== null}
            title="Deshace todas las ediciones y recupera la imagen tal como la subiste"
          >
            {restoring ? 'Restaurando…' : 'Volver al original'}
          </button>
        </>
      ) : null}
      <SaveButton />
    </div>
  )
}
