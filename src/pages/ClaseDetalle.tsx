import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { useClase, useEliminarClase } from '../api/queries'
import { useAuth } from '../auth/context'
import { Boton, Cargando, Etiqueta, MensajeError, Titulo } from '../components/ui'
import { CATEGORIAS, MODALIDADES, POSICIONES, formatoFechaLarga, horario } from '../lib/formato'

export function ClaseDetalle() {
  const id = Number(useParams().id)
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const clase = useClase(id)
  const eliminar = useEliminarClase()

  if (clase.isPending) return <Cargando />
  if (clase.isError) {
    return (
      <div className="space-y-4">
        <Volver />
        <MensajeError error={clase.error} onReintentar={() => void clase.refetch()} />
      </div>
    )
  }

  const c = clase.data

  function borrar() {
    if (!window.confirm(`¿Eliminar la clase "${c.tema}"? No se puede deshacer.`)) return
    eliminar.mutate(c.id, { onSuccess: () => navigate('/clases', { replace: true }) })
  }

  return (
    <article className="space-y-8">
      <div className="space-y-3">
        <Volver />
        <p className="font-semibold text-acento">{formatoFechaLarga(c.fecha)}</p>
        <Titulo>{c.tema}</Titulo>
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-borde bg-borde">
        <Dato titulo="Turno">{c.turno.nombre}</Dato>
        <Dato titulo="Horario">{horario(c.hora_inicio, c.hora_fin)}</Dato>
        <Dato titulo="Modalidad">{MODALIDADES[c.modalidad]}</Dato>
        <Dato titulo="Instructor">{c.instructor ?? '—'}</Dato>
      </dl>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold uppercase">
          Técnicas <span className="text-texto-suave">({c.tecnicas.length})</span>
        </h2>
        {c.tecnicas.length === 0 ? (
          <p className="text-texto-suave">No se registraron técnicas.</p>
        ) : (
          <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde">
            {c.tecnicas.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 bg-superficie p-4">
                <span className="font-semibold">{t.nombre}</span>
                <span className="flex shrink-0 flex-col items-end gap-1 text-right">
                  <Etiqueta acento>{CATEGORIAS[t.categoria]}</Etiqueta>
                  <span className="text-xs text-texto-suave">{POSICIONES[t.posicion]}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {c.notas && (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold uppercase">Notas</h2>
          <p className="whitespace-pre-wrap rounded-2xl bg-acento-suave p-4 text-black">
            {c.notas}
          </p>
        </section>
      )}

      {c.video_url && (
        <a
          href={c.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-acento font-bold text-acento hover:bg-acento hover:text-black"
        >
          ▶ Ver video
        </a>
      )}

      <footer className="space-y-4 border-t border-borde pt-6">
        <p className="text-sm text-texto-suave">Registrada por {c.creado_por.nombre}</p>
        <MensajeError error={eliminar.error} />
        <div className="flex gap-3">
          <Link
            to={`/clases/${c.id}/editar`}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-borde-fuerte font-semibold hover:border-texto-suave"
          >
            Editar
          </Link>
          {usuario?.es_admin && (
            <Boton variante="peligro" cargando={eliminar.isPending} onClick={borrar}>
              Eliminar
            </Boton>
          )}
        </div>
      </footer>
    </article>
  )
}

function Volver() {
  return (
    <Link to="/clases" className="inline-block text-sm font-semibold text-texto-suave hover:text-texto">
      ← Clases
    </Link>
  )
}

function Dato({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="bg-superficie p-4">
      <dt className="text-xs font-bold uppercase tracking-wide text-texto-suave">{titulo}</dt>
      <dd className="mt-1 font-semibold">{children}</dd>
    </div>
  )
}
