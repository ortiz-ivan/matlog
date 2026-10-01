import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { useCerrarAlSalir } from '../lib/useCerrarAlSalir'

const HORAS = Array.from({ length: 24 }, (_, h) => h)
const PASO_MINUTOS = 5

function dos(n: number) {
  return String(n).padStart(2, '0')
}

interface Props {
  /** "HH:MM" o "" si aún no hay hora. */
  valor: string
  onChange: (valor: string) => void
  etiqueta: string
  invalido?: boolean
  /** Lado hacia el que se abre la tarjeta: "derecha" para campos pegados al borde derecho. */
  alinear?: 'izquierda' | 'derecha'
}

/**
 * Selector de hora con el estilo de la app, en lugar del <input type="time"> nativo
 * (cuyo desplegable dibuja el sistema y no admite estilos): un campo que abre una
 * tarjeta con una columna de horas y otra de minutos de 5 en 5.
 */
export function SelectorHora({ valor, onChange, etiqueta, invalido = false, alinear = 'izquierda' }: Props) {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const idTarjeta = useId()

  const cerrar = useCallback(() => setAbierto(false), [])
  useCerrarAlSalir(abierto, cerrar, contenedor, boton)

  const [h, m] = valor ? valor.split(':').map(Number) : [undefined, undefined]
  // Minutos de 5 en 5, más el actual si no encaja (p. ej. 19:32 de un turno antiguo).
  const minutos = Array.from({ length: 60 / PASO_MINUTOS }, (_, i) => i * PASO_MINUTOS)
  if (m !== undefined && !minutos.includes(m)) minutos.push(m)
  minutos.sort((a, b) => a - b)

  function elegirHora(hora: number) {
    onChange(`${dos(hora)}:${dos(m ?? 0)}`)
  }

  function elegirMinuto(minuto: number) {
    // Si aún no se eligió la hora, se usan las 19 (la franja habitual de la academia).
    onChange(`${dos(h ?? 19)}:${dos(minuto)}`)
    cerrar()
    boton.current?.focus()
  }

  return (
    <div ref={contenedor} className="relative">
      <button
        ref={boton}
        type="button"
        aria-label={`${etiqueta}: ${valor || 'sin elegir'}`}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-controls={idTarjeta}
        aria-invalid={invalido}
        onClick={() => setAbierto((a) => !a)}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border bg-superficie px-4 text-left text-base transition-colors ${
          abierto || invalido ? '' : 'border-borde hover:border-borde-fuerte'
        } ${abierto ? 'border-acento' : ''} ${invalido && !abierto ? 'border-peligro' : ''}`}
      >
        <span className={`font-semibold tabular-nums ${valor ? 'text-texto' : 'text-texto-suave/60'}`}>
          {valor || '--:--'}
        </span>
        <IconoReloj activo={abierto} />
      </button>

      {abierto && (
        <div
          id={idTarjeta}
          role="dialog"
          aria-label={etiqueta}
          className={`absolute top-full z-30 mt-2 w-full min-w-56 overflow-hidden rounded-2xl border border-borde-fuerte bg-superficie shadow-2xl shadow-black ${
            alinear === 'derecha' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="grid grid-cols-2 border-b border-borde text-center text-xs font-bold uppercase text-texto-suave">
            <span className="py-2">Hora</span>
            <span className="border-l border-borde py-2">Minutos</span>
          </div>
          <div className="grid grid-cols-2">
            <Columna
              etiqueta="Hora"
              opciones={HORAS}
              seleccion={h}
              onElegir={elegirHora}
            />
            <Columna
              etiqueta="Minutos"
              opciones={minutos}
              seleccion={m}
              onElegir={elegirMinuto}
              conBorde
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Columna({
  etiqueta,
  opciones,
  seleccion,
  onElegir,
  conBorde = false,
}: {
  etiqueta: string
  opciones: number[]
  seleccion: number | undefined
  onElegir: (n: number) => void
  conBorde?: boolean
}) {
  const lista = useRef<HTMLUListElement>(null)

  // Al abrir, la columna se coloca con la opción elegida a la vista (centrada).
  useEffect(() => {
    const elegida = lista.current?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (elegida && lista.current) {
      lista.current.scrollTop = elegida.offsetTop - lista.current.clientHeight / 2 + elegida.clientHeight / 2
    }
  }, [])

  return (
    <ul
      ref={lista}
      role="listbox"
      aria-label={etiqueta}
      className={`relative max-h-56 overflow-y-auto p-1.5 ${conBorde ? 'border-l border-borde' : ''}`}
    >
      {opciones.map((n) => {
        const elegida = n === seleccion
        return (
          <li key={n} role="option" aria-selected={elegida}>
            <button
              type="button"
              onClick={() => onElegir(n)}
              className={`flex min-h-10 w-full items-center justify-center rounded-lg text-base font-semibold tabular-nums transition-colors ${
                elegida ? 'bg-acento text-black' : 'text-texto hover:bg-superficie-alta'
              }`}
            >
              {dos(n)}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function IconoReloj({ activo }: { activo: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={`size-5 shrink-0 ${activo ? 'text-acento' : 'text-texto-suave'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" />
    </svg>
  )
}
