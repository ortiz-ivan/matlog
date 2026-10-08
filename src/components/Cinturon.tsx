import type { Cinturon } from '../api/types'
import { CINTURONES, textoGrado } from '../lib/formato'

const COLOR: Record<Cinturon, string> = {
  BLANCO: 'bg-neutral-100',
  AZUL: 'bg-blue-600',
  MORADO: 'bg-purple-700',
  MARRON: 'bg-amber-900',
  NEGRO: 'bg-neutral-900 ring-1 ring-inset ring-borde-fuerte',
}

/**
 * El cinturón dibujado: la tela de su color y, en el extremo, la barra (negra; roja en
 * el cinturón negro) con una franja blanca por grado.
 */
export function BarraCinturon({
  cinturon,
  grado,
  className = '',
}: {
  cinturon: Cinturon | null
  grado: number
  className?: string
}) {
  if (cinturon === null) {
    return (
      <span
        role="img"
        aria-label="Sin cinturón asignado"
        className={`block h-4 rounded-sm border border-dashed border-borde-fuerte ${className}`}
      />
    )
  }
  return (
    <span
      role="img"
      aria-label={`Cinturón ${CINTURONES[cinturon].toLowerCase()}, ${textoGrado(grado).toLowerCase()}`}
      className={`flex h-4 overflow-hidden rounded-sm ${COLOR[cinturon]} ${className}`}
    >
      <span
        className={`mr-3 ml-auto flex h-full min-w-12 justify-end gap-1 px-1.5 ${
          cinturon === 'NEGRO' ? 'bg-red-600' : 'bg-black'
        }`}
      >
        {Array.from({ length: grado }, (_, i) => (
          <span key={i} className="w-1 bg-white" />
        ))}
      </span>
    </span>
  )
}
