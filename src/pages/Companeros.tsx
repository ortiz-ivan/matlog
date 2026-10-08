import { useMemo } from 'react'
import { useSearchParams } from 'react-router'

import { useCompaneros } from '../api/queries'
import type { Cinturon, Companero } from '../api/types'
import { useAuth } from '../auth/context'
import { BarraCinturon } from '../components/Cinturon'
import { Cargando, Chip, Input, MensajeError, Titulo } from '../components/ui'
import {
  CINTURONES,
  CINTURONES_DESC,
  antiguedad,
  formatoMesAnio,
  iniciales,
  normalizar,
  textoGrado,
} from '../lib/formato'

function esCinturon(valor: string | null): valor is Cinturon {
  return valor !== null && valor in CINTURONES
}

/** /companeros — la vitrina de la academia: quién entrena, con qué cinturón y desde cuándo. */
export function Companeros() {
  const companeros = useCompaneros()
  const [params, setParams] = useSearchParams()

  // Filtros en la URL, como en Técnicas: se conservan al volver atrás.
  const q = params.get('q') ?? ''
  const filtroCinturon = params.get('cinturon')
  const cinturon = esCinturon(filtroCinturon) ? filtroCinturon : null

  function setFiltro(clave: string, valor: string | null) {
    setParams(
      (actual) => {
        const nuevos = new URLSearchParams(actual)
        if (valor) nuevos.set(clave, valor)
        else nuevos.delete(clave)
        return nuevos
      },
      { replace: true, preventScrollReset: true },
    )
  }

  // Ya vienen ordenados por cinturón, grado y antigüedad: basta con repartirlos.
  const grupos = useMemo(() => {
    const termino = normalizar(q)
    const visibles = (companeros.data ?? []).filter(
      (c) => (!termino || normalizar(c.nombre).includes(termino)) && (!cinturon || c.cinturon === cinturon),
    )
    return [...CINTURONES_DESC, null]
      .map((c) => ({ cinturon: c, miembros: visibles.filter((m) => m.cinturon === c) }))
      .filter((g) => g.miembros.length > 0)
  }, [companeros.data, q, cinturon])

  const total = companeros.data?.length ?? 0
  const hayFiltros = Boolean(q || cinturon)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Titulo>Compañeros</Titulo>
        {companeros.data && (
          <p className="text-texto-suave">
            {total === 1 ? '1 persona entrena' : `${total} personas entrenan`} en la academia.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Input
          type="search"
          placeholder="Buscar por nombre"
          maxLength={100}
          value={q}
          onChange={(e) => setFiltro('q', e.target.value)}
        />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Cinturón">
          <Chip activo={cinturon === null} onClick={() => setFiltro('cinturon', null)}>
            Todos
          </Chip>
          {CINTURONES_DESC.map((c) => (
            <Chip key={c} activo={cinturon === c} onClick={() => setFiltro('cinturon', cinturon === c ? null : c)}>
              {CINTURONES[c]}
            </Chip>
          ))}
        </div>
      </div>

      <MensajeError error={companeros.error} onReintentar={() => void companeros.refetch()} />

      {companeros.isPending ? (
        <Cargando texto="Cargando compañeros…" />
      ) : grupos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-borde-fuerte px-6 py-12 text-center text-texto-suave">
          {hayFiltros ? 'Nadie coincide con los filtros.' : 'Todavía no hay nadie.'}
        </p>
      ) : (
        grupos.map((g) => (
          <section key={g.cinturon ?? 'sin'} className="space-y-3" aria-labelledby={`grupo-${g.cinturon ?? 'sin'}`}>
            <h2
              id={`grupo-${g.cinturon ?? 'sin'}`}
              className="flex items-baseline gap-2 font-display text-xl font-bold uppercase"
            >
              {g.cinturon ? `Cinturón ${CINTURONES[g.cinturon].toLowerCase()}` : 'Sin cinturón asignado'}
              <span className="text-sm font-semibold text-texto-suave">{g.miembros.length}</span>
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {g.miembros.map((c) => (
                <li key={c.id}>
                  <TarjetaCompanero companero={c} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}

function TarjetaCompanero({ companero: c }: { companero: Companero }) {
  const esYo = useAuth().usuario?.id === c.id

  return (
    <article
      className={`space-y-4 rounded-2xl border bg-superficie p-4 ${esYo ? 'border-acento/60' : 'border-borde'}`}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-full border border-borde-fuerte bg-superficie-alta font-display text-base font-bold"
        >
          {iniciales(c.nombre)}
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-bold">
            {c.nombre}
            {esYo && <span className="font-normal text-texto-suave"> (tú)</span>}
          </h3>
          <p className="text-sm text-texto-suave">
            {c.cinturon ? `${CINTURONES[c.cinturon]} · ${textoGrado(c.grado).toLowerCase()}` : 'Sin cinturón'}
          </p>
        </div>
      </div>

      <BarraCinturon cinturon={c.cinturon} grado={c.grado} />

      <p className="text-sm">
        {c.fecha_ingreso ? (
          <>
            <span className="text-texto-suave">En la academia desde </span>
            <span className="font-semibold">{formatoMesAnio(c.fecha_ingreso)}</span>
            <span className="text-texto-suave"> · {antiguedad(c.fecha_ingreso)}</span>
          </>
        ) : (
          <span className="text-texto-suave">Fecha de ingreso sin registrar</span>
        )}
      </p>
    </article>
  )
}
