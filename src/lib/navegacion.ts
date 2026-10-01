import { useCallback } from 'react'
import { useNavigate } from 'react-router'

/**
 * ¿Hay una pantalla anterior de la app en el historial de esta pestaña?
 *
 * React Router guarda en history.state un índice `idx`: 0 en la primera pantalla
 * que se abrió, +1 en cada navegación y sin cambios con `replace` (por eso la
 * redirección tras el login no cuenta como pantalla anterior).
 */
export function hayPantallaAnterior(): boolean {
  const idx: unknown = (window.history.state as { idx?: unknown } | null)?.idx
  return typeof idx === 'number' && idx > 0
}

/**
 * Vuelve a la pantalla anterior tal como estaba (filtros incluidos, porque viven
 * en la URL). Si se llegó por un enlace directo o recargando, va a `alternativa`.
 */
export function useVolver(alternativa: string) {
  const navigate = useNavigate()
  return useCallback(() => {
    if (hayPantallaAnterior()) navigate(-1)
    else navigate(alternativa, { replace: true })
  }, [navigate, alternativa])
}
