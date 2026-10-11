import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'

import { useEliminarTorneo, useGuardarTorneo, useTorneo, useTorneos } from '../api/queries'
import type { Torneo } from '../api/types'
import { SelectorFecha } from '../components/SelectorFecha'
import { Boton, Campo, Cargando, Input, MensajeError, Titulo } from '../components/ui'
import { Volver } from '../components/Volver'
import { formatoFechaCorta, hoyISO } from '../lib/formato'
import { useVolver } from '../lib/navegacion'

/**
 * /torneos — solo admins. Los torneos los da de alta cualquiera al registrar su
 * participación; aquí se corrigen erratas y se borran los que sobran.
 */
export function Torneos() {
  const torneos = useTorneos()

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Volver alternativa="/revision" />
        <Titulo>Torneos</Titulo>
        <p className="text-texto-suave">
          Los dan de alta los alumnos al registrar su participación. Corrige aquí nombres o fechas
          mal escritos.
        </p>
      </div>

      <MensajeError error={torneos.error} onReintentar={() => void torneos.refetch()} />

      {torneos.isPending ? (
        <Cargando />
      ) : torneos.data?.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-borde-fuerte px-6 py-12 text-center text-texto-suave">
          Todavía no hay torneos.
        </p>
      ) : (
        <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde">
          {torneos.data?.map((t) => (
            <li key={t.id}>
              <Link
                to={`/torneos/${t.id}`}
                className="flex items-center justify-between gap-4 bg-superficie px-4 py-3 hover:bg-superficie-alta"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{t.nombre}</span>
                  <span className="block truncate text-sm text-texto-suave">
                    {formatoFechaCorta(t.fecha)}
                    {t.lugar && ` · ${t.lugar}`}
                  </span>
                </span>
                <span aria-hidden className="text-texto-suave">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** /torneos/:id — solo admins. */
export function TorneoFormulario() {
  const id = Number(useParams().id)
  const torneo = useTorneo(id)
  if (torneo.isPending) return <Cargando />
  if (torneo.isError) {
    return (
      <div className="space-y-4">
        <Volver alternativa="/torneos" />
        <MensajeError error={torneo.error} onReintentar={() => void torneo.refetch()} />
      </div>
    )
  }
  return <Edicion torneo={torneo.data} />
}

function Edicion({ torneo }: { torneo: Torneo }) {
  const volver = useVolver('/torneos')
  const guardar = useGuardarTorneo(torneo.id)
  const eliminar = useEliminarTorneo()
  const [nombre, setNombre] = useState(torneo.nombre)
  const [fecha, setFecha] = useState(torneo.fecha)
  const [lugar, setLugar] = useState(torneo.lugar ?? '')

  function enviar(e: FormEvent) {
    e.preventDefault()
    guardar.mutate(
      { nombre: nombre.trim(), fecha, lugar: lugar.trim() || null },
      { onSuccess: volver },
    )
  }

  function borrar() {
    if (!window.confirm(`¿Eliminar el torneo "${torneo.nombre}"?`)) return
    eliminar.mutate(torneo.id, { onSuccess: volver })
  }

  return (
    <form onSubmit={enviar} className="space-y-6">
      <div className="space-y-3">
        <Volver alternativa="/torneos" texto="Cancelar" />
        <Titulo>Editar torneo</Titulo>
      </div>

      <Campo etiqueta="Nombre">
        <Input required maxLength={150} value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </Campo>
      {/* div y no Campo (<label>): el selector contiene sus propios botones. */}
      <div className="space-y-1.5">
        <span className="block text-sm font-semibold text-texto-suave">Fecha</span>
        <SelectorFecha
          etiqueta="Fecha del torneo"
          saltoAnual
          min="1950-01-01"
          max={hoyISO()}
          valor={fecha}
          onChange={setFecha}
        />
      </div>
      <Campo etiqueta="Lugar (opcional)">
        <Input maxLength={150} value={lugar} onChange={(e) => setLugar(e.target.value)} />
      </Campo>

      <MensajeError error={guardar.error} />
      <Boton type="submit" cargando={guardar.isPending} className="w-full">
        Guardar cambios
      </Boton>

      <div className="space-y-2 border-t border-borde pt-6">
        <MensajeError error={eliminar.error} />
        <Boton variante="peligro" cargando={eliminar.isPending} onClick={borrar} className="w-full">
          Eliminar torneo
        </Boton>
        <p className="text-xs text-texto-suave">
          Solo se puede eliminar si nadie tiene participaciones en él.
        </p>
      </div>
    </form>
  )
}
