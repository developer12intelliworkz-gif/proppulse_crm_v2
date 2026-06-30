import axiosInstance from "@/api/axiosInstance";
import type {
  InventoryFloor,
  InventoryState,
  InventoryTower,
  InventoryUnit,
  UnitStatus,
} from "@/store/types/inventory";
import { isApartmentSubcategory } from "./inventoryConstants";
import { SUBCATEGORY_UNIT_TYPE_CODES } from "./inventoryBackendMapping";
import {
  floorNodeName,
  parseFloorFromNodeName,
  sortFloorsTopToBottom,
} from "@/utils/inventoryFloors";
import {
  computeTotalPriceFromSqft,
  formatAreaDisplay,
  fromCanonicalSqft,
  normalizeAreaUnitCode,
  resolveAreaSqftForPricing,
  toCanonicalSqft,
} from "@/utils/areaConversion";
import type { AreaUnit } from "@/store/types/inventory";

interface HierarchyNode {
  id: string;
  name: string;
  type_code?: string;
  parent_id: string | null;
  children?: HierarchyNode[];
}

interface ApiUnitRow {
  id: number | string;
  hierarchy_node_id?: number | string | null;
  unit_number?: string;
  status?: string;
  carpet_area_sqft?: number | string | null;
  super_builtup_area_sqft?: number | string | null;
  facing?: string | null;
  price?: number | string | null;
  unit_type_id?: number | string | null;
  carpet_area_unit?: string | null;
  super_builtup_area_unit?: string | null;
  base_rate?: number | string | null;
  total_price?: number | string | null;
  has_parking?: boolean | null;
  parking_count?: number | null;
  amenities?: string[];
}

export const flattenHierarchyTree = (roots: HierarchyNode[]): HierarchyNode[] => {
  const flat: HierarchyNode[] = [];
  const walk = (node: HierarchyNode, parentId: string | null) => {
    const id = String(node.id);
    flat.push({
      id,
      name: node.name,
      type_code: node.type_code,
      parent_id: parentId,
    });
    for (const child of node.children ?? []) {
      walk(child, id);
    }
  };
  for (const root of roots) {
    walk(root, null);
  }
  return flat;
};

const towerIdFromName = (name: string) =>
  `tower-${name.toLowerCase().replace(/\s+/g, "-")}`;

const normalizeNodeId = (id: string | number | null | undefined): string | null =>
  id == null ? null : String(id);

const normalizeHierarchyNode = (node: HierarchyNode): HierarchyNode => ({
  ...node,
  id: String(node.id),
  parent_id: normalizeNodeId(node.parent_id),
});

const mapApiStatus = (status?: string): UnitStatus => {
  const normalized = (status ?? "available").toLowerCase();
  if (normalized === "booked") return "booked";
  if (normalized === "sold") return "sold";
  if (normalized === "blocked") return "blocked";
  if (normalized === "reserved") return "reserved";
  return "available";
};

const mapApiUnitToInventoryUnit = (row: ApiUnitRow): InventoryUnit => {
  const id = String(row.id);
  const number = String(row.unit_number ?? id).trim();
  const displayUnit = normalizeAreaUnitCode(
    row.carpet_area_unit ?? row.super_builtup_area_unit,
  ) as AreaUnit;

  const carpetCanonical =
    row.carpet_area_sqft != null && row.carpet_area_sqft !== ""
      ? Number(row.carpet_area_sqft)
      : null;
  const superCanonical =
    row.super_builtup_area_sqft != null && row.super_builtup_area_sqft !== ""
      ? Number(row.super_builtup_area_sqft)
      : null;

  const carpet =
    carpetCanonical != null
      ? formatAreaDisplay(fromCanonicalSqft(carpetCanonical, displayUnit))
      : "";
  const superBuiltup =
    superCanonical != null
      ? formatAreaDisplay(fromCanonicalSqft(superCanonical, displayUnit))
      : "";

  return {
    id: `db-${id}`,
    number,
    unitName: number,
    area: carpet,
    super_builtup_area: superBuiltup,
    areaUnit_carpet: displayUnit,
    areaUnit_super: displayUnit,
    base_rate: row.base_rate != null ? String(row.base_rate) : "",
    total_price:
      row.total_price != null && Number.isFinite(Number(row.total_price))
        ? Number(row.total_price)
        : null,
    unit_type_id:
      row.unit_type_id != null && row.unit_type_id !== ""
        ? Number(row.unit_type_id)
        : null,
    facing: row.facing ?? null,
    has_parking: Boolean(row.has_parking),
    parking_count:
      row.parking_count != null ? Number(row.parking_count) : null,
    price: row.price != null ? String(row.price) : "",
    status: mapApiStatus(row.status),
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
  };
};

