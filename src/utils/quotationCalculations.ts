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

export function resolveUnitRatePerUnit(unit: {
  base_rate?: number | null;
  total_price?: number | null;
  price?: number | null;
  carpet_area_sqft?: number | null;
  super_builtup_area_sqft?: number | null;
}): number {
  const baseRate =
    unit.base_rate != null && unit.base_rate !== undefined
      ? Number(unit.base_rate)
      : null;
  if (baseRate != null && Number.isFinite(baseRate) && baseRate > 0) {
    return baseRate;
  }

  const carpet = Number(unit.carpet_area_sqft) || 0;
  const superBuiltup = Number(unit.super_builtup_area_sqft) || 0;
  const totalArea = carpet + superBuiltup;

  const totalPrice =
    unit.total_price != null && unit.total_price !== undefined
      ? Number(unit.total_price)
      : null;
  if (
    totalPrice != null &&
    Number.isFinite(totalPrice) &&
    totalPrice > 0 &&
    totalArea > 0
  ) {
    return totalPrice / totalArea;
  }

  const price =
    unit.price != null && unit.price !== undefined ? Number(unit.price) : null;
  if (price != null && Number.isFinite(price) && price > 0) {
    if (totalArea > 0 && price > totalArea * 1000) {
      return price / totalArea;
    }
    return price;
  }

  return 0;
}

export function resolveUnitBasicPrice(unit: {
  base_rate?: number | null;
  total_price?: number | null;
  price?: number | null;
  carpet_area_sqft?: number | null;
  super_builtup_area_sqft?: number | null;
}): number {
  const carpet = Number(unit.carpet_area_sqft) || 0;
  const superBuiltup = Number(unit.super_builtup_area_sqft) || 0;
  const totalArea = carpet + superBuiltup;

  const totalPrice =
    unit.total_price != null && unit.total_price !== undefined
      ? Number(unit.total_price)
      : null;
  if (totalPrice != null && Number.isFinite(totalPrice) && totalPrice > 0) {
    return Math.round((totalPrice + Number.EPSILON) * 100) / 100;
  }

  const price =
    unit.price != null && unit.price !== undefined ? Number(unit.price) : null;
  if (
    price != null &&
    Number.isFinite(price) &&
    price > 0 &&
    totalArea > 0 &&
    price > totalArea * 1000
  ) {
    return Math.round((price + Number.EPSILON) * 100) / 100;
  }

  const rate = resolveUnitRatePerUnit(unit);
  if (totalArea > 0 && rate > 0) {
    return Math.round((totalArea * rate + Number.EPSILON) * 100) / 100;
  }

  return 0;
}
