import type { InventoryFloor } from "@/store/types/inventory";

export const formatFloorLabel = (floor: Pick<InventoryFloor, "number" | "label">): string => {
  if (floor.label?.trim()) return floor.label.trim();
  if (floor.number < 0) return `Basement ${Math.abs(floor.number)}`;
  if (floor.number === 0) return "Ground Floor";
  return `Floor ${floor.number}`;
};

export const floorNodeName = (floor: Pick<InventoryFloor, "number" | "label">): string =>
  formatFloorLabel(floor);

export const parseFloorFromNodeName = (name: string): {
  number: number;
  label: string;
  isParking: boolean;
} => {
  const trimmed = name.trim();
  const basementMatch = trimmed.match(/^basement\s*(\d+)$/i);
  if (basementMatch) {
    const level = Number(basementMatch[1]);
    return {
      number: -level,
      label: `Basement ${level}`,
      isParking: false,
    };
  }
  if (/^ground(\s*floor)?$/i.test(trimmed)) {
    return { number: 0, label: "Ground Floor", isParking: false };
  }
  const floorMatch = trimmed.match(/^floor\s*(\d+)$/i);
  if (floorMatch) {
    const level = Number(floorMatch[1]);
    return { number: level, label: `Floor ${level}`, isParking: false };
  }
  const legacyMatch = trimmed.match(/^floor\s*(-?\d+)$/i);
  if (legacyMatch) {
    const level = Number(legacyMatch[1]);
    if (level < 0) {
      return {
        number: level,
        label: `Basement ${Math.abs(level)}`,
        isParking: false,
      };
    }
    if (level === 0) {
      return { number: 0, label: "Ground Floor", isParking: false };
    }
    return { number: level, label: `Floor ${level}`, isParking: false };
  }
  return { number: 0, label: trimmed || "Ground Floor", isParking: false };
};

export const buildFloorList = (
  basementCount: number,
  hasGroundFloor: boolean,
  floorsAboveGround: number,
): InventoryFloor[] => {
  const basements = Math.max(0, Math.floor(basementCount));
  const above = Math.max(0, Math.floor(floorsAboveGround));
  const floors: InventoryFloor[] = [];

  for (let b = basements; b >= 1; b--) {
    floors.push({
      number: -b,
      label: `Basement ${b}`,
      isParking: false,
      units: [],
    });
  }
  if (hasGroundFloor) {
    floors.push({
      number: 0,
      label: "Ground Floor",
      isParking: false,
      units: [],
    });
  }
  for (let f = 1; f <= above; f++) {
    floors.push({
      number: f,
      label: `Floor ${f}`,
      isParking: false,
      units: [],
    });
  }

  return floors;
};

export const sortFloorsBottomToTop = (floors: InventoryFloor[]): InventoryFloor[] =>
  [...floors].sort((a, b) => a.number - b.number);

/** Highest floor first (Floor 10 → … → Basement 1). */
export const sortFloorsTopToBottom = (floors: InventoryFloor[]): InventoryFloor[] =>
  [...floors].sort((a, b) => b.number - a.number);
