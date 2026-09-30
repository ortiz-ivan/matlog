import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'

import type { Cinturon } from '../api/types'
import { useAuth } from '../auth/context'
import { Logo } from '../components/Logo'
import { Boton, Campo, Input, MensajeError, Select } from '../components/ui'
import { CINTURONES } from '../lib/formato'

function PantallaAcceso({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <Logo className="text-5xl" />
      <p className="mt-2 text-texto-suave">Lo que vimos en cada clase, en un solo sitio.</p>
      <h1 className="mt-10 mb-6 font-display text-2xl font-bold uppercase">{titulo}</h1>
      {children}
    </main>
  )
}

/** Ejecuta un envío de formulario guardando el estado de carga y el error. */
function useEnvio() {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  async function enviar(e: FormEvent, accion: () => Promise<void>) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      await accion()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error inesperado'))
      setEnviando(false)
    }
  }

  return { enviando, error, enviar }
}

export function Login() {
  const { login } = useAuth()
  const { enviando, error, enviar } = useEnvio()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  return (
    <PantallaAcceso titulo="Iniciar sesión">
      <form onSubmit={(e) => enviar(e, () => login(username, password))} className="space-y-4">
        <Campo etiqueta="Usuario">
          <Input
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Campo>
        <Campo etiqueta="Contraseña">
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Campo>
        <MensajeError error={error} />
        <Boton type="submit" cargando={enviando} className="w-full">
          Entrar
        </Boton>
      </form>
      <p className="mt-8 text-center text-sm text-texto-suave">
        ¿Primera vez?{' '}
        <Link to="/registro" className="font-bold text-acento hover:underline">
          Crea tu cuenta
        </Link>
      </p>
    </PantallaAcceso>
  )
}

export function Registro() {
  const { registro } = useAuth()
  const { enviando, error, enviar } = useEnvio()
  const [datos, setDatos] = useState({
    nombre: '',
    username: '',
    email: '',
    password: '',
    cinturon: '' as Cinturon | '',
    codigo_invitacion: '',
  })

  const cambiar =
    (campo: keyof typeof datos) =>
    (e: { target: { value: string } }) =>
      setDatos((d) => ({ ...d, [campo]: e.target.value }))

  return (
    <PantallaAcceso titulo="Crear cuenta">
      <form
        onSubmit={(e) =>
          enviar(e, () =>
            registro({ ...datos, cinturon: datos.cinturon === '' ? null : datos.cinturon }),
          )
        }
        className="space-y-4"
      >
        <Campo etiqueta="Nombre">
          <Input
            autoComplete="name"
            required
            maxLength={100}
            value={datos.nombre}
            onChange={cambiar('nombre')}
          />
        </Campo>
        <Campo
          etiqueta="Usuario"
          ayuda="Con él inicias sesión. 3 a 30 caracteres: letras, números, punto, guion o guion bajo."
        >
          <Input
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            minLength={3}
            maxLength={30}
            pattern="[A-Za-z0-9._\-]+"
            title="Letras sin tildes, números, punto, guion o guion bajo"
            value={datos.username}
            onChange={cambiar('username')}
          />
        </Campo>
        <Campo etiqueta="Email">
          <Input
            type="email"
            autoComplete="email"
            required
            value={datos.email}
            onChange={cambiar('email')}
          />
        </Campo>
        <Campo etiqueta="Contraseña" ayuda="Mínimo 8 caracteres.">
          <Input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={datos.password}
            onChange={cambiar('password')}
          />
        </Campo>
        <Campo etiqueta="Cinturón (opcional)">
          <Select value={datos.cinturon} onChange={cambiar('cinturon')}>
            <option value="">—</option>
            {Object.entries(CINTURONES).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo etiqueta="Código de invitación" ayuda="Pídeselo a un compañero de la academia.">
          <Input
            required
            autoComplete="off"
            value={datos.codigo_invitacion}
            onChange={cambiar('codigo_invitacion')}
          />
        </Campo>
        <MensajeError error={error} />
        <Boton type="submit" cargando={enviando} className="w-full">
          Crear cuenta
        </Boton>
      </form>
      <p className="mt-8 text-center text-sm text-texto-suave">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-bold text-acento hover:underline">
          Inicia sesión
        </Link>
      </p>
    </PantallaAcceso>
  )
}
