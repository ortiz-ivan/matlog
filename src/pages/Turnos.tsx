import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import {
  useDesactivarTurno,
  useGuardarTurno,
  useTodosLosTurnos,
  useTurno,
} from '../api/queries'
import type { Modalidad, Turno, TurnoDia } from '../api/types'
import { SelectorHora } from '../components/SelectorHora'
import { Boton, Campo, Cargando, Etiqueta, Input, MensajeError, Titulo } from '../components/ui'
import { Volver } from '../components/Volver'
import { DIAS_CORTOS, DIAS_SEMANA } from '../lib/calendario'
import { COLOR_MODALIDAD, MODALIDADES, horario } from '../lib/formato'
import { hayPantallaAnterior, useVolver } from '../lib/navegacion'

/** /turnos — horario semanal de la academia (solo admins). */
export function Turnos() {
  const turnos = useTodosLosTurnos()

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <Titulo>Turnos</Titulo>
        <Link
          to="/turnos/nuevo"
          className="inline-flex min-h-10 items-center rounded-xl border border-acento px-4 text-sm font-bold text-acento hover:bg-acento hover:text-black"
        >
          + Nuevo
        </Link>
      </div>
      <p className="text-texto-suave">
        El horario semanal de la academia: qué días hay clase en cada turno y con qué modalidad.
        Es lo que todos ven en el calendario.
      </p>

      <MensajeError error={turnos.error} onReintentar={() => void turnos.refetch()} />
      {turnos.isPending ? (
        <Cargando />
      ) : (
        <ul className="space-y-3">
          {turnos.data?.map((t) => (
            <li key={t.id}>
              <Link
                to={`/turnos/${t.id}`}
                className={`block space-y-3 rounded-2xl border border-borde bg-superficie p-4 hover:border-borde-fuerte ${
                  t.activo ? '' : 'opacity-60'
                }`}
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{t.nombre}</span>
                  <span className="text-texto-suave">{horario(t.hora_inicio, t.hora_fin)}</span>
                  {!t.activo && <Etiqueta>Desactivado</Etiqueta>}
                </span>
                <SemanaResumen dias={t.dias} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** L M X J V S D, coloreando los días con clase según su modalidad. */
function SemanaResumen({ dias }: { dias: TurnoDia[] }) {
  return (
    <span className="grid grid-cols-7 gap-1" aria-label={describirSemana(dias)}>
      {DIAS_CORTOS.map((letra, dia) => {
        const programa = dias.find((d) => d.dia === dia)
        return (
          <span
            key={dia}
            aria-hidden
            className={`grid h-8 place-items-center rounded-md text-xs font-bold ${
              programa
                ? `${COLOR_MODALIDAD[programa.modalidad].fondo} text-black`
                : 'border border-borde text-texto-suave/50'
            }`}
          >
            {letra}
          </span>
        )
      })}
    </span>
  )
}

function describirSemana(dias: TurnoDia[]): string {
  if (dias.length === 0) return 'Sin días asignados'
  return dias.map((d) => `${DIAS_SEMANA[d.dia]} ${MODALIDADES[d.modalidad]}`).join(', ')
}

// --- Formulario ---

/** /turnos/nuevo y /turnos/:id */
export function TurnoFormulario() {
  const { id } = useParams()
  if (id === undefined) return <Formulario />
  return <Edicion id={Number(id)} />
}

function Edicion({ id }: { id: number }) {
  const turno = useTurno(id)
  if (turno.isPending) return <Cargando />
  if (turno.isError) {
    return (
      <div className="space-y-4">
        <Volver alternativa="/turnos" />
        <MensajeError error={turno.error} onReintentar={() => void turno.refetch()} />
      </div>
    )
  }
  return <Formulario turno={turno.data} />
}

const LUNES_A_SABADO: TurnoDia[] = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, modalidad: 'GI' }))

function Formulario({ turno }: { turno?: Turno }) {
  const navigate = useNavigate()
  const volver = useVolver('/turnos')
  const guardar = useGuardarTurno(turno?.id)
  const desactivar = useDesactivarTurno()

  const [nombre, setNombre] = useState(turno?.nombre ?? '')
  const [inicio, setInicio] = useState(turno?.hora_inicio.slice(0, 5) ?? '')
  const [fin, setFin] = useState(turno?.hora_fin.slice(0, 5) ?? '')
  const [dias, setDias] = useState<TurnoDia[]>(turno?.dias ?? LUNES_A_SABADO)

  const horaInvalida = inicio !== '' && fin !== '' && fin <= inicio

  function alternarDia(dia: number) {
    setDias((actuales) =>
      actuales.some((d) => d.dia === dia)
        ? actuales.filter((d) => d.dia !== dia)
        : [...actuales, { dia, modalidad: 'GI' as Modalidad }].sort((a, b) => a.dia - b.dia),
    )
  }

  function cambiarModalidad(dia: number, modalidad: Modalidad) {
    setDias((actuales) => actuales.map((d) => (d.dia === dia ? { ...d, modalidad } : d)))
  }

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (horaInvalida || !inicio || !fin) return
    guardar.mutate(
      { nombre: nombre.trim(), hora_inicio: inicio, hora_fin: fin, dias },
      {
        onSuccess: (guardado) => {
          if (turno && hayPantallaAnterior()) navigate(-1)
          else navigate(`/turnos/${guardado.id}`, { replace: true })
        },
      },
    )
  }

  function borrar() {
    if (!turno) return
    const aviso = `¿Desactivar "${turno.nombre}"? Dejará de aparecer en el calendario y en el formulario de clase. Las clases ya registradas se conservan.`
    if (!window.confirm(aviso)) return
    desactivar.mutate(turno.id, { onSuccess: volver })
  }

  return (
    <form onSubmit={enviar} className="space-y-6">
      <div className="space-y-3">
        <Volver alternativa="/turnos" texto="Cancelar" />
        <Titulo>{turno ? 'Editar turno' : 'Nuevo turno'}</Titulo>
        {turno && !turno.activo && (
          <p className="rounded-xl bg-acento-suave px-4 py-3 text-sm font-semibold text-black">
            Este turno está desactivado. Al guardar se vuelve a activar.
          </p>
        )}
      </div>

      <Campo etiqueta="Nombre">
        <Input
          required
          maxLength={100}
          placeholder="Ej.: Turno 1"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </Campo>

      {/* div y no Campo (<label>): el selector contiene sus propios botones. */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <span className="block text-sm font-semibold text-texto-suave">Empieza</span>
          <SelectorHora etiqueta="Hora de inicio" valor={inicio} onChange={setInicio} />
        </div>
        <div className="space-y-1.5">
          <span className="block text-sm font-semibold text-texto-suave">Termina</span>
          <SelectorHora
            etiqueta="Hora de fin"
            valor={fin}
            onChange={setFin}
            invalido={horaInvalida}
            alinear="derecha"
          />
        </div>
      </div>
      {horaInvalida && (
        <p className="-mt-3 text-sm text-peligro">La hora de fin debe ser posterior a la de inicio.</p>
      )}

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-semibold text-texto-suave">
          Días y modalidad
        </legend>
        <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde">
          {DIAS_SEMANA.map((nombreDia, dia) => {
            const programa = dias.find((d) => d.dia === dia)
            return (
              <li key={dia} className="flex min-h-14 items-center justify-between gap-3 bg-superficie px-4">
                <label className="flex flex-1 cursor-pointer items-center gap-3 py-3">
                  <input
                    type="checkbox"
                    checked={Boolean(programa)}
                    onChange={() => alternarDia(dia)}
                    className="size-5 accent-[var(--color-acento)]"
                  />
                  <span className={programa ? 'font-semibold' : 'text-texto-suave'}>{nombreDia}</span>
                </label>
                {programa && (
                  <span className="flex gap-1" role="radiogroup" aria-label={`Modalidad del ${nombreDia.toLowerCase()}`}>
                    {(Object.keys(MODALIDADES) as Modalidad[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        role="radio"
                        aria-checked={programa.modalidad === m}
                        onClick={() => cambiarModalidad(dia, m)}
                        className={`min-h-9 rounded-lg px-3 text-sm font-bold transition-colors ${
                          programa.modalidad === m
                            ? `${COLOR_MODALIDAD[m].fondo} text-black`
                            : 'border border-borde-fuerte text-texto-suave hover:text-texto'
                        }`}
                      >
                        {MODALIDADES[m]}
                      </button>
                    ))}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
        {dias.length === 0 && (
          <p className="text-sm text-texto-suave">
            Sin días marcados, el turno no aparecerá en el calendario.
          </p>
        )}
      </fieldset>

      <MensajeError error={guardar.error} />
      <Boton type="submit" cargando={guardar.isPending} disabled={horaInvalida || !inicio || !fin} className="w-full">
        {turno ? 'Guardar cambios' : 'Crear turno'}
      </Boton>

      {turno?.activo && (
        <div className="space-y-3 border-t border-borde pt-6">
          <MensajeError error={desactivar.error} />
          <Boton variante="peligro" cargando={desactivar.isPending} onClick={borrar} className="w-full">
            Desactivar turno
          </Boton>
        </div>
      )}
    </form>
  )
}
