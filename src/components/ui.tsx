import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

function cx(...clases: (string | false | null | undefined)[]) {
  return clases.filter(Boolean).join(' ')
}

// --- Botones ---

const VARIANTES = {
  primario: 'bg-acento text-black hover:bg-acento-hover font-bold',
  secundario: 'border border-borde-fuerte text-texto hover:border-texto-suave',
  fantasma: 'text-texto-suave hover:text-texto',
  peligro: 'border border-peligro/60 text-peligro hover:bg-peligro/10',
}

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: keyof typeof VARIANTES
  cargando?: boolean
}

export function Boton({
  variante = 'primario',
  cargando = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: BotonProps) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      className={cx(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-base transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTES[variante],
        className,
      )}
      {...props}
    >
      {cargando && <Spinner />}
      {children}
    </button>
  )
}

// --- Formularios ---

const CAMPO =
  'w-full min-h-12 rounded-xl border border-borde bg-superficie px-4 text-base text-texto ' +
  'placeholder:text-texto-suave/60 focus:border-acento focus:outline-none'

export function Campo({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string
  ayuda?: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-texto-suave">{etiqueta}</span>
      {children}
      {ayuda && <span className="block text-xs text-texto-suave/80">{ayuda}</span>}
    </label>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(CAMPO, className)} {...props} />
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(CAMPO, 'appearance-none pr-10', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(CAMPO, 'min-h-28 py-3', className)} {...props} />
}

/** Interruptor sí/no con su explicación. */
export function Interruptor({
  etiqueta,
  ayuda,
  activo,
  onChange,
  disabled = false,
}: {
  etiqueta: string
  ayuda?: string
  activo: boolean
  onChange: (activo: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      disabled={disabled}
      onClick={() => onChange(!activo)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-borde bg-superficie p-4 text-left disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span>
        <span className="block font-semibold">{etiqueta}</span>
        {ayuda && <span className="block text-sm text-texto-suave">{ayuda}</span>}
      </span>
      <span
        aria-hidden
        className={cx(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
          activo ? 'bg-acento' : 'bg-borde-fuerte',
        )}
      >
        <span
          className={cx(
            'absolute top-1 size-5 rounded-full transition-all',
            activo ? 'left-6 bg-black' : 'left-1 bg-texto-suave',
          )}
        />
      </span>
    </button>
  )
}

// --- Chips y etiquetas ---

export function Chip({
  activo = false,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { activo?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      className={cx(
        'min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors',
        activo
          ? 'border-acento bg-acento text-black'
          : 'border-borde-fuerte text-texto-suave hover:text-texto',
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Etiqueta({ children, acento = false }: { children: ReactNode; acento?: boolean }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide',
        acento ? 'bg-acento text-black' : 'bg-superficie-alta text-texto-suave',
      )}
    >
      {children}
    </span>
  )
}

// --- Estados ---

export function Spinner() {
  return (
    <span
      aria-hidden
      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  )
}

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-texto-suave">
      <Spinner />
      {texto}
    </div>
  )
}

export function MensajeError({
  error,
  onReintentar,
}: {
  error: Error | null
  onReintentar?: () => void
}) {
  if (!error) return null
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-peligro"
    >
      <span>{error.message}</span>
      {onReintentar && (
        <button type="button" onClick={onReintentar} className="shrink-0 font-bold underline">
          Reintentar
        </button>
      )}
    </div>
  )
}

export function Titulo({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1 className={cx('font-display text-4xl font-extrabold uppercase leading-none', className)}>
      {children}
    </h1>
  )
}
