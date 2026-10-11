import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router'

import {
  useActualizarParticipacion,
  useCompaneros,
  useCrearParticipacion,
  useGuardarTorneo,
  useParticipacion,
  useTorneos,
} from '../api/queries'
import type { Medalla, Modalidad, Participacion } from '../api/types'
import { useAuth } from '../auth/context'
import { IconoMedalla } from '../components/Medallas'
import { SelectorFecha } from '../components/SelectorFecha'
import { Boton, Campo, Cargando, Chip, Input, MensajeError, Select, Titulo } from '../components/ui'
import { Volver } from '../components/Volver'
import { MEDALLAS, MODALIDADES, formatoFechaCorta, hoyISO } from '../lib/formato'
import { useVolver } from '../lib/navegacion'

const NUEVO = 'nuevo'

/** /mis-torneos/nueva y /mis-torneos/:id — registrar o corregir una participación. */
export function ParticipacionFormulario() {
  const { id } = useParams()
  if (id === undefined) return <Formulario />
  return <Edicion id={Number(id)} />
}

function Edicion({ id }: { id: number }) {
  const participacion = useParticipacion(id)
  if (participacion.isPending) return <Cargando />
  if (participacion.isError) {
    return (
      <div className="space-y-4">
        <Volver alternativa="/mis-torneos" />
        <MensajeError error={participacion.error} onReintentar={() => void participacion.refetch()} />
      </div>
    )
  }
  return <Formulario participacion={participacion.data} />
}

