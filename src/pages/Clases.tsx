import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import { useClases, useTurnos } from '../api/queries'
import { useAuth } from '../auth/context'
import type { Clase, FiltrosClases, Modalidad } from '../api/types'
import { Paginacion } from '../components/Paginacion'
import { SelectorFecha } from '../components/SelectorFecha'
import { Cargando, Chip, Etiqueta, MensajeError, Titulo } from '../components/ui'
import { MODALIDADES, horario, partesFecha } from '../lib/formato'
import { conFiltro, rango, usePaginaURL } from '../lib/paginacion'

function leerFiltros(params: URLSearchParams): FiltrosClases {
  const turno = Number(params.get('turno'))
  const modalidad = params.get('modalidad')
  return {
    turno_id: turno > 0 ? turno : undefined,
    modalidad: modalidad === 'GI' || modalidad === 'NO_GI' ? modalidad : undefined,
    desde: params.get('desde') || undefined,
    hasta: params.get('hasta') || undefined,
  }
}

export function Clases() {
  const [params, setParams] = useSearchParams()
  const filtros = leerFiltros(params)
  const [verFechas, setVerFechas] = useState(Boolean(filtros.desde || filtros.hasta))

  const turnos = useTurnos()
  const pagina = usePaginaURL()
  const clases = useClases(filtros, pagina)

  function setFiltro(clave: string, valor: string | undefined) {
    setParams((actual) => conFiltro(actual, clave, valor ?? null), {
      replace: true,
      preventScrollReset: true,
    })
  }

  const hayFiltros = Object.values(filtros).some((v) => v !== undefined)
  const lista = clases.data?.items ?? []
  const total = clases.data?.total
  const { desde, hasta } = rango(pagina, total ?? 0)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <Titulo>Historial</Titulo>
        {total !== undefined && total > 0 && (
          <span className="text-sm text-texto-suave">
            {desde}–{hasta} de {total}
          </span>
        )}
      </div>

      <section aria-label="Filtros" className="space-y-3">
        <div className="scrollbar-oculta -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip activo={!filtros.turno_id} onClick={() => setFiltro('turno', undefined)}>
            Todos
          </Chip>
          {turnos.data?.map((t) => (
            <Chip
              key={t.id}
              activo={filtros.turno_id === t.id}
              onClick={() => setFiltro('turno', String(t.id))}
            >
              {t.nombre}
            </Chip>
          ))}
          <span className="mx-1 w-px shrink-0 bg-borde" />
          {(Object.keys(MODALIDADES) as Modalidad[]).map((m) => (
            <Chip
              key={m}
              activo={filtros.modalidad === m}
              onClick={() => setFiltro('modalidad', filtros.modalidad === m ? undefined : m)}
            >
              {MODALIDADES[m]}
            </Chip>
          ))}
          <Chip activo={verFechas} onClick={() => setVerFechas((v) => !v)}>
            Fechas
          </Chip>
        </div>

        {verFechas && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 text-sm text-texto-suave">
              <span className="block">Desde</span>
              <SelectorFecha
                etiqueta="Desde"
                placeholder="Cualquiera"
                permitirVacio
                valor={filtros.desde ?? ''}
                max={filtros.hasta}
                onChange={(v) => setFiltro('desde', v || undefined)}
              />
            </div>
            <div className="space-y-1 text-sm text-texto-suave">
              <span className="block">Hasta</span>
              <SelectorFecha
                etiqueta="Hasta"
                placeholder="Cualquiera"
                permitirVacio
                alinear="derecha"
                valor={filtros.hasta ?? ''}
                min={filtros.desde}
                onChange={(v) => setFiltro('hasta', v || undefined)}
              />
            </div>
          </div>
        )}

        {hayFiltros && (
          <button
            type="button"
            onClick={() => setParams({}, { replace: true, preventScrollReset: true })}
            className="text-sm font-semibold text-acento hover:underline"
          >
            Quitar filtros
          </button>
        )}
      </section>

      <MensajeError error={turnos.error} />
      <MensajeError error={clases.error} onReintentar={() => void clases.refetch()} />

      {clases.isPending ? (
        <Cargando texto="Cargando clases…" />
      ) : lista.length === 0 ? (
        !clases.isError && <SinClases filtrado={hayFiltros} />
      ) : (
        <ul
          className={`space-y-3 transition-opacity ${clases.isPlaceholderData ? 'opacity-50' : ''}`}
          aria-busy={clases.isPlaceholderData}
        >
          {lista.map((c) => (
            <li key={c.id}>
              <TarjetaClase clase={c} />
            </li>
          ))}
        </ul>
      )}

      {total !== undefined && <Paginacion pagina={pagina} total={total} />}
    </div>
  )
}

const TECNICAS_VISIBLES = 4

function TarjetaClase({ clase }: { clase: Clase }) {
  const { dia, mes, semana } = partesFecha(clase.fecha)
  const extra = clase.tecnicas.length - TECNICAS_VISIBLES

  return (
    <Link
      to={`/clases/${clase.id}`}
      className="flex gap-4 rounded-2xl border border-borde bg-superficie p-4 transition-colors hover:border-borde-fuerte"
    >
      <div className="flex w-12 shrink-0 flex-col items-center text-center font-display uppercase leading-none">
        <span className="text-xs font-bold text-texto-suave">{semana}</span>
        <span className="mt-1 text-3xl font-extrabold text-acento">{dia}</span>
        <span className="text-xs font-bold text-texto-suave">{mes}</span>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-texto-suave">
          <span className="font-semibold text-texto">{clase.turno.nombre}</span>
          <span>{horario(clase.hora_inicio, clase.hora_fin)}</span>
          <Etiqueta>{MODALIDADES[clase.modalidad]}</Etiqueta>
        </div>
        <h2 className="text-lg font-bold leading-snug">{clase.tema}</h2>
        {clase.tecnicas.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {clase.tecnicas.slice(0, TECNICAS_VISIBLES).map((t) => (
              <li
                key={t.id}
                className="rounded-md border border-borde px-2 py-0.5 text-xs text-texto-suave"
              >
                {t.nombre}
              </li>
            ))}
            {extra > 0 && <li className="px-1 py-0.5 text-xs text-texto-suave">+{extra}</li>}
          </ul>
        )}
      </div>
    </Link>
  )
}

function SinClases({ filtrado }: { filtrado: boolean }) {
  const puedeRegistrar = useAuth().usuario?.es_admin ?? false
  return (
    <div className="rounded-2xl border border-dashed border-borde-fuerte px-6 py-12 text-center">
      <p className="font-display text-2xl font-bold uppercase">
        {filtrado ? 'Sin resultados' : 'Aún no hay clases'}
      </p>
      <p className="mt-2 text-texto-suave">
        {filtrado
          ? 'Prueba con otros filtros.'
          : puedeRegistrar
            ? 'Registra la primera clase para empezar el historial.'
            : 'Aparecerán aquí cuando un admin registre la primera.'}
      </p>
      {!filtrado && puedeRegistrar && (
        <Link
          to="/clases/nueva"
          className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-acento px-5 font-bold text-black hover:bg-acento-hover"
        >
          Registrar clase
        </Link>
      )}
    </div>
  )
}
