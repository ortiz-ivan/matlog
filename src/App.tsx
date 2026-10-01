import type { ReactNode } from 'react'
import { Navigate, Outlet, ScrollRestoration, createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import { useAuth } from './auth/context'
import { Layout } from './components/Layout'
import { Logo } from './components/Logo'
import { Cargando, MensajeError } from './components/ui'
import { Login, Registro } from './pages/Acceso'
import { Calendario } from './pages/Calendario'
import { ClaseDetalle } from './pages/ClaseDetalle'
import { ClaseFormulario } from './pages/ClaseFormulario'
import { Clases } from './pages/Clases'
import { FichaTecnica } from './pages/FichaTecnica'
import { Inicio } from './pages/Inicio'
import { Perfil } from './pages/Perfil'
import { TecnicaFormulario } from './pages/TecnicaFormulario'
import { Tecnicas } from './pages/Tecnicas'
import { TurnoFormulario, Turnos } from './pages/Turnos'
import { UsuarioFormulario } from './pages/UsuarioFormulario'
import { Usuarios } from './pages/Usuarios'

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

/** Rutas de administración. El backend también lo exige: esto solo evita pantallas de error. */
function SoloAdmin() {
  const { usuario } = useAuth()
  if (!usuario?.es_admin) return <Navigate to="/" replace />
  return <Outlet />
}

/** Login y registro: si ya hay sesión, a la app. */
function SinSesion() {
  const { usuario, cargando } = useAuth()
  if (cargando) return <Arranque />
  if (usuario) return <Navigate to="/" replace />
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

/**
 * Raíz de todas las rutas. ScrollRestoration recuerda la posición de cada entrada
 * del historial: al volver atrás se recupera (p. ej. la tarjeta del listado en la
 * que estabas) y al navegar a una pantalla nueva se empieza arriba.
 */
function Raiz() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  )
}

const router = createBrowserRouter([
  {
    element: <Raiz />,
    children: [
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
              { path: '/', element: <Inicio /> },
              { path: '/clases', element: <Clases /> },
              { path: '/clases/:id', element: <ClaseDetalle /> },
              { path: '/clases/:id/editar', element: <ClaseFormulario /> },
              { path: '/tecnicas', element: <Tecnicas /> },
              { path: '/tecnicas/nueva', element: <TecnicaFormulario /> },
              { path: '/tecnicas/:id', element: <FichaTecnica /> },
              { path: '/tecnicas/:id/editar', element: <TecnicaFormulario /> },
              { path: '/calendario', element: <Calendario /> },
              { path: '/perfil', element: <Perfil /> },
              {
                element: <SoloAdmin />,
                children: [
                  { path: '/clases/nueva', element: <ClaseFormulario /> },
                  { path: '/turnos', element: <Turnos /> },
                  { path: '/turnos/nuevo', element: <TurnoFormulario /> },
                  { path: '/turnos/:id', element: <TurnoFormulario /> },
                  { path: '/usuarios', element: <Usuarios /> },
                  { path: '/usuarios/nuevo', element: <UsuarioFormulario /> },
                  { path: '/usuarios/:id', element: <UsuarioFormulario /> },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
