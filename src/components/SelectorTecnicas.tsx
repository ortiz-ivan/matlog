import { useId, useMemo, useState } from 'react'

import { useGuardarTecnica, useTecnicas } from '../api/queries'
import type { Categoria, Posicion, TecnicaResumen } from '../api/types'
import { CATEGORIAS, POSICIONES, normalizar } from '../lib/formato'
import { Boton, Input, MensajeError, Select, Spinner } from './ui'

const MAX_RESULTADOS = 8

interface Props {
  seleccionadas: TecnicaResumen[]
  onChange: (tecnicas: TecnicaResumen[]) => void
}

export function SelectorTecnicas({ seleccionadas, onChange }: Props) {
  const tecnicas = useTecnicas()
  const [busqueda, setBusqueda] = useState('')
  const [creando, setCreando] = useState(false)
  const idLista = useId()

  const idsSeleccionadas = useMemo(() => new Set(seleccionadas.map((t) => t.id)), [seleccionadas])
  const termino = normalizar(busqueda)

  const resultados = useMemo(() => {
    if (!termino) return []
    return (tecnicas.data ?? [])
      .filter((t) => !idsSeleccionadas.has(t.id) && normalizar(t.nombre).includes(termino))
      .slice(0, MAX_RESULTADOS)
  }, [tecnicas.data, termino, idsSeleccionadas])

  const existeExacta = (tecnicas.data ?? []).some((t) => normalizar(t.nombre) === termino)

  function agregar(tecnica: TecnicaResumen) {
    onChange([...seleccionadas, tecnica])
    setBusqueda('')
    setCreando(false)
  }

  return (
    <div className="space-y-3">
      {seleccionadas.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Técnicas seleccionadas">
          {seleccionadas.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-1 rounded-full bg-acento py-1 pr-1 pl-3 text-sm font-semibold text-black"
            >
              {t.nombre}
              <button
                type="button"
                aria-label={`Quitar ${t.nombre}`}
                onClick={() => onChange(seleccionadas.filter((s) => s.id !== t.id))}
                className="grid size-7 place-items-center rounded-full hover:bg-black/15"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <Input
          type="search"
          role="combobox"
          aria-expanded={resultados.length > 0}
          aria-controls={idLista}
          placeholder="Buscar técnica (armbar, knee cut…)"
          maxLength={100}
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setCreando(false)
          }}
          onKeyDown={(e) => {
            // Enter elige el primer resultado en lugar de enviar el formulario.
            if (e.key === 'Enter' && termino) {
              e.preventDefault()
              if (resultados[0]) agregar(resultados[0])
            }
          }}
        />
        {tecnicas.isPending && (
          <span className="absolute top-1/2 right-4 -translate-y-1/2 text-texto-suave">
            <Spinner />
          </span>
        )}
      </div>

      <MensajeError error={tecnicas.error} onReintentar={() => void tecnicas.refetch()} />

      {termino && (
        <ul id={idLista} className="divide-y divide-borde overflow-hidden rounded-xl border border-borde">
          {resultados.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => agregar(t)}
                className="flex min-h-12 w-full items-center justify-between gap-3 bg-superficie px-4 text-left hover:bg-superficie-alta"
              >
                <span>{t.nombre}</span>
                <span className="shrink-0 text-xs text-texto-suave">{CATEGORIAS[t.categoria]}</span>
              </button>
            </li>
          ))}
          {!existeExacta && !creando && (
            <li>
              <button
                type="button"
                onClick={() => setCreando(true)}
                className="flex min-h-12 w-full items-center bg-superficie px-4 text-left font-semibold text-acento hover:bg-superficie-alta"
              >
                + Crear «{busqueda.trim()}»
              </button>
            </li>
          )}
        </ul>
      )}

      {creando && (
        <NuevaTecnica
          nombre={busqueda.trim()}
          onCreada={agregar}
          onCancelar={() => setCreando(false)}
        />
      )}
    </div>
  )
}

function NuevaTecnica({
  nombre,
  onCreada,
  onCancelar,
}: {
  nombre: string
  onCreada: (t: TecnicaResumen) => void
  onCancelar: () => void
}) {
  const crear = useGuardarTecnica()
  const [categoria, setCategoria] = useState<Categoria>('FINALIZACION')
  const [posicion, setPosicion] = useState<Posicion>('GUARDIA_CERRADA')

  // No es un <form>: estaría anidado dentro del formulario de la clase.
  return (
    <div className="space-y-3 rounded-xl border border-acento/50 bg-superficie p-4">
      <p className="font-semibold">
        Nueva técnica: <span className="text-acento">{nombre}</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-sm text-texto-suave">
          <span>Categoría</span>
          <Select value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)}>
            {Object.entries(CATEGORIAS).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm text-texto-suave">
          <span>Posición</span>
          <Select value={posicion} onChange={(e) => setPosicion(e.target.value as Posicion)}>
            {Object.entries(POSICIONES).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <MensajeError error={crear.error} />
      <div className="flex gap-3">
        <Boton
          className="flex-1"
          cargando={crear.isPending}
          onClick={() => crear.mutate({ nombre, categoria, posicion }, { onSuccess: onCreada })}
        >
          Crear y añadir
        </Boton>
        <Boton variante="fantasma" onClick={onCancelar}>
          Cancelar
        </Boton>
      </div>
    </div>
  )
}