const groupUnitsByNode = (unitRows: ApiUnitRow[]) => {
  const unitsByNode = new Map<string, InventoryUnit[]>();
  for (const row of unitRows) {
    const nodeId =
      row.hierarchy_node_id != null ? String(row.hierarchy_node_id) : "";
    if (!nodeId) continue;
    const unit = mapApiUnitToInventoryUnit(row);
    const list = unitsByNode.get(nodeId) ?? [];
    list.push(unit);
    unitsByNode.set(nodeId, list);
  }
  return unitsByNode;
};

const buildApartmentInventoryFromDb = (
  roots: HierarchyNode[],
  unitsByNode: Map<string, InventoryUnit[]>,
): Partial<InventoryState> => {
  const towers: InventoryTower[] = roots.map((tower) => {
    const towerId = towerIdFromName(tower.name);
    const floors: InventoryFloor[] = (tower.children ?? [])
      .map((floorNode) => {
        const parsed = parseFloorFromNodeName(floorNode.name);
        const units = unitsByNode.get(String(floorNode.id)) ?? [];
        return {
          number: parsed.number,
          label: parsed.label,
          isParking: parsed.isParking,
          units,
          nodeId: String(floorNode.id),
        };
      })
      .sort((a, b) => a.number - b.number);

    const totalUnits = floors.reduce((sum, floor) => sum + floor.units.length, 0);
    return {
      id: towerId,
      name: tower.name,
      nodeId: String(tower.id),
      totalFloors: floors.length,
      totalUnits,
      floors: sortFloorsTopToBottom(floors),
    };
  });

  return { towers, units: [] };
};

const buildFlatInventoryFromDb = (
  roots: HierarchyNode[],
  unitsByNode: Map<string, InventoryUnit[]>,
): Partial<InventoryState> => {
  const units: InventoryUnit[] = [];
  const collect = (node: HierarchyNode) => {
    const nodeUnits = unitsByNode.get(String(node.id)) ?? [];
    units.push(...nodeUnits);
    for (const child of node.children ?? []) {
      collect(child);
    }
  };
  for (const root of roots) {
    collect(root);
  }

  let plotRows = 4;
  let plotCols = 5;
  const maxRow = Math.max(0, ...units.map((u) => u.row ?? 0));
  const maxCol = Math.max(0, ...units.map((u) => u.col ?? 0));
  if (maxRow > 0) plotRows = maxRow;
  if (maxCol > 0) plotCols = maxCol;

  return { towers: [], units, plotRows, plotCols };
};

export const loadInventoryFromDatabase = async (
  projectId: string,
  subcategory: string | null,
): Promise<Partial<InventoryState> | null> => {
  try {
    const [nodesRes, unitsRes] = await Promise.all([
      axiosInstance.get(`/projects/${projectId}/hierarchy-nodes`),
      axiosInstance.get(`/projects/${projectId}/units`),
    ]);

    const roots: HierarchyNode[] = nodesRes.data?.data ?? [];
    const unitRows: ApiUnitRow[] = unitsRes.data?.data ?? [];
    const hasNodes = Array.isArray(roots) && roots.length > 0;
    const hasUnits = Array.isArray(unitRows) && unitRows.length > 0;

    if (!hasNodes && !hasUnits) {
      return null;
    }

    const unitsByNode = groupUnitsByNode(
      Array.isArray(unitRows) ? unitRows : [],
    );

    if (isApartmentSubcategory(subcategory)) {
      if (!hasNodes) return null;
      return buildApartmentInventoryFromDb(roots, unitsByNode);
    }

    if (hasNodes) {
      return buildFlatInventoryFromDb(roots, unitsByNode);
    }

    return {
      towers: [],
      units: (Array.isArray(unitRows) ? unitRows : []).map(
        mapApiUnitToInventoryUnit,
      ),
    };
  } catch (err) {
    console.error("loadInventoryFromDatabase failed", err);
    return null;
  }
};

