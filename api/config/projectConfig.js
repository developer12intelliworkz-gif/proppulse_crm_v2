// config/projectConfig.js
export const PROJECT_CONFIG = {
  level1_project_types: [
    { code: "RESIDENTIAL", name: "Residential" },
    { code: "COMMERCIAL", name: "Commercial" },
    { code: "INDUSTRIAL", name: "Industrial" },
    { code: "MIXED_USE", name: "Mixed-Use" },
    { code: "LAND", name: "Land / Plotting" },
  ],

  level2_project_structures: {
    RESIDENTIAL: [
      { code: "TOWER_BASED", name: "Towers / Buildings" },
      { code: "SECTOR_BASED", name: "Sectors / Blocks" },
      { code: "VILLA_ROW", name: "Villas / Row Houses" },
      { code: "PLOT_BASED", name: "Plots Only" },
      { code: "PHASE_BASED", name: "Phases" },
      { code: "SINGLE_BUILDING", name: "Single Building" },
      { code: "NA", name: "Not Applicable" },
    ],
    COMMERCIAL: [
      { code: "TOWER_BASED", name: "Towers" },
      { code: "COMPLEX_BASED", name: "Complex / Mall / Business Park" },
      { code: "FLOOR_WISE", name: "Floor-Wise Units" },
      { code: "SHOP_WISE", name: "Shop / Unit Based" },
      { code: "PHASE_BASED", name: "Phases" },
      { code: "SINGLE_BUILDING", name: "Single Building" },
      { code: "NA", name: "Not Applicable" },
    ],
    INDUSTRIAL: [
      { code: "PLOT_SHED", name: "Plots with Shed" },
      { code: "SHED_BASED", name: "Shed / Warehouse Park" },
      { code: "PHASE_BASED", name: "Phases" },
      { code: "ZONE_BASED", name: "Zones / SEZ" },
      { code: "SINGLE_UNIT", name: "Single Factory / Unit" },
      { code: "NA", name: "Not Applicable" },
    ],
    MIXED_USE: [
      { code: "TOWER_BASED", name: "Multiple Towers" },
      { code: "SECTOR_BASED", name: "Sectors" },
      { code: "PHASE_BASED", name: "Phases" },
      { code: "COMPLEX_BASED", name: "Integrated Complex" },
      { code: "NA", name: "Not Applicable" },
    ],
    LAND: [
      { code: "PLOT_ONLY", name: "Plots Only" },
      { code: "SECTOR_BASED", name: "Sectors" },
      { code: "PHASE_BASED", name: "Phases" },
      { code: "NA", name: "Not Applicable" },
    ],
  },

  level3_level4_hierarchy_by_structure: {
    RESIDENTIAL: {
      TOWER_BASED: {
        level3: {
          type_code: "TOWER",
          default_label: "Tower / Building",
          required: true,
          examples: ["Tower A", "Tower B"],
        },
        level4_modes: [
          {
            mode_code: "WING_MODE",
            level4: {
              type_code: "WING",
              default_label: "Wing / Core",
              required: false,
              examples: ["A", "B"],
            },
          },
          {
            mode_code: "FLOOR_MODE",
            level4: {
              type_code: "FLOOR",
              default_label: "Floor",
              required: false,
              examples: ["1", "2", "3"],
            },
          },
          {
            mode_code: "WING_FLOOR_MODE",
            extra_level: {
              type_code: "FLOOR",
              default_label: "Floor",
              required: true,
            },
            note: "Advanced: Tower -> Wing -> Floor -> Unit",
          },
        ],
        inventory_unit_types: ["FLAT"],
      },
      SECTOR_BASED: {
        level3: {
          type_code: "SECTOR",
          default_label: "Sector",
          required: true,
          examples: ["Sector 1", "Sector 2"],
        },
        level4: {
          type_code: "BLOCK",
          default_label: "Block / Pocket / Street",
          required: false,
          examples: ["Block A", "Pocket 3"],
        },
        inventory_unit_types: ["PLOT", "VILLA", "FLAT"],
      },
      VILLA_ROW: {
        level3: {
          type_code: "CLUSTER",
          default_label: "Cluster / Phase",
          required: false,
          examples: ["Phase 1", "Cluster A"],
        },
        level4: {
          type_code: "STREET",
          default_label: "Street / Row",
          required: false,
          examples: ["Street 5", "Row B"],
        },
        inventory_unit_types: ["VILLA", "ROW_HOUSE"],
      },
      PLOT_BASED: {
        level3: {
          type_code: "PHASE",
          default_label: "Phase / Sector",
          required: false,
          examples: ["Phase 1"],
        },
        level4: {
          type_code: "BLOCK",
          default_label: "Block / Street / Pocket",
          required: false,
          examples: ["Block C"],
        },
        inventory_unit_types: ["PLOT"],
      },
      PHASE_BASED: {
        level3: {
          type_code: "PHASE",
          default_label: "Phase",
          required: true,
          examples: ["Phase 1", "Phase 2"],
        },
        level4: {
          type_code: "CLUSTER",
          default_label: "Cluster / Block",
          required: false,
          examples: ["Cluster A"],
        },
        inventory_unit_types: ["FLAT", "VILLA", "PLOT"],
      },
      SINGLE_BUILDING: {
        level3: {
          type_code: "BUILDING",
          default_label: "Building",
          required: true,
          auto_create_single: true,
          examples: ["Building"],
        },
        level4: {
          type_code: "FLOOR",
          default_label: "Floor",
          required: false,
          examples: ["1", "2"],
        },
        inventory_unit_types: ["FLAT"],
      },
      NA: {
        level3: {
          type_code: "NA",
          default_label: "Not Applicable",
          required: false,
        },
        level4: {
          type_code: "NA",
          default_label: "Not Applicable",
          required: false,
        },
        inventory_unit_types: ["FLAT", "VILLA", "PLOT"],
      },
    },
    COMMERCIAL: {
      TOWER_BASED: {
        level3: {
          type_code: "TOWER",
          default_label: "Tower",
          required: true,
          examples: ["Tower A"],
        },
        level4: {
          type_code: "FLOOR",
          default_label: "Floor",
          required: false,
          examples: ["G", "1", "2"],
        },
        inventory_unit_types: ["OFFICE", "SHOP"],
      },
      COMPLEX_BASED: {
        level3: {
          type_code: "BLOCK",
          default_label: "Block / Building",
          required: true,
          examples: ["Block 1"],
        },
        level4: {
          type_code: "FLOOR_OR_ZONE",
          default_label: "Floor / Zone",
          required: false,
          examples: ["Food Court", "Retail Zone", "1"],
        },
        inventory_unit_types: ["SHOP", "KIOSK", "OFFICE"],
      },
      FLOOR_WISE: {
        level3: {
          type_code: "BUILDING",
          default_label: "Building / Block",
          required: true,
          examples: ["Building A"],
        },
        level4: {
          type_code: "FLOOR",
          default_label: "Floor",
          required: true,
          examples: ["1", "2", "3"],
        },
        inventory_unit_types: ["OFFICE", "SUITE"],
      },
      SHOP_WISE: {
        level3: {
          type_code: "BLOCK",
          default_label: "Block / Wing",
          required: true,
          examples: ["Wing A"],
        },
        level4: {
          type_code: "FLOOR_OR_ZONE",
          default_label: "Floor / Zone",
          required: false,
          examples: ["Ground", "Retail Zone"],
        },
        inventory_unit_types: ["SHOP", "SHOWROOM"],
      },
      PHASE_BASED: {
        level3: {
          type_code: "PHASE",
          default_label: "Phase",
          required: true,
          examples: ["Phase 1"],
        },
        level4: {
          type_code: "BLOCK",
          default_label: "Block / Building",
          required: false,
          examples: ["Block A"],
        },
        inventory_unit_types: ["OFFICE", "SHOP"],
      },
      SINGLE_BUILDING: {
        level3: {
          type_code: "BUILDING",
          default_label: "Building",
          required: true,
          auto_create_single: true,
          examples: ["Building"],
        },
        level4: {
          type_code: "FLOOR",
          default_label: "Floor",
          required: false,
          examples: ["G", "1"],
        },
        inventory_unit_types: ["OFFICE", "SHOP"],
      },
      NA: {
        level3: {
          type_code: "NA",
          default_label: "Not Applicable",
          required: false,
        },
        level4: {
          type_code: "NA",
          default_label: "Not Applicable",
          required: false,
        },
        inventory_unit_types: ["OFFICE", "SHOP"],
      },
    },
    INDUSTRIAL: {
      PLOT_SHED: {
        level3: {
          type_code: "ZONE",
          default_label: "Phase / Zone",
          required: true,
          examples: ["Zone A"],
        },
        level4: {
          type_code: "STREET",
          default_label: "Cluster / Street",
          required: false,
          examples: ["Street 1"],
        },
        inventory_unit_types: ["INDUSTRIAL_PLOT", "SHED_UNIT"],
      },
      SHED_BASED: {
        level3: {
          type_code: "WAREHOUSE_BUILDING",
          default_label: "Warehouse Building / Shed Block",
          required: true,
          examples: ["Shed Block 1"],
        },
        level4: {
          type_code: "BAY",
          default_label: "Bay / Row",
          required: false,
          examples: ["Bay 01", "Row A"],
        },
        inventory_unit_types: ["WAREHOUSE_UNIT", "BAY_UNIT"],
      },
      PHASE_BASED: {
        level3: {
          type_code: "PHASE",
          default_label: "Phase",
          required: true,
          examples: ["Phase 1"],
        },
        level4: {
          type_code: "ZONE",
          default_label: "Zone / Cluster",
          required: false,
          examples: ["Zone B"],
        },
        inventory_unit_types: ["INDUSTRIAL_PLOT", "WAREHOUSE_UNIT"],
      },
      ZONE_BASED: {
        level3: {
          type_code: "ZONE",
          default_label: "Zone",
          required: true,
          examples: ["SEZ Zone 1"],
        },
        level4: {
          type_code: "SECTOR",
          default_label: "Sector / Cluster",
          required: false,
          examples: ["Sector A"],
        },
        inventory_unit_types: ["INDUSTRIAL_PLOT", "UNIT"],
      },
      SINGLE_UNIT: {
        level3: {
          type_code: "FACTORY",
          default_label: "Factory / Unit",
          required: true,
          auto_create_single: true,
          examples: ["Factory"],
        },
        level4: {
          type_code: "NA",
          default_label: "Not Applicable",
          required: false,
        },
        inventory_unit_types: ["FACTORY_UNIT"],
      },
      NA: {
        level3: {
          type_code: "NA",
          default_label: "Not Applicable",
          required: false,
        },
        level4: {
          type_code: "NA",
          default_label: "Not Applicable",
          required: false,
        },
        inventory_unit_types: ["INDUSTRIAL_PLOT", "WAREHOUSE_UNIT"],
      },
    },
    MIXED_USE: {
      TOWER_BASED: {
        level3: {
          type_code: "TOWER",
          default_label: "Tower",
          required: true,
          examples: ["Tower A"],
        },
        level4: {
          type_code: "FLOOR",
          default_label: "Floor",
          required: false,
          examples: ["G", "1", "2"],
        },
        inventory_unit_types: ["FLAT", "OFFICE", "SHOP"],
        inventory_extra_fields: [
          {
            code: "USAGE_TYPE",
            name: "Usage Type",
            values: ["RESIDENTIAL", "COMMERCIAL", "RETAIL"],
          },
        ],
      },
      SECTOR_BASED: {
        level3: {
          type_code: "SECTOR",
          default_label: "Sector",
          required: true,
          examples: ["Sector 1"],
        },
        level4: {
          type_code: "BLOCK",
          default_label: "Block / Cluster",
          required: false,
          examples: ["Block A"],
        },
        inventory_unit_types: ["PLOT", "FLAT", "SHOP"],
      },
      PHASE_BASED: {
        level3: {
          type_code: "PHASE",
          default_label: "Phase",
          required: true,
          examples: ["Phase 1"],
        },
        level4: {
          type_code: "BLOCK",
          default_label: "Block / Tower",
          required: false,
          examples: ["Tower B"],
        },
        inventory_unit_types: ["FLAT", "OFFICE", "SHOP", "PLOT"],
      },
      COMPLEX_BASED: {
        level3: {
          type_code: "COMPLEX",
          default_label: "Complex Block / Building",
          required: true,
          examples: ["Complex 1"],
        },
        level4: {
          type_code: "FLOOR_OR_ZONE",
          default_label: "Floor / Zone",
          required: false,
          examples: ["Retail Zone", "1"],
        },
        inventory_unit_types: ["FLAT", "OFFICE", "SHOP"],
      },
      NA: {
        level3: {
          type_code: "NA",
          default_label: "Not Applicable",
          required: false,
        },
        level4: {
          type_code: "NA",
          default_label: "Not Applicable",
          required: false,
        },
        inventory_unit_types: ["FLAT", "OFFICE", "SHOP", "PLOT"],
      },
    },
    LAND: {
      PLOT_ONLY: {
        level3: {
          type_code: "SECTOR_OR_PHASE",
          default_label: "Sector / Phase",
          required: false,
          examples: ["Sector A", "Phase 1"],
        },
        level4: {
          type_code: "BLOCK_OR_STREET",
          default_label: "Block / Street / Pocket",
          required: false,
          examples: ["Block 2", "Street 7"],
        },
        inventory_unit_types: ["PLOT"],
      },
      SECTOR_BASED: {
        level3: {
          type_code: "SECTOR",
          default_label: "Sector",
          required: true,
          examples: ["Sector 1"],
        },
        level4: {
          type_code: "BLOCK",
          default_label: "Block / Pocket",
          required: false,
          examples: ["Pocket A"],
        },
        inventory_unit_types: ["PLOT"],
      },
      PHASE_BASED: {
        level3: {
          type_code: "PHASE",
          default_label: "Phase",
          required: true,
          examples: ["Phase 1"],
        },
        level4: {
          type_code: "SECTOR",
          default_label: "Sector / Block",
          required: false,
          examples: ["Sector B"],
        },
        inventory_unit_types: ["PLOT"],
      },
      NA: {
        level3: {
          type_code: "NA",
          default_label: "Not Applicable",
          required: false,
        },
        level4: {
          type_code: "NA",
          default_label: "Not Applicable",
          required: false,
        },
        inventory_unit_types: ["PLOT"],
      },
    },
  },

  global_enums: {
    level3_type_codes: [
      "TOWER",
      "BUILDING",
      "SECTOR",
      "PHASE",
      "ZONE",
      "COMPLEX",
      "BLOCK",
      "CLUSTER",
      "WAREHOUSE_BUILDING",
      "FACTORY",
      "SECTOR_OR_PHASE",
    ],
    level4_type_codes: [
      "WING",
      "FLOOR",
      "BLOCK",
      "POCKET",
      "STREET",
      "ROW",
      "BAY",
      "ZONE",
      "SECTOR",
      "FLOOR_OR_ZONE",
      "BLOCK_OR_STREET",
      "NA",
    ],
    inventory_unit_types: [
      "FLAT",
      "VILLA",
      "ROW_HOUSE",
      "PLOT",
      "OFFICE",
      "SUITE",
      "SHOP",
      "SHOWROOM",
      "KIOSK",
      "INDUSTRIAL_PLOT",
      "WAREHOUSE_UNIT",
      "BAY_UNIT",
      "SHED_UNIT",
      "UNIT",
      "FACTORY_UNIT",
    ],
  },
};
