import type { ReactNode } from 'react'
import { Navigate, Outlet, createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import { useAuth } from './auth/context'
import { Layout } from './components/Layout'
import { Logo } from './components/Logo'
import { Cargando, MensajeError } from './components/ui'
import { Login, Registro } from './pages/Acceso'
import { ClaseDetalle } from './pages/ClaseDetalle'
import { ClaseFormulario } from './pages/ClaseFormulario'
import { Clases } from './pages/Clases'

/** Rutas que requieren sesión. */
function ConSesion() {
  const { usuario, cargando, error, reintentar } = useAuth()

  if (cargando) return <Arranque />
  if (error) {
    return (
      <Arranque>
        <MensajeError error={error} onReintentar={reintentar} />
      </Arranque>
    )
  }
  if (!usuario) return <Navigate to="/login" replace />
  return <Outlet />
}

/** Login y registro: si ya hay sesión, a la app. */
function SinSesion() {
  const { usuario, cargando } = useAuth()
  if (cargando) return <Arranque />
  if (usuario) return <Navigate to="/clases" replace />
  return <Outlet />
}

function Arranque({ children }: { children?: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-6 px-4">
      <Logo className="text-5xl" />
      {children ?? <Cargando texto="" />}
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <SinSesion />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/registro', element: <Registro /> },
    ],
  },
  {
    element: <ConSesion />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/clases', element: <Clases /> },
          { path: '/clases/nueva', element: <ClaseFormulario /> },
          { path: '/clases/:id', element: <ClaseDetalle /> },
          { path: '/clases/:id/editar', element: <ClaseFormulario /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/clases" replace /> },
])

export function App() {
  return <RouterProvider router={router} />
}
