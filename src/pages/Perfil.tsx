import { useState, type FormEvent, type ReactNode } from 'react'

import { useActualizarPerfil, useCambiarPassword } from '../api/queries'
import type { Cinturon, PerfilActualizar, Usuario } from '../api/types'
import { useAuth } from '../auth/context'
import { Boton, Campo, Etiqueta, Input, MensajeError, Select, Titulo } from '../components/ui'
import { Volver } from '../components/Volver'
import { CINTURONES, iniciales } from '../lib/formato'

/** /perfil — cada usuario edita sus datos y su contraseña. */
export function Perfil() {
  const { usuario } = useAuth()
  // ConSesion garantiza la sesión; esto solo satisface al tipado.
  if (!usuario) return null

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <Volver alternativa="/" />
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="grid size-16 shrink-0 place-items-center rounded-full bg-acento font-display text-2xl font-extrabold text-black"
          >
            {iniciales(usuario.nombre)}
          </span>
          <div className="min-w-0">
            <Titulo className="truncate">{usuario.nombre}</Titulo>
            <p className="mt-1 truncate text-texto-suave">@{usuario.username}</p>
          </div>
        </div>
        {usuario.es_admin && <Etiqueta acento>Admin</Etiqueta>}
      </div>

      <DatosPersonales usuario={usuario} />
      <CambiarPassword />
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-borde bg-superficie p-5">
      <h2 className="font-display text-xl font-bold uppercase">{titulo}</h2>
      {children}
    </section>
  )
}

function Aviso({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="rounded-xl bg-acento-suave px-4 py-3 text-sm font-semibold text-black">
      {children}
    </p>
  )
}

function DatosPersonales({ usuario }: { usuario: Usuario }) {
  const actualizar = useActualizarPerfil()
  const [nombre, setNombre] = useState(usuario.nombre)
  const [cinturon, setCinturon] = useState<Cinturon | ''>(usuario.cinturon ?? '')

  const cambios: PerfilActualizar = {}
  if (nombre.trim() !== usuario.nombre) cambios.nombre = nombre.trim()
  if ((cinturon || null) !== usuario.cinturon) cambios.cinturon = cinturon || null
  const hayCambios = Object.keys(cambios).length > 0

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (hayCambios) actualizar.mutate(cambios)
  }

  return (
    <Seccion titulo="Tus datos">
      <form onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Nombre">
          <Input
            required
            maxLength={100}
            autoComplete="name"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value)
              actualizar.reset()
            }}
          />
        </Campo>
        <Campo etiqueta="Cinturón">
          <Select
            value={cinturon}
            onChange={(e) => {
              setCinturon(e.target.value as Cinturon | '')
              actualizar.reset()
            }}
          >
            <option value="">—</option>
            {Object.entries(CINTURONES).map(([v, texto]) => (
              <option key={v} value={v}>
                {texto}
              </option>
            ))}
          </Select>
        </Campo>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-texto-suave">Usuario</dt>
            <dd className="font-semibold">@{usuario.username}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-texto-suave">Email</dt>
            <dd className="truncate font-semibold">{usuario.email}</dd>
          </div>
        </dl>
        <p className="text-xs text-texto-suave">
          El usuario y el email solo puede cambiarlos un admin.
        </p>

        <MensajeError error={actualizar.error} />
        {actualizar.isSuccess && <Aviso>Datos guardados.</Aviso>}
        <Boton type="submit" cargando={actualizar.isPending} disabled={!hayCambios} className="w-full">
          Guardar datos
        </Boton>
      </form>
    </Seccion>
  )
}

function CambiarPassword() {
  const cambiar = useCambiarPassword()
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetida, setRepetida] = useState('')

  const noCoinciden = repetida !== '' && nueva !== repetida

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (nueva !== repetida) return
    cambiar.mutate(
      { actual, nueva },
      {
        onSuccess: () => {
          setActual('')
          setNueva('')
          setRepetida('')
        },
      },
    )
  }

  function al(setter: (v: string) => void) {
    return (e: { target: { value: string } }) => {
      setter(e.target.value)
      cambiar.reset()
    }
  }

  return (
    <Seccion titulo="Cambiar contraseña">
      <form onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Contraseña actual">
          <Input
            type="password"
            required
            autoComplete="current-password"
            value={actual}
            onChange={al(setActual)}
          />
        </Campo>
        <Campo etiqueta="Nueva contraseña" ayuda="Mínimo 8 caracteres.">
          <Input
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            value={nueva}
            onChange={al(setNueva)}
          />
        </Campo>
        <Campo etiqueta="Repite la nueva contraseña">
          <Input
            type="password"
            required
            autoComplete="new-password"
            aria-invalid={noCoinciden}
            value={repetida}
            onChange={al(setRepetida)}
          />
        </Campo>
        {noCoinciden && <p className="text-sm text-peligro">Las contraseñas no coinciden.</p>}

        <MensajeError error={cambiar.error} />
        {cambiar.isSuccess && <Aviso>Contraseña cambiada. Úsala la próxima vez que entres.</Aviso>}
        <Boton
          type="submit"
          cargando={cambiar.isPending}
          disabled={noCoinciden}
          className="w-full"
        >
          Cambiar contraseña
        </Boton>
      </form>
    </Seccion>
  )
}
