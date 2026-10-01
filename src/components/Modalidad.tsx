import type { Modalidad } from '../api/types'
import { COLOR_MODALIDAD, MODALIDADES } from '../lib/formato'

export function EtiquetaModalidad({ modalidad }: { modalidad: Modalidad }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-black ${COLOR_MODALIDAD[modalidad].fondo}`}
    >
      {MODALIDADES[modalidad]}
    </span>
  )
}

/**
 * Marca de un turno en una celda del calendario: rellena si la clase está
 * registrada, solo el contorno si está programada pero sin registrar.
 */
export function MarcaTurno({ modalidad, registrada }: { modalidad: Modalidad; registrada: boolean }) {
  const { fondo, borde } = COLOR_MODALIDAD[modalidad]
  return (
    <span
      aria-hidden
      className={`block size-2 rounded-full border ${borde} ${registrada ? fondo : 'bg-transparent'}`}
    />
  )
}
