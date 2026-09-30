import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Prefijo '' para leer también las variables que no llegan al navegador (DEV_PORT).
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.DEV_PORT) || 5180

  return {
    plugins: [react(), tailwindcss()],
    // strictPort: si el puerto está ocupado, fallar en vez de saltar a otro que
    // no esté en CORS_ORIGINS del backend.
    server: { port, strictPort: true },
    preview: { port, strictPort: true },
  }
})
