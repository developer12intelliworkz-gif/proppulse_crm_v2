/**
 * Canonical area storage unit: square feet (sq.ft).
 * All carpet_area_sqft / super_builtup_area_sqft values in the database
 * MUST be stored in sq.ft after conversion from the user's entry unit.
 */

/** @typedef {'sqft' | 'sqyd' | 'sqm' | 'acre' | 'bigha' | 'sector'} AreaUnitCode */

export const CANONICAL_AREA_UNIT = "sqft";

export const AREA_UNIT_CODES = [
  "sqft",
  "sqyd",
  "sqm",
  "acre",
  "bigha",
  "sector",
];

/**
 * Square feet per one unit of measure.
 * Bigha: Gujarat regional standard (~17,427.8 sq.ft) — override via BIGHA_SQFT env.
 * Sector: non-standard; override via SECTOR_SQFT env (confirm with product owner).
 */
export const SQFT_PER_UNIT = {
  sqft: 1,
  sqyd: 9,
  sqm: 10.7639,
  acre: 43_560,
  bigha: Number(process.env.BIGHA_SQFT) || 17_427.8,
  sector: Number(process.env.SECTOR_SQFT) || 1_000_000,
};

export const AREA_FIELDS_MODES = ["carpet_only", "super_only"];

export const normalizeAreaUnitCode = (value) => {
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
  if (raw === "sqft" || raw === "sqfeet" || raw === "ft2") return "sqft";
  return CANONICAL_AREA_UNIT;
};

export const isValidAreaUnit = (value) =>
  AREA_UNIT_CODES.includes(normalizeAreaUnitCode(value));

export const normalizeAreaFieldsMode = (value) => {
  const raw = String(value ?? "carpet_only").trim().toLowerCase();
  if (raw === "super_only" || raw === "super" || raw === "super_builtup_only") {
    return "super_only";
  }
  if (raw === "both") return "carpet_only";
  return "carpet_only";
};

export const isValidAreaFieldsMode = (value) =>
  AREA_FIELDS_MODES.includes(normalizeAreaFieldsMode(value));

/**
 * Convert a value from the given unit into canonical sq.ft.
 * @param {number} value
 * @param {string} fromUnit
 * @returns {number}
 */
export const toCanonicalSqft = (value, fromUnit) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("Area value must be a valid number");
  }
  const unit = normalizeAreaUnitCode(fromUnit);
  const factor = SQFT_PER_UNIT[unit];
  if (!factor) {
    throw new Error(`Unsupported area unit: ${fromUnit}`);
  }
  return parsed * factor;
};

/**
 * Convert canonical sq.ft into the target display/entry unit.
 * @param {number} sqftValue
 * @param {string} toUnit
 * @returns {number}
 */
export const fromCanonicalSqft = (sqftValue, toUnit) => {
  const parsed = Number(sqftValue);
  if (!Number.isFinite(parsed)) {
    throw new Error("Canonical area value must be a valid number");
  }
  const unit = normalizeAreaUnitCode(toUnit);
  const factor = SQFT_PER_UNIT[unit];
  if (!factor) {
    throw new Error(`Unsupported area unit: ${toUnit}`);
  }
  return parsed / factor;
};

/** Resolve canonical sq.ft for pricing from the single applicable area field. */
export const resolveAreaSqftForPricing = (carpetSqft, superSqft) => {
  const superVal =
    superSqft === null || superSqft === undefined ? 0 : Number(superSqft) || 0;
  if (superVal > 0) return superVal;
  return Number(carpetSqft) || 0;
};

export const computeTotalPriceFromSqft = (areaSqft, baseRate) => {
  const rate = Number(baseRate) || 0;
  const area = Number(areaSqft) || 0;
  if (rate <= 0 || area <= 0) return null;
  return area * rate;
};
