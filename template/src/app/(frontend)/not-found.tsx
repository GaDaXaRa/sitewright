import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import './styles.css'

// Next already marks 404 pages as noindex; only the title is set here.
export const metadata: Metadata = {
  title: 'Página no encontrada',
}

export default function NotFound() {
  return (
    <section className="notfound">
      <div className="container">
        <span className="kicker">Error 404</span>
        <h1>Aquí no hay nada</h1>
        <p>
          El enlace puede estar mal escrito, o la página ya no existe. Prueba con las fechas o
          con las sesiones.
        </p>
        <div className="notfound-actions">
          <Link href="/" className="btn btn-primary">
            Volver al inicio
          </Link>
          <Link href="/eventos" className="btn btn-ghost">
            Ver fechas
          </Link>
        </div>
      </div>
    </section>
  )
}
