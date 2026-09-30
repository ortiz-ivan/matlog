export function Logo({ className = 'text-2xl' }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold uppercase tracking-tight ${className}`}>
      Mat<span className="text-acento">Log</span>
    </span>
  )
}
