import type { MouseEvent } from "react";
import { isApartmentSubcategory } from "./inventoryConstants";
import type { InventoryState, InventoryUnit } from "@/store/types/inventory";

export interface UnitWithLocation {
  unit: InventoryUnit;
  towerId?: string;
  floorNumber?: number;
}

export const collectAllUnitsWithLocation = (
  inventory: InventoryState,
): UnitWithLocation[] => {
  const result: UnitWithLocation[] = [];

  if (isApartmentSubcategory(inventory.subcategory)) {
    for (const tower of inventory.towers ?? []) {
      for (const floor of tower.floors ?? []) {
        for (const unit of floor.units ?? []) {
          result.push({
            unit,
            towerId: tower.id,
            floorNumber: floor.number,
          });
        }
      }
    }
    return result;
  }

  for (const unit of inventory.units ?? []) {
    result.push({ unit });
  }

  return result;
};

export const getUnitsWithLocationByIds = (
  inventory: InventoryState,
  unitIds: string[],
): UnitWithLocation[] => {
  const idSet = new Set(unitIds);
  return collectAllUnitsWithLocation(inventory).filter((entry) =>
    idSet.has(entry.unit.id),
  );
};

export const uniformStringField = (
  units: InventoryUnit[],
  key: keyof InventoryUnit,
): { uniform: boolean; value: string } => {
  if (units.length === 0) return { uniform: true, value: "" };
  const values = units.map((u) => {
    const raw = u[key];
    if (raw === null || raw === undefined) return "";
    return String(raw);
  });
  const first = values[0];
  const uniform = values.every((v) => v === first);
  return { uniform, value: uniform ? first : "" };
};

export const uniformStatus = (
  units: InventoryUnit[],
): { uniform: boolean; value: string } => {
  if (units.length === 0) return { uniform: true, value: "" };
  const statuses = units.map((u) => u.status);
  const uniform = statuses.every((s) => s === statuses[0]);
  return { uniform, value: uniform ? statuses[0] : "" };
};

export const handleUnitSelectClick = (
  e: MouseEvent,
  unitId: string,
  dispatch: (action: unknown) => void,
  actions: {
    selectOnly: (id: string) => unknown;
    toggle: (id: string) => unknown;
  },
) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    dispatch(actions.toggle(unitId));
    return;
  }
  dispatch(actions.selectOnly(unitId));
};
