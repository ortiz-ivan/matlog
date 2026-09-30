import { createContext, useContext } from 'react'

import type { Registro, Usuario } from '../api/types'

export interface Auth {
  /** null mientras no hay sesión. */
  usuario: Usuario | null
  /** true mientras se comprueba un token guardado al abrir la app. */
  cargando: boolean
  /** Error al comprobar la sesión que no es "token inválido" (p. ej. servidor caído). */
  error: Error | null
  reintentar: () => void
  login: (username: string, password: string) => Promise<void>
  registro: (datos: Registro) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<Auth | null>(null)

export function useAuth(): Auth {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return auth
}
