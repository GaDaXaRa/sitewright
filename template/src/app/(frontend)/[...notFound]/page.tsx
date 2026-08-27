import { notFound } from 'next/navigation'

// Captura cualquier URL que no coincida con una ruta real y muestra el 404 propio
// (src/app/(frontend)/not-found.tsx). Al vivir dentro del grupo (frontend), hereda su
// layout: idioma "es" y tipografías. Las rutas del panel y la API son más específicas,
// así que tienen prioridad y no se ven afectadas.
export default function CatchAllNotFound() {
  notFound()
}