const hasPersistedInventory = (data: Partial<InventoryState> | null) => {
  if (!data) return false;
  if ((data.units?.length ?? 0) > 0) return true;
  if ((data.towers?.length ?? 0) > 0) return true;
  return (data.towers ?? []).some((tower) => tower.floors.length > 0);
};

interface UnitTypeRow {
  id: number;
  unit_name: string;
  label?: string | null;
  area_fields_mode?: string | null;
}

const API_ALLOWED_STATUSES = new Set([
  "available",
  "booked",
  "sold",
  "blocked",
]);

const inventoryDraftKey = (projectId: string) =>
  `inventory_builder_draft_${projectId}`;

export const clearInventoryDraft = (projectId: string) => {
  localStorage.removeItem(inventoryDraftKey(projectId));
};

export const saveInventoryDraft = (
  projectId: string,
  inventory: InventoryState,
) => {
  const payload = {
    projectId,
    projectName: inventory.projectName,
    projectType: inventory.projectType,
    subcategory: inventory.subcategory,
    towers: inventory.towers,
    units: inventory.units,
    plotRows: inventory.plotRows,
    plotCols: inventory.plotCols,
  };
  localStorage.setItem(inventoryDraftKey(projectId), JSON.stringify(payload));
};

export const loadInventoryDraft = (
  projectId: string,
): Partial<InventoryState> | null => {
  try {
    const raw = localStorage.getItem(inventoryDraftKey(projectId));
    if (!raw) return null;
    return JSON.parse(raw) as Partial<InventoryState>;
  } catch {
    return null;
  }
};

const mapStatusForApi = (status: string) => {
  const normalized = status.toLowerCase();
  if (API_ALLOWED_STATUSES.has(normalized)) return normalized;
  if (normalized === "reserved") return "booked";
  return "available";
};

const parseCarpetArea = (area: string) => {
  const parsed = Number(area);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 1;
};

const fetchUnitTypes = async (projectId: string): Promise<UnitTypeRow[]> => {
  const res = await axiosInstance.get(
    `/projects/${projectId}/unit-type-labels`,
  );
  const rows = res.data?.data ?? [];
  return Array.isArray(rows) ? rows : [];
};

const resolveUnitTypeId = (
  unitTypes: UnitTypeRow[],
  subcategory: string | null,
): number | null => {
  if (unitTypes.length === 0) return null;

  const preferred = SUBCATEGORY_UNIT_TYPE_CODES[subcategory ?? ""] ?? [];
  for (const code of preferred) {
    const match = unitTypes.find(
      (t) =>
        String(t.unit_name).trim().toUpperCase() === code ||
        String(t.label ?? "")
          .trim()
          .toUpperCase()
          .replace(/\s+/g, "_") === code,
    );
    if (match) return Number(match.id);
  }

  return Number(unitTypes[0].id);
};

const parseDbUnitId = (unitId: string): string | null => {
  if (unitId.startsWith("db-")) return unitId.slice(3);
  return null;
};

