import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getSubcategory } from "@/components/inventory/inventoryConstants";
import { buildFloorList, sortFloorsTopToBottom } from "@/utils/inventoryFloors";
import type {
  InventoryState,
  InventoryTower,
  InventoryUnit,
  ProjectTypeKey,
  UnitStatus,
} from "@/store/types/inventory";

const createEmptyUnit = (
  id: string,
  number: string,
  unitName: string,
  extra?: Partial<InventoryUnit>,
): InventoryUnit => ({
  id,
  number,
  unitName,
  area: "",
  super_builtup_area: "",
  areaUnit_carpet: "sqft",
  areaUnit_super: "sqft",
  areaType: "sqft",
  base_rate: "",
  total_price: null,
  unit_type_id: null,
  facing: null,
  has_parking: false,
  parking_count: null,
  price: "",
  status: "available",
  ...extra,
});

const initialState: InventoryState = {
  wizardStep: 1,
  projectType: null,
  subcategory: null,
  projectName: "New Project",
  projectId: null,
  towers: [],
  units: [],
  plotRows: 4,
  plotCols: 5,
  selectedUnits: [],
  selectedTowerId: null,
  selectedFloorNumber: null,
};

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    setWizardStep(state, action: PayloadAction<1 | 2 | 3>) {
      state.wizardStep = action.payload;
    },
    setProjectType(state, action: PayloadAction<ProjectTypeKey>) {
      state.projectType = action.payload;
      state.subcategory = null;
      state.wizardStep = 2;
      state.towers = [];
      state.units = [];
      state.selectedUnits = [];
      state.selectedTowerId = null;
      state.selectedFloorNumber = null;
    },
    setSubcategory(state, action: PayloadAction<string>) {
      state.subcategory = action.payload;
      state.wizardStep = 3;
      state.towers = [];
      state.units = [];
      state.selectedUnits = [];
      state.selectedTowerId = null;
      state.selectedFloorNumber = null;
    },
    setProjectName(state, action: PayloadAction<string>) {
      state.projectName = action.payload;
    },
    setProjectId(state, action: PayloadAction<string | null>) {
      state.projectId = action.payload;
    },
    setSelectedTowerId(state, action: PayloadAction<string | null>) {
      state.selectedTowerId = action.payload;
      if (action.payload) {
        const tower = state.towers.find((t) => t.id === action.payload);
        state.selectedFloorNumber =
          tower && tower.floors.length > 0 ? tower.floors[0].number : null;
      }
      state.selectedUnits = [];
    },
    setSelectedFloorNumber(state, action: PayloadAction<number | null>) {
      state.selectedFloorNumber = action.payload;
    },
    generateTowers(state, action: PayloadAction<number>) {
      const count = Math.min(Math.max(action.payload || 1, 1), 26);
      const towers: InventoryTower[] = [];
      for (let i = 0; i < count; i++) {
        const char = String.fromCharCode(65 + i);
        towers.push({
          id: `tower-${char.toLowerCase()}`,
          name: `Tower ${char}`,
          totalFloors: 0,
          totalUnits: 0,
          floors: [],
        });
      }
      state.towers = towers;
      state.selectedTowerId = towers[0]?.id ?? null;
      state.selectedFloorNumber = null;
      state.selectedUnits = [];
    },
    addTower(state, action: PayloadAction<string>) {
      const name = action.payload.trim();
      if (!name) return;
      const id = `tower-${name.toLowerCase().replace(/\s+/g, "-")}`;
      if (state.towers.some((t) => t.id === id)) return;
      state.towers.push({
        id,
        name,
        totalFloors: 0,
        totalUnits: 0,
        floors: [],
      });
      if (!state.selectedTowerId) state.selectedTowerId = id;
    },
    scaffoldFloors(
      state,
      action: PayloadAction<{
        towerId: string;
        basementCount: number;
        hasGroundFloor: boolean;
        floorsAboveGround: number;
      }>,
    ) {
      const { towerId, basementCount, hasGroundFloor, floorsAboveGround } =
        action.payload;
      const generated = buildFloorList(
        basementCount,
        hasGroundFloor,
        floorsAboveGround,
      );

      state.towers = state.towers.map((tower) => {
        if (tower.id !== towerId) return tower;
        const existingByNumber = new Map(
          tower.floors.map((floor) => [floor.number, floor]),
        );
        const floors = sortFloorsTopToBottom(
          generated.map((floor) => {
            const existing = existingByNumber.get(floor.number);
            return existing
              ? {
                  ...floor,
                  units: existing.units,
                  isParking: false,
                }
              : floor;
          }),
        );
        return {
          ...tower,
          floors,
          totalFloors: floors.length,
        };
      });

      if (state.selectedFloorNumber === null && generated.length > 0) {
        const sorted = sortFloorsTopToBottom(generated);
        state.selectedFloorNumber = sorted[0]?.number ?? null;
      }
    },
    scaffoldUnits(
      state,
      action: PayloadAction<{
        towerId: string;
        floorNumber: number;
        unitCount: number;
      }>,
    ) {
      const { towerId, floorNumber, unitCount } = action.payload;
      state.towers = state.towers.map((tower) => {
        if (tower.id !== towerId) return tower;
        const towerLetter =
          tower.name.replace(/^Tower\s*/i, "").charAt(0).toUpperCase() ||
          "A";
        let totalUnits = 0;
        const floors = tower.floors.map((floor) => {
          if (floor.number !== floorNumber) {
            totalUnits += floor.units.length;
            return floor;
          }
          const units = [...floor.units];
          for (let i = 1; i <= unitCount; i++) {
            const floorSuffix =
              floorNumber < 0
                ? `B${Math.abs(floorNumber)}`
                : floorNumber === 0
                  ? "G"
                  : String(floorNumber);
            const unitNumber = `${towerLetter}${floorSuffix}${String(i).padStart(2, "0")}`;
            const id = `${tower.id}-${floorNumber}-${unitNumber.toLowerCase()}`;
            if (!units.some((u) => u.number === unitNumber)) {
              units.push(
                createEmptyUnit(id, unitNumber, unitNumber),
              );
            }
          }
          totalUnits += units.length;
          return { ...floor, units };
        });
        return { ...tower, floors, totalUnits };
      });
    },
    generateUnits(
      state,
      action: PayloadAction<{ count: number; subcategory: string }>,
    ) {
      const { count, subcategory } = action.payload;
      const sub = getSubcategory(state.projectType, subcategory);
      const label = sub?.unitLabel || "Unit";
      const units: InventoryUnit[] = [];
      for (let i = 1; i <= count; i++) {
        units.push(
          createEmptyUnit(`unit-${subcategory}-${i}`, String(i), `${label} ${i}`),
        );
      }
      state.units = units;
      state.selectedUnits = [];
    },
    generatePlots(
      state,
      action: PayloadAction<{
        rows: number;
        cols: number;
        subcategory: string;
      }>,
    ) {
      const { rows, cols, subcategory } = action.payload;
      const sub = getSubcategory(state.projectType, subcategory);
      const label = sub?.unitLabel || "Plot";
      state.plotRows = rows;
      state.plotCols = cols;
      const units: InventoryUnit[] = [];
      let idx = 1;
      for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
          units.push(
            createEmptyUnit(`plot-${idx}`, String(idx), `${label} ${idx}`, {
              row: r,
              col: c,
            }),
          );
          idx++;
        }
      }
      state.units = units;
      state.selectedUnits = [];
    },
    updateUnit(
      state,
      action: PayloadAction<{ unitId: string; fields: Partial<InventoryUnit> }>,
    ) {
      const { unitId, fields } = action.payload;
      state.units = state.units.map((u) =>
        u.id === unitId ? { ...u, ...fields } : u,
      );
    },
    removeUnit(state, action: PayloadAction<string>) {
      const unitId = action.payload;
      state.units = state.units.filter((u) => u.id !== unitId);
      state.towers = state.towers.map((tower) => ({
        ...tower,
        floors: tower.floors.map((floor) => ({
          ...floor,
          units: floor.units.filter((u) => u.id !== unitId),
        })),
        totalUnits: tower.floors.reduce(
          (sum, floor) => sum + floor.units.filter((u) => u.id !== unitId).length,
          0,
        ),
      }));
      state.selectedUnits = state.selectedUnits.filter((id) => id !== unitId);
    },
    removeFloor(
      state,
      action: PayloadAction<{ towerId: string; floorNumber: number }>,
    ) {
      const { towerId, floorNumber } = action.payload;
      state.towers = state.towers.map((tower) => {
        if (tower.id !== towerId) return tower;
        const floors = tower.floors.filter((f) => f.number !== floorNumber);
        const totalUnits = floors.reduce((sum, f) => sum + f.units.length, 0);
        return { ...tower, floors, totalFloors: floors.length, totalUnits };
      });
      if (state.selectedTowerId === towerId && state.selectedFloorNumber === floorNumber) {
        state.selectedFloorNumber = null;
      }
      state.selectedUnits = [];
    },
    removeTower(state, action: PayloadAction<string>) {
      const towerId = action.payload;
      state.towers = state.towers.filter((t) => t.id !== towerId);
      if (state.selectedTowerId === towerId) {
        state.selectedTowerId = state.towers[0]?.id ?? null;
        state.selectedFloorNumber = null;
      }
      state.selectedUnits = [];
    },
    updateTowerUnit(
      state,
      action: PayloadAction<{
        towerId: string;
        floorNumber: number;
        unitId: string;
        fields: Partial<InventoryUnit>;
      }>,
    ) {
      const { towerId, floorNumber, unitId, fields } = action.payload;
      state.towers = state.towers.map((tower) => {
        if (tower.id !== towerId) return tower;
        return {
          ...tower,
          floors: tower.floors.map((floor) => {
            if (floor.number !== floorNumber) return floor;
            return {
              ...floor,
              units: floor.units.map((u) =>
                u.id === unitId ? { ...u, ...fields } : u,
              ),
            };
          }),
        };
      });
    },
    bulkUpdateStatus(
      state,
      action: PayloadAction<{ unitIds: string[]; status: UnitStatus }>,
    ) {
      const { unitIds, status } = action.payload;
      const idSet = new Set(unitIds);
      const apply = (u: InventoryUnit) =>
        idSet.has(u.id) ? { ...u, status } : u;
      state.units = state.units.map(apply);
      state.towers = state.towers.map((tower) => ({
        ...tower,
        floors: tower.floors.map((floor) => ({
          ...floor,
          units: floor.units.map(apply),
        })),
      }));
      state.selectedUnits = [];
    },
    bulkUpdateUnits(
      state,
      action: PayloadAction<{
        unitIds: string[];
        fields: Partial<InventoryUnit>;
      }>,
    ) {
      const idSet = new Set(action.payload.unitIds);
      const apply = (u: InventoryUnit) =>
        idSet.has(u.id) ? { ...u, ...action.payload.fields } : u;
      state.units = state.units.map(apply);
      state.towers = state.towers.map((tower) => ({
        ...tower,
        floors: tower.floors.map((floor) => ({
          ...floor,
          units: floor.units.map(apply),
        })),
      }));
    },
    selectUnit(state, action: PayloadAction<string>) {
      if (!state.selectedUnits.includes(action.payload)) {
        state.selectedUnits.push(action.payload);
      }
    },
    selectOnlyUnit(state, action: PayloadAction<string>) {
      state.selectedUnits = [action.payload];
    },
    selectAllUnits(state) {
      const ids: string[] = [];
      for (const tower of state.towers) {
        for (const floor of tower.floors) {
          for (const unit of floor.units) {
            ids.push(unit.id);
          }
        }
      }
      if (ids.length === 0) {
        ids.push(...state.units.map((u) => u.id));
      }
      state.selectedUnits = ids;
    },
    deselectUnit(state, action: PayloadAction<string>) {
      state.selectedUnits = state.selectedUnits.filter(
        (id) => id !== action.payload,
      );
    },
    toggleUnitSelection(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.selectedUnits.includes(id)) {
        state.selectedUnits = state.selectedUnits.filter((x) => x !== id);
      } else {
        state.selectedUnits.push(id);
      }
    },
    clearSelection(state) {
      state.selectedUnits = [];
    },
    clearUnits(state) {
      state.units = [];
      state.selectedUnits = [];
    },
    hydrateInventoryWizard(
      state,
      action: PayloadAction<{
        projectType: ProjectTypeKey;
        subcategory: string;
        wizardStep: 1 | 2 | 3;
      }>,
    ) {
      state.projectType = action.payload.projectType;
      state.subcategory = action.payload.subcategory;
      state.wizardStep = action.payload.wizardStep;
    },
    applyInventoryDraft(
      state,
      action: PayloadAction<Partial<InventoryState>>,
    ) {
      const draft = action.payload;
      if (draft.towers) {
        state.towers = draft.towers;
        if (draft.towers.length > 0) {
          state.selectedTowerId = draft.towers[0].id;
          state.selectedFloorNumber =
            draft.towers[0].floors[0]?.number ?? null;
        }
      }
      if (draft.units) state.units = draft.units;
      if (draft.plotRows !== undefined) state.plotRows = draft.plotRows;
      if (draft.plotCols !== undefined) state.plotCols = draft.plotCols;
      state.selectedUnits = [];
    },
    resetInventory() {
      return { ...initialState };
    },
  },
});

export const {
  setWizardStep,
  setProjectType,
  setSubcategory,
  setProjectName,
  setProjectId,
  setSelectedTowerId,
  setSelectedFloorNumber,
  generateTowers,
  addTower,
  scaffoldFloors,
  scaffoldUnits,
  generateUnits,
  generatePlots,
  updateUnit,
  updateTowerUnit,
  bulkUpdateStatus,
  bulkUpdateUnits,
  selectUnit,
  selectOnlyUnit,
  selectAllUnits,
  deselectUnit,
  toggleUnitSelection,
  clearSelection,
  clearUnits,
  hydrateInventoryWizard,
  applyInventoryDraft,
  resetInventory,
  removeUnit,
  removeFloor,
  removeTower,
} = inventorySlice.actions;

export default inventorySlice.reducer;
