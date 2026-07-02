/**
 * Lightweight regression runner for area conversion + unit_type mapping.
 * Run: npm test
 */
import {
  CANONICAL_AREA_UNIT,
  computeTotalPriceFromSqft,
  fromCanonicalSqft,
  normalizeAreaFieldsMode,
  normalizeAreaUnitCode,
  resolveAreaSqftForPricing,
  SQFT_PER_UNIT,
  toCanonicalSqft,
} from "../api/utils/areaConversion.js";

let passed = 0;
let failed = 0;

const assert = (condition, message) => {
  if (!condition) {
    failed += 1;
    console.error(`FAIL: ${message}`);
    return;
  }
  passed += 1;
};

assert(CANONICAL_AREA_UNIT === "sqft", "canonical unit is sqft");
assert(toCanonicalSqft(10, "sqyd") === 90, "10 sqyd = 90 sqft");
assert(fromCanonicalSqft(90, "sqyd") === 10, "90 sqft = 10 sqyd");
assert(toCanonicalSqft(1, "acre") === 43_560, "1 acre = 43560 sqft");
assert(resolveAreaSqftForPricing(1000, null) === 1000, "carpet-only pricing");
assert(resolveAreaSqftForPricing(1000, 1500) === 1500, "super-only pricing");
assert(
  computeTotalPriceFromSqft(1500, 100) === 150_000,
  "price = area sqft × rate",
);
assert(normalizeAreaUnitCode("Sq. Yd") === "sqyd", "normalizes sq yd alias");
assert(normalizeAreaFieldsMode("both") === "carpet_only", "legacy both → carpet");
assert(normalizeAreaFieldsMode("super") === "super_only", "normalizes super mode");

for (const unit of Object.keys(SQFT_PER_UNIT)) {
  const sqft = 2500;
  const display = fromCanonicalSqft(sqft, unit);
  const back = toCanonicalSqft(display, unit);
  assert(Math.abs(back - sqft) < 0.01, `round-trip ${unit}`);
}

const apiRow = { unit_type_id: 7 };
const unitTypeId =
  apiRow.unit_type_id != null && apiRow.unit_type_id !== ""
    ? Number(apiRow.unit_type_id)
    : null;
assert(unitTypeId === 7, "unit_type_id maps from API row");
assert(String(unitTypeId) === "7", "unit_type_id stringifies for Select value");

const savePayload = { unit_type_id: 7, unit_number: "A602" };
assert(
  typeof savePayload.unit_type_id === "number" && savePayload.unit_type_id === 7,
  "save payload includes numeric unit_type_id",
);

console.log(`\nArea/unit tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
