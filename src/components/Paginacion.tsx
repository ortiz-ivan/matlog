import type { ReactNode } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router'

import { POR_PAGINA, totalPaginas } from '../lib/paginacion'

interface Props {
  pagina: number
  total: number
  porPagina?: number
}

/**
 * ‹ Anterior · Página 2 de 5 · Siguiente ›
 *
 * Son enlaces (?pagina=N, conservando los filtros): cada página es una entrada del
 * historial, así que "atrás" vuelve a la anterior y ScrollRestoration sube al
 * principio al cambiar. Si la página pedida ya no existe, lleva a la última.
 */
export function Paginacion({ pagina, total, porPagina = POR_PAGINA }: Props) {
  const [params] = useSearchParams()
  const { pathname } = useLocation()
  const ultima = totalPaginas(total, porPagina)

  function aPagina(n: number) {
    const nuevos = new URLSearchParams(params)
    if (n <= 1) nuevos.delete('pagina')
    else nuevos.set('pagina', String(n))
    const qs = nuevos.toString()
    return { pathname, search: qs ? `?${qs}` : '' }
  }

  if (pagina > ultima) return <Navigate to={aPagina(ultima)} replace />
  if (ultima <= 1) return null

  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-3">
      <Boton a={aPagina(pagina - 1)} deshabilitado={pagina <= 1} etiqueta="Página anterior">
        <span aria-hidden>‹</span> Anterior
      </Boton>
      <p className="text-sm text-texto-suave" aria-live="polite">
        Página <span className="font-bold text-texto">{pagina}</span> de {ultima}
      </p>
      <Boton a={aPagina(pagina + 1)} deshabilitado={pagina >= ultima} etiqueta="Página siguiente">
        Siguiente <span aria-hidden>›</span>
      </Boton>
    </nav>
  )
}

function Boton({
  a,
  deshabilitado,
  etiqueta,
  children,
}: {
  a: { pathname: string; search: string }
  deshabilitado: boolean
  etiqueta: string
  children: ReactNode
}) {
  const clases =
    'inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold transition-colors'
  if (deshabilitado) {
    return (
      <span aria-disabled className={`${clases} border-borde text-texto-suave/40`}>
        {children}
      </span>
    )
  }
  return (
    <Link
      to={a}
      aria-label={etiqueta}
      className={`${clases} border-borde-fuerte text-texto hover:border-acento hover:text-acento`}
    >
      {children}
    </Link>
  )
}
