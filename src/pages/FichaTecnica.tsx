import { Link, useParams } from 'react-router'

import { useClases, useEliminarTecnica, useTecnica } from '../api/queries'
import { useAuth } from '../auth/context'
import { Paginacion } from '../components/Paginacion'
import { Boton, Cargando, Etiqueta, MensajeError, Titulo } from '../components/ui'
import { Volver } from '../components/Volver'
import { CATEGORIAS, MODALIDADES, POSICIONES, partesFecha } from '../lib/formato'
import { useVolver } from '../lib/navegacion'
import { usePaginaURL } from '../lib/paginacion'

/** /tecnicas/:id — la técnica y las clases en las que se vio. */
export function FichaTecnica() {
  const id = Number(useParams().id)
  const { usuario } = useAuth()
  const volver = useVolver('/tecnicas')
  const tecnica = useTecnica(id)
  const eliminar = useEliminarTecnica()
  // Las clases en las que apareció, paginadas en el servidor (pueden ser muchas).
  const pagina = usePaginaURL()
  const clases = useClases({ tecnica_id: id }, pagina)

  if (tecnica.isPending) return <Cargando />
  if (tecnica.isError) {
    return (
      <div className="space-y-4">
        <Volver alternativa="/tecnicas" />
        <MensajeError error={tecnica.error} onReintentar={() => void tecnica.refetch()} />
      </div>
    )
  }

  const t = tecnica.data
  const vecesVista = clases.data?.total ?? 0

  function borrar() {
    const aviso =
      vecesVista > 0 ? ` Se quitará de ${vecesVista} ${vecesVista === 1 ? 'clase' : 'clases'}.` : ''
    if (!window.confirm(`¿Eliminar la técnica "${t.nombre}"?${aviso} No se puede deshacer.`)) return
    eliminar.mutate(t.id, { onSuccess: volver })
  }

  return (
    <article className="space-y-8">
      <div className="space-y-3">
        <Volver alternativa="/tecnicas" />
        <div className="flex flex-wrap gap-2">
          <Etiqueta acento>{CATEGORIAS[t.categoria]}</Etiqueta>
          <Etiqueta>{POSICIONES[t.posicion]}</Etiqueta>
        </div>
        <Titulo>{t.nombre}</Titulo>
      </div>

      <section className="space-y-3">
        {t.descripcion ? (
          <p className="whitespace-pre-wrap leading-relaxed">{t.descripcion}</p>
        ) : (
          <p className="text-texto-suave">
            Sin descripción todavía.{' '}
            <Link to={`/tecnicas/${t.id}/editar`} className="font-bold text-acento hover:underline">
              Añadir una
            </Link>
          </p>
        )}
        {t.video_url && (
          <a
            href={t.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-acento font-bold text-acento hover:bg-acento hover:text-black"
          >
            ▶ Ver video
          </a>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold uppercase">
          {clases.isPending
            ? 'Clases'
            : vecesVista === 0
              ? 'Aún no se ha visto en clase'
              : `Vista en ${vecesVista} ${vecesVista === 1 ? 'clase' : 'clases'}`}
        </h2>
        <MensajeError error={clases.error} onReintentar={() => void clases.refetch()} />
        {clases.isPending && <Cargando texto="Cargando clases…" />}
        {clases.data && clases.data.items.length > 0 && (
          <ul
            className={`divide-y divide-borde overflow-hidden rounded-2xl border border-borde transition-opacity ${
              clases.isPlaceholderData ? 'opacity-50' : ''
            }`}
            aria-busy={clases.isPlaceholderData}
          >
            {clases.data.items.map((c) => {
              const { dia, mes, semana } = partesFecha(c.fecha)
              return (
                <li key={c.id}>
                  <Link
                    to={`/clases/${c.id}`}
                    className="flex items-center gap-4 bg-superficie px-4 py-3 hover:bg-superficie-alta"
                  >
                    <span className="w-16 shrink-0 font-display font-bold uppercase leading-tight">
                      <span className="text-acento">
                        {dia} {mes}
                      </span>
                      <span className="block text-xs text-texto-suave">{semana}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{c.tema}</span>
                      <span className="text-sm text-texto-suave">
                        {c.turno.nombre} · {MODALIDADES[c.modalidad]}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        {clases.data && <Paginacion pagina={pagina} total={clases.data.total} />}
      </section>

      <footer className="space-y-4 border-t border-borde pt-6">
        <MensajeError error={eliminar.error} />
        <div className="flex gap-3">
          <Link
            to={`/tecnicas/${t.id}/editar`}
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
