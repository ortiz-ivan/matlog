import { Link } from 'react-router'

import { useClases } from '../api/queries'
import type { Clase, TecnicaResumen } from '../api/types'
import { useAuth } from '../auth/context'
import { Cargando, Etiqueta, MensajeError } from '../components/ui'
import { MODALIDADES, fechaRelativa, horario, lunesISO } from '../lib/formato'

const MAX_RECIENTES = 12

/** "/" — responde a "¿qué vimos hoy?" y da acceso rápido a lo reciente. */
export function Inicio() {
  const { usuario } = useAuth()
  // Igual que la página 1 del historial sin filtros: comparten caché, sin peticiones extra.
  const clases = useClases({})
  const recientes = clases.data?.items ?? []

  const nombre = usuario?.nombre.trim().split(/\s+/)[0]

  if (clases.isPending) return <Cargando />

  // Clases del día más reciente (puede haber varias: Turno 1 y Turno 2).
  const ultimaFecha = recientes[0]?.fecha
  const delUltimoDia = recientes.filter((c) => c.fecha === ultimaFecha)
  const anteriores = recientes.filter((c) => c.fecha !== ultimaFecha)

  const lunes = lunesISO()
  const deLaSemana = recientes.filter((c) => c.fecha >= lunes)

  return (
    <div className="space-y-10">
      <h1 className="font-display text-4xl font-extrabold uppercase leading-none">
        Hola{nombre ? <>, <span className="text-acento">{nombre}</span></> : ''}
      </h1>

      <MensajeError error={clases.error} onReintentar={() => void clases.refetch()} />

      {!clases.isError && recientes.length === 0 ? (
        <Bienvenida />
      ) : (
        <>
          <section className="space-y-3" aria-labelledby="ultima">
            <h2 id="ultima" className="font-display text-xl font-bold uppercase text-texto-suave">
              {ultimaFecha && fechaRelativa(ultimaFecha) === 'Hoy'
                ? 'Hoy'
                : delUltimoDia.length > 1
                  ? 'Últimas clases'
                  : 'Última clase'}
            </h2>
            <ul className="space-y-3">
              {delUltimoDia.map((c) => (
                <li key={c.id}>
                  <ClaseDestacada clase={c} />
                </li>
              ))}
            </ul>
          </section>

          <ResumenSemana clases={deLaSemana} />

          <TecnicasRecientes clases={anteriores} />

          <Link
            to="/clases"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-borde-fuerte font-semibold hover:border-texto-suave"
          >
            Ver historial de clases <span aria-hidden>→</span>
          </Link>
        </>
      )}
    </div>
  )
}

function ClaseDestacada({ clase }: { clase: Clase }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-borde bg-superficie">
      <Link to={`/clases/${clase.id}`} className="block space-y-2 p-5 hover:bg-superficie-alta">
        <p className="flex flex-wrap items-center gap-2 text-sm text-texto-suave">
          <span className="font-semibold text-acento">{fechaRelativa(clase.fecha)}</span>
          <span>·</span>
          <span className="font-semibold text-texto">{clase.turno.nombre}</span>
          <span>{horario(clase.hora_inicio, clase.hora_fin)}</span>
          <Etiqueta>{MODALIDADES[clase.modalidad]}</Etiqueta>
        </p>
        <h3 className="font-display text-3xl font-extrabold uppercase leading-tight">{clase.tema}</h3>
        {clase.instructor && <p className="text-sm text-texto-suave">Con {clase.instructor}</p>}
      </Link>
      {clase.tecnicas.length > 0 ? (
        <ul className="flex flex-wrap gap-2 border-t border-borde p-4">
          {clase.tecnicas.map((t) => (
            <li key={t.id}>
              <ChipTecnica tecnica={t} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-t border-borde p-4 text-sm text-texto-suave">
          Sin técnicas registradas.{' '}
          <Link to={`/clases/${clase.id}/editar`} className="font-bold text-acento hover:underline">
            Añadirlas
          </Link>
        </p>
      )}
    </article>
  )
}

function ResumenSemana({ clases }: { clases: Clase[] }) {
  const tecnicas = new Set(clases.flatMap((c) => c.tecnicas.map((t) => t.id)))
  return (
    <section aria-label="Esta semana" className="grid grid-cols-2 gap-3">
      <Dato valor={clases.length} texto={clases.length === 1 ? 'clase esta semana' : 'clases esta semana'} />
      <Dato valor={tecnicas.size} texto={tecnicas.size === 1 ? 'técnica esta semana' : 'técnicas esta semana'} />
    </section>
  )
}

function Dato({ valor, texto }: { valor: number; texto: string }) {
  return (
    <div className="rounded-2xl border border-borde bg-superficie p-4">
      <p className="font-display text-4xl font-extrabold text-acento">{valor}</p>
      <p className="text-sm text-texto-suave">{texto}</p>
    </div>
  )
}

function TecnicasRecientes({ clases }: { clases: Clase[] }) {
  // Únicas, de la más reciente a la más antigua (las clases ya vienen ordenadas).
  const vistas = new Map<number, TecnicaResumen>()
  for (const c of clases) for (const t of c.tecnicas) if (!vistas.has(t.id)) vistas.set(t.id, t)
  const lista = [...vistas.values()].slice(0, MAX_RECIENTES)
  if (lista.length === 0) return null

  return (
    <section className="space-y-3" aria-labelledby="recientes">
      <h2 id="recientes" className="font-display text-xl font-bold uppercase text-texto-suave">
        Vistas recientemente
      </h2>
      <ul className="flex flex-wrap gap-2">
        {lista.map((t) => (
          <li key={t.id}>
            <ChipTecnica tecnica={t} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function ChipTecnica({ tecnica }: { tecnica: TecnicaResumen }) {
  return (
    <Link
      to={`/tecnicas/${tecnica.id}`}
      className="inline-flex min-h-10 items-center rounded-full border border-borde-fuerte px-4 text-sm font-semibold hover:border-acento hover:text-acento"
    >
      {tecnica.nombre}
    </Link>
  )
}

function Bienvenida() {
  const puedeRegistrar = useAuth().usuario?.es_admin ?? false
  return (
    <div className="space-y-6 rounded-2xl border border-dashed border-borde-fuerte px-6 py-10 text-center">
      <div className="space-y-2">
        <p className="font-display text-2xl font-bold uppercase">Aún no hay clases</p>
        <p className="text-texto-suave">
          {puedeRegistrar
            ? 'Registra la primera y aquí verás lo que se vio en cada entrenamiento.'
            : 'Cuando un admin registre la primera, aquí verás lo que se vio en cada entrenamiento.'}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {puedeRegistrar && (
          <Link
            to="/clases/nueva"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-acento px-5 font-bold text-black hover:bg-acento-hover"
          >
            Registrar clase
          </Link>
        )}
        <Link
          to="/tecnicas"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-borde-fuerte px-5 font-semibold hover:border-texto-suave"
        >
          Explorar técnicas
        </Link>
      </div>
    </div>
  )
}