function Formulario({ participacion }: { participacion?: Participacion }) {
  const { usuario } = useAuth()
  const esAdmin = usuario?.es_admin ?? false
  const volver = useVolver('/mis-torneos')
  const torneos = useTorneos()
  // Solo un admin registra participaciones de otros, y solo al crearlas.
  const companeros = useCompaneros()
  const elegirCompanero = esAdmin && participacion === undefined

  const crear = useCrearParticipacion()
  const actualizar = useActualizarParticipacion(participacion?.id ?? 0)
  const guardarTorneo = useGuardarTorneo()

  const [usuarioId, setUsuarioId] = useState(usuario?.id ?? 0)
  const [torneoId, setTorneoId] = useState(participacion ? String(participacion.torneo.id) : '')
  const [nuevoTorneo, setNuevoTorneo] = useState({ nombre: '', fecha: '', lugar: '' })
  const [modalidad, setModalidad] = useState<Modalidad>(participacion?.modalidad ?? 'GI')
  const [categoria, setCategoria] = useState(participacion?.categoria ?? '')
  const [medalla, setMedalla] = useState<Medalla | null>(participacion?.medalla ?? null)

  const esNuevo = torneoId === NUEVO
  const enviando = crear.isPending || actualizar.isPending || guardarTorneo.isPending
  const error = guardarTorneo.error ?? crear.error ?? actualizar.error
  const faltaFecha = esNuevo && !nuevoTorneo.fecha

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (faltaFecha) return
    guardarTorneo.reset()
    crear.reset()
    actualizar.reset()
    try {
      // Un torneo que no está en la lista se da de alta antes.
      const torneo_id = esNuevo
        ? (
            await guardarTorneo.mutateAsync({
              nombre: nuevoTorneo.nombre.trim(),
              fecha: nuevoTorneo.fecha,
              lugar: nuevoTorneo.lugar.trim() || null,
            })
          ).id
        : Number(torneoId)
      // Si el torneo se creó pero la participación falla, ya queda elegido en la lista.
      if (esNuevo) setTorneoId(String(torneo_id))
      const datos = { torneo_id, modalidad, categoria: categoria.trim(), medalla }
      if (participacion) await actualizar.mutateAsync(datos)
      else await crear.mutateAsync(elegirCompanero ? { ...datos, usuario_id: usuarioId } : datos)
      volver()
    } catch {
      // El error queda en la mutación correspondiente y se muestra abajo.
    }
  }

  if (participacion?.estado === 'APROBADA' && !esAdmin) {
    return (
      <div className="space-y-4">
        <Volver alternativa="/mis-torneos" />
        <p className="text-texto-suave">Esta participación ya está aprobada: pide a un admin que la corrija.</p>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="space-y-6">
      <div className="space-y-3">
        <Volver alternativa="/mis-torneos" texto="Cancelar" />
        <Titulo>{participacion ? 'Editar participación' : 'Nueva participación'}</Titulo>
        {!esAdmin && (
          <p className="text-texto-suave">
            {participacion?.estado === 'RECHAZADA'
              ? 'Al guardar vuelve a revisión.'
              : 'Un admin la revisará antes de que aparezca en tu ficha.'}
          </p>
        )}
      </div>

      {elegirCompanero && (
        <Campo etiqueta="Compañero">
          <Select value={usuarioId} onChange={(e) => setUsuarioId(Number(e.target.value))}>
            {companeros.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
                {c.id === usuario?.id ? ' (tú)' : ''}
              </option>
            ))}
          </Select>
        </Campo>
      )}

      <Campo etiqueta="Torneo">
        <Select required value={torneoId} onChange={(e) => setTorneoId(e.target.value)}>
          <option value="" disabled>
            {torneos.isPending ? 'Cargando torneos…' : 'Elige un torneo'}
          </option>
          <option value={NUEVO}>+ Otro torneo (no está en la lista)</option>
          {torneos.data?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre} · {formatoFechaCorta(t.fecha)}
            </option>
          ))}
        </Select>
      </Campo>

      {esNuevo && (
        <fieldset className="space-y-4 rounded-2xl border border-borde bg-superficie p-4">
          <legend className="px-1 text-sm font-semibold text-texto-suave">Torneo nuevo</legend>
          <Campo etiqueta="Nombre">
            <Input
              required
              maxLength={150}
              placeholder="Ej.: Open Asunción 2026"
              value={nuevoTorneo.nombre}
              onChange={(e) => setNuevoTorneo((t) => ({ ...t, nombre: e.target.value }))}
            />
          </Campo>
          {/* div y no Campo (<label>): el selector contiene sus propios botones. */}
          <div className="space-y-1.5">
            <span className="block text-sm font-semibold text-texto-suave">Fecha</span>
            <SelectorFecha
              etiqueta="Fecha del torneo"
              saltoAnual
              min="1950-01-01"
              max={hoyISO()}
              valor={nuevoTorneo.fecha}
              onChange={(fecha) => setNuevoTorneo((t) => ({ ...t, fecha }))}
            />
          </div>
          <Campo etiqueta="Lugar (opcional)">
            <Input
              maxLength={150}
              value={nuevoTorneo.lugar}
              onChange={(e) => setNuevoTorneo((t) => ({ ...t, lugar: e.target.value }))}
            />
          </Campo>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-texto-suave">Modalidad</legend>
        <div className="flex gap-2">
          {(Object.keys(MODALIDADES) as Modalidad[]).map((m) => (
            <Chip key={m} activo={modalidad === m} onClick={() => setModalidad(m)}>
              {MODALIDADES[m]}
            </Chip>
          ))}
        </div>
      </fieldset>

      <Campo etiqueta="Categoría" ayuda="Como la nombra el torneo: edad, cinturón y peso, o absoluto.">
        <Input
          required
          maxLength={100}
          placeholder="Ej.: Adulto azul pluma"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        />
      </Campo>

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-texto-suave">Resultado</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MEDALLAS) as Medalla[]).map((m) => (
            <Chip key={m} activo={medalla === m} onClick={() => setMedalla(m)}>
              <span className="flex items-center gap-2">
                <IconoMedalla medalla={m} className="h-6" />
                {MEDALLAS[m]}
              </span>
            </Chip>
          ))}
          <Chip activo={medalla === null} onClick={() => setMedalla(null)}>
            Sin medalla
          </Chip>
        </div>
      </fieldset>

      {faltaFecha && <p className="text-sm text-texto-suave">Elige la fecha del torneo nuevo.</p>}
      <MensajeError error={error} />
      <Boton type="submit" cargando={enviando} disabled={faltaFecha} className="w-full">
        {participacion ? 'Guardar cambios' : esAdmin ? 'Registrar' : 'Enviar a revisión'}
      </Boton>
    </form>
  )
}
