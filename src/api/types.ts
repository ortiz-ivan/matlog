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

/** Datos de la academia: solo los asigna un admin. */
export interface DatosAcademia {
  cinturon: Cinturon | null
  /** Stripes: 0-4, hasta 6 en el negro. */
  grado: number
  fecha_ingreso: string | null
}

/** Lo que cualquier usuario ve de los demás (sin username ni email). */
export interface Companero extends UsuarioResumen, DatosAcademia {}

export interface Usuario extends Companero {
  username: string
  email: string
  es_admin: boolean
  activo: boolean
}

export interface UsuarioCrear {
  nombre: string
  username: string
  email: string
  password: string
}

export interface Registro extends UsuarioCrear {
  codigo_invitacion: string
}

/** Alta hecha por un admin. */
export interface UsuarioNuevo extends UsuarioCrear, DatosAcademia {
  es_admin: boolean
}

/** Cambios de un admin sobre un usuario (solo se envían los que cambian). */
export interface UsuarioActualizar extends Partial<DatosAcademia> {
  nombre?: string
  password?: string
  es_admin?: boolean
  activo?: boolean
}

export interface TurnoResumen {
  id: number
  nombre: string
}

/** Un día de la semana con clase en un turno. dia: 0 = lunes ... 6 = domingo. */
export interface TurnoDia {
  dia: number
  modalidad: Modalidad
}

export interface Turno extends TurnoResumen {
  hora_inicio: string
  hora_fin: string
  activo: boolean
  dias: TurnoDia[]
}

export interface TurnoIn {
  nombre: string
  hora_inicio: string
  hora_fin: string
  dias: TurnoDia[]
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

/** Lo que cada usuario puede cambiar de sí mismo. */
export interface PerfilActualizar {
  nombre?: string
}