export const deleteInventoryUnitFromDatabase = async (
  projectId: string,
  unit: InventoryUnit,
): Promise<{ ok: boolean; error?: string }> => {
  const dbUnitId = parseDbUnitId(unit.id);
  if (!dbUnitId) {
    // Unit hasn't been persisted yet; caller should remove it from local state.
    return { ok: true };
  }

  try {
    await axiosInstance.delete(`/projects/${projectId}/units/${dbUnitId}`);
    return { ok: true };
  } catch (err: unknown) {
    const data = (err as { response?: { data?: { error?: string; details?: string } } })
      ?.response?.data;
    const message =
      [data?.error, data?.details].filter(Boolean).join(" — ") ||
      "Could not delete unit";
    return { ok: false, error: message };
  }
};

const resolveHierarchyNodeId = async (
  projectId: string,
  towerName: string,
  floor?: Pick<InventoryFloor, "number" | "label" | "nodeId">,
): Promise<string | null> => {
  if (floor?.nodeId) return floor.nodeId;

  const nodesRes = await axiosInstance.get(
    `/projects/${projectId}/hierarchy-nodes`,
  );
  const nodes = flattenHierarchyTree(nodesRes.data?.data ?? []);
  const towerNode = findNode(nodes, towerName, null);
  if (!towerNode) return null;
  if (!floor) return towerNode.id;

  const floorName = floorNodeName(floor);
  const floorNode = findNode(nodes, floorName, towerNode.id);
  return floorNode?.id ?? null;
};

export const deleteInventoryFloorFromDatabase = async (
  projectId: string,
  towerName: string,
  floor: InventoryFloor,
): Promise<{ ok: boolean; error?: string }> => {
  try {
    const nodeId = await resolveHierarchyNodeId(projectId, towerName, floor);
    if (!nodeId) {
      return { ok: true };
    }
    await axiosInstance.delete(
      `/projects/${projectId}/hierarchy-nodes/${nodeId}`,
      { params: { cascade: true } },
    );
    return { ok: true };
  } catch (err: unknown) {
    const data = (err as { response?: { data?: { error?: string; details?: string } } })
      ?.response?.data;
    const message =
      [data?.error, data?.details].filter(Boolean).join(" — ") ||
      "Could not delete floor";
    return { ok: false, error: message };
  }
};

export const deleteInventoryTowerFromDatabase = async (
  projectId: string,
  tower: InventoryTower,
): Promise<{ ok: boolean; error?: string }> => {
  try {
    const nodeId =
      tower.nodeId ??
      (await resolveHierarchyNodeId(projectId, tower.name));
    if (!nodeId) {
      return { ok: true };
    }
    await axiosInstance.delete(
      `/projects/${projectId}/hierarchy-nodes/${nodeId}`,
      { params: { cascade: true } },
    );
    return { ok: true };
  } catch (err: unknown) {
    const data = (err as { response?: { data?: { error?: string; details?: string } } })
      ?.response?.data;
    const message =
      [data?.error, data?.details].filter(Boolean).join(" — ") ||
      "Could not delete tower";
    return { ok: false, error: message };
  }
};

const normalizeUnitNumberKey = (unit: InventoryUnit) =>
  (unit.unitName || unit.number || "").trim().toUpperCase();

const fetchExistingUnitsByNumber = async (
  projectId: string,
): Promise<Map<string, string>> => {
  const map = new Map<string, string>();
  try {
    const res = await axiosInstance.get(`/projects/${projectId}/units`);
    const rows = res.data?.data ?? [];
    for (const row of Array.isArray(rows) ? rows : []) {
      const num = String(
        (row as { unit_number?: string }).unit_number ?? "",
      )
        .trim()
        .toUpperCase();
      if (num) {
        map.set(num, String((row as { id: number | string }).id));
      }
    }
  } catch {
    // return empty map
  }
  return map;
};

const resolveUnitDbId = (
  unit: InventoryUnit,
  existingByNumber: Map<string, string>,
): string | null => {
  const fromId = parseDbUnitId(unit.id);
  if (fromId) return fromId;
  return existingByNumber.get(normalizeUnitNumberKey(unit)) ?? null;
};

const parseOptionalArea = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const normalizeAreaUnit = (value?: string) =>
  normalizeAreaUnitCode(value) as AreaUnit;

