import { Link, useParams } from 'react-router'

import { useFichaCompanero } from '../api/queries'
import { useAuth } from '../auth/context'
import { BarraCinturon } from '../components/Cinturon'
import { MedalleroCompleto } from '../components/Medallas'
import { FilaParticipacion } from '../components/Participacion'
import { Cargando, MensajeError, Titulo } from '../components/ui'
import { Volver } from '../components/Volver'
import { CINTURONES, antiguedad, formatoMesAnio, iniciales, textoGrado } from '../lib/formato'

/** /companeros/:id — la ficha de un compañero con su medallero y sus torneos. */
export function FichaCompanero() {
  const id = Number(useParams().id)
  const { usuario } = useAuth()
  const ficha = useFichaCompanero(id)

  if (ficha.isPending) return <Cargando />
  if (ficha.isError) {
    return (
      <div className="space-y-4">
        <Volver alternativa="/companeros" />
        <MensajeError error={ficha.error} onReintentar={() => void ficha.refetch()} />
      </div>
    )
  }

  const c = ficha.data
  const esYo = usuario?.id === c.id
  // Por año, del más reciente al más antiguo (ya vienen ordenadas por fecha).
  const porAnio = new Map<string, typeof c.participaciones>()
  for (const p of c.participaciones) {
    const anio = p.torneo.fecha.slice(0, 4)
    porAnio.set(anio, [...(porAnio.get(anio) ?? []), p])
  }

  return (
    <article className="space-y-8">
      <div className="space-y-4">
        <Volver alternativa="/companeros" />
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="grid size-16 shrink-0 place-items-center rounded-full border border-borde-fuerte bg-superficie-alta font-display text-2xl font-extrabold"
          >
            {iniciales(c.nombre)}
          </span>
          <div className="min-w-0">
            <Titulo className="truncate">{c.nombre}</Titulo>
            <p className="mt-1 text-texto-suave">
              {c.cinturon ? `Cinturón ${CINTURONES[c.cinturon].toLowerCase()} · ${textoGrado(c.grado).toLowerCase()}` : 'Sin cinturón asignado'}
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
      </div>

      <section className="space-y-3" aria-labelledby="medallero">
        <h2 id="medallero" className="font-display text-xl font-bold uppercase">
          Medallero
        </h2>
        <MedalleroCompleto medallero={c.medallero} />
      </section>

      <section className="space-y-3" aria-labelledby="torneos">
        <div className="flex items-end justify-between gap-4">
          <h2 id="torneos" className="font-display text-xl font-bold uppercase">
            Torneos
          </h2>
          {esYo && (
            <Link to="/mis-torneos" className="text-sm font-bold text-acento hover:underline">
              Gestionar mis torneos
            </Link>
          )}
        </div>
        {c.participaciones.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-borde-fuerte px-6 py-10 text-center text-texto-suave">
            {esYo ? 'Todavía no tienes torneos aprobados.' : 'Todavía no tiene torneos registrados.'}
          </p>
        ) : (
          [...porAnio].map(([anio, participaciones]) => (
            <div key={anio} className="space-y-2">
              <h3 className="text-sm font-bold text-texto-suave">{anio}</h3>
              <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde">
                {participaciones.map((p) => (
                  <li key={p.id}>
                    <FilaParticipacion participacion={p} />
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </article>
  )
}
