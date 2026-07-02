/**
 * Canonical area storage unit: square feet (sq.ft).
 * All carpet_area_sqft / super_builtup_area_sqft values in the database
 * MUST be stored in sq.ft after conversion from the user's entry unit.
 */

export const CANONICAL_AREA_UNIT = "sqft" as const;

export type AreaUnitCode =
  | "sqft"
  | "sqyd"
  | "sqm"
  | "acre"
  | "bigha"
  | "sector";

export type AreaFieldsMode = "carpet_only" | "super_only";

export const AREA_UNIT_CODES: AreaUnitCode[] = [
  "sqft",
  "sqyd",
  "sqm",
  "acre",
  "bigha",
  "sector",
];

/**
 * Square feet per one unit of measure.
 * Bigha: Gujarat regional standard (~17,427.8 sq.ft).
 * Sector: non-standard — confirm conversion factor with product owner.
 */
export const SQFT_PER_UNIT: Record<AreaUnitCode, number> = {
  sqft: 1,
  sqyd: 9,
  sqm: 10.7639,
  acre: 43_560,
  bigha: 17_427.8,
  sector: 1_000_000,
};

export const AREA_FIELDS_MODES: AreaFieldsMode[] = [
  "carpet_only",
  "super_only",
];

export const normalizeAreaUnitCode = (value?: string | null): AreaUnitCode => {
  const raw = String(value ?? CANONICAL_AREA_UNIT)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/\./g, "");

  if (raw === "sqyard" || raw === "sqyards" || raw === "sqyd") return "sqyd";
  if (raw === "sqm" || raw === "sqmeter" || raw === "sqmeters" || raw === "m2") {
    return "sqm";
  }
  if (raw === "acre" || raw === "acres") return "acre";
  if (raw === "bigha" || raw === "bighas") return "bigha";
  if (raw === "sector" || raw === "sectors") return "sector";
  return "sqft";
};

export const normalizeAreaFieldsMode = (
  value?: string | null,
): AreaFieldsMode => {
  const raw = String(value ?? "carpet_only").trim().toLowerCase();
  if (raw === "super_only" || raw === "super" || raw === "super_builtup_only") {
    return "super_only";
  }
  if (raw === "both") return "carpet_only";
  return "carpet_only";
};

export const toCanonicalSqft = (value: number, fromUnit: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("Area value must be a valid number");
  }
  const unit = normalizeAreaUnitCode(fromUnit);
  return parsed * SQFT_PER_UNIT[unit];
};

export const fromCanonicalSqft = (sqftValue: number, toUnit: string): number => {
  const parsed = Number(sqftValue);
  if (!Number.isFinite(parsed)) {
    throw new Error("Canonical area value must be a valid number");
  }
  const unit = normalizeAreaUnitCode(toUnit);
  return parsed / SQFT_PER_UNIT[unit];
};

export const computeTotalPriceFromSqft = (
  areaSqft: number | null | undefined,
  baseRate: number | null | undefined,
): number | null => {
  const rate = Number(baseRate) || 0;
  const area = Number(areaSqft) || 0;
  if (rate <= 0 || area <= 0) return null;
  return area * rate;
};

export const resolveAreaSqftForPricing = (
  carpetSqft: number | null | undefined,
  superSqft: number | null | undefined,
): number => {
  const superVal =
    superSqft === null || superSqft === undefined ? 0 : Number(superSqft) || 0;
  if (superVal > 0) return superVal;
  return Number(carpetSqft) || 0;
};

export const formatAreaDisplay = (value: number, maxDecimals = 4): string => {
  const rounded = Number(value.toFixed(maxDecimals));
  return String(rounded);
};