const computeTotalPrice = (unit: InventoryUnit) => {
  if (unit.total_price !== null && unit.total_price !== undefined) {
    return unit.total_price;
  }
  const rate = Number(unit.base_rate) || 0;
  if (rate <= 0) return null;

  const carpetEntry = parseOptionalArea(unit.area);
  const superEntry = parseOptionalArea(unit.super_builtup_area);
  const displayUnit = normalizeAreaUnit(unit.areaUnit_carpet);

  const carpetSqft =
    carpetEntry !== null ? toCanonicalSqft(carpetEntry, displayUnit) : 0;
  const superSqft =
    superEntry !== null ? toCanonicalSqft(superEntry, displayUnit) : null;

  const areaSqft = resolveAreaSqftForPricing(carpetSqft, superSqft);
  return computeTotalPriceFromSqft(areaSqft, rate);
};

const mapUnitPayload = (
  nodeId: string,
  unit: InventoryUnit,
  fallbackUnitTypeId: number,
) => {
  const unitNumber = (unit.unitName || unit.number || "").trim();
  if (!unitNumber) {
    throw new Error("unit_number is required");
  }

  const unitTypeId = unit.unit_type_id ?? fallbackUnitTypeId;
  if (!unitTypeId) {
    throw new Error("unit_type_id is required");
  }

  const displayUnit = normalizeAreaUnit(unit.areaUnit_carpet);
  const carpetEntry = parseOptionalArea(unit.area);
  const superEntry = parseOptionalArea(unit.super_builtup_area);

  if (carpetEntry === null && superEntry === null) {
    throw new Error("Area value is required");
  }

  const carpetSqft =
    carpetEntry !== null ? toCanonicalSqft(carpetEntry, displayUnit) : null;
  const superSqft =
    superEntry !== null ? toCanonicalSqft(superEntry, displayUnit) : null;
  const baseRate = Number(unit.base_rate) || null;
  const areaSqft = resolveAreaSqftForPricing(
    carpetSqft ?? 0,
    superSqft,
  );
  const totalPrice = computeTotalPriceFromSqft(areaSqft, baseRate);

  return {
    hierarchy_node_id: nodeId,
    nodeId,
    unit_number: unitNumber,
    unit_type_id: unitTypeId,
    status: mapStatusForApi(unit.status),
    carpet_area_sqft: carpetEntry,
    super_builtup_area_sqft: superEntry,
    carpet_area_unit: displayUnit,
    super_builtup_area_unit: displayUnit,
    base_rate: baseRate,
    total_price: totalPrice,
    facing: unit.facing || null,
    has_parking: Boolean(unit.has_parking),
    parking_count:
      unit.has_parking && unit.parking_count ? unit.parking_count : null,
    amenities: unit.amenities ?? [],
    price: totalPrice ?? (unit.price ? Number(unit.price) : null),
  };
};

const findNode = (
  nodes: HierarchyNode[],
  name: string,
  parentId: string | null,
) =>
  nodes.find(
    (n) =>
      n.name.trim().toLowerCase() === name.trim().toLowerCase() &&
      normalizeNodeId(n.parent_id) === normalizeNodeId(parentId),
  );

const ensureLevel3Node = async (
  projectId: string,
  nodes: HierarchyNode[],
  name: string,
): Promise<HierarchyNode> => {
  const existing = findNode(nodes, name, null);
  if (existing) return existing;

  const res = await axiosInstance.post(
    `/projects/${projectId}/hierarchy-nodes`,
    { name },
  );
  const created = normalizeHierarchyNode(res.data?.data as HierarchyNode);
  nodes.push(created);
  return created;
};

const ensureFloorNode = async (
  projectId: string,
  nodes: HierarchyNode[],
  towerNodeId: string,
  floor: Pick<InventoryFloor, "number" | "label">,
): Promise<HierarchyNode> => {
  const floorName = floorNodeName(floor);
  const parentId = String(towerNodeId);
  const existing = findNode(nodes, floorName, parentId);
  if (existing) return existing;

  const res = await axiosInstance.post(
    `/projects/${projectId}/hierarchy-nodes`,
    {
      name: floorName,
      parent_id: parentId,
      mode_code: "FLOOR_MODE",
    },
  );
  const created = normalizeHierarchyNode(res.data?.data as HierarchyNode);
  nodes.push(created);
  return created;
};

