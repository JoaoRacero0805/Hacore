/** Monograma "H" do Hacoré (traço do meio inclinado). Troque por /public/logo.png se quiser o logo oficial. */
export function Monogram({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="var(--laranja)" />
      <path d="M20 12h9l-4 40h-9z M39 12h9l-4 40h-9z" fill="#fff" />
      <path d="M14 36l36-10v8l-36 10z" fill="#fff" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <Monogram size={34} />
      <span className="display text-2xl text-ink">Hacoré</span>
    </span>
  );
}
