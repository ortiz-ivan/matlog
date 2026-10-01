import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'

import { useActualizarUsuario, useCrearUsuario, useUsuario } from '../api/queries'
import type { Cinturon, Usuario, UsuarioActualizar } from '../api/types'
import { useAuth } from '../auth/context'
import {
  Boton,
  Campo,
  Cargando,
  Input,
  Interruptor,
  MensajeError,
  Select,
  Titulo,
} from '../components/ui'
import { Volver } from '../components/Volver'
import { CINTURONES } from '../lib/formato'
import { useVolver } from '../lib/navegacion'

/** /usuarios/nuevo y /usuarios/:id — solo admins. */
export function UsuarioFormulario() {
  const { id } = useParams()
  if (id === undefined) return <Alta />
  return <Edicion id={Number(id)} />
}

/** Contraseña inicial legible (sin 0/O ni 1/l/I) para dictarla o copiarla. */
function generarPassword(longitud = 10): string {
  const letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const aleatorios = crypto.getRandomValues(new Uint32Array(longitud))
  return Array.from(aleatorios, (n) => letras[n % letras.length]).join('')
}

function SelectorCinturon({
  valor,
  onChange,
}: {
  valor: Cinturon | ''
  onChange: (v: Cinturon | '') => void
}) {
  return (
    <Select value={valor} onChange={(e) => onChange(e.target.value as Cinturon | '')}>
      <option value="">—</option>
      {Object.entries(CINTURONES).map(([v, texto]) => (
        <option key={v} value={v}>
          {texto}
        </option>
      ))}
    </Select>
  )
}

// --- Alta ---

function Alta() {
  const crear = useCrearUsuario()
  const [datos, setDatos] = useState({
    nombre: '',
    username: '',
    email: '',
    password: generarPassword(),
    cinturon: '' as Cinturon | '',
    es_admin: false,
  })

  function cambiar<K extends keyof typeof datos>(campo: K, valor: (typeof datos)[K]) {
    setDatos((d) => ({ ...d, [campo]: valor }))
  }

  function enviar(e: FormEvent) {
    e.preventDefault()
    crear.mutate({
      ...datos,
      nombre: datos.nombre.trim(),
      cinturon: datos.cinturon === '' ? null : datos.cinturon,
    })
  }

  if (crear.isSuccess) {
    return (
      <CuentaCreada
        usuario={crear.data}
        password={datos.password}
        onOtra={() => {
          crear.reset()
          setDatos({ nombre: '', username: '', email: '', password: generarPassword(), cinturon: '', es_admin: false })
        }}
      />
    )
  }

  return (
    <form onSubmit={enviar} className="space-y-6">
      <div className="space-y-3">
        <Volver alternativa="/usuarios" texto="Cancelar" />
        <Titulo>Nuevo usuario</Titulo>
      </div>

      <Campo etiqueta="Nombre">
        <Input
          required
          maxLength={100}
          autoComplete="off"
          value={datos.nombre}
          onChange={(e) => cambiar('nombre', e.target.value)}
        />
      </Campo>
      <Campo etiqueta="Usuario" ayuda="Con él inicia sesión. 3 a 30 caracteres: letras, números, . - _">
        <Input
          required
          minLength={3}
          maxLength={30}
          pattern="[A-Za-z0-9._\-]+"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          value={datos.username}
          onChange={(e) => cambiar('username', e.target.value)}
        />
      </Campo>
      <Campo etiqueta="Email">
        <Input
          type="email"
          required
          autoComplete="off"
          value={datos.email}
          onChange={(e) => cambiar('email', e.target.value)}
        />
      </Campo>
      <Campo
        etiqueta="Contraseña inicial"
        ayuda="Se la tendrás que pasar. Puedes dejar la generada o escribir otra (mín. 8)."
      >
        <div className="flex gap-2">
          <Input
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            className="font-mono"
            value={datos.password}
            onChange={(e) => cambiar('password', e.target.value)}
          />
          <Boton variante="secundario" onClick={() => cambiar('password', generarPassword())}>
            Generar
          </Boton>
        </div>
      </Campo>
      <Campo etiqueta="Cinturón (opcional)">
        <SelectorCinturon valor={datos.cinturon} onChange={(v) => cambiar('cinturon', v)} />
      </Campo>
      <Interruptor
        etiqueta="Administrador"
        ayuda="Puede gestionar usuarios y borrar clases y técnicas."
        activo={datos.es_admin}
        onChange={(v) => cambiar('es_admin', v)}
      />

      <MensajeError error={crear.error} />
      <Boton type="submit" cargando={crear.isPending} className="w-full">
        Crear usuario
      </Boton>
    </form>
  )
}

