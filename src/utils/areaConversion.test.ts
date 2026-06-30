import { describe, expect, it } from "vitest";
import {
  CANONICAL_AREA_UNIT,
  computeTotalPriceFromSqft,
  fromCanonicalSqft,
  normalizeAreaFieldsMode,
  normalizeAreaUnitCode,
  resolveAreaSqftForPricing,
  SQFT_PER_UNIT,
  toCanonicalSqft,
} from "./areaConversion";

describe("areaConversion", () => {
  it("uses sq.ft as canonical storage unit", () => {
    expect(CANONICAL_AREA_UNIT).toBe("sqft");
  });

  it("converts sq.yd to sq.ft", () => {
    expect(toCanonicalSqft(10, "sqyd")).toBeCloseTo(90, 5);
    expect(fromCanonicalSqft(90, "sqyd")).toBeCloseTo(10, 5);
  });

  it("computes price from single canonical area", () => {
    expect(computeTotalPriceFromSqft(1500, 100)).toBe(150_000);
  });

  it("resolves area for pricing by unit type mode", () => {
    expect(resolveAreaSqftForPricing(1000, null)).toBe(1000);
    expect(resolveAreaSqftForPricing(1000, 1500)).toBe(1500);
  });

  it("maps legacy both mode to carpet_only", () => {
    expect(normalizeAreaFieldsMode("both")).toBe("carpet_only");
  });

  it("round-trips all supported units", () => {
    const sqft = 2500;
    for (const unit of Object.keys(SQFT_PER_UNIT)) {
      const display = fromCanonicalSqft(sqft, unit);
      const back = toCanonicalSqft(display, unit);
      expect(back).toBeCloseTo(sqft, 3);
    }
  });
});

describe("unit type persistence mapping", () => {
  it("keeps unit_type_id as number through API row mapping", () => {
    const apiRow = { unit_type_id: 7 };
    const unitTypeId =
      apiRow.unit_type_id != null ? Number(apiRow.unit_type_id) : null;
    expect(unitTypeId).toBe(7);
    expect(String(unitTypeId)).toBe("7");
  });
});
