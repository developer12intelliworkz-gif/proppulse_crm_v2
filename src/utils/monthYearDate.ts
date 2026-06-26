/** Month/year (YYYY-MM) helpers for project launch & possession dates. */

export const formatDateToMonthYear = (
  date: string | null | undefined,
): string => {
  if (!date) return "";
  if (/^\d{4}-\d{2}$/.test(date)) return date;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const monthYearToApiDate = (monthYear: string): string => {
  if (!monthYear) return "";
  if (/^\d{4}-\d{2}$/.test(monthYear)) return `${monthYear}-01`;
  return monthYear;
};

export const currentMonthYear = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Display "July 2026" from YYYY-MM */
export const formatMonthYearLabel = (monthYear: string): string => {
  if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) return "";
  const [year, month] = monthYear.split("-");
  const idx = parseInt(month, 10) - 1;
  if (idx < 0 || idx > 11) return monthYear;
  return `${MONTH_LABELS[idx]} ${year}`;
};
