import { useMemo, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'

import { useClasesRango, useTurnos } from '../api/queries'
import type { Clase } from '../api/types'
import { useAuth } from '../auth/context'
import { EtiquetaModalidad, MarcaTurno } from '../components/Modalidad'
import { Cargando, MensajeError, Titulo } from '../components/ui'
import {
  DIAS_CORTOS,
  agendaDelDia,
  aISO,
  leerMes,
  mesISO,
  semanasDelMes,
  tituloMes,
  type Hueco,
} from '../lib/calendario'
import { formatoFechaLarga, hora, hoyISO } from '../lib/formato'

/** /calendario?mes=2026-10&dia=2026-10-01 */
export function Calendario() {
  const [params, setParams] = useSearchParams()
  const { anio, mes } = leerMes(params.get('mes'))
  const hoy = hoyISO()

  const semanas = useMemo(() => semanasDelMes(anio, mes), [anio, mes])
  const desde = aISO(semanas[0][0])
  const hasta = aISO(semanas.at(-1)!.at(-1)!)

  const turnos = useTurnos()
  const clases = useClasesRango(desde, hasta)

  // Día seleccionado: el de la URL; si no, hoy cuando se mira el mes actual.
  const diaURL = params.get('dia')
  const seleccionado =
    diaURL && diaURL >= desde && diaURL <= hasta
      ? diaURL
      : hoy >= desde && hoy <= hasta && mesISO(anio, mes) === hoy.slice(0, 7)
        ? hoy
        : null

  const agendas = useMemo(() => {
    const porDia = new Map<string, Hueco[]>()
    if (!turnos.data) return porDia
    for (const semana of semanas) {
      for (const d of semana) {
        const iso = aISO(d)
        porDia.set(iso, agendaDelDia(iso, turnos.data, clases.data ?? []))
      }
    }
    return porDia
  }, [semanas, turnos.data, clases.data])

  function seleccionar(iso: string) {
    setParams(
      (actual) => {
        const nuevos = new URLSearchParams(actual)
        nuevos.set('dia', iso)
        // Al tocar un día del mes anterior o siguiente, el calendario lo acompaña.
        nuevos.set('mes', iso.slice(0, 7))
        return nuevos
      },
      { replace: true, preventScrollReset: true },
    )
  }

  const aMes = (delta: number) => `?mes=${mesISO(anio, mes + delta)}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Titulo>Calendario</Titulo>
        <Leyenda />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Link to={aMes(-1)} replace aria-label="Mes anterior" className={BOTON_MES}>
          ‹
        </Link>
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-bold uppercase" aria-live="polite">
            {tituloMes(anio, mes)}
          </h2>
          {mesISO(anio, mes) !== hoy.slice(0, 7) && (
            <Link
              to={`?mes=${hoy.slice(0, 7)}&dia=${hoy}`}
              replace
              className="rounded-lg border border-borde-fuerte px-2 py-1 text-xs font-bold uppercase text-texto-suave hover:border-acento hover:text-acento"
            >
              Hoy
            </Link>
          )}
        </div>
        <Link to={aMes(1)} replace aria-label="Mes siguiente" className={BOTON_MES}>
          ›
        </Link>
      </div>

      <MensajeError error={turnos.error} onReintentar={() => void turnos.refetch()} />
      <MensajeError error={clases.error} onReintentar={() => void clases.refetch()} />

      {turnos.isPending ? (
        <Cargando texto="Cargando calendario…" />
      ) : (
        <div
          role="grid"
          aria-label={tituloMes(anio, mes)}
          className={`overflow-hidden rounded-2xl border border-borde transition-opacity ${
            clases.isPlaceholderData ? 'opacity-60' : ''
          }`}
        >
          <div role="row" className="grid grid-cols-7 border-b border-borde bg-superficie">
            {DIAS_CORTOS.map((d) => (
              <div
                key={d}
                role="columnheader"
                className="py-2 text-center text-xs font-bold text-texto-suave"
              >
                {d}
              </div>
            ))}
          </div>
          {semanas.map((semana) => (
            <div role="row" key={aISO(semana[0])} className="grid grid-cols-7">
              {semana.map((d) => {
                const iso = aISO(d)
                return (
                  <Celda
                    key={iso}
                    fecha={d}
                    huecos={agendas.get(iso) ?? []}
                    delMes={d.getMonth() === mes}
                    esHoy={iso === hoy}
                    seleccionada={iso === seleccionado}
                    onSeleccionar={() => seleccionar(iso)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      )}

      {seleccionado && turnos.data && (
        <Agenda
          fecha={seleccionado}
          huecos={agendas.get(seleccionado) ?? []}
          cargando={clases.isPending}
          hoy={hoy}
        />
      )}
      {!seleccionado && !turnos.isPending && (
        <p className="text-center text-sm text-texto-suave">Toca un día para ver sus turnos.</p>
      )}
    </div>
  )
}

const BOTON_MES =
  'grid size-11 place-items-center rounded-xl border border-borde-fuerte text-xl font-bold hover:border-acento hover:text-acento'

function Leyenda() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-suave">
      <li className="flex items-center gap-1.5">
        <MarcaTurno modalidad="GI" registrada /> Gi
      </li>
      <li className="flex items-center gap-1.5">
        <MarcaTurno modalidad="NO_GI" registrada /> No-Gi
      </li>
      <li className="flex items-center gap-1.5">
        <MarcaTurno modalidad="GI" registrada={false} /> Sin registrar
      </li>
    </ul>
  )
}

function Celda({
  fecha,
  huecos,
  delMes,
  esHoy,
  seleccionada,
  onSeleccionar,
}: {
  fecha: Date
  huecos: Hueco[]
  delMes: boolean
  esHoy: boolean
  seleccionada: boolean
  onSeleccionar: () => void
}) {
  const resumen =
    huecos.length === 0
      ? 'sin entrenamiento'
      : huecos
          .map((h) => `${h.turno.nombre} ${h.clase ? 'registrada' : 'sin registrar'}`)
          .join(', ')

  return (
    <button
      type="button"
      role="gridcell"
      aria-selected={seleccionada}
      aria-label={`${formatoFechaLarga(aISO(fecha))}: ${resumen}`}
      onClick={onSeleccionar}
      className={`flex min-h-16 flex-col items-center gap-1.5 border-r border-b border-borde p-1.5 text-sm transition-colors last:border-r-0 md:min-h-24 md:items-stretch md:p-2 ${
        seleccionada ? 'bg-superficie-alta' : 'hover:bg-superficie'
      } ${delMes ? '' : 'text-texto-suave/40'}`}
    >
      <span
        className={`grid size-7 place-items-center rounded-full font-semibold md:self-start ${
          esHoy ? 'bg-acento text-black' : seleccionada ? 'ring-2 ring-acento' : ''
        }`}
      >
        {fecha.getDate()}
      </span>

      {/* Móvil: puntos. Escritorio: la hora y la modalidad de cada turno. */}
      <span className={`flex flex-wrap justify-center gap-1 md:hidden ${delMes ? '' : 'opacity-40'}`}>
        {huecos.map((h, i) => (
          <MarcaTurno key={i} modalidad={h.modalidad} registrada={Boolean(h.clase)} />
        ))}
      </span>
      <span className={`hidden flex-col gap-1 md:flex ${delMes ? '' : 'opacity-40'}`}>
        {huecos.map((h, i) => (
          <span key={i} className="flex items-center gap-1.5 text-xs text-texto-suave">
            <MarcaTurno modalidad={h.modalidad} registrada={Boolean(h.clase)} />
            {hora(h.hora_inicio)}
          </span>
        ))}
      </span>
    </button>
  )
}

function Agenda({
  fecha,
  huecos,
  cargando,
  hoy,
}: {
  fecha: string
  huecos: Hueco[]
  cargando: boolean
  hoy: string
}) {
  const puedeRegistrar = useAuth().usuario?.es_admin ?? false

  return (
    <section aria-labelledby="agenda" className="space-y-3">
      <h2 id="agenda" className="font-display text-xl font-bold uppercase">
        {formatoFechaLarga(fecha)}
      </h2>
      {cargando ? (
        <Cargando texto="Cargando clases…" />
      ) : huecos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-borde-fuerte px-4 py-6 text-center text-texto-suave">
          No hay entrenamiento este día.
        </p>
      ) : (
        <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde">
          {huecos.map((h, i) => (
            <li key={h.clase?.id ?? `turno-${h.turno.id}-${i}`}>
              <FilaHueco hueco={h} fecha={fecha} futuro={fecha > hoy} puedeRegistrar={puedeRegistrar} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function FilaHueco({
  hueco,
  fecha,
  futuro,
  puedeRegistrar,
}: {
  hueco: Hueco
  fecha: string
  futuro: boolean
  puedeRegistrar: boolean
}) {
  const cabecera = (
    <span className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-semibold">{hueco.turno.nombre}</span>
      <span className="text-texto-suave">
        {hora(hueco.hora_inicio)} – {hora(hueco.hora_fin)}
      </span>
      <EtiquetaModalidad modalidad={hueco.modalidad} />
    </span>
  )

  if (hueco.clase) {
    return <ClaseRegistrada clase={hueco.clase} cabecera={cabecera} fueraDeHorario={!hueco.programado} />
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-superficie p-4">
      <div className="min-w-0 space-y-1">
        {cabecera}
        <p className="text-sm text-texto-suave">{futuro ? 'Programada' : 'Sin registrar'}</p>
      </div>
      {puedeRegistrar && (
        <Link
          to={`/clases/nueva?fecha=${fecha}&turno=${hueco.turno.id}`}
          className="inline-flex min-h-10 shrink-0 items-center rounded-xl border border-acento px-3 text-sm font-bold text-acento hover:bg-acento hover:text-black"
        >
          Registrar
        </Link>
      )}
    </div>
  )
}

function ClaseRegistrada({
  clase,
  cabecera,
  fueraDeHorario,
}: {
  clase: Clase
  cabecera: ReactNode
  fueraDeHorario: boolean
}) {
  const n = clase.tecnicas.length
  return (
    <Link to={`/clases/${clase.id}`} className="block space-y-1 bg-superficie p-4 hover:bg-superficie-alta">
      {cabecera}
      <p className="font-display text-lg font-bold uppercase leading-tight">{clase.tema}</p>
      <p className="text-sm text-texto-suave">
        {n === 0 ? 'Sin técnicas' : `${n} ${n === 1 ? 'técnica' : 'técnicas'}`}
        {clase.instructor && ` · Con ${clase.instructor}`}
        {fueraDeHorario && ' · Fuera del horario habitual'}
      </p>
    </Link>
  )
}
