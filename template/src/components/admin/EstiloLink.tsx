import React from 'react'
import Link from 'next/link'

/** El enlace al probador de estilos, en el menú del panel junto a la guía. */
export default function EstiloLink() {
  return (
    <div style={{ marginTop: 'var(--base)' }}>
      <Link href="/admin/estilo" className="nav__link">
        Estilo de la web
      </Link>
    </div>
  )
}
