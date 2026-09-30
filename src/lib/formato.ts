import type { Categoria, Cinturon, Modalidad, Posicion, Turno } from '../api/types'

export const MODALIDADES: Record<Modalidad, string> = {
  GI: 'Gi',
  NO_GI: 'No-Gi',
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

/** "2026-09-30" → Date local (new Date("2026-09-30") lo interpretaría en UTC). */
export function parseFecha(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

/** Fecha de hoy en formato ISO según la hora local. */
export function hoyISO(): string {
  const d = new Date()
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`
}

const fechaLarga = new Intl.DateTimeFormat('es', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

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
