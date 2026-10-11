import type { Categoria, Cinturon, EstadoParticipacion, Medalla, Modalidad, Posicion, Turno } from '../api/types'

export const MODALIDADES: Record<Modalidad, string> = {
  GI: 'Gi',
  NO_GI: 'No-Gi',
}

/** Colores fijos por modalidad en toda la app: Gi verde, No-Gi blanco. */
export const COLOR_MODALIDAD: Record<Modalidad, { fondo: string; borde: string }> = {
  GI: { fondo: 'bg-acento', borde: 'border-acento' },
  NO_GI: { fondo: 'bg-texto', borde: 'border-texto' },
}

export const CATEGORIAS: Record<Categoria, string> = {
  GUARDIA: 'Guardia',
  PASAJE: 'Pasaje',
  BARRIDA: 'Barrida',
  FINALIZACION: 'Finalización',
  ESCAPE: 'Escape',
  DERRIBO: 'Derribo',
  TRANSICION: 'Transición',
  CONTROL: 'Control',
  OTRA: 'Otra',
}

export const POSICIONES: Record<Posicion, string> = {
  GUARDIA_CERRADA: 'Guardia cerrada',
  GUARDIA_ABIERTA: 'Guardia abierta',
  MEDIA_GUARDIA: 'Media guardia',
  CONTROL_LATERAL: 'Control lateral',
  MONTADA: 'Montada',
  ESPALDA: 'Espalda',
  NORTE_SUR: 'Norte-sur',
  TORTUGA: 'Tortuga',
  DE_PIE: 'De pie',
  OTRA: 'Otra',
}

export const CINTURONES: Record<Cinturon, string> = {
  BLANCO: 'Blanco',
  AZUL: 'Azul',
  MORADO: 'Morado',
  MARRON: 'Marrón',
  NEGRO: 'Negro',
}

export const MEDALLAS: Record<Medalla, string> = {
  ORO: 'Oro',
  PLATA: 'Plata',
  BRONCE: 'Bronce',
}

export const ESTADOS_PARTICIPACION: Record<EstadoParticipacion, string> = {
  PENDIENTE: 'Pendiente de revisión',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
}

/** Del más alto al más bajo, como se agrupan en Compañeros. */
export const CINTURONES_DESC = (Object.keys(CINTURONES) as Cinturon[]).reverse()

/** Grados (stripes) que admite cada cinturón; el backend aplica el mismo límite. */
export function gradoMaximo(cinturon: Cinturon | null): number {
  if (cinturon === null) return 0
  return cinturon === 'NEGRO' ? 6 : 4
}

/** 0 → "Sin grados"; 1 → "1 grado"; 3 → "3 grados". */
export function textoGrado(grado: number): string {
  if (grado === 0) return 'Sin grados'
  return grado === 1 ? '1 grado' : `${grado} grados`
}

/** Tiempo desde una fecha: "3 años y 2 meses", "8 meses", "Menos de un mes". */
export function antiguedad(iso: string, hoy = new Date()): string {
  const desde = parseFecha(iso)
  let meses = (hoy.getFullYear() - desde.getFullYear()) * 12 + hoy.getMonth() - desde.getMonth()
  if (hoy.getDate() < desde.getDate()) meses -= 1
  if (meses < 1) return 'Menos de un mes'
  const anios = Math.floor(meses / 12)
  const resto = meses % 12
  const textoMeses = resto === 1 ? '1 mes' : `${resto} meses`
  if (anios === 0) return textoMeses
  const textoAnios = anios === 1 ? '1 año' : `${anios} años`
  return resto === 0 ? textoAnios : `${textoAnios} y ${textoMeses}`
}

const mesAnio = new Intl.DateTimeFormat('es', { month: 'short', year: 'numeric' })

/** "2024-03-15" → "mar 2024" */
export function formatoMesAnio(iso: string): string {
  return mesAnio.format(parseFecha(iso)).replace('.', '')
}

/** "Iván Ortiz" → "IO"; "ivan" → "IV". */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  const letras = partes.length > 1 ? partes[0][0] + partes[1][0] : (partes[0] ?? '?').slice(0, 2)
  return letras.toUpperCase()
}

/** Minúsculas y sin tildes, para que "triangulo" encuentre "Triángulo". */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

/** "2026-09-30" → Date local (new Date("2026-09-30") lo interpretaría en UTC). */
export function parseFecha(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

function aISO(d: Date): string {
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`
}

/** Fecha de hoy en formato ISO según la hora local. */
export function hoyISO(): string {
  return aISO(new Date())
}

/** Lunes de la semana en curso (ISO), para "esta semana". */
export function lunesISO(hoy = new Date()): string {
  const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return aISO(d)
}

/** "Hoy", "Ayer" o la fecha larga. */
export function fechaRelativa(iso: string, hoy = new Date()): string {
  if (iso === aISO(hoy)) return 'Hoy'
  const ayer = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1)
  if (iso === aISO(ayer)) return 'Ayer'
  return formatoFechaLarga(iso)
}

const fechaLarga = new Intl.DateTimeFormat('es', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const fechaCorta = new Intl.DateTimeFormat('es', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

/** "2026-10-01" → "jue, 1 oct 2026" */
export function formatoFechaCorta(iso: string): string {
  return fechaCorta.format(parseFecha(iso)).replaceAll('.', '')
}

export function formatoFechaLarga(iso: string): string {
  const texto = fechaLarga.format(parseFecha(iso))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function partesFecha(iso: string) {
  const d = parseFecha(iso)
  return {
    dia: d.getDate(),
    mes: d.toLocaleDateString('es', { month: 'short' }).replace('.', ''),
    semana: d.toLocaleDateString('es', { weekday: 'short' }).replace('.', ''),
  }
}

/** "19:30:00" → "19:30" */
export function hora(valor: string): string {
  return valor.slice(0, 5)
}

export function horario(inicio: string, fin: string): string {
  return `${hora(inicio)} – ${hora(fin)}`
}

/**
 * Turno más probable para registrar una clase ahora: el que está en curso,
 * si no el siguiente del día, y si no el último (clase recién terminada).
 */
export function turnoSugerido(turnos: Turno[], ahora = new Date()): Turno | undefined {
  if (turnos.length === 0) return undefined
  const actual = ahora.toTimeString().slice(0, 8)
  const ordenados = [...turnos].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
  return (
    ordenados.find((t) => t.hora_inicio <= actual && actual < t.hora_fin) ??
    ordenados.find((t) => actual < t.hora_inicio) ??
    ordenados.at(-1)
  )
}
