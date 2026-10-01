import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { POR_PAGINA } from '../lib/paginacion'
import { api } from './client'
import type {
  Clase,
  ClaseIn,
  FiltrosClases,
  Pagina,
  PerfilActualizar,
  Tecnica,
  TecnicaIn,
  Turno,
  TurnoIn,
  Usuario,
  UsuarioActualizar,
  UsuarioNuevo,
} from './types'

export const claves = {
  turnos: ['turnos'] as const,
  todosLosTurnos: ['turnos', 'todos'] as const,
  turno: (id: number) => ['turnos', 'detalle', id] as const,
  clasesRango: (desde: string, hasta: string) => ['clases', 'rango', desde, hasta] as const,
  tecnicas: ['tecnicas'] as const,
  tecnica: (id: number) => ['tecnicas', 'detalle', id] as const,
  clases: ['clases'] as const,
  listaClases: (filtros: FiltrosClases, pagina: number) => ['clases', 'lista', filtros, pagina] as const,
  clase: (id: number) => ['clases', 'detalle', id] as const,
  usuarios: ['usuarios'] as const,
  listaUsuarios: (q: string, pagina: number) => ['usuarios', 'lista', q, pagina] as const,
  usuario: (id: number) => ['usuarios', 'detalle', id] as const,
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

export function useTecnica(id: number) {
  return useQuery({
    queryKey: claves.tecnica(id),
    queryFn: () => api<Tecnica>(`/api/tecnicas/${id}`),
  })
}

/** Sin id crea; con id actualiza. */
export function useGuardarTecnica(id?: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (datos: TecnicaIn) =>
      id === undefined
        ? api<Tecnica>('/api/tecnicas', { method: 'POST', json: datos })
        : api<Tecnica>(`/api/tecnicas/${id}`, { method: 'PUT', json: datos }),
    onSuccess: async () => {
      // claves.tecnicas es prefijo del detalle, así que también lo refresca.
      await qc.invalidateQueries({ queryKey: claves.tecnicas })
      // Las clases muestran nombre y categoría de sus técnicas.
      if (id !== undefined) await qc.invalidateQueries({ queryKey: claves.clases })
    },
  })
}

export function useEliminarTecnica() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<void>(`/api/tecnicas/${id}`, { method: 'DELETE' }),
    onSuccess: async (_, id) => {
      qc.removeQueries({ queryKey: claves.tecnica(id) })
      // exact: solo la lista; el detalle borrado no debe volver a pedirse (daría 404).
      await qc.invalidateQueries({ queryKey: claves.tecnicas, exact: true })
      await qc.invalidateQueries({ queryKey: claves.clases })
    },
  })
}

// --- Clases ---

/** Una página de clases (paginación en el servidor). */
export function useClases(filtros: FiltrosClases, pagina = 1) {
  return useQuery({
    queryKey: claves.listaClases(filtros, pagina),
    queryFn: () =>
      api<Pagina<Clase>>(
        `/api/clases${queryString({ ...filtros, limit: POR_PAGINA, offset: (pagina - 1) * POR_PAGINA })}`,
      ),
    // Al cambiar de página se sigue viendo la anterior hasta que llega la nueva,
    // en lugar de un parpadeo de "Cargando…".
    placeholderData: keepPreviousData,
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

// --- Usuarios (solo admins) ---

export function useUsuarios(q: string, pagina = 1) {
  return useQuery({
    queryKey: claves.listaUsuarios(q, pagina),
    queryFn: () =>
      api<Pagina<Usuario>>(
        `/api/usuarios${queryString({ q, limit: POR_PAGINA, offset: (pagina - 1) * POR_PAGINA })}`,
      ),
    placeholderData: keepPreviousData,
  })
}

export function useUsuario(id: number) {
  return useQuery({
    queryKey: claves.usuario(id),
    queryFn: () => api<Usuario>(`/api/usuarios/${id}`),
  })
}

export function useCrearUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (datos: UsuarioNuevo) => api<Usuario>('/api/usuarios', { method: 'POST', json: datos }),
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.usuarios }),
  })
}

export function useActualizarUsuario(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cambios: UsuarioActualizar) =>
      api<Usuario>(`/api/usuarios/${id}`, { method: 'PATCH', json: cambios }),
    onSuccess: async (usuario) => {
      qc.setQueryData(claves.usuario(id), usuario)
      await qc.invalidateQueries({ queryKey: claves.usuarios })
      // Si el admin se edita a sí mismo, refrescar también su sesión (nombre, cinturón…).
      await qc.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

// --- Mi perfil ---

export function useActualizarPerfil() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cambios: PerfilActualizar) =>
      api<Usuario>('/api/auth/me', { method: 'PATCH', json: cambios }),
    // La sesión (cabecera, menú) se actualiza al momento sin volver a pedirla.
    onSuccess: (usuario) => qc.setQueriesData({ queryKey: ['me'] }, usuario),
  })
}

export function useCambiarPassword() {
  return useMutation({
    mutationFn: (datos: { actual: string; nueva: string }) =>
      api<void>('/api/auth/me/password', { method: 'PUT', json: datos }),
  })
}

// --- Turnos (gestión: solo admins) ---

/** Incluye los desactivados: para la pantalla de gestión. */
export function useTodosLosTurnos() {
  return useQuery({
    queryKey: claves.todosLosTurnos,
    queryFn: () => api<Turno[]>('/api/turnos?incluir_inactivos=true'),
  })
}

export function useTurno(id: number) {
  return useQuery({
    queryKey: claves.turno(id),
    queryFn: () => api<Turno>(`/api/turnos/${id}`),
  })
}

/** Sin id crea; con id actualiza (y reactiva). */
export function useGuardarTurno(id?: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (datos: TurnoIn) =>
      id === undefined
        ? api<Turno>('/api/turnos', { method: 'POST', json: datos })
        : api<Turno>(`/api/turnos/${id}`, { method: 'PUT', json: datos }),
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.turnos }),
  })
}

export function useDesactivarTurno() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<void>(`/api/turnos/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: claves.turnos }),
  })
}

// --- Calendario ---

const MAX_LIMIT = 100

/** Todas las clases entre dos fechas (un mes cabe en una o dos peticiones). */
export function useClasesRango(desde: string, hasta: string) {
  return useQuery({
    queryKey: claves.clasesRango(desde, hasta),
    queryFn: async () => {
      const clases: Clase[] = []
      for (let offset = 0; ; offset += MAX_LIMIT) {
        const pagina = await api<Pagina<Clase>>(
          `/api/clases${queryString({ desde, hasta, limit: MAX_LIMIT, offset })}`,
        )
        clases.push(...pagina.items)
        if (clases.length >= pagina.total || pagina.items.length === 0) return clases
      }
    },
    placeholderData: keepPreviousData,
  })
}
