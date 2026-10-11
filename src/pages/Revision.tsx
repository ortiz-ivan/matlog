import { useState } from 'react'
import { Link } from 'react-router'

import { useRevisarParticipacion, useRevision } from '../api/queries'
import type { Participacion } from '../api/types'
import { FilaParticipacion } from '../components/Participacion'
import { Boton, Cargando, Input, MensajeError, Titulo } from '../components/ui'

/** /revision — solo admins: aprobar o rechazar las participaciones que mandan los alumnos. */
export function Revision() {
  const pendientes = useRevision()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-end justify-between gap-4">
          <Titulo>Revisión</Titulo>
          <Link to="/torneos" className="text-sm font-bold text-acento hover:underline">
            Gestionar torneos
          </Link>
        </div>
        <p className="text-texto-suave">
          Participaciones en torneos que esperan aprobación. Hasta que no las apruebes no aparecen en
          Compañeros.
        </p>
      </div>

      <MensajeError error={pendientes.error} onReintentar={() => void pendientes.refetch()} />

      {pendientes.isPending ? (
        <Cargando />
      ) : pendientes.data?.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-borde-fuerte px-6 py-12 text-center text-texto-suave">
          No hay nada pendiente.
        </p>
      ) : (
        <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde">
          {pendientes.data?.map((p) => (
            <li key={p.id}>
              <Pendiente participacion={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Pendiente({ participacion: p }: { participacion: Participacion }) {
  const revisar = useRevisarParticipacion()
  const [rechazando, setRechazando] = useState(false)
  const [motivo, setMotivo] = useState('')

  return (
    <FilaParticipacion participacion={p}>
      <div className="space-y-3 pt-2">
        <p className="text-sm">
          <span className="text-texto-suave">De </span>
          <Link to={`/companeros/${p.usuario.id}`} className="font-semibold hover:underline">
            {p.usuario.nombre}
          </Link>
        </p>
        <MensajeError error={revisar.error} />
        {rechazando ? (
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              revisar.mutate({ id: p.id, aprobar: false, motivo: motivo.trim() })
            }}
          >
            <Input
              autoFocus
              maxLength={200}
              placeholder="Motivo (opcional): p. ej. «Fue plata, no oro»"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
            <div className="flex gap-2">
              <Boton type="submit" variante="peligro" cargando={revisar.isPending}>
                Rechazar
              </Boton>
              <Boton variante="fantasma" onClick={() => setRechazando(false)}>
                Cancelar
              </Boton>
            </div>
          </form>
        ) : (
          <div className="flex gap-2">
            <Boton cargando={revisar.isPending} onClick={() => revisar.mutate({ id: p.id, aprobar: true })}>
              Aprobar
            </Boton>
            <Boton variante="secundario" onClick={() => setRechazando(true)}>
              Rechazar…
            </Boton>
          </div>
        )}
      </div>
    </FilaParticipacion>
  )
}
