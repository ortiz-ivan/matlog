import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/**
 * Content-Security-Policy como <meta> en el index.html de producción.
 *
 * El token está en localStorage: la CSP es la defensa que impide que un script
 * inyectado se ejecute y lo robe. Solo se aplica al compilar porque el servidor de
 * desarrollo de Vite necesita scripts inline para el HMR.
 *
 * Las directivas que no funcionan en <meta> (frame-ancestors) van como cabeceras en
 * el servidor que publique la app: ver README.
 */
function csp(apiUrl: string | undefined): Plugin {
  if (!apiUrl) {
    throw new Error(
      'Falta VITE_API_URL: en local va en .env (ver .env.example); en Cloudflare, en las ' +
        'variables del build (Settings → Build → Variables and secrets), no en las del Worker',
    )
  }
  const politica = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com",
    'font-src https://fonts.gstatic.com',
    "img-src 'self'",
    `connect-src ${new URL(apiUrl).origin}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
  ].join('; ')

  return {
    name: 'matlog-csp',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: politica },
        // Antes que cualquier script o estilo, o no los cubriría.
        injectTo: 'head-prepend',
      },
    ],
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Prefijo '' para leer también las variables que no llegan al navegador (DEV_PORT).
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.DEV_PORT) || 5180

  return {
    plugins: [react(), tailwindcss(), csp(env.VITE_API_URL)],
    // strictPort: si el puerto está ocupado, fallar en vez de saltar a otro que
    // no esté en CORS_ORIGINS del backend.
    server: { port, strictPort: true },
    preview: { port, strictPort: true },
  }
})
