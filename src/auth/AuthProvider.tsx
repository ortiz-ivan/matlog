import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { api, onSesionExpirada, tokenStore } from '../api/client'
import type { Registro, Token, Usuario } from '../api/types'
import { AuthContext, type Auth } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const [token, setToken] = useState(tokenStore.get)

  const me = useQuery({
    queryKey: ['me', token],
    queryFn: () => api<Usuario>('/api/auth/me'),
    enabled: token !== null,
    staleTime: Infinity,
  })

  const iniciarSesion = useCallback((nuevo: Token) => {
    tokenStore.set(nuevo.access_token)
    setToken(nuevo.access_token)
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setToken(null)
    qc.clear()
  }, [qc])

  useEffect(() => onSesionExpirada(logout), [logout])

  const auth = useMemo<Auth>(
    () => ({
      usuario: token ? (me.data ?? null) : null,
      cargando: token !== null && me.isPending,
      error: token ? me.error : null,
      reintentar: () => void me.refetch(),
      logout,
      login: async (username, password) => {
        // El backend usa el formulario estándar de OAuth2 (application/x-www-form-urlencoded).
        iniciarSesion(
          await api<Token>('/api/auth/login', { method: 'POST', form: { username, password } }),
        )
      },
      registro: async (datos: Registro) => {
        iniciarSesion(await api<Token>('/api/auth/registro', { method: 'POST', json: datos }))
      },
    }),
    [token, me, logout, iniciarSesion],
  )

  return <AuthContext value={auth}>{children}</AuthContext>
}
