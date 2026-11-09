import type { Notice } from "@/lib/store/types";
import { formatDateLong } from "@/lib/time";

export function NoticeCard({ n }: { n: Notice }) {
  return (
    <article className={`card p-4 ${n.pinned ? "border-laranja/60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-lg leading-snug">{n.title}</h3>
        {n.pinned && <span className="badge badge-orange">Fixado</span>}
      </div>
      {n.body && <p className="mt-2 whitespace-pre-line text-[0.95rem] leading-relaxed">{n.body}</p>}
      {n.linkUrl && (
        <a href={n.linkUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block font-semibold text-laranja underline">
          Abrir link ↗
        </a>
      )}
      <p className="mt-3 text-xs text-muted">Publicado em {formatDateLong(n.createdAt)}</p>
    </article>
  );
}
