import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import type { InventoryMetrics, InventoryUnit } from "@/store/types/inventory";
import { isApartmentSubcategory } from "./inventoryConstants";

const selectInventoryState = (state: RootState) => state.inventory;

const collectAllUnits = (inv: RootState["inventory"]): InventoryUnit[] => {
  if (isApartmentSubcategory(inv.subcategory)) {
    const units: InventoryUnit[] = [];
    (inv.towers ?? []).forEach((tower) => {
      (tower.floors ?? []).forEach((floor) => {
        units.push(...(floor.units ?? []));
      });
    });
    return units;
  }
  return inv.units ?? [];
};

export const selectInventoryMetrics = createSelector(
  [selectInventoryState],
  (inv): InventoryMetrics => {
    const allUnits = collectAllUnits(inv);

    let available = 0;
    let reserved = 0;
    let sold = 0;
    let blocked = 0;
    let booked = 0;
    let totalValue = 0;
    let soldValue = 0;

    allUnits.forEach((u) => {
      if (u.status === "available") available++;
      else if (u.status === "reserved") reserved++;
      else if (u.status === "sold") sold++;
      else if (u.status === "blocked") blocked++;
      else if (u.status === "booked") booked++;

      const price = Number(u.price) || 0;
      totalValue += price;
      if (u.status === "sold") soldValue += price;
    });

    let totalFloors = 0;
    (inv.towers ?? []).forEach((t) => {
      totalFloors += (t.floors ?? []).length;
    });

    return {
      totalUnits: allUnits.length,
      available,
      reserved,
      sold,
      blocked,
      booked,
      totalValue,
      soldValue,
      totalTowers: (inv.towers ?? []).length,
      totalFloors,
    };
  },
);
