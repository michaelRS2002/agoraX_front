// Lightweight relative time formatter for Spanish (Bogotá - GMT-5)
export function formatRelativeTime(isoTimestamp?: string | null): string {
  if (!isoTimestamp) return "";
  const ts = Date.parse(String(isoTimestamp));
  if (Number.isNaN(ts)) return String(isoTimestamp);

  const now = Date.now();
  const diffSeconds = Math.floor((now - ts) / 1000);

  if (diffSeconds < 5) return "Justo ahora";
  if (diffSeconds < 60) return `hace ${diffSeconds} segundo${diffSeconds === 1 ? "" : "s"}`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `hace ${diffMinutes} minuto${diffMinutes === 1 ? "" : "s"}`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours === 1 ? "" : "s"}`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `hace ${diffDays} día${diffDays === 1 ? "" : "s"}`;

  // Fallback: show localized date/time in Bogotá timezone (America/Bogota, GMT-5)
  try {
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Bogota",
    }).format(new Date(ts));
  } catch (e) {
    return new Date(ts).toLocaleString();
  }
}

export default formatRelativeTime;