const postUnit = async (
  projectId: string,
  nodeId: string,
  unit: InventoryUnit,
  unitTypeId: number,
): Promise<string | null> => {
  const res = await axiosInstance.post(
    `/projects/${projectId}/units`,
    mapUnitPayload(nodeId, unit, unitTypeId),
  );
  const id = res.data?.data?.id;
  return id != null ? String(id) : null;
};

const putUnit = async (
  projectId: string,
  unitDbId: string,
  nodeId: string,
  unit: InventoryUnit,
  unitTypeId: number,
) => {
  await axiosInstance.put(
    `/projects/${projectId}/units/${unitDbId}`,
    mapUnitPayload(nodeId, unit, unitTypeId),
  );
};

const upsertUnit = async (
  projectId: string,
  nodeId: string,
  unit: InventoryUnit,
  fallbackUnitTypeId: number,
  existingByNumber: Map<string, string>,
): Promise<{
  created: boolean;
  updated: boolean;
  skipped: boolean;
  dbUnitId?: string;
  error?: string;
}> => {
  const unitNumber = (unit.unitName || unit.number || "").trim();
  if (!unitNumber) {
    return { created: false, updated: false, skipped: true };
  }

  const resolvedTypeId = unit.unit_type_id ?? fallbackUnitTypeId;
  if (!resolvedTypeId) {
    return {
      created: false,
      updated: false,
      skipped: false,
      error: `Unit ${unitNumber} is missing unit_type_id`,
    };
  }

  const existingDbId = resolveUnitDbId(unit, existingByNumber);

  try {
    if (existingDbId) {
      await putUnit(projectId, existingDbId, nodeId, unit, resolvedTypeId);
      return {
        created: false,
        updated: true,
        skipped: false,
        dbUnitId: existingDbId,
      };
    }

    const newId = await postUnit(projectId, nodeId, unit, resolvedTypeId);
    if (newId) {
      existingByNumber.set(unitNumber.toUpperCase(), newId);
    }
    return {
      created: true,
      updated: false,
      skipped: false,
      dbUnitId: newId ?? undefined,
    };
  } catch (err: unknown) {
    return {
      created: false,
      updated: false,
      skipped: false,
      error: getApiErrorMessage(
        err,
        `Failed to save unit ${unitNumber}`,
      ),
    };
  }
};

export interface SingleUnitSaveContext {
  unit: InventoryUnit;
  towerId?: string;
  floorNumber?: number;
}

export const persistSingleInventoryUnit = async (
  projectId: string,
  inventory: InventoryState,
  context: SingleUnitSaveContext,
): Promise<{ ok: boolean; dbUnitId?: string; error?: string }> => {
  const unitTypes = await fetchUnitTypes(projectId);
  const defaultTypeId = resolveUnitTypeId(unitTypes, inventory.subcategory);
  if (!defaultTypeId && !context.unit.unit_type_id) {
    return {
      ok: false,
      error:
        "No unit type found for this project. Add unit types in Project Profile Step 4 first.",
    };
  }

  await persistInventoryHierarchy(projectId, inventory);

  const nodesRes = await axiosInstance.get(
    `/projects/${projectId}/hierarchy-nodes`,
  );
  const nodes = flattenHierarchyTree(nodesRes.data?.data ?? []);

  let nodeId: string | null = null;

  if (isApartmentSubcategory(inventory.subcategory)) {
    const tower = inventory.towers.find((t) => t.id === context.towerId);
    if (!tower) {
      return { ok: false, error: "Tower not found for this unit" };
    }
    const floorNumber = context.floorNumber;
    if (floorNumber === undefined) {
      return { ok: false, error: "Floor not found for this unit" };
    }
    const floor = tower.floors.find((f) => f.number === floorNumber);
    if (!floor) {
      return { ok: false, error: "Floor not found for this unit" };
    }
    const towerNode = await ensureLevel3Node(projectId, nodes, tower.name);
    const floorNode = await ensureFloorNode(
      projectId,
      nodes,
      towerNode.id,
      floor,
    );
    nodeId = floorNode.id;
  } else {
    const rootName = inventory.subcategory?.includes("plot")
      ? "Plot Sector"
      : "Inventory";
    const rootNode = await ensureLevel3Node(projectId, nodes, rootName);
    nodeId = rootNode.id;
  }

  const existingByNumber = await fetchExistingUnitsByNumber(projectId);
  const result = await upsertUnit(
    projectId,
    nodeId,
    context.unit,
    defaultTypeId ?? context.unit.unit_type_id!,
    existingByNumber,
  );

  if (result.error) {
    return { ok: false, error: result.error };
  }
  if (result.skipped) {
    return { ok: false, error: "Unit number is required" };
  }

  return { ok: true, dbUnitId: result.dbUnitId };
};

