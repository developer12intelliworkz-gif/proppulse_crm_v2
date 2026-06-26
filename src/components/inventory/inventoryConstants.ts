export interface SubcategoryDef {
  key: string;
  label: string;
  icon: string;
  unitLabel: string;
  hasTowers?: boolean;
  hasFloors?: boolean;
  isPlotting?: boolean;
}

export interface ProjectTypeDef {
  label: string;
  icon: string;
  description: string;
  subcategories: SubcategoryDef[];
}

export const PROJECT_TYPES: Record<string, ProjectTypeDef> = {
  residential: {
    label: "Residential",
    icon: "🏠",
    description: "Apartments, villas, plots & homes",
    subcategories: [
      {
        key: "flat_apartment",
        label: "Flat / Apartment",
        icon: "🏢",
        unitLabel: "Unit",
        hasTowers: true,
        hasFloors: true,
      },
      {
        key: "bungalow",
        label: "Bungalows",
        icon: "🏡",
        unitLabel: "Bungalow",
      },
      {
        key: "weekend_home",
        label: "Weekend Homes",
        icon: "🛖",
        unitLabel: "Home",
      },
      {
        key: "farmhouse",
        label: "Farmhouse",
        icon: "🌿",
        unitLabel: "Farmhouse",
      },
      {
        key: "residential_plot",
        label: "Residential Plotting",
        icon: "📐",
        unitLabel: "Plot",
        isPlotting: true,
      },
    ],
  },
  commercial: {
    label: "Commercial",
    icon: "🏪",
    description: "Showrooms, shops, offices & plots",
    subcategories: [
      {
        key: "showroom",
        label: "Showroom",
        icon: "🏬",
        unitLabel: "Showroom",
      },
      { key: "shop", label: "Shops", icon: "🛍️", unitLabel: "Shop" },
      {
        key: "office",
        label: "Office",
        icon: "💼",
        unitLabel: "Office",
        hasFloors: true,
      },
      {
        key: "commercial_plot",
        label: "Commercial Plotting",
        icon: "📋",
        unitLabel: "Plot",
        isPlotting: true,
      },
    ],
  },
  industry: {
    label: "Industry",
    icon: "🏭",
    description: "Warehouses, cold storage & industrial plots",
    subcategories: [
      {
        key: "warehouse",
        label: "Warehouse",
        icon: "🏗️",
        unitLabel: "Warehouse",
      },
      {
        key: "cold_storage",
        label: "Cold Storage",
        icon: "❄️",
        unitLabel: "Cold Storage Unit",
      },
      {
        key: "industry_plot",
        label: "Industry Plotting",
        icon: "🏭",
        unitLabel: "Industrial Plot",
        isPlotting: true,
      },
    ],
  },
};

export const getSubcategory = (
  typeKey: string | null,
  subKey: string | null,
): SubcategoryDef | null => {
  if (!typeKey || !subKey) return null;
  return (
    PROJECT_TYPES[typeKey]?.subcategories.find((s) => s.key === subKey) ?? null
  );
};

export const isApartmentSubcategory = (sub: string | null) =>
  sub === "flat_apartment";

export const isPlottingSubcategory = (sub: string | null) => {
  const plottingKeys = [
    "residential_plot",
    "commercial_plot",
    "industry_plot",
  ];
  return sub ? plottingKeys.includes(sub) : false;
};

export const FACING_OPTIONS = [
  { value: "east", label: "East" },
  { value: "west", label: "West" },
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "north_east", label: "North-East" },
  { value: "north_west", label: "North-West" },
  { value: "south_east", label: "South-East" },
  { value: "south_west", label: "South-West" },
] as const;

export const AREA_UNIT_OPTIONS = [
  { value: "sqft", label: "Sq. Ft" },
  { value: "sqyd", label: "Sq. Yd" },
] as const;

export const STATUS_OPTIONS = [
  { value: "available", label: "Available", className: "bg-green-500" },
  { value: "reserved", label: "Reserved", className: "bg-sky-400" },
  { value: "sold", label: "Sold", className: "bg-red-500" },
  { value: "blocked", label: "Blocked", className: "bg-amber-400" },
  { value: "booked", label: "Booked", className: "bg-violet-500" },
] as const;

export const STATUS_UI: Record<
  string,
  { cell: string; dot: string; badge: string; label: string }
> = {
  available: {
    cell: "bg-green-50 border-green-200 text-green-800 hover:bg-green-100",
    dot: "bg-green-500",
    badge: "bg-green-100 text-green-700",
    label: "Available",
  },
  reserved: {
    cell: "bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100",
    dot: "bg-sky-400",
    badge: "bg-sky-100 text-sky-700",
    label: "Reserved",
  },
  sold: {
    cell: "bg-red-50 border-red-200 text-red-800 hover:bg-red-100",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700",
    label: "Sold",
  },
  blocked: {
    cell: "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100",
    dot: "bg-amber-400",
    badge: "bg-amber-100 text-amber-700",
    label: "Blocked",
  },
  booked: {
    cell: "bg-violet-50 border-violet-200 text-violet-800 hover:bg-violet-100",
    dot: "bg-violet-500",
    badge: "bg-violet-100 text-violet-700",
    label: "Booked",
  },
};
