import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { api, debeRenovar, onSesionExpirada, tokenStore } from '../api/client'
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

  // El token dura poco (JWT_EXPIRE_MINUTES en el backend): se renueva mientras la app se
  // usa. Solo cambia el token guardado, no el estado: sigue siendo la misma sesión y así
  // no se vuelve a pedir /me.
  useEffect(() => {
    if (token === null) return
    let renovando = false
    const revisar = async () => {
      const actual = tokenStore.get()
      if (renovando || document.hidden || !actual || !debeRenovar(actual)) return
      renovando = true
      try {
        const nuevo = await api<Token>('/api/auth/renovar', { method: 'POST' })
        // Si entretanto se cerró sesión (o cambió el token), no resucitarla.
        if (tokenStore.get() === actual) tokenStore.set(nuevo.access_token)
      } catch {
        // Sin conexión: se reintenta en la próxima revisión. Un 401 ya cierra la sesión.
      } finally {
        renovando = false
      }
    }
    void revisar()
    const intervalo = setInterval(revisar, 60_000)
    document.addEventListener('visibilitychange', revisar)
    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', revisar)
    }
  }, [token])

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
