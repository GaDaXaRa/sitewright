import React from 'react'
import Link from 'next/link'

/**
 * El enlace a la guía en el menú del panel.
 *
 * Una guía que hay que saber que existe no la lee nadie: va donde se mira todos los días,
 * debajo de las colecciones.
 */
export default function GuiaLink() {
  return (
    <div style={{ marginTop: 'var(--base)' }}>
      <Link href="/admin/guia" className="nav__link">
        Cómo se maneja esto
      </Link>
    </div>
  )
}
