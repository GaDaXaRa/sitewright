import { defineConfig } from '../template/node_modules/vite/dist/node/index.js'
import react from '../template/node_modules/@vitejs/plugin-react/dist/index.mjs'
import { fileURLToPath } from 'node:url'
const path = (relative) => fileURLToPath(new URL(relative, import.meta.url))
export default defineConfig({
  root: path('./'),
  plugins: [react()],
  cacheDir: path('./node_modules/.vite'),
  define: {
    'process.env': JSON.stringify({ NODE_ENV: 'development', __NEXT_ROUTER_BASEPATH: '' }),
  },
  resolve: {
    alias: {
      '@': path('../template/src'),
      react: path('../template/node_modules/react'),
      'react-dom': path('../template/node_modules/react-dom'),
      next: path('../template/node_modules/next'),
      'sitewright-core': path('../core/dist/index.mjs'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: { host: '127.0.0.1', port: 4173, strictPort: true, fs: { allow: [path('../')] } },
})
