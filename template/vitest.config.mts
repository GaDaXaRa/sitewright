import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Las de la web, y las que viajan dentro de cada módulo. Un módulo se copia al sitio y
    // es suyo para editarlo, así que sus pruebas se copian con él: quien toque
    // `schedule/Row.tsx` en su web se entera aquí de lo que ha roto, sin volver a la fábrica.
    include: ['tests/int/**/*.int.spec.ts', 'src/modules/**/*.spec.ts'],
  },
})
