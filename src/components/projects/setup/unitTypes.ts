export type UnitStatus = "available" | "booked" | "sold" | "blocked";

export interface UnitFormValues {
  id?: string;
  unit_number: string;
  unit_type_id?: string | null;
  status: UnitStatus;
  carpet_area_sqft: number;
  super_builtup_area_sqft?: number;
  facing?: string;
  amenities?: string[];
  price?: number;
  lead_id?: string | null;
}

export interface Unit extends UnitFormValues {
  id: string;
  nodeId: string;
}
