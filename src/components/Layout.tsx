import { useState, type ComponentType } from 'react'
import { Link, Outlet, useLocation } from 'react-router'

import { useAuth } from '../auth/context'
import { Logo } from './Logo'
import { MenuUsuario } from './MenuUsuario'

const NUEVA_CLASE = '/clases/nueva'

const bajo = (raiz: string) => (ruta: string) => ruta === raiz || ruta.startsWith(`${raiz}/`)

/** Secciones de la app, iguales en móvil (barra inferior) y escritorio (cabecera). */
const SECCIONES: { a: string; texto: string; icono: ComponentType; activa: (r: string) => boolean }[] = [
  { a: '/', texto: 'Inicio', icono: IconoCasa, activa: (r) => r === '/' },
  { a: '/calendario', texto: 'Calendario', icono: IconoCalendario, activa: bajo('/calendario') },
  { a: '/clases', texto: 'Historial', icono: IconoLista, activa: (r) => r !== NUEVA_CLASE && bajo('/clases')(r) },
  { a: '/tecnicas', texto: 'Técnicas', icono: IconoLibro, activa: bajo('/tecnicas') },
]

/** Pantallas cuya URL (filtros, mes…) se recuerda al volver desde la navegación. */
const RECORDADAS = new Set(['/calendario', '/clases', '/tecnicas'])

const CONTENEDOR = 'mx-auto w-full max-w-2xl px-4 md:max-w-3xl'

export function Layout() {
  const { pathname, search } = useLocation()
  // Registrar clases es solo de admins (el backend también lo exige).
  const puedeRegistrar = useAuth().usuario?.es_admin ?? false

  // Última URL de cada sección (con sus filtros): la navegación lleva ahí, no a una
  // pantalla limpia. Se actualiza durante el render, sin efecto ni render extra.
  const [ultimas, setUltimas] = useState<Record<string, string>>({})
  if (RECORDADAS.has(pathname) && ultimas[pathname] !== pathname + search) {
    setUltimas({ ...ultimas, [pathname]: pathname + search })
  }
  const destino = (a: string) => ultimas[a] ?? a

  // Móvil: el botón "+" (solo admins) va en el centro, con dos secciones a cada lado.
  const izquierda = SECCIONES.slice(0, 2)
  const derecha = SECCIONES.slice(2)

  return (
    <div className="min-h-dvh pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-12">
      <header className="sticky top-0 z-30 border-b border-borde bg-fondo/90 backdrop-blur">
        <div className={`${CONTENEDOR} flex h-14 items-center justify-between gap-6 md:h-16`}>
          <Link to="/" aria-label="Inicio">
            <Logo />
          </Link>

          {/* Escritorio: la navegación sube a la cabecera. */}
          <nav aria-label="Principal" className="hidden flex-1 items-center gap-1 md:flex">
            {SECCIONES.map(({ a, texto, activa }) => {
              const esActiva = activa(pathname)
              return (
                <Link
                  key={a}
                  to={destino(a)}
                  aria-current={esActiva ? 'page' : undefined}
                  className={`relative flex h-16 items-center px-3 font-semibold ${
                    esActiva ? 'text-acento' : 'text-texto-suave hover:text-texto'
                  }`}
                >
                  {texto}
                  {esActiva && (
                    <span aria-hidden className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-acento" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            {puedeRegistrar && (
              <Link
                to={NUEVA_CLASE}
                aria-current={pathname === NUEVA_CLASE ? 'page' : undefined}
                className="hidden min-h-10 items-center gap-1.5 rounded-xl bg-acento px-4 text-sm font-bold text-black hover:bg-acento-hover md:inline-flex"
              >
                <span aria-hidden className="text-lg leading-none">+</span> Nueva clase
              </Link>
            )}
            <MenuUsuario />
          </div>
        </div>
      </header>

      <main className={`${CONTENEDOR} py-6 md:py-10`}>
        <Outlet />
      </main>

      {/* Móvil: barra inferior con las secciones y la acción principal en el centro. */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-borde bg-fondo/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul
          className={`mx-auto grid max-w-2xl items-end ${puedeRegistrar ? 'grid-cols-5' : 'grid-cols-4'}`}
        >
          {izquierda.map((s) => (
            <li key={s.a}>
              <PestanaSeccion {...s} a={destino(s.a)} activa={s.activa(pathname)} />
            </li>
          ))}
          {puedeRegistrar && (
            <li className="flex justify-center">
              <BotonNuevaClase actual={pathname === NUEVA_CLASE} />
            </li>
          )}
          {derecha.map((s) => (
            <li key={s.a}>
              <PestanaSeccion {...s} a={destino(s.a)} activa={s.activa(pathname)} />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

function PestanaSeccion({
  a,
  texto,
  icono: Icono,
  activa,
}: {
  a: string
  texto: string
  icono: ComponentType
  activa: boolean
}) {
  return (
    <Link
      to={a}
      aria-current={activa ? 'page' : undefined}
      className={`relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${
        activa ? 'text-acento' : 'text-texto-suave hover:text-texto'
      }`}
    >
      {activa && <span aria-hidden className="absolute inset-x-8 top-0 h-0.5 rounded-full bg-acento" />}
      <Icono />
      {texto}
    </Link>
  )
}

/** Acción principal de la app: siempre visible, destacada sobre la barra. */
function BotonNuevaClase({ actual }: { actual: boolean }) {
  return (
    <Link
      to={NUEVA_CLASE}
      aria-current={actual ? 'page' : undefined}
      className="group flex h-20 flex-col items-center justify-end gap-1 pb-2 text-xs font-semibold text-texto-suave"
    >
      <span
        className={`-mt-6 grid size-14 place-items-center rounded-full bg-acento text-black shadow-lg shadow-acento/20 ring-4 ring-fondo transition-transform group-hover:bg-acento-hover group-active:scale-95 ${
          actual ? 'outline-2 outline-offset-2 outline-acento' : ''
        }`}
      >
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={2.75}>
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </span>
      <span className={actual ? 'text-acento' : 'group-hover:text-texto'}>Nueva clase</span>
    </Link>
  )
}

function IconoCalendario() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  )
}

function IconoLista() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" strokeLinecap="round" />
    </svg>
  )
}

function IconoCasa() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2}>
      <path
        d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconoLibro() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2}>
      <path
        d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2.5ZM4 19.5A2 2 0 0 0 6 21h13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
