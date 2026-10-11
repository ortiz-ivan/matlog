import type { ReactNode } from 'react'

import type { Medalla, Medallero } from '../api/types'
import { MEDALLAS } from '../lib/formato'

/** Disco claro y canto oscuro del mismo metal: el contraste da el relieve. */
const METAL: Record<Medalla, { disco: string; canto: string }> = {
  ORO: { disco: 'fill-yellow-300', canto: 'fill-yellow-600' },
  PLATA: { disco: 'fill-zinc-200', canto: 'fill-zinc-500' },
  BRONCE: { disco: 'fill-amber-500', canto: 'fill-amber-800' },
}

const ORDEN: Medalla[] = ['ORO', 'PLATA', 'BRONCE']

function cuantas(medallero: Medallero, m: Medalla): number {
  return medallero[m.toLowerCase() as 'oro' | 'plata' | 'bronce']
}

/**
 * Una medalla dibujada: cinta en V con el verde de la academia, canto, disco, brillo y
 * una estrella en relieve. Decorativa: quien la usa pone el texto accesible.
 */
export function IconoMedalla({ medalla, className = 'h-7' }: { medalla: Medalla; className?: string }) {
  const { disco, canto } = METAL[medalla]
  return (
    <svg aria-hidden viewBox="0 0 32 42" className={`shrink-0 ${className}`}>
      {/* Cinta: dos tiras que se cruzan detrás del disco. */}
      <path d="M6 0h7l6 18h-7z" className="fill-acento-hover" />
      <path d="M26 0h-7l-6 18h7z" className="fill-acento" />
      <circle cx="16" cy="28" r="13" className={canto} />
      <circle cx="16" cy="28" r="10" className={disco} />
      {/* Brillo arriba a la izquierda. */}
      <path d="M8.6 24.5a8 8 0 0 1 6-5.4" fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="m16 22.5 1.6 3.4 3.7.4-2.8 2.5.8 3.7-3.3-1.9-3.3 1.9.8-3.7-2.8-2.5 3.7-.4z"
        className={canto}
      />
    </svg>
  )
}

/** Para las tarjetas: solo las medallas que tiene, con su número. Nada si no tiene ninguna. */
export function MedallasCompactas({ medallero }: { medallero: Medallero }) {
  const conMedalla = ORDEN.filter((m) => cuantas(medallero, m) > 0)
  if (conMedalla.length === 0) return null
  const texto = conMedalla.map((m) => `${cuantas(medallero, m)} de ${MEDALLAS[m].toLowerCase()}`).join(', ')
  return (
    <span role="img" aria-label={`Medallas: ${texto}`} className="flex items-center gap-3">
      {conMedalla.map((m) => (
        <span key={m} className="flex items-center gap-1 text-sm font-bold tabular-nums">
          <IconoMedalla medalla={m} className="h-6" />
          {cuantas(medallero, m)}
        </span>
      ))}
    </span>
  )
}

/** Las tres medallas y los torneos, en grande, para la ficha. Las que no tiene, apagadas. */
export function MedalleroCompleto({ medallero }: { medallero: Medallero }) {
  return (
    <dl className="grid grid-cols-4 gap-2">
      {ORDEN.map((m) => {
        const total = cuantas(medallero, m)
        return (
          <Celda key={m} texto={MEDALLAS[m]} valor={total} apagada={total === 0}>
            <IconoMedalla medalla={m} className="h-12" />
          </Celda>
        )
      })}
      <Celda texto="Torneos" valor={medallero.torneos} apagada={medallero.torneos === 0}>
        <IconoTrofeo />
      </Celda>
    </dl>
  )
}

function Celda({
  texto,
  valor,
  apagada,
  children,
}: {
  texto: string
  valor: number
  apagada: boolean
  children: ReactNode
}) {
  return (
    <div className="flex flex-col-reverse items-center gap-1 rounded-2xl border border-borde bg-superficie px-1 py-4">
      <dt className="text-xs font-semibold text-texto-suave">{texto}</dt>
      <dd className="flex flex-col items-center gap-1">
        <span className={apagada ? 'opacity-25 grayscale' : ''}>{children}</span>
        <span
          className={`font-display text-2xl leading-none font-extrabold tabular-nums ${apagada ? 'text-texto-suave' : ''}`}
        >
          {valor}
        </span>
      </dd>
    </div>
  )
}

function IconoTrofeo() {
  return (
    <svg aria-hidden viewBox="0 0 32 42" className="h-12 text-texto" fill="none" stroke="currentColor" strokeWidth={2.2}>
      <path d="M10 8h12v8a6 6 0 0 1-12 0z" strokeLinejoin="round" />
      <path d="M10 10H6v2a5 5 0 0 0 5 5M22 10h4v2a5 5 0 0 1-5 5" strokeLinecap="round" />
      <path d="M16 22v6M11 33h10M12.5 28h7l1 5h-9z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
