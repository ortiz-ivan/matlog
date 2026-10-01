import { useEffect, type RefObject } from 'react'

/**
 * Mientras `abierto`, llama a `cerrar` al tocar fuera de `contenedor` o al pulsar
 * Escape (en ese caso devuelve el foco a `alEscape`, normalmente el botón que lo abrió).
 */
export function useCerrarAlSalir(
  abierto: boolean,
  cerrar: () => void,
  contenedor: RefObject<HTMLElement | null>,
  alEscape?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!abierto) return
    function alPulsar(e: PointerEvent) {
      if (!contenedor.current?.contains(e.target as Node)) cerrar()
    }
    function alTeclear(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        cerrar()
        alEscape?.current?.focus()
      }
    }
    document.addEventListener('pointerdown', alPulsar)
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('pointerdown', alPulsar)
      document.removeEventListener('keydown', alTeclear)
    }
  }, [abierto, cerrar, contenedor, alEscape])
}