function CuentaCreada({
  usuario,
  password,
  onOtra,
}: {
  usuario: Usuario
  password: string
  onOtra: () => void
}) {
  const [copiado, setCopiado] = useState(false)
  const texto = `Usuario: ${usuario.username}\nContraseña: ${password}`

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
    } catch {
      // Sin permiso para el portapapeles: los datos siguen visibles en pantalla.
    }
  }

  return (
    <div className="space-y-6">
      <Titulo>Cuenta creada</Titulo>
      <p className="text-texto-suave">
        Pásale estos datos a <span className="font-semibold text-texto">{usuario.nombre}</span>. La
        contraseña no se vuelve a mostrar.
      </p>
      <dl className="space-y-3 rounded-2xl bg-acento-suave p-5 font-mono text-black">
        <div>
          <dt className="text-xs font-bold uppercase">Usuario</dt>
          <dd className="text-lg font-bold">{usuario.username}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase">Contraseña</dt>
          <dd className="text-lg font-bold break-all">{password}</dd>
        </div>
      </dl>
      <div className="grid gap-3 sm:grid-cols-3">
        <Boton onClick={copiar}>{copiado ? '¡Copiado!' : 'Copiar datos'}</Boton>
        <Boton variante="secundario" onClick={onOtra}>
          Crear otro
        </Boton>
        <Link
          to="/usuarios"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-borde-fuerte font-semibold hover:border-texto-suave"
        >
          Ver usuarios
        </Link>
      </div>
    </div>
  )
}

// --- Edición ---

function Edicion({ id }: { id: number }) {
  const usuario = useUsuario(id)
  if (usuario.isPending) return <Cargando />
  if (usuario.isError) {
    return (
      <div className="space-y-4">
        <Volver alternativa="/usuarios" />
        <MensajeError error={usuario.error} onReintentar={() => void usuario.refetch()} />
      </div>
    )
  }
  return <FormularioEdicion usuario={usuario.data} />
}

function FormularioEdicion({ usuario }: { usuario: Usuario }) {
  const { usuario: yo } = useAuth()
  const esYo = yo?.id === usuario.id
  const actualizar = useActualizarUsuario(usuario.id)
  const volver = useVolver('/usuarios')

  const [nombre, setNombre] = useState(usuario.nombre)
  const [cinturon, setCinturon] = useState<Cinturon | ''>(usuario.cinturon ?? '')
  const [esAdmin, setEsAdmin] = useState(usuario.es_admin)
  const [activo, setActivo] = useState(usuario.activo)
  const [password, setPassword] = useState('')

  function enviar(e: FormEvent) {
    e.preventDefault()
    // Solo lo que cambió: el backend aplica cambios parciales.
    const cambios: UsuarioActualizar = {}
    if (nombre.trim() !== usuario.nombre) cambios.nombre = nombre.trim()
    if ((cinturon || null) !== usuario.cinturon) cambios.cinturon = cinturon || null
    if (esAdmin !== usuario.es_admin) cambios.es_admin = esAdmin
    if (activo !== usuario.activo) cambios.activo = activo
    if (password) cambios.password = password
    actualizar.mutate(cambios, { onSuccess: volver })
  }

  return (
    <form onSubmit={enviar} className="space-y-6">
      <div className="space-y-3">
        <Volver alternativa="/usuarios" texto="Cancelar" />
        <Titulo>{usuario.nombre}</Titulo>
        <p className="text-texto-suave">
          @{usuario.username} · {usuario.email}
        </p>
      </div>

      <Campo etiqueta="Nombre">
        <Input required maxLength={100} value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </Campo>
      <Campo etiqueta="Cinturón">
        <SelectorCinturon valor={cinturon} onChange={setCinturon} />
      </Campo>

      <div className="space-y-3">
        <Interruptor
          etiqueta="Administrador"
          ayuda={
            esYo
              ? 'No puedes quitarte el admin a ti mismo.'
              : 'Puede gestionar usuarios y borrar clases y técnicas.'
          }
          activo={esAdmin}
          onChange={setEsAdmin}
          disabled={esYo}
        />
        <Interruptor
          etiqueta="Cuenta activa"
          ayuda={
            esYo
              ? 'No puedes desactivar tu propia cuenta.'
              : 'Si la desactivas, no podrá iniciar sesión. Sus clases se conservan.'
          }
          activo={activo}
          onChange={setActivo}
          disabled={esYo}
        />
      </div>

      <Campo
        etiqueta="Nueva contraseña (opcional)"
        ayuda="Solo si la ha olvidado. Déjala vacía para no cambiarla."
      >
        <Input
          type="text"
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className="font-mono"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Campo>

      <MensajeError error={actualizar.error} />
      <Boton type="submit" cargando={actualizar.isPending} className="w-full">
        Guardar cambios
      </Boton>
    </form>
  )
}
