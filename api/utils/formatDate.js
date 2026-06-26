const IST = "Asia/Kolkata";
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function partsFromDateInIst(d) {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const [y, m, day] = iso.split("-").map(Number);
  return { year: y, month: m, day };
}

/** Use for API responses — never shifts a plain YYYY-MM-DD string. */
export function formatPgDate(dateVal) {
  if (dateVal == null || dateVal === "") return null;

  if (typeof dateVal === "string") {
    const trimmed = dateVal.trim();
    if (DATE_ONLY.test(trimmed)) return trimmed;
    if (trimmed.includes("T")) {
      const d = new Date(trimmed);
      if (!Number.isNaN(d.getTime())) {
        const { year, month, day } = partsFromDateInIst(d);
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }
  }

  if (dateVal instanceof Date && !Number.isNaN(dateVal.getTime())) {
    const { year, month, day } = partsFromDateInIst(dateVal);
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return null;
}

/** Normalize client/API date input before INSERT/UPDATE (::date cast). */
export function normalizeActivityDate(date) {
  if (date == null || date === "") return null;
  if (typeof date === "string" && DATE_ONLY.test(date.trim())) {
    return date.trim();
  }
  return formatPgDate(date);
}

/** Calendar date in IST for server-side defaults. */
export function todayInTimeZone(timeZone = IST) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** SQL fragment: read DATE as text (no node-pg Date conversion). */
export const SQL_ACTIVITY_DATE = `TO_CHAR(date, 'YYYY-MM-DD')`;
