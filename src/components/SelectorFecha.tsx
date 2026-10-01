import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

import { DIAS_CORTOS, aISO, semanasDelMes, tituloMes } from '../lib/calendario'
import { formatoFechaCorta, formatoFechaLarga, hoyISO, parseFecha } from '../lib/formato'
import { useCerrarAlSalir } from '../lib/useCerrarAlSalir'

interface Props {
  /** "AAAA-MM-DD" o "" si no hay fecha. */
  valor: string
  onChange: (valor: string) => void
  etiqueta: string
  /** Límites inclusivos ("AAAA-MM-DD"): los días fuera quedan deshabilitados. */
  min?: string
  max?: string
  /** Muestra "Borrar" para dejar el campo vacío (filtros). */
  permitirVacio?: boolean
  placeholder?: string
  /** Lado hacia el que se abre la tarjeta: "derecha" para campos pegados al borde derecho. */
  alinear?: 'izquierda' | 'derecha'
}

/**
 * Selector de fecha con el estilo de la app, en lugar del <input type="date"> nativo
 * (su calendario lo dibuja el sistema y no admite estilos).
 */
export function SelectorFecha({
  valor,
  onChange,
  etiqueta,
  min,
  max,
  permitirVacio = false,
  placeholder = 'Elegir fecha',
  alinear = 'izquierda',
}: Props) {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const idTarjeta = useId()

  const cerrar = useCallback(() => setAbierto(false), [])
  useCerrarAlSalir(abierto, cerrar, contenedor, boton)

  function elegir(iso: string) {
    onChange(iso)
    cerrar()
    boton.current?.focus()
  }

  return (
    <div ref={contenedor} className="relative">
      <button
        ref={boton}
        type="button"
        aria-label={`${etiqueta}: ${valor ? formatoFechaLarga(valor) : 'sin elegir'}`}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-controls={idTarjeta}
        onClick={() => setAbierto((a) => !a)}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border bg-superficie px-4 text-left text-base transition-colors ${
          abierto ? 'border-acento' : 'border-borde hover:border-borde-fuerte'
        }`}
      >
        <span className={`truncate font-semibold ${valor ? 'text-texto' : 'text-texto-suave/60'}`}>
          {valor ? formatoFechaCorta(valor) : placeholder}
        </span>
        <IconoCalendario activo={abierto} />
      </button>

      {abierto && (
        <div
          id={idTarjeta}
          role="dialog"
          aria-label={etiqueta}
          className={`absolute top-full z-30 mt-2 w-72 rounded-2xl border border-borde-fuerte bg-superficie p-3 shadow-2xl shadow-black ${
            alinear === 'derecha' ? 'right-0' : 'left-0'
          }`}
        >
          <Mes
            valor={valor}
            min={min}
            max={max}
            onElegir={elegir}
            onBorrar={permitirVacio && valor ? () => elegir('') : undefined}
          />
        </div>
      )}
    </div>
  )
}

function Mes({
  valor,
  min,
  max,
  onElegir,
  onBorrar,
}: {
  valor: string
  min?: string
  max?: string
  onElegir: (iso: string) => void
  onBorrar?: () => void
}) {
  const hoy = hoyISO()
  // Día con el foco del teclado; el mes mostrado es siempre el suyo.
  const [enfocado, setEnfocado] = useState(valor || hoy)
  const fechaEnfocada = parseFecha(enfocado)
  const anio = fechaEnfocada.getFullYear()
  const mes = fechaEnfocada.getMonth()
  const semanas = semanasDelMes(anio, mes)
  const rejilla = useRef<HTMLDivElement>(null)
  // Ref y no estado: solo indica al efecto si debe mover el foco, no cambia lo que se pinta.
  // true al abrir: el foco va directo al día elegido (o a hoy) para usar el teclado.
  const moverFoco = useRef(true)

  const fueraDeRango = (iso: string) => (min !== undefined && iso < min) || (max !== undefined && iso > max)

  // Al abrir y tras moverse con el teclado, el foco sigue al día enfocado.
  useEffect(() => {
    if (!moverFoco.current) return
    moverFoco.current = false
    rejilla.current?.querySelector<HTMLElement>(`[data-dia="${enfocado}"]`)?.focus()
  }, [enfocado])

  function desplazar(dias: number) {
    const d = parseFecha(enfocado)
    d.setDate(d.getDate() + dias)
    moverFoco.current = true
    setEnfocado(aISO(d))
  }

  function cambiarMes(delta: number) {
    // Mismo día en el mes nuevo (o el último, si no existe: 31 → 30).
    const d = parseFecha(enfocado)
    const destino = new Date(d.getFullYear(), d.getMonth() + delta, 1)
    const ultimo = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate()
    destino.setDate(Math.min(d.getDate(), ultimo))
    setEnfocado(aISO(destino))
  }

  function alTeclear(e: KeyboardEvent) {
    const movimientos: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    }
    if (e.key in movimientos) {
      e.preventDefault()
      desplazar(movimientos[e.key])
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Mes anterior" onClick={() => cambiarMes(-1)} className={BOTON_MES}>
          ‹
        </button>
        <span className="font-display text-lg font-bold uppercase" aria-live="polite">
          {tituloMes(anio, mes)}
        </span>
        <button type="button" aria-label="Mes siguiente" onClick={() => cambiarMes(1)} className={BOTON_MES}>
          ›
        </button>
      </div>

      <div role="grid" ref={rejilla} onKeyDown={alTeclear} className="space-y-1">
        <div role="row" className="grid grid-cols-7">
          {DIAS_CORTOS.map((d) => (
            <span key={d} role="columnheader" className="py-1 text-center text-xs font-bold text-texto-suave">
              {d}
            </span>
          ))}
        </div>
        {semanas.map((semana) => (
          <div role="row" key={aISO(semana[0])} className="grid grid-cols-7 gap-0.5">
            {semana.map((d) => {
              const iso = aISO(d)
              const elegido = iso === valor
              const deshabilitado = fueraDeRango(iso)
              return (
                <button
                  key={iso}
                  type="button"
                  role="gridcell"
                  data-dia={iso}
                  aria-selected={elegido}
                  aria-label={formatoFechaLarga(iso)}
                  disabled={deshabilitado}
                  tabIndex={iso === enfocado ? 0 : -1}
                  onClick={() => onElegir(iso)}
                  onFocus={() => setEnfocado(iso)}
                  className={`grid aspect-square place-items-center rounded-lg text-sm font-semibold tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-25 ${
                    elegido
                      ? 'bg-acento text-black'
                      : iso === hoy
                        ? 'ring-2 ring-acento ring-inset hover:bg-superficie-alta'
                        : 'hover:bg-superficie-alta'
                  } ${d.getMonth() !== mes && !elegido ? 'text-texto-suave/40' : ''}`}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex justify-between border-t border-borde pt-2">
        {onBorrar ? (
          <button type="button" onClick={onBorrar} className={BOTON_PIE}>
            Borrar
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={fueraDeRango(hoy)}
          onClick={() => onElegir(hoy)}
          className={`${BOTON_PIE} text-acento disabled:opacity-30`}
        >
          Hoy
        </button>
      </div>
    </div>
  )
}

const BOTON_MES =
  'grid size-9 place-items-center rounded-lg text-xl font-bold text-texto-suave hover:bg-superficie-alta hover:text-texto'
const BOTON_PIE = 'min-h-9 rounded-lg px-3 text-sm font-bold text-texto-suave hover:bg-superficie-alta'

function IconoCalendario({ activo }: { activo: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={`size-5 shrink-0 ${activo ? 'text-acento' : 'text-texto-suave'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  )
}
