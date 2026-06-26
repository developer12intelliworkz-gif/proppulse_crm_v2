/** @typedef {"percent_of_basic_price" | "percent_of_total" | "rate_x_total_area" | "fixed_amount"} QuotationCalcType */

export const ALLOWED_CALC_TYPES = new Set([
  "percent_of_basic_price",
  "percent_of_total",
  "rate_x_total_area",
  "fixed_amount",
]);

const CALC_TYPE_ALIASES = {
  percent_of_basic: "percent_of_basic_price",
  percent_basic: "percent_of_basic_price",
  percent_of_basic_price: "percent_of_basic_price",
  percent_of_total: "percent_of_total",
  rate_x_total_area: "rate_x_total_area",
  fixed_amount: "fixed_amount",
};

/**
 * @param {unknown} raw
 * @returns {QuotationCalcType}
 */
export function normalizeCalculationType(raw) {
  const key = String(raw || "")
    .trim()
    .toLowerCase();
  const mapped = CALC_TYPE_ALIASES[key];
  if (mapped) return mapped;
  if (ALLOWED_CALC_TYPES.has(key)) return /** @type {QuotationCalcType} */ (key);
  return "percent_of_basic_price";
}

/**
 * @param {object} params
 * @param {{ calculation_type?: string, value?: unknown }} params.particular
 * @param {number} params.basicPrice
 * @param {number} params.totalArea
 * @param {number} [params.runningTotal]
 */
export function computeParticularAmount({
  particular,
  basicPrice,
  totalArea,
  runningTotal,
}) {
  const calcType = normalizeCalculationType(particular.calculation_type);
  const value = Number(particular.value);

  if (!ALLOWED_CALC_TYPES.has(calcType)) {
    throw new Error(`Unsupported calculation_type: ${calcType}`);
  }

  const baseForPercentTotal =
    runningTotal !== undefined && runningTotal !== null
      ? Number(runningTotal)
      : basicPrice;

  let amount = 0;

  if (calcType === "fixed_amount") {
    amount = value;
  } else if (calcType === "percent_of_basic_price") {
    amount = (value / 100) * basicPrice;
  } else if (calcType === "percent_of_total") {
    amount = (value / 100) * baseForPercentTotal;
  } else if (calcType === "rate_x_total_area") {
    amount = value * totalArea;
  }

  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
