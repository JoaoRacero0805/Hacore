import Link from "next/link";

export function Pager({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 mt-4">
      {page > 1 ? <Link className="btn btn-secondary" href={href(page - 1)}>← Anterior</Link> : <span />}
      <span className="text-sm text-muted">Página {page} de {pages}</span>
      {page < pages ? <Link className="btn btn-secondary" href={href(page + 1)}>Próxima →</Link> : <span />}
    </div>
  );
}
