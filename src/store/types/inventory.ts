export type ProjectTypeKey = "residential" | "commercial" | "industry";

export type UnitStatus =
  | "available"
  | "reserved"
  | "sold"
  | "blocked"
  | "booked";

export type AreaType = "sqft" | "sqyard" | "acre";
export type AreaUnit = "sqft" | "sqyd";

export interface InventoryUnit {
  id: string;
  number: string;
  unitName: string;
  area: string;
  super_builtup_area: string;
  areaUnit_carpet: AreaUnit;
  areaUnit_super: AreaUnit;
  areaType?: AreaType;
  base_rate: string;
  total_price: number | null;
  unit_type_id: number | null;
  facing: string | null;
  has_parking: boolean;
  parking_count: number | null;
  price: string;
  status: UnitStatus;
  amenities?: string[];
  notes?: string;
  floorLabel?: string;
  row?: number;
  col?: number;
}

export interface InventoryFloor {
  number: number;
  label?: string;
  isParking: boolean;
  units: InventoryUnit[];
  nodeId?: string;
}

export interface InventoryTower {
  id: string;
  name: string;
  totalFloors: number;
  totalUnits: number;
  floors: InventoryFloor[];
  nodeId?: string;
}

export interface InventoryState {
  wizardStep: 1 | 2 | 3;
  projectType: ProjectTypeKey | null;
  subcategory: string | null;
  projectName: string;
  projectId: string | null;
  towers: InventoryTower[];
  units: InventoryUnit[];
  plotRows: number;
  plotCols: number;
  selectedUnits: string[];
  selectedTowerId: string | null;
  selectedFloorNumber: number | null;
}

export interface InventoryMetrics {
  totalUnits: number;
  available: number;
  reserved: number;
  sold: number;
  blocked: number;
  booked: number;
  totalValue: number;
  soldValue: number;
  totalTowers: number;
  totalFloors: number;
}
