import type { ReactNode } from 'react'

import type { EstadoParticipacion, ParticipacionPublica } from '../api/types'
import { ESTADOS_PARTICIPACION, MEDALLAS, formatoFechaCorta } from '../lib/formato'
import { IconoMedalla } from './Medallas'
import { EtiquetaModalidad } from './Modalidad'

const COLOR_ESTADO: Record<EstadoParticipacion, string> = {
  PENDIENTE: 'bg-superficie-alta text-texto-suave',
  APROBADA: 'bg-acento text-black',
  RECHAZADA: 'bg-peligro/15 text-peligro',
}

export function EtiquetaEstado({ estado }: { estado: EstadoParticipacion }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${COLOR_ESTADO[estado]}`}
    >
      {ESTADOS_PARTICIPACION[estado]}
    </span>
  )
}

/**
 * Una participación en un torneo: medalla, torneo, fecha y categoría. `children` va
 * debajo (estado de la revisión, acciones…).
 */
export function FilaParticipacion({
  participacion: p,
  children,
}: {
  participacion: ParticipacionPublica
  children?: ReactNode
}) {
  return (
    <div className="flex gap-4 bg-superficie px-4 py-4">
      {p.medalla ? (
        <span className="shrink-0" title={`Medalla de ${MEDALLAS[p.medalla].toLowerCase()}`}>
          <IconoMedalla medalla={p.medalla} />
          <span className="sr-only">Medalla de {MEDALLAS[p.medalla].toLowerCase()}</span>
        </span>
      ) : (
        <span
          title="Sin medalla"
          className="mt-2 grid size-5 shrink-0 place-items-center rounded-full border border-dashed border-borde-fuerte text-xs text-texto-suave"
        >
          <span aria-hidden>—</span>
          <span className="sr-only">Sin medalla</span>
        </span>
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-bold">{p.torneo.nombre}</p>
        <p className="text-sm text-texto-suave">
          {formatoFechaCorta(p.torneo.fecha)}
          {p.torneo.lugar && ` · ${p.torneo.lugar}`}
        </p>
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <EtiquetaModalidad modalidad={p.modalidad} />
          <span>{p.categoria}</span>
        </p>
        {children}
      </div>
    </div>
  )
}
