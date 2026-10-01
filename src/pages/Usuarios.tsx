import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import { useUsuarios } from '../api/queries'
import { useAuth } from '../auth/context'
import { Paginacion } from '../components/Paginacion'
import { Cargando, Etiqueta, Input, MensajeError, Titulo } from '../components/ui'
import { CINTURONES, iniciales } from '../lib/formato'
import { conFiltro, rango, usePaginaURL } from '../lib/paginacion'

const ESPERA_BUSQUEDA_MS = 300

/** /usuarios — solo admins. */
export function Usuarios() {
  const { usuario: yo } = useAuth()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const pagina = usePaginaURL()
  const usuarios = useUsuarios(q, pagina)

  // El texto se escribe en local y pasa a la URL (y al servidor) al dejar de teclear.
  const [texto, setTexto] = useState(q)
  // Si la búsqueda cambia desde fuera (atrás/adelante), el campo la sigue.
  const [qPrevia, setQPrevia] = useState(q)
  if (q !== qPrevia) {
    setQPrevia(q)
    if (q !== texto.trim()) setTexto(q)
  }
  useEffect(() => {
    if (texto.trim() === q) return
    const espera = setTimeout(() => {
      setParams((actual) => conFiltro(actual, 'q', texto.trim() || null), {
        replace: true,
        preventScrollReset: true,
      })
    }, ESPERA_BUSQUEDA_MS)
    return () => clearTimeout(espera)
  }, [texto, q, setParams])

  const total = usuarios.data?.total
  const { desde, hasta } = rango(pagina, total ?? 0)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <Titulo>Usuarios</Titulo>
        <Link
          to="/usuarios/nuevo"
          className="inline-flex min-h-10 items-center rounded-xl border border-acento px-4 text-sm font-bold text-acento hover:bg-acento hover:text-black"
        >
          + Nuevo
        </Link>
      </div>

      <div className="space-y-2">
        <Input
          type="search"
          placeholder="Buscar por nombre o usuario"
          maxLength={100}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        {total !== undefined && total > 0 && (
          <p className="text-sm text-texto-suave">
            {desde}–{hasta} de {total}
          </p>
        )}
      </div>

      <MensajeError error={usuarios.error} onReintentar={() => void usuarios.refetch()} />

      {usuarios.isPending ? (
        <Cargando texto="Cargando usuarios…" />
      ) : usuarios.data?.items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-borde-fuerte px-6 py-12 text-center text-texto-suave">
          {q ? `Nadie coincide con «${q}».` : 'No hay usuarios.'}
        </p>
      ) : (
        <ul
          className={`divide-y divide-borde overflow-hidden rounded-2xl border border-borde transition-opacity ${
            usuarios.isPlaceholderData ? 'opacity-50' : ''
          }`}
          aria-busy={usuarios.isPlaceholderData}
        >
          {usuarios.data?.items.map((u) => (
            <li key={u.id}>
              <Link
                to={`/usuarios/${u.id}`}
                className="flex items-center gap-4 bg-superficie px-4 py-3 hover:bg-superficie-alta"
              >
                <span
                  aria-hidden
                  className={`grid size-10 shrink-0 place-items-center rounded-full border font-display text-sm font-bold ${
                    u.activo ? 'border-borde-fuerte bg-superficie-alta' : 'border-borde text-texto-suave'
                  }`}
                >
                  {iniciales(u.nombre)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate font-semibold ${u.activo ? '' : 'text-texto-suave line-through'}`}>
                    {u.nombre}
                    {u.id === yo?.id && <span className="font-normal text-texto-suave"> (tú)</span>}
                  </span>
                  <span className="block truncate text-sm text-texto-suave">@{u.username}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  {u.es_admin && <Etiqueta acento>Admin</Etiqueta>}
                  {!u.activo && <Etiqueta>Inactivo</Etiqueta>}
                  {u.cinturon && (
                    <span className="text-xs text-texto-suave">{CINTURONES[u.cinturon]}</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {total !== undefined && <Paginacion pagina={pagina} total={total} />}
    </div>
  )
}
