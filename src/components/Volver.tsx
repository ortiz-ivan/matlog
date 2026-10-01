import { useVolver } from '../lib/navegacion'

/** "← Volver" a la pantalla anterior; si no la hay, a `alternativa`. */
export function Volver({ alternativa, texto = 'Volver' }: { alternativa: string; texto?: string }) {
  const volver = useVolver(alternativa)
  return (
    <button
      type="button"
      onClick={volver}
      className="-ml-1 inline-flex min-h-10 items-center gap-1 px-1 text-sm font-semibold text-texto-suave hover:text-texto"
    >
      <span aria-hidden>←</span> {texto}
    </button>
  )
}
