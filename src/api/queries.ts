import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { api } from './client'
import type {
  Clase,
  ClaseIn,
  FiltrosClases,
  Pagina,
  Tecnica,
  TecnicaIn,
  Turno,
} from './types'

const POR_PAGINA = 20

export const claves = {
  turnos: ['turnos'] as const,
  tecnicas: ['tecnicas'] as const,
  clases: ['clases'] as const,
  listaClases: (filtros: FiltrosClases) => ['clases', 'lista', filtros] as const,
  clase: (id: number) => ['clases', 'detalle', id] as const,
}

function queryString(params: object): string {
  const qs = new URLSearchParams()
  for (const [clave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== '') qs.set(clave, String(valor))
  }
  const texto = qs.toString()
  return texto ? `?${texto}` : ''
}

// --- Turnos y técnicas (catálogos pequeños: se cargan completos) ---

export function useTurnos() {
  return useQuery({
    queryKey: claves.turnos,
    queryFn: () => api<Turno[]>('/api/turnos'),
    staleTime: 5 * 60_000,
  })
}

export function useTecnicas() {
  return useQuery({
    queryKey: claves.tecnicas,
    queryFn: () => api<Tecnica[]>('/api/tecnicas'),
    staleTime: 60_000,
  })
}

export function useCrearTecnica() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (datos: TecnicaIn) => api<Tecnica>('/api/tecnicas', { method: 'POST', json: datos }),
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.tecnicas }),
  })
}

// --- Clases ---

export function useClases(filtros: FiltrosClases) {
  return useInfiniteQuery({
    queryKey: claves.listaClases(filtros),
    queryFn: ({ pageParam }) =>
      api<Pagina<Clase>>(
        `/api/clases${queryString({ ...filtros, limit: POR_PAGINA, offset: pageParam })}`,
      ),
    initialPageParam: 0,
    getNextPageParam: (ultima, paginas) => {
      const cargadas = paginas.reduce((n, p) => n + p.items.length, 0)
      return cargadas < ultima.total ? cargadas : undefined
    },
  })
}

export function useClase(id: number) {
  return useQuery({
    queryKey: claves.clase(id),
    queryFn: () => api<Clase>(`/api/clases/${id}`),
  })
}

export function useGuardarClase(id?: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (datos: ClaseIn) =>
      id === undefined
        ? api<Clase>('/api/clases', { method: 'POST', json: datos })
        : api<Clase>(`/api/clases/${id}`, { method: 'PUT', json: datos }),
    onSuccess: (clase) => {
      qc.setQueryData(claves.clase(clase.id), clase)
      return qc.invalidateQueries({ queryKey: claves.clases })
    },
  })
}

export function useEliminarClase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<void>(`/api/clases/${id}`, { method: 'DELETE' }),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: claves.clase(id) })
      return qc.invalidateQueries({ queryKey: claves.clases })
    },
  })
}
