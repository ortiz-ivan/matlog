import type { Clase, Modalidad, Turno } from '../api/types'
import { parseFecha } from './formato'

/** Días de la semana empezando en lunes, como en el backend (0 = lunes ... 6 = domingo). */
export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export const DIAS_CORTOS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function dos(n: number) {
  return String(n).padStart(2, '0')
}

export function aISO(d: Date): string {
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`
}

/** Día de la semana con lunes = 0 (getDay() empieza en domingo). */
export function diaSemana(fecha: Date | string): number {
  const d = typeof fecha === 'string' ? parseFecha(fecha) : fecha
  return (d.getDay() + 6) % 7
}

/** "2026-10" → { anio: 2026, mes: 9 } (mes 0-11). Si no es válido, el mes actual. */
export function leerMes(valor: string | null, hoy = new Date()) {
  const m = valor?.match(/^(\d{4})-(\d{2})$/)
  if (m) {
    const anio = Number(m[1])
    const mes = Number(m[2]) - 1
    if (mes >= 0 && mes <= 11) return { anio, mes }
  }
  return { anio: hoy.getFullYear(), mes: hoy.getMonth() }
}

export function mesISO(anio: number, mes: number): string {
  const d = new Date(anio, mes, 1)
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}`
}

const nombreMes = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' })

export function tituloMes(anio: number, mes: number): string {
  const texto = nombreMes.format(new Date(anio, mes, 1))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/**
 * Semanas (lunes a domingo) que cubren el mes, con los días del mes anterior y
 * siguiente necesarios para completarlas.
 */
export function semanasDelMes(anio: number, mes: number): Date[][] {
  const primero = new Date(anio, mes, 1)
  const inicio = new Date(anio, mes, 1 - diaSemana(primero))
  const ultimo = new Date(anio, mes + 1, 0)
  const semanas: Date[][] = []
  for (let d = inicio; d <= ultimo || semanas.at(-1)?.length !== 7; ) {
    if (!semanas.length || semanas.at(-1)!.length === 7) semanas.push([])
    semanas.at(-1)!.push(d)
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  }
  return semanas
}

/** Un hueco del horario de un día: un turno programado y, si existe, la clase registrada. */
export interface Hueco {
  turno: Turno | Clase['turno']
  hora_inicio: string
  hora_fin: string
  /** La de la clase si se registró; si no, la programada. */
  modalidad: Modalidad
  clase?: Clase
  /** false si hubo clase en un turno que ese día no estaba programado. */
  programado: boolean
}

/**
 * Agenda de un día: los turnos activos programados para ese día de la semana,
 * cruzados con las clases registradas en esa fecha (incluidas las de turnos que
 * no tocaban ese día o ya desactivados).
 */
export function agendaDelDia(fecha: string, turnos: Turno[], clases: Clase[]): Hueco[] {
  const dia = diaSemana(fecha)
  const delDia = clases.filter((c) => c.fecha === fecha)
  const huecos: Hueco[] = []

  for (const turno of turnos) {
    const programa = turno.dias.find((d) => d.dia === dia)
    if (!programa) continue
    const registradas = delDia.filter((c) => c.turno.id === turno.id)
    if (registradas.length === 0) {
      huecos.push({
        turno,
        hora_inicio: turno.hora_inicio,
        hora_fin: turno.hora_fin,
        modalidad: programa.modalidad,
        programado: true,
      })
    }
    for (const clase of registradas) {
      huecos.push({ turno, ...horasYModalidad(clase), clase, programado: true })
    }
  }

  const idsProgramados = new Set(huecos.map((h) => h.turno.id))
  for (const clase of delDia) {
    if (!idsProgramados.has(clase.turno.id)) {
      huecos.push({ turno: clase.turno, ...horasYModalidad(clase), clase, programado: false })
    }
  }

  return huecos.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
}

function horasYModalidad(clase: Clase) {
  return { hora_inicio: clase.hora_inicio, hora_fin: clase.hora_fin, modalidad: clase.modalidad }
}

/** Modalidad programada para un turno en una fecha, si ese día tiene clase. */
export function modalidadProgramada(turno: Turno | undefined, fecha: string): Modalidad | undefined {
  if (!turno || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return undefined
  return turno.dias.find((d) => d.dia === diaSemana(fecha))?.modalidad
}
