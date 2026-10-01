import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'

import { useTecnicas } from '../api/queries'
import type { Categoria, Posicion } from '../api/types'
import { Paginacion } from '../components/Paginacion'
import { Cargando, Chip, Etiqueta, Input, MensajeError, Select, Titulo } from '../components/ui'
import { CATEGORIAS, POSICIONES, normalizar } from '../lib/formato'
import { POR_PAGINA, conFiltro, rango, usePaginaURL } from '../lib/paginacion'

function esCategoria(valor: string | null): valor is Categoria {
  return valor !== null && valor in CATEGORIAS
}

function esPosicion(valor: string | null): valor is Posicion {
  return valor !== null && valor in POSICIONES
}

export function Tecnicas() {
  const tecnicas = useTecnicas()
  const [params, setParams] = useSearchParams()

  // Filtros en la URL: se conservan al volver desde el detalle de una técnica.
  const q = params.get('q') ?? ''
  const categoria = esCategoria(params.get('categoria')) ? params.get('categoria') : null
  const posicion = esPosicion(params.get('posicion')) ? params.get('posicion') : null

  function setFiltro(clave: string, valor: string | null) {
    setParams((actual) => conFiltro(actual, clave, valor), {
      replace: true,
      preventScrollReset: true,
    })
  }

  // El catálogo es pequeño y ya está en caché (lo usa el formulario de clase):
  // filtrar aquí es instantáneo y permite buscar sin tildes.
  const lista = useMemo(() => {
    const termino = normalizar(q)
    return (tecnicas.data ?? []).filter(
      (t) =>
        (!termino || normalizar(t.nombre).includes(termino)) &&
        (!categoria || t.categoria === categoria) &&
        (!posicion || t.posicion === posicion),
    )
  }, [tecnicas.data, q, categoria, posicion])

  // Paginación en el navegador: la lista completa ya está cargada.
  const pagina = usePaginaURL()
  const visibles = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  const { desde, hasta } = rango(pagina, lista.length)

  const hayFiltros = Boolean(q || categoria || posicion)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <Titulo>Técnicas</Titulo>
        <Link
          to="/tecnicas/nueva"
          className="inline-flex min-h-10 items-center rounded-xl border border-acento px-4 text-sm font-bold text-acento hover:bg-acento hover:text-black"
        >
          + Nueva
        </Link>
      </div>

      <section aria-label="Filtros" className="space-y-3">
        <Input
          type="search"
          placeholder="Buscar (armbar, triangulo, knee cut…)"
          value={q}
          onChange={(e) => setFiltro('q', e.target.value)}
        />
        <div className="scrollbar-oculta -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip activo={!categoria} onClick={() => setFiltro('categoria', null)}>
            Todas
          </Chip>
          {(Object.keys(CATEGORIAS) as Categoria[]).map((c) => (
            <Chip
              key={c}
              activo={categoria === c}
              onClick={() => setFiltro('categoria', categoria === c ? null : c)}
            >
              {CATEGORIAS[c]}
            </Chip>
          ))}
        </div>
        <Select
          aria-label="Posición"
          value={posicion ?? ''}
          onChange={(e) => setFiltro('posicion', e.target.value || null)}
        >
          <option value="">Todas las posiciones</option>
          {(Object.keys(POSICIONES) as Posicion[]).map((p) => (
            <option key={p} value={p}>
              {POSICIONES[p]}
            </option>
          ))}
        </Select>
        <div className="flex items-center justify-between text-sm">
          <span className="text-texto-suave">
            {tecnicas.data &&
              lista.length > 0 &&
              `${desde}–${hasta} de ${lista.length}${hayFiltros ? ` · ${tecnicas.data.length} en total` : ''}`}
          </span>
          {hayFiltros && (
            <button
              type="button"
              onClick={() => setParams({}, { replace: true, preventScrollReset: true })}
              className="font-semibold text-acento hover:underline"
            >
              Quitar filtros
            </button>
          )}
        </div>
      </section>

      <MensajeError error={tecnicas.error} onReintentar={() => void tecnicas.refetch()} />

      {tecnicas.isPending ? (
        <Cargando texto="Cargando técnicas…" />
      ) : lista.length === 0 ? (
        !tecnicas.isError && (
          <div className="rounded-2xl border border-dashed border-borde-fuerte px-6 py-12 text-center">
            <p className="font-display text-2xl font-bold uppercase">Sin resultados</p>
            <p className="mt-2 text-texto-suave">
              {q ? (
                <>
                  ¿No está?{' '}
                  <Link
                    to={`/tecnicas/nueva?nombre=${encodeURIComponent(q.trim())}`}
                    className="font-bold text-acento hover:underline"
                  >
                    Crea «{q.trim()}»
                  </Link>
                </>
              ) : (
                'Prueba con otros filtros.'
              )}
            </p>
          </div>
        )
      ) : (
        <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde">
          {visibles.map((t) => (
            <li key={t.id}>
              <Link
                to={`/tecnicas/${t.id}`}
                className="flex min-h-16 items-center justify-between gap-3 bg-superficie px-4 py-3 hover:bg-superficie-alta"
              >
                <span className="min-w-0">
                  <span className="block font-semibold">{t.nombre}</span>
                  <span className="text-sm text-texto-suave">{POSICIONES[t.posicion]}</span>
                </span>
                <Etiqueta>{CATEGORIAS[t.categoria]}</Etiqueta>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {tecnicas.data && <Paginacion pagina={pagina} total={lista.length} />}
    </div>
  )
}
