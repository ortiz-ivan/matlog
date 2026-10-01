import { useCallback, useId, useRef, useState } from 'react'
import { Link } from 'react-router'

import { useAuth } from '../auth/context'
import { CINTURONES, iniciales } from '../lib/formato'
import { useCerrarAlSalir } from '../lib/useCerrarAlSalir'
import { Etiqueta } from './ui'

/** Avatar con iniciales en la cabecera; al tocarlo, datos de la cuenta y "Cerrar sesión". */
export function MenuUsuario() {
  const { usuario, logout } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const idMenu = useId()

  // Cerrar al tocar fuera o con Escape (devolviendo el foco al avatar).
  const cerrar = useCallback(() => setAbierto(false), [])
  useCerrarAlSalir(abierto, cerrar, contenedor, boton)

  if (!usuario) return null

  return (
    <div ref={contenedor} className="relative">
      <button
        ref={boton}
        type="button"
        aria-label={`Cuenta de ${usuario.nombre}`}
        aria-haspopup="true"
        aria-expanded={abierto}
        aria-controls={idMenu}
        onClick={() => setAbierto((a) => !a)}
        className={`grid size-10 place-items-center rounded-full border font-display text-sm font-bold transition-colors ${
          abierto
            ? 'border-acento bg-acento text-black'
            : 'border-borde-fuerte bg-superficie-alta text-texto hover:border-texto-suave'
        }`}
      >
        {iniciales(usuario.nombre)}
      </button>

      {abierto && (
        <div
          id={idMenu}
          className="absolute top-full right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-borde-fuerte bg-superficie shadow-2xl shadow-black"
        >
          <div className="space-y-2 border-b border-borde p-4">
            <p className="truncate font-bold">{usuario.nombre}</p>
            <p className="truncate text-sm text-texto-suave">@{usuario.username}</p>
            {(usuario.cinturon || usuario.es_admin) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {usuario.cinturon && <Etiqueta>Cinturón {CINTURONES[usuario.cinturon]}</Etiqueta>}
                {usuario.es_admin && <Etiqueta acento>Admin</Etiqueta>}
              </div>
            )}
          </div>
          <Link
            to="/perfil"
            onClick={() => setAbierto(false)}
            className="flex min-h-12 w-full items-center gap-3 border-b border-borde px-4 font-semibold hover:bg-superficie-alta"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
            </svg>
            Mi perfil
          </Link>
          {usuario.es_admin && (
            <Link
              to="/turnos"
              onClick={() => setAbierto(false)}
              className="flex min-h-12 w-full items-center gap-3 border-b border-borde px-4 font-semibold hover:bg-superficie-alta"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7.5V12l3 2" strokeLinecap="round" />
              </svg>
              Turnos y horario
            </Link>
          )}
          {usuario.es_admin && (
            <Link
              to="/usuarios"
              onClick={() => setAbierto(false)}
              className="flex min-h-12 w-full items-center gap-3 border-b border-borde px-4 font-semibold hover:bg-superficie-alta"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="9" cy="8" r="3.5" />
                <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" strokeLinecap="round" />
              </svg>
              Usuarios
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="flex min-h-12 w-full items-center px-4 text-left font-semibold text-peligro hover:bg-peligro/10"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
