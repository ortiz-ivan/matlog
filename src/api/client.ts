import { config } from '../config'

const TOKEN_KEY = 'matlog.token'

// localStorage puede no estar disponible (modo privado, bloqueos): nunca debe romper la app.
export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // sin persistencia: la sesión dura lo que la pestaña
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // nada que limpiar
    }
  },
}

/**
 * true si el token ya ha consumido la mitad de su vida y conviene renovarlo.
 *
 * Lee iat/exp sin verificar la firma: no es una comprobación de seguridad (eso lo hace
 * el backend), solo decide cuándo pedir uno nuevo. Al final de la sesión el backend
 * emite tokens cada vez más cortos; con el mínimo de 5 min no se piden en bucle.
 */
export function debeRenovar(token: string, ahora = Date.now() / 1000): boolean {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { iat, exp } = JSON.parse(atob(base64)) as { iat?: unknown; exp?: unknown }
    if (typeof iat !== 'number' || typeof exp !== 'number') return false
    return ahora - iat >= Math.max((exp - iat) / 2, 5 * 60)
  } catch {
    return false
  }
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let alExpirarSesion: (() => void) | null = null

/** Se llama cuando el backend rechaza el token (expirado o usuario desactivado). */
export function onSesionExpirada(fn: () => void) {
  alExpirarSesion = fn
}

interface Opciones extends Omit<RequestInit, 'body'> {
  json?: unknown
  form?: Record<string, string>
}

export async function api<T>(ruta: string, { json, form, ...init }: Opciones = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const token = tokenStore.get()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let body: BodyInit | undefined
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(json)
  } else if (form) {
    body = new URLSearchParams(form)
  }

  let res: Response
  try {
    res = await fetch(`${config.apiUrl}${ruta}`, { ...init, headers, body })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor')
  }

  if (res.status === 401 && token) alExpirarSesion?.()
  if (!res.ok) throw new ApiError(res.status, await mensajeDeError(res))
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

interface ErrorValidacion {
  loc: (string | number)[]
  msg: string
}

async function mensajeDeError(res: Response): Promise<string> {
  try {
    const { detail } = (await res.json()) as { detail?: string | ErrorValidacion[] }
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((e) => `${e.loc.at(-1)}: ${e.msg}`).join('. ')
    }
  } catch {
    // respuesta sin JSON
  }
  return `Error inesperado (${res.status})`
}