export const persistBulkInventoryUnits = async (
  projectId: string,
  inventory: InventoryState,
  targets: SingleUnitSaveContext[],
): Promise<{
  succeeded: SingleUnitSaveContext[];
  failed: { unit: InventoryUnit; error: string }[];
}> => {
  const succeeded: SingleUnitSaveContext[] = [];
  const failed: { unit: InventoryUnit; error: string }[] = [];

  for (const target of targets) {
    const result = await persistSingleInventoryUnit(projectId, inventory, target);
    if (result.ok) {
      succeeded.push({
        ...target,
        unit: result.dbUnitId
          ? { ...target.unit, id: `db-${result.dbUnitId}` }
          : target.unit,
      });
    } else {
      failed.push({
        unit: target.unit,
        error: result.error ?? "Failed to save unit",
      });
    }
  }

  return { succeeded, failed };
};

const getApiErrorMessage = (err: unknown, fallback: string) => {
  const data = (err as { response?: { data?: { error?: string; details?: string } } })
    ?.response?.data;
  return [data?.error, data?.details].filter(Boolean).join(" — ") || fallback;
};

export const persistInventoryHierarchy = async (
  projectId: string,
  inventory: InventoryState,
): Promise<{ errors: string[] }> => {
  const errors: string[] = [];

  try {
    const nodesRes = await axiosInstance.get(
      `/projects/${projectId}/hierarchy-nodes`,
    );
    const nodes = flattenHierarchyTree(nodesRes.data?.data ?? []);

    if (isApartmentSubcategory(inventory.subcategory)) {
      for (const tower of inventory.towers ?? []) {
        try {
          const towerNode = await ensureLevel3Node(
            projectId,
            nodes,
            tower.name,
          );
          for (const floor of tower.floors ?? []) {
            try {
              await ensureFloorNode(
                projectId,
                nodes,
                towerNode.id,
                floor,
              );
            } catch (err: unknown) {
              errors.push(
                getApiErrorMessage(
                  err,
                  `Failed to save floor ${floor.number} in ${tower.name}`,
                ),
              );
            }
          }
        } catch (err: unknown) {
          errors.push(
            getApiErrorMessage(err, `Failed to save tower ${tower.name}`),
          );
        }
      }
    } else {
      const rootName = inventory.subcategory?.includes("plot")
        ? "Plot Sector"
        : "Inventory";
      try {
        await ensureLevel3Node(projectId, nodes, rootName);
      } catch (err: unknown) {
        errors.push(
          getApiErrorMessage(err, "Failed to save inventory grouping node"),
        );
      }
    }
  } catch (err: unknown) {
    errors.push(getApiErrorMessage(err, "Failed to load hierarchy nodes"));
  }

  return { errors: [...new Set(errors)] };
};

