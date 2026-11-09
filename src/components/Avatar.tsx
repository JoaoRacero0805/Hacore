export function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  if (src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} referrerPolicy="no-referrer" className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  return (
    <span
      className="rounded-full bg-marinho text-creme font-semibold inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials || "?"}
    </span>
  );
}
