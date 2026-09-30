import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { useClase, useGuardarClase, useTurnos } from '../api/queries'
import type { Clase, Modalidad, TecnicaResumen, Turno } from '../api/types'
import { SelectorTecnicas } from '../components/SelectorTecnicas'
import {
  Boton,
  Campo,
  Cargando,
  Chip,
  Input,
  MensajeError,
  Textarea,
  Titulo,
} from '../components/ui'
import { MODALIDADES, hoyISO, horario, turnoSugerido } from '../lib/formato'

/** /clases/nueva y /clases/:id/editar */
export function ClaseFormulario() {
  const { id } = useParams()
  const turnos = useTurnos()

  if (id === undefined) {
    if (turnos.isPending) return <Cargando />
    if (turnos.isError) {
      return <MensajeError error={turnos.error} onReintentar={() => void turnos.refetch()} />
    }
    return <Formulario turnos={turnos.data} />
  }
  return <Edicion id={Number(id)} turnos={turnos.data} />
}

function Edicion({ id, turnos }: { id: number; turnos: Turno[] | undefined }) {
  const clase = useClase(id)
  if (clase.isPending || !turnos) return <Cargando />
  if (clase.isError) {
    return <MensajeError error={clase.error} onReintentar={() => void clase.refetch()} />
  }
  return <Formulario turnos={turnos} clase={clase.data} />
}

function Formulario({ turnos, clase }: { turnos: Turno[]; clase?: Clase }) {
  const navigate = useNavigate()
  const guardar = useGuardarClase(clase?.id)

  const [fecha, setFecha] = useState(clase?.fecha ?? hoyISO())
  const [turnoId, setTurnoId] = useState(clase?.turno.id ?? turnoSugerido(turnos)?.id)
  const [modalidad, setModalidad] = useState<Modalidad>(clase?.modalidad ?? 'GI')
  const [tema, setTema] = useState(clase?.tema ?? '')
  const [tecnicas, setTecnicas] = useState<TecnicaResumen[]>(clase?.tecnicas ?? [])
  const [instructor, setInstructor] = useState(clase?.instructor ?? '')
  const [notas, setNotas] = useState(clase?.notas ?? '')
  const [videoUrl, setVideoUrl] = useState(clase?.video_url ?? '')

  // Al editar, el turno puede estar desactivado: se mantiene como opción.
  const opcionesTurno =
    clase && !turnos.some((t) => t.id === clase.turno.id)
      ? [...turnos, { ...clase.turno, hora_inicio: clase.hora_inicio, hora_fin: clase.hora_fin, activo: false }]
      : turnos

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (turnoId === undefined) return
    const texto = (valor: string) => valor.trim() || null
    guardar.mutate(
      {
        fecha,
        turno_id: turnoId,
        modalidad,
        tema: tema.trim(),
        instructor: texto(instructor),
        notas: texto(notas),
        video_url: texto(videoUrl),
        tecnica_ids: tecnicas.map((t) => t.id),
      },
      { onSuccess: (guardada) => navigate(`/clases/${guardada.id}`, { replace: true }) },
    )
  }

  const volverA = clase ? `/clases/${clase.id}` : '/clases'

  if (turnos.length === 0) {
    return (
      <p className="text-texto-suave">
        No hay turnos activos. Un admin tiene que crear al menos uno antes de registrar clases.
      </p>
    )
  }

  return (
    <form onSubmit={enviar} className="space-y-6">
      <div className="space-y-3">
        <Link to={volverA} className="inline-block text-sm font-semibold text-texto-suave hover:text-texto">
          ← Cancelar
        </Link>
        <Titulo>{clase ? 'Editar clase' : 'Nueva clase'}</Titulo>
      </div>

      <Campo etiqueta="Fecha">
        <Input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </Campo>

      <fieldset className="space-y-1.5">
        <legend className="mb-1.5 text-sm font-semibold text-texto-suave">Turno</legend>
        <div className="grid grid-cols-2 gap-2">
          {opcionesTurno.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={turnoId === t.id}
              onClick={() => setTurnoId(t.id)}
              className={`min-h-16 rounded-xl border px-3 text-left transition-colors ${
                turnoId === t.id
                  ? 'border-acento bg-acento text-black'
                  : 'border-borde bg-superficie hover:border-borde-fuerte'
              }`}
            >
              <span className="block font-bold">{t.nombre}</span>
              <span className={`text-sm ${turnoId === t.id ? 'text-black/70' : 'text-texto-suave'}`}>
                {horario(t.hora_inicio, t.hora_fin)}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

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

      <Campo etiqueta="Tema">
        <Input
          required
          maxLength={200}
          placeholder="Ej.: Guardia cerrada"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
        />
      </Campo>

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-texto-suave">Técnicas</legend>
        <SelectorTecnicas seleccionadas={tecnicas} onChange={setTecnicas} />
      </fieldset>

      <details className="group rounded-xl border border-borde" open={Boolean(clase)}>
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 font-semibold text-texto-suave">
          Más detalles (opcional)
          <span className="transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="space-y-4 border-t border-borde p-4">
          <Campo etiqueta="Instructor">
            <Input
              maxLength={100}
              placeholder="Quién dio la clase"
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
            />
          </Campo>
          <Campo etiqueta="Notas">
            <Textarea
              placeholder="Detalles, variantes, puntos clave…"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </Campo>
          <Campo etiqueta="Video">
            <Input
              type="url"
              placeholder="https://…"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </Campo>
        </div>
      </details>

      <MensajeError error={guardar.error} />

      <Boton type="submit" cargando={guardar.isPending} className="w-full">
        {clase ? 'Guardar cambios' : 'Guardar clase'}
      </Boton>
    </form>
  )
}