export const persistInventoryToDatabase = async (
  projectId: string,
  inventory: InventoryState,
): Promise<{
  hierarchyErrors: string[];
  saved: number;
  created: number;
  updated: number;
  skipped: number;
  unitErrors: string[];
}> => {
  const { errors: hierarchyErrors } = await persistInventoryHierarchy(
    projectId,
    inventory,
  );
  const { saved, created, updated, skipped, errors: unitErrors } =
    await persistInventoryUnits(projectId, inventory);
  return { hierarchyErrors, saved, created, updated, skipped, unitErrors };
};

export type InventorySaveResult = Awaited<
  ReturnType<typeof persistInventoryToDatabase>
> & {
  ok: boolean;
  errors: string[];
};

export const saveInventoryWithFeedback = async (
  projectId: string,
  inventory: InventoryState,
  label = "inventory",
): Promise<InventorySaveResult> => {
  saveInventoryDraft(projectId, inventory);
  const result = await persistInventoryToDatabase(projectId, inventory);
  const errors = [...result.hierarchyErrors, ...result.unitErrors];
  if (errors.length > 0) {
    console.error(`[${label}] save failed:`, errors);
    return { ...result, ok: false, errors };
  }
  console.info(`[${label}] saved successfully`, {
    towers: inventory.towers.length,
    saved: result.saved,
    created: result.created,
    updated: result.updated,
    skipped: result.skipped,
  });
  return { ...result, ok: true, errors: [] };
};

export { hasPersistedInventory };

export const persistInventoryUnits = async (
  projectId: string,
  inventory: InventoryState,
): Promise<{
  saved: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}> => {
  const errors: string[] = [];
  let saved = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;

  const unitTypes = await fetchUnitTypes(projectId);
  const unitTypeId = resolveUnitTypeId(unitTypes, inventory.subcategory);

  if (!unitTypeId) {
    return {
      saved: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [
        "No unit type found for this project. Add unit types in Project Profile Step 4 first.",
      ],
    };
  }

  const existingByNumber = await fetchExistingUnitsByNumber(projectId);

  const nodesRes = await axiosInstance.get(
    `/projects/${projectId}/hierarchy-nodes`,
  );
  const nodes = flattenHierarchyTree(nodesRes.data?.data ?? []);

  const trySave = async (nodeId: string, unit: InventoryUnit) => {
    const result = await upsertUnit(
      projectId,
      nodeId,
      unit,
      unitTypeId,
      existingByNumber,
    );

    if (result.skipped) {
      skipped++;
      return;
    }
    if (result.error) {
      errors.push(result.error);
      return;
    }
    if (result.created) {
      created++;
      saved++;
    } else if (result.updated) {
      updated++;
      saved++;
    }
  };

  if (isApartmentSubcategory(inventory.subcategory)) {
    for (const tower of inventory.towers ?? []) {
      try {
        const towerNode = await ensureLevel3Node(
          projectId,
          nodes,
          tower.name,
        );
        for (const floor of tower.floors ?? []) {
          try {
            const floorNode = await ensureFloorNode(
              projectId,
              nodes,
              towerNode.id,
              floor,
            );
            for (const unit of floor.units ?? []) {
              await trySave(floorNode.id, unit);
            }
          } catch (err: unknown) {
            errors.push(
              getApiErrorMessage(err, `Failed to create floor ${floor.number}`),
            );
          }
        }
      } catch (err: unknown) {
        errors.push(
          getApiErrorMessage(err, `Failed to create tower ${tower.name}`),
        );
      }
    }
  } else {
    const rootName = inventory.subcategory?.includes("plot")
      ? "Plot Sector"
      : "Inventory";
    try {
      const rootNode = await ensureLevel3Node(projectId, nodes, rootName);
      for (const unit of inventory.units ?? []) {
        await trySave(rootNode.id, unit);
      }
    } catch (err: unknown) {
      errors.push(
        getApiErrorMessage(err, "Failed to create inventory grouping node"),
      );
    }
  }

  const uniqueErrors = [...new Set(errors)];
  return { saved, created, updated, skipped, errors: uniqueErrors };
};
