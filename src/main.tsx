import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { ApiError } from './api/client'
import { App } from './App'
import { AuthProvider } from './auth/AuthProvider'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reintentar no arregla un 4xx (permisos, no encontrado, validación).
      retry: (fallos, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) && fallos < 2,
      refetchOnWindowFocus: false,
      // Mantener en caché lo que no está en pantalla (por defecto 5 min): al volver a
      // un listado se pinta al instante y ScrollRestoration puede recuperar la posición.
      gcTime: 30 * 60_000,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
