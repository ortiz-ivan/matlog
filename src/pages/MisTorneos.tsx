import { Link } from 'react-router'

import { useEliminarParticipacion, useMisParticipaciones } from '../api/queries'
import type { Participacion } from '../api/types'
import { useAuth } from '../auth/context'
import { EtiquetaEstado, FilaParticipacion } from '../components/Participacion'
import { Cargando, MensajeError, Titulo } from '../components/ui'
import { Volver } from '../components/Volver'

/** /mis-torneos — las participaciones propias, en cualquier estado de revisión. */
export function MisTorneos() {
  const { usuario } = useAuth()
  const mias = useMisParticipaciones()
  const eliminar = useEliminarParticipacion()

  const pendientes = mias.data?.filter((p) => p.estado !== 'APROBADA').length ?? 0

  function borrar(p: Participacion) {
    if (!window.confirm(`¿Eliminar tu participación en "${p.torneo.nombre}"?`)) return
    eliminar.mutate(p.id)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Volver alternativa={usuario ? `/companeros/${usuario.id}` : '/companeros'} />
        <div className="flex items-end justify-between gap-4">
          <Titulo>Mis torneos</Titulo>
          <Link
            to="/mis-torneos/nueva"
            className="inline-flex min-h-10 shrink-0 items-center rounded-xl border border-acento px-4 text-sm font-bold text-acento hover:bg-acento hover:text-black"
          >
            + Añadir
          </Link>
        </div>
        <p className="text-texto-suave">
          {usuario?.es_admin
            ? 'Como admin, lo que registras se publica directamente en tu ficha.'
            : 'Un admin revisa cada participación antes de que aparezca en tu ficha de Compañeros.'}
        </p>
      </div>

      <MensajeError error={mias.error ?? eliminar.error} onReintentar={mias.isError ? () => void mias.refetch() : undefined} />

      {mias.isPending ? (
        <Cargando texto="Cargando tus torneos…" />
      ) : mias.data?.length === 0 ? (
        <div className="space-y-3 rounded-2xl border border-dashed border-borde-fuerte px-6 py-12 text-center text-texto-suave">
          <p>Todavía no has registrado ningún torneo.</p>
          <Link to="/mis-torneos/nueva" className="font-bold text-acento hover:underline">
            Registrar el primero
          </Link>
        </div>
      ) : (
        <>
          {pendientes > 0 && (
            <p className="text-sm text-texto-suave">
              {pendientes === 1 ? '1 participación sin aprobar.' : `${pendientes} participaciones sin aprobar.`}
            </p>
          )}
          <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde">
            {mias.data?.map((p) => (
              <li key={p.id}>
                <FilaParticipacion participacion={p}>
                  <div className="space-y-2 pt-1">
                    <EtiquetaEstado estado={p.estado} />
                    {p.estado === 'RECHAZADA' && p.motivo_rechazo && (
                      <p className="text-sm text-peligro">Motivo: {p.motivo_rechazo}</p>
                    )}
                    {/* Una vez aprobada solo la cambia un admin (el backend lo exige). */}
                    {(p.estado !== 'APROBADA' || usuario?.es_admin) && (
                      <div className="flex gap-4 text-sm font-bold">
                        <Link to={`/mis-torneos/${p.id}`} className="text-acento hover:underline">
                          {p.estado === 'RECHAZADA' ? 'Corregir y reenviar' : 'Editar'}
                        </Link>
                        <button
                          type="button"
                          onClick={() => borrar(p)}
                          disabled={eliminar.isPending}
                          className="text-texto-suave hover:text-peligro disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </FilaParticipacion>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
