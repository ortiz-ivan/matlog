import { Link, NavLink, Outlet } from 'react-router'

import { useAuth } from '../auth/context'
import { Logo } from './Logo'

const NAV = [
  { a: '/clases', texto: 'Clases', icono: IconoLista, end: true },
  { a: '/clases/nueva', texto: 'Nueva clase', icono: IconoMas, end: false },
]

export function Layout() {
  const { usuario, logout } = useAuth()

  return (
    <div className="min-h-dvh pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 border-b border-borde bg-fondo/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link to="/clases" aria-label="Inicio">
            <Logo />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="max-w-32 truncate text-texto-suave">{usuario?.nombre}</span>
            <button
              type="button"
              onClick={logout}
              className="min-h-10 font-semibold text-texto-suave hover:text-texto"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <Outlet />
      </main>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-borde bg-fondo/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto grid max-w-2xl grid-cols-2">
          {NAV.map(({ a, texto, icono: Icono, end }) => (
            <li key={a}>
              <NavLink
                to={a}
                end={end}
                className={({ isActive }) =>
                  `flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${
                    isActive ? 'text-acento' : 'text-texto-suave hover:text-texto'
                  }`
                }
              >
                <Icono />
                {texto}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

function IconoLista() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" strokeLinecap="round" />
    </svg>
  )
}

function IconoMas() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  )
}
