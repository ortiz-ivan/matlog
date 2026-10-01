import { useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { useGuardarTecnica, useTecnica } from '../api/queries'
import type { Categoria, Posicion, Tecnica } from '../api/types'
import {
  Boton,
  Campo,
  Cargando,
  Input,
  MensajeError,
  Select,
  Textarea,
  Titulo,
} from '../components/ui'
import { Volver } from '../components/Volver'
import { CATEGORIAS, POSICIONES } from '../lib/formato'
import { hayPantallaAnterior } from '../lib/navegacion'

/** /tecnicas/nueva (admite ?nombre=) y /tecnicas/:id/editar */
export function TecnicaFormulario() {
  const { id } = useParams()
  if (id === undefined) return <Formulario />
  return <Edicion id={Number(id)} />
}

function Edicion({ id }: { id: number }) {
  const tecnica = useTecnica(id)
  if (tecnica.isPending) return <Cargando />
  if (tecnica.isError) {
    return <MensajeError error={tecnica.error} onReintentar={() => void tecnica.refetch()} />
  }
  return <Formulario tecnica={tecnica.data} />
}

function Formulario({ tecnica }: { tecnica?: Tecnica }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const guardar = useGuardarTecnica(tecnica?.id)

  const [nombre, setNombre] = useState(tecnica?.nombre ?? params.get('nombre') ?? '')
  const [categoria, setCategoria] = useState<Categoria>(tecnica?.categoria ?? 'FINALIZACION')
  const [posicion, setPosicion] = useState<Posicion>(tecnica?.posicion ?? 'GUARDIA_CERRADA')
  const [descripcion, setDescripcion] = useState(tecnica?.descripcion ?? '')
  const [videoUrl, setVideoUrl] = useState(tecnica?.video_url ?? '')

  function enviar(e: FormEvent) {
    e.preventDefault()
    guardar.mutate(
      {
        nombre: nombre.trim(),
        categoria,
        posicion,
        descripcion: descripcion.trim() || null,
        video_url: videoUrl.trim() || null,
      },
      {
        onSuccess: (guardada) => {
          // Igual que en clases: editar vuelve atrás, crear sustituye el formulario.
          if (tecnica && hayPantallaAnterior()) navigate(-1)
          else navigate(`/tecnicas/${guardada.id}`, { replace: true })
        },
      },
    )
  }

  return (
    <form onSubmit={enviar} className="space-y-6">
      <div className="space-y-3">
        <Volver alternativa={tecnica ? `/tecnicas/${tecnica.id}` : '/tecnicas'} texto="Cancelar" />
        <Titulo>{tecnica ? 'Editar técnica' : 'Nueva técnica'}</Titulo>
      </div>

      <Campo etiqueta="Nombre">
        <Input
          required
          maxLength={150}
          placeholder="Ej.: Armbar desde guardia cerrada"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Categoría">
          <Select value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)}>
            {Object.entries(CATEGORIAS).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo etiqueta="Posición">
          <Select value={posicion} onChange={(e) => setPosicion(e.target.value as Posicion)}>
            {Object.entries(POSICIONES).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </Select>
        </Campo>
      </div>

      <Campo etiqueta="Descripción (opcional)">
        <Textarea
          className="min-h-40"
          placeholder="Pasos, detalles clave, errores comunes…"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </Campo>

      <Campo etiqueta="Video (opcional)">
        <Input
          type="url"
          placeholder="https://…"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
      </Campo>

      <MensajeError error={guardar.error} />

      <Boton type="submit" cargando={guardar.isPending} className="w-full">
        {tecnica ? 'Guardar cambios' : 'Crear técnica'}
      </Boton>
    </form>
  )
}
