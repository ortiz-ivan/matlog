import { useSearchParams } from 'react-router'

export const POR_PAGINA = 20

/** Página actual según ?pagina= (1 si falta o no es válida). */
export function usePaginaURL(): number {
  const [params] = useSearchParams()
  const pagina = Number(params.get('pagina'))
  return Number.isInteger(pagina) && pagina > 1 ? pagina : 1
}

export function totalPaginas(total: number, porPagina = POR_PAGINA): number {
  return Math.max(1, Math.ceil(total / porPagina))
}

/** Rango "21–40 de 87" de la página actual. */
export function rango(pagina: number, total: number, porPagina = POR_PAGINA) {
  const desde = total === 0 ? 0 : (pagina - 1) * porPagina + 1
  return { desde, hasta: Math.min(pagina * porPagina, total), total }
}

/**
 * Copia de los parámetros con un cambio aplicado. Cualquier cambio de filtro
 * vuelve a la página 1, porque la página actual puede dejar de existir.
 */
export function conFiltro(actual: URLSearchParams, clave: string, valor: string | null) {
  const nuevos = new URLSearchParams(actual)
  if (valor) nuevos.set(clave, valor)
  else nuevos.delete(clave)
  nuevos.delete('pagina')
  return nuevos
}
