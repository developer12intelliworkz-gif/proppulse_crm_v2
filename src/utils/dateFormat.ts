const IST = "Asia/Kolkata";

function partsFromDateInIst(d: Date): { year: number; month: number; day: number } {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const [y, m, day] = iso.split("-").map(Number);
  return { year: y, month: m, day: day };
}

/** Extract calendar Y-M-D without timezone day-shift (for PG DATE / API strings). */
export function extractCalendarParts(
  dateVal: string | Date | null | undefined,
): { year: number; month: number; day: number } | null {
  if (dateVal == null || dateVal === "") return null;

  if (typeof dateVal === "string") {
    const trimmed = dateVal.trim();

    // API date-only string — use calendar day as stored
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split("-").map(Number);
      return { year: y, month: m, day: d };
    }

    // ISO datetime — must use IST, not the UTC prefix (fixes D-1 display)
    if (trimmed.includes("T")) {
      const d = new Date(trimmed);
      if (!Number.isNaN(d.getTime())) return partsFromDateInIst(d);
    }
  }

  if (dateVal instanceof Date && !Number.isNaN(dateVal.getTime())) {
    return partsFromDateInIst(dateVal);
  }

  if (typeof dateVal === "string") {
    const d = new Date(dateVal);
    if (!Number.isNaN(d.getTime())) return partsFromDateInIst(d);
  }

  return null;
}

export function formatDisplayDate(
  dateVal: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  const parts = extractCalendarParts(dateVal);
  if (!parts) return dateVal ? String(dateVal) : "-";

  const stable = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0),
  );
  return stable.toLocaleDateString("en-IN", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  });
}

export function getTodayInTimeZone(timeZone = IST): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+\n/g, "\n")
    .trim();
}

export function notePreviewTitle(htmlOrText: string, maxLen = 60): string {
  const plain = stripHtml(htmlOrText);
  const firstLine =
    plain
      .split(/\n/)
      .map((l) => l.trim())
      .find(Boolean) || "Untitled note";
  return firstLine.length > maxLen
    ? `${firstLine.slice(0, maxLen - 1)}…`
    : firstLine;
}
