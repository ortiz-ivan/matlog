// Espejo de los esquemas de matlog-api (app/schemas.py).

export type Cinturon = 'BLANCO' | 'AZUL' | 'MORADO' | 'MARRON' | 'NEGRO'
export type Modalidad = 'GI' | 'NO_GI'
export type Categoria =
  | 'GUARDIA'
  | 'PASAJE'
  | 'BARRIDA'
  | 'FINALIZACION'
  | 'ESCAPE'
  | 'DERRIBO'
  | 'TRANSICION'
  | 'CONTROL'
  | 'OTRA'
export type Posicion =
  | 'GUARDIA_CERRADA'
  | 'GUARDIA_ABIERTA'
  | 'MEDIA_GUARDIA'
  | 'CONTROL_LATERAL'
  | 'MONTADA'
  | 'ESPALDA'
  | 'NORTE_SUR'
  | 'TORTUGA'
  | 'DE_PIE'
  | 'OTRA'

export interface Pagina<T> {
  items: T[]
  total: number
}

export interface Token {
  access_token: string
  token_type: string
}

export interface UsuarioResumen {
  id: number
  nombre: string
}

export interface Usuario extends UsuarioResumen {
  username: string
  email: string
  cinturon: Cinturon | null
  es_admin: boolean
  activo: boolean
}

export interface Registro {
  nombre: string
  username: string
  email: string
  password: string
  cinturon: Cinturon | null
  codigo_invitacion: string
}

export interface TurnoResumen {
  id: number
  nombre: string
}

export interface Turno extends TurnoResumen {
  hora_inicio: string
  hora_fin: string
  activo: boolean
}

export interface TecnicaResumen {
  id: number
  nombre: string
  categoria: Categoria
  posicion: Posicion
}

export interface Tecnica extends TecnicaResumen {
  descripcion: string | null
  video_url: string | null
}

export interface TecnicaIn {
  nombre: string
  categoria: Categoria
  posicion: Posicion
  descripcion?: string | null
  video_url?: string | null
}

export interface ClaseResumen {
  id: number
  fecha: string
  hora_inicio: string
  hora_fin: string
  modalidad: Modalidad
  tema: string
  instructor: string | null
  turno: TurnoResumen
}

export interface Clase extends ClaseResumen {
  creado_por: UsuarioResumen
  notas: string | null
  video_url: string | null
  tecnicas: TecnicaResumen[]
}

export interface TecnicaDetalle extends Tecnica {
  clases: ClaseResumen[]
}

export interface ClaseIn {
  fecha: string
  turno_id: number
  modalidad: Modalidad
  tema: string
  instructor: string | null
  notas: string | null
  video_url: string | null
  tecnica_ids: number[]
}

export interface FiltrosClases {
  desde?: string
  hasta?: string
  turno_id?: number
  modalidad?: Modalidad
  tecnica_id?: number
}
