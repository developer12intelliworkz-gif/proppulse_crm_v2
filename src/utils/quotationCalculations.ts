export const QUOTATION_CALC_TYPE_OPTIONS = [
  { value: "percent_of_basic_price", label: "% of Total Basic Price" },
  { value: "percent_of_total", label: "% of Running Total (prior lines)" },
  { value: "rate_x_total_area", label: "Rate × (Super Built-up or Carpet)" },
  { value: "fixed_amount", label: "Fixed Amount" },
] as const;

export type QuotationCalcType =
  (typeof QUOTATION_CALC_TYPE_OPTIONS)[number]["value"];

const CALC_TYPE_ALIASES: Record<string, QuotationCalcType> = {
  percent_of_basic: "percent_of_basic_price",
  percent_basic: "percent_of_basic_price",
};

const ALLOWED = new Set<string>(
  QUOTATION_CALC_TYPE_OPTIONS.map((o) => o.value),
);

export function normalizeCalculationType(raw: unknown): QuotationCalcType {
  const key = String(raw || "")
    .trim()
    .toLowerCase();
  if (CALC_TYPE_ALIASES[key]) return CALC_TYPE_ALIASES[key];
  if (ALLOWED.has(key)) return key as QuotationCalcType;
  return "percent_of_basic_price";
}

export function calcTypeLabel(value: string): string {
  return (
    QUOTATION_CALC_TYPE_OPTIONS.find((o) => o.value === value)?.label || value
  );
}

export function computeParticularAmount({
  calcType,
  value,
  basicPrice,
  totalArea,
  runningTotal,
}: {
  calcType: string;
  value: number;
  basicPrice: number;
  totalArea: number;
  runningTotal: number;
}): number {
  const type = normalizeCalculationType(calcType);
  const v = Number(value || 0);
  let amount = 0;

  if (type === "fixed_amount") {
    amount = v;
  } else if (type === "percent_of_basic_price") {
    amount = (v / 100) * basicPrice;
  } else if (type === "percent_of_total") {
    amount = (v / 100) * runningTotal;
  } else if (type === "rate_x_total_area") {
    amount = v * totalArea;
  }

  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
