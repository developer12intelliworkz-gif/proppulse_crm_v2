# PropPulse CRM — System Documentation

## Project & Quotation Modules (End-to-End)

**Version:** 1.0  
**Last updated:** June 2026  
**Audience:** Developers, product team, system architects

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [CRM Process — Six Main Steps](#2-crm-process--six-main-steps)
3. [Module 1: Project Creation](#3-module-1-project-creation)
4. [Module 2: Project Update](#4-module-2-project-update)
5. [Module 3: Project Setup (Inventory)](#5-module-3-project-setup-inventory)
6. [Module 4: Unit Creation & Management](#6-module-4-unit-creation--management)
7. [Module 5: Quotation Module](#7-module-5-quotation-module)
8. [Database Schema Reference](#8-database-schema-reference)
9. [Entity Relationships (ER Model)](#9-entity-relationships-er-model)
10. [API Endpoints Reference](#10-api-endpoints-reference)
11. [Backend Architecture & Data Flow](#11-backend-architecture--data-flow)
12. [Edge Cases & Special Scenarios](#12-edge-cases--special-scenarios)
13. [Known Gaps & Implementation Notes](#13-known-gaps--implementation-notes)

---

## 1. System Overview

PropPulse CRM is a real-estate customer relationship management platform built on:

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Frontend | React + TypeScript, Redux, React Router |
| Backend  | Node.js + Express (ES modules)          |
| Database | PostgreSQL                              |
| Auth     | JWT (`authenticateToken` middleware)    |

The **Project** and **Quotation** modules form a connected pipeline:

```
Project Creation (6-step wizard)
    → Project Setup (type, structure, hierarchy)
        → Unit Creation & Management
            → Quotation Template Setup
                → Quotation Generation & PDF
```

**Key design principles:**

- Projects store marketing/metadata in the main `projects` table; inventory structure is configured separately via **Project Setup**.
- Units are always linked to a **hierarchy node** (tower, sector, floor, etc.), not directly to the project root.
- Quotations are **immutable snapshots** — generated once with frozen pricing; no update/delete API exists.
- Soft deletes are used throughout (`deleted_at` columns).

---

## 2. CRM Process — Six Main Steps

The CRM defines **two parallel workflows** for projects:

### A. Project Profile Wizard (6 Steps) — Marketing & Metadata

Used when creating/editing a project via `/projects/create` and `/projects/edit/:id`.

| Step | Name                       | Purpose                                            | API Action                                       |
| ---- | -------------------------- | -------------------------------------------------- | ------------------------------------------------ |
| 1    | Project Details            | Core identity, dates, sales assignment             | `POST /projects` (create) or `PUT /projects/:id` |
| 2    | Address                    | Location, map coordinates, office address          | `PUT /projects/:id`                              |
| 3    | Virtual Walkthrough        | VR `.glb` upload (optional)                        | `PUT /projects/:id` (multipart)                  |
| 4    | Amenities & Specifications | Feature flags + spec list                          | `PUT /projects/:id`                              |
| 5    | Brochures                  | PDF/image uploads + email templates                | `PUT /projects/:id` (multipart)                  |
| 6    | Portal Integration         | India Property / Magicbricks codes; marks complete | `PUT /projects/:id` → `status: "completed"`      |

### B. Inventory Setup Wizard (3 Steps) — Units & Hierarchy

Used via `/project-setup` after a project exists.

| Step | Name              | Purpose                                      | API Action                           |
| ---- | ----------------- | -------------------------------------------- | ------------------------------------ |
| 1    | Initial Setup     | Select project type (L1) and structure (L2)  | `PUT /projects/:id/initial-setup`    |
| 2    | Level 3 Hierarchy | Create towers/sectors/phases/etc.            | `POST /projects/:id/hierarchy-nodes` |
| 3    | Units             | Create inventory units under hierarchy nodes | `POST /projects/:id/units`           |

### C. Quotation Flow (3 Tabs)

Used via `/quotations/:projectId` after units exist.

| Tab                  | Purpose                              | API Action                                                   |
| -------------------- | ------------------------------------ | ------------------------------------------------------------ |
| Particulars Setup    | Define pricing line items (template) | `POST /quotation-templates`                                  |
| Units & Generate     | Pick unit, generate quotation        | `POST /quotations/generate`                                  |
| Generated Quotations | View/download past quotations        | `GET /quotations/by-project/:id`, `POST /quotations/:id/pdf` |

---

## 3. Module 1: Project Creation

### 3.1 Purpose

Creates a new real-estate project record with marketing metadata, location, amenities, brochures, and portal integration codes. Does **not** configure inventory structure — that happens in Project Setup.

### 3.2 Entry Points

| Route              | Component                                           |
| ------------------ | --------------------------------------------------- |
| `/projects/create` | `CreateProject.tsx` → 6-step wizard                 |
| `/project-setup`   | Quick create: `POST /projects` with `{ name }` only |

### 3.3 Step-by-Step Workflow

#### Step 1 — Project Details

**Frontend:** `Step1Form.tsx`  
**API:** `POST /api/projects` (multipart/form-data)

| Display Name        | Technical Field       | Data Type            | Required | Default      | Validation                     | Business Logic               |
| ------------------- | --------------------- | -------------------- | -------- | ------------ | ------------------------------ | ---------------------------- |
| Project Name        | `name`                | `string`             | Yes      | —            | Non-empty                      | Primary identifier           |
| Description         | `description`         | `string` (HTML)      | No       | `""`         | —                              | Rich text via ReactQuill     |
| RERA Project ID     | `rera_project_id`     | `string`             | No       | —            | `/^[a-zA-Z0-9-]+$/` if set     | Regulatory ID                |
| Users               | `sales`               | `string` (user UUID) | No       | —            | Must exist in `users`          | Assigned sales user          |
| Notify To Emails    | `notify_to_emails`    | `string[]`           | No       | `[]`         | Valid emails                   | Sends notification on create |
| Launched On         | `launched_on`         | `date`               | Yes      | —            | ≥ today; ≤ expected_completion | Project launch date          |
| Expected Completion | `expected_completion` | `date`               | Yes      | —            | ≤ possession                   | Construction timeline        |
| Possession          | `possession`          | `date`               | Yes      | —            | After expected completion      | Handover date                |
| Is Active           | `is_active`           | `boolean`            | No       | `true`       | —                              | Visibility flag              |
| Inventory           | `inventory`           | `boolean`            | No       | `false`      | Irreversible warning shown     | Enables unit management      |
| Created By          | `created_by`          | `UUID`               | Yes      | Auth user ID | —                              | Audit trail                  |
| Status              | `status`              | `string`             | —        | `"draft"`    | —                              | Wizard progress marker       |

**Backend (`createProject`):**

1. Parses multipart: `vr_upload` (1 file), `brochure_uploads` (up to 10 files)
2. Parses JSON strings for `amenities`, `specifications`
3. Builds `office_address` from `office_address_line1` + `office_address_line2`
4. If `status === "completed"`: validates name, full address, ≥1 spec, ≥1 brochure, property code, VR file if enabled
5. Transaction: INSERT `projects` + INSERT `project_specifications` rows
6. Optional notification emails to `notify_to_emails`

**Response:** `{ id, message }` — project UUID returned.

---

#### Step 2 — Address

**Frontend:** `Step2Form.tsx`  
**API:** `PUT /api/projects/:id`

| Display Name           | Technical Field        | Data Type | Required | Validation                        |
| ---------------------- | ---------------------- | --------- | -------- | --------------------------------- |
| Search Project Address | `search_address`       | `string`  | Yes      | Nominatim autocomplete (≥3 chars) |
| Full Address           | `address`              | `string`  | Yes      | Non-empty                         |
| Street / Road          | `street`               | `string`  | No       | —                                 |
| Locality / Area        | `locality`             | `string`  | No       | —                                 |
| City                   | `city`                 | `string`  | Yes      | —                                 |
| State                  | `state`                | `string`  | Yes      | —                                 |
| Country                | `country`              | `string`  | Yes      | —                                 |
| Pin Code / ZIP         | `zip`                  | `string`  | Yes      | —                                 |
| Latitude               | `latitude`             | `string`  | No       | Map draggable                     |
| Longitude              | `longitude`            | `string`  | No       | Map draggable                     |
| Office Address Line 1  | `office_address_line1` | `string`  | No       | —                                 |
| Office Address Line 2  | `office_address_line2` | `string`  | No       | Combined → `office_address` in DB |

---

#### Step 3 — Virtual Walkthrough

| Display Name           | Technical Field | Data Type | Required      | Validation               |
| ---------------------- | --------------- | --------- | ------------- | ------------------------ |
| Enable Virtual Reality | `enable_vr`     | `boolean` | No            | `false`                  |
| Upload .glb File       | `vr_upload`     | `File`    | If VR enabled | Must be `.glb` extension |
| VR Upload URL          | `vr_upload_url` | `string`  | —             | Set after server upload  |

Files stored in `public/project_vr_app_document/`. Served at `/project_vr_app_document/*`.

---

#### Step 4 — Amenities & Specifications

**Amenities** (`amenities` JSONB object — boolean flags):

| Display Name      | Key                 |
| ----------------- | ------------------- |
| Sr Citizen Corner | `sr_citizen_corner` |
| Gazebo            | `gazebo`            |
| Kids Play Area    | `kids_play_area`    |
| Garden            | `garden`            |
| Jogging Track     | `jogging_track`     |

**Specifications** (`project_specifications` table — at least 1 required on completion):

| Field         | Data Type | Required |
| ------------- | --------- | -------- |
| `title`       | `string`  | Yes      |
| `description` | `string`  | Yes      |

---

#### Step 5 — Brochures

| Display Name     | Technical Field       | Data Type       | Required                            | Validation                              |
| ---------------- | --------------------- | --------------- | ----------------------------------- | --------------------------------------- |
| Upload Brochures | `brochure_uploads`    | `File[]`        | ≥1 file OR template OR existing URL | PDF, JPG, PNG only                      |
| Template Name    | `brochures[].name`    | `string`        | If adding template                  | All 3 template fields required together |
| Subject          | `brochures[].subject` | `string`        | —                                   | —                                       |
| Content          | `brochures[].content` | `string` (HTML) | —                                   | —                                       |
| Active           | `brochures[].active`  | `boolean`       | No                                  | `true`                                  |

Stored as filenames in `projects.brochure_uploads` (TEXT array).

---

#### Step 6 — Portal Integration

| Display Name        | Technical Field       | Data Type | Required            | Validation                           |
| ------------------- | --------------------- | --------- | ------------------- | ------------------------------------ |
| India Property Code | `india_property_code` | `string`  | One of two required | `/^[a-zA-Z0-9-]+$/`                  |
| Magicbricks Code    | `magicbricks_code`    | `string`  | One of two required | Same pattern                         |
| Status              | `status`              | `string`  | —                   | Set to `"completed"` on final submit |

**Completion validation:** Re-validates Steps 1, 2, 4, and 3 (VR) before marking complete.

---

### 3.4 Backend Create Flow

```
Frontend (Step1Form)
  → FormContext.saveStepData()
  → POST /api/projects (multipart)
  → project.controller.js :: createProject()
      → Validate created_by, status rules
      → INSERT projects
      → INSERT project_specifications (if any)
      → Send notification emails (optional)
  → Returns { id }
  → Steps 2–6: PUT /api/projects/:id
```

**Controller:** `api/controllers/project.controller.js`  
**Route:** `POST /api/projects` (auth required)

---

## 4. Module 2: Project Update

### 4.1 Purpose

Partial or full update of an existing project's metadata. Supports dynamic field updates — only fields present in the request body are modified.

### 4.2 Entry Points

| Route                                | Component                               |
| ------------------------------------ | --------------------------------------- |
| `/projects/edit/:id/step1` … `step6` | Edit wizard (same forms as create)      |
| `/projects/manage`                   | `ProjectManagement.tsx` — list + delete |

### 4.3 Update Logic

**API:** `PUT /api/projects/:id`  
**Controller:** `updateProject` in `project.controller.js`

**Updatable fields (dynamic — only sent fields are updated):**

| Field Group     | Fields                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity        | `name`, `description`, `rera_project_id`                                                                                                                      |
| Dates           | `launched_on`, `expected_completion`, `possession`                                                                                                            |
| Flags           | `is_active`, `inventory`, `enable_vr`                                                                                                                         |
| Address         | `search_address`, `address`, `street`, `locality`, `city`, `state`, `country`, `zip`, `latitude`, `longitude`, `office_address_line1`, `office_address_line2` |
| Files           | `vr_upload`, `brochure_uploads` (appends new files)                                                                                                           |
| Portal          | `india_property_code`, `magicbricks_code`                                                                                                                     |
| Status          | `status`                                                                                                                                                      |
| Inventory setup | `project_type`, `project_structure`                                                                                                                           |

**Rules:**

- Returns 400 if no fields provided
- `office_address` rebuilt from line1 + line2 when either changes
- Brochure uploads append to existing array (do not replace)
- Updating `project_type` without `project_structure` may clear structure (setup controller handles this separately)

### 4.4 Delete Logic

**API:** `DELETE /api/projects/:id`  
**Type:** Soft delete  
**Action:** `UPDATE projects SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL`

**Cascading effects (DB-level):**

- `project_specifications` — CASCADE delete
- `project_hierarchy_nodes` — CASCADE delete
- `project_units` — CASCADE delete
- `quotation_templates` — CASCADE delete
- `quotations` — CASCADE delete

**Application-level:** No hard delete. Deleted projects excluded from all list queries (`WHERE deleted_at IS NULL`).

---

## 5. Module 3: Project Setup (Inventory)

### 5.1 Purpose

Configures the **inventory structure** of a project after it has been created. Defines what type of real estate it is (residential tower, commercial complex, land plots, etc.) and builds the hierarchy tree under which units are created.

**Separate from** the 6-step marketing wizard. A project can exist with `project_type = NULL` until setup is completed.

### 5.2 Entry Point

**Route:** `/project-setup`  
**Component:** `src/components/projects/setup/ProjectSetup.tsx`

### 5.3 Setup Status Machine

**API:** `GET /api/projects/:id/setup-status`  
**Controller:** `projectSetup.controller.js` → `buildProjectSetupStatus()`

Returns:

```json
{
  "initialSetupComplete": false,
  "hasPartialSetup": false,
  "nextStep": "initial_setup",
  "nextStepKey": "initial_setup",
  "nextStepTitle": "Project Type & Structure",
  "level3Label": "Tower / Building",
  "level3TypeCode": "TOWER",
  "hierarchyConfig": { ... },
  "stepsCompleted": {
    "initialSetup": false,
    "level3Hierarchy": false,
    "units": false
  },
  "level3NodeCount": 0,
  "unitCount": 0
}
```

### 5.4 Step 1 — Initial Setup (L1 + L2)

**API:** `PUT /api/projects/:id/initial-setup`  
**Body:** `{ project_type, project_structure }`

#### Level 1 — Project Type (`projects.project_type`)

| Code          | Display Name    |
| ------------- | --------------- |
| `RESIDENTIAL` | Residential     |
| `COMMERCIAL`  | Commercial      |
| `INDUSTRIAL`  | Industrial      |
| `MIXED_USE`   | Mixed-Use       |
| `LAND`        | Land / Plotting |

#### Level 2 — Project Structure (`projects.project_structure`)

Depends on L1. Examples:

| L1 Type     | Valid L2 Codes                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------- |
| RESIDENTIAL | `TOWER_BASED`, `SECTOR_BASED`, `VILLA_ROW`, `PLOT_BASED`, `PHASE_BASED`, `SINGLE_BUILDING`, `NA`  |
| COMMERCIAL  | `TOWER_BASED`, `COMPLEX_BASED`, `FLOOR_WISE`, `SHOP_WISE`, `PHASE_BASED`, `SINGLE_BUILDING`, `NA` |
| INDUSTRIAL  | `PLOT_SHED`, `SHED_BASED`, `PHASE_BASED`, `ZONE_BASED`, `SINGLE_UNIT`, `NA`                       |
| MIXED_USE   | `TOWER_BASED`, `SECTOR_BASED`, `PHASE_BASED`, `COMPLEX_BASED`, `NA`                               |
| LAND        | `PLOT_ONLY`, `SECTOR_BASED`, `PHASE_BASED`, `NA`                                                  |

**Validation rules:**

- `project_type` required (non-empty)
- `project_structure` must be valid for the selected `project_type` (checked against `PROJECT_CONFIG` in `api/config/projectConfig.js`)
- Changing L1 alone clears L2 unless both are saved together
- On successful L1+L2 save → `syncProjectUnitTypes()` auto-creates `unit_types` rows

**Config source:** `api/config/projectConfig.js`  
**Routing logic:** `api/utils/projectSetupRouting.js`  
**Unit type sync:** `api/utils/syncProjectUnitTypes.js`

### 5.5 Step 2 — Level 3 Hierarchy

**API:** `POST /api/projects/:id/hierarchy-nodes`  
**Component:** `DynamicHierarchyBuilder.tsx`

#### Hierarchy Node Fields

| Display Name | Technical Field | Data Type | Required | Validation                                                |
| ------------ | --------------- | --------- | -------- | --------------------------------------------------------- |
| Name         | `name`          | `string`  | Yes      | Trimmed; unique per project (case-insensitive)            |
| Type Code    | `type_code`     | `string`  | Auto     | Set by backend from `PROJECT_CONFIG` — not sent by client |
| Parent Node  | `parent_id`     | `UUID`    | No       | `null` = Level 3; non-null = Level 4 child                |
| Description  | `description`   | `string`  | No       | Optional notes                                            |

#### L3/L4 Examples by Structure

| Type + Structure           | L3 (`type_code`) | L4 (`type_code`) | Unit Types                 |
| -------------------------- | ---------------- | ---------------- | -------------------------- |
| RESIDENTIAL + TOWER_BASED  | TOWER            | WING or FLOOR    | FLAT                       |
| RESIDENTIAL + SECTOR_BASED | SECTOR           | BLOCK            | PLOT, VILLA, FLAT          |
| RESIDENTIAL + PLOT_BASED   | PHASE            | —                | PLOT                       |
| COMMERCIAL + FLOOR_WISE    | BUILDING         | FLOOR (required) | OFFICE, SUITE, SHOP        |
| INDUSTRIAL + PLOT_SHED     | ZONE             | SHED             | INDUSTRIAL_PLOT, SHED_UNIT |
| LAND + PLOT_ONLY           | PHASE            | —                | PLOT                       |

**Duplicate prevention:**

- L3: unique `(project_id, UPPER(name))` where `parent_id IS NULL`
- L4: unique `(project_id, parent_id, UPPER(name))` where `parent_id IS NOT NULL`

**Delete protection:** Cannot delete a hierarchy node if units reference it (`ON DELETE RESTRICT` on `project_units.hierarchy_node_id`).

### 5.6 Step 3 — Units View

After hierarchy nodes exist, user clicks "Manage Units" on a node → navigates to units view filtered by `hierarchy_node_id`. See [Module 4](#6-module-4-unit-creation--management).

### 5.7 Reset Setup

**API:** `POST /api/projects/:id/reset-initial-setup`  
**Action:** Sets `project_type` and `project_structure` to `NULL`  
**Note:** Does NOT delete hierarchy nodes or units — only clears L1/L2.

---

## 6. Module 4: Unit Creation & Management

### 6.1 Purpose

Creates and manages individual sellable/rentable inventory units (flats, plots, shops, sheds, etc.) linked to a hierarchy node within a project.

### 6.2 Entry Points

| Route / Context               | Component                                      |
| ----------------------------- | ---------------------------------------------- |
| `/project-setup` → Units view | `UnitList.tsx` → `UnitForm.tsx`                |
| Legacy tower/floor path       | `CreateUnits.tsx` (nested under towers/floors) |

### 6.3 Unit Form Fields

| Display Name          | Technical Field           | Data Type        | Required       | Default       | Validation                                                                   | Business Logic                                                              |
| --------------------- | ------------------------- | ---------------- | -------------- | ------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Unit Number           | `unit_number`             | `string`         | Yes            | —             | Unique per project (case-insensitive); real-time duplicate check on frontend | Primary unit identifier (e.g. "A-101")                                      |
| Status                | `status`                  | `enum`           | No             | `"available"` | One of: `available`, `booked`, `sold`, `blocked`                             | Sales pipeline state                                                        |
| Unit Type             | `unit_type_id`            | `string/integer` | Yes (implicit) | Auto-resolved | Must exist in `unit_types` for project                                       | Links to inventory type from setup                                          |
| Carpet Area (sqft)    | `carpet_area_sqft`        | `number`         | Yes            | `0`           | Must be > 0                                                                  | Used in quotation basic price calculation                                   |
| Super Built-up (sqft) | `super_builtup_area_sqft` | `number`         | No             | —             | ≥ 0 if set                                                                   | Added to carpet for total area in quotations                                |
| Facing                | `facing`                  | `string`         | No             | —             | Free text                                                                    | Direction/view (North, Park View, etc.)                                     |
| Amenities             | `amenities`               | `string[]`       | No             | `[]`          | Array of strings                                                             | Toggle badges: Balcony, Parking, Garden View, Corner, Modular Kitchen, Lift |
| Assigned Lead         | `lead_id`                 | `string`         | No             | `null`        | Lead must exist, be active, and `interested_project_id` must match project   | CRM lead assignment                                                         |
| Price (₹)             | `price`                   | `number`         | No             | `0`           | ≥ 0                                                                          | Rate per sqft used in quotation: `basicPrice = totalArea × price`           |

### 6.4 Unit Type Resolution Logic

When `unit_type_id` is not sent explicitly, backend infers it:

1. Match hierarchy node's `type_code` to `unit_types.unit_name` (excluding structural codes: TOWER, FLOOR, BLOCK, WING, SECTOR, etc.)
2. If project has exactly **one** unit type → use it
3. Else → 400 error listing available count

**Structural codes excluded from unit type matching:** `TOWER`, `FLOOR`, `BLOCK`, `WING`, `SECTOR`, `PHASE`, `CLUSTER`, `STREET`, `ZONE`, `BUILDING`

### 6.5 Create Flow

```
UnitForm.tsx
  → handleSave()
  → UnitList.tsx builds payload
  → POST /api/projects/:projectId/units
  → unit.controller.js :: createUnit()
      1. Verify project exists
      2. buildUnitPayload() — validate + normalize
      3. ensureUniqueUnitNumber() — case-insensitive duplicate check
      4. getProjectUnitsSchema() — introspect DB columns
      5. resolveLegacyTowerFloor() — map to tower_id/floor_id if legacy columns exist
      6. buildUnitInsertQuery() — dynamic INSERT
  → 201 { message, data: unit }
```

### 6.6 Update Flow

**API:** `PUT /api/projects/:projectId/units/:unitId`  
Same validation as create; uniqueness check excludes current unit ID.

### 6.7 Delete Flow

**API:** `DELETE /api/projects/:projectId/units/:unitId`  
**Type:** Soft delete — `UPDATE project_units SET deleted_at = NOW()`

### 6.8 Duplicate Prevention

| Layer        | Mechanism                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------- |
| Frontend     | Real-time check against loaded project units on input change/blur                                  |
| Application  | `ensureUniqueUnitNumber()` in `unit.controller.js`                                                 |
| Database     | Unique index `uniq_project_units_project_unit_number` on `(project_id, UPPER(BTRIM(unit_number)))` |
| API response | 409 Conflict: "Unit number already exists"                                                         |

### 6.9 Unit Status Transitions

| Status      | Meaning                 | Typical Trigger                  |
| ----------- | ----------------------- | -------------------------------- |
| `available` | Open for sale           | Default on create                |
| `booked`    | Reserved by customer    | Manual update or lead assignment |
| `sold`      | Sale completed          | Manual update                    |
| `blocked`   | Temporarily unavailable | Admin hold                       |

No automatic status transitions — all manual via unit update.

### 6.10 Lead Assignment Side Effects

When a lead is assigned to a unit (`lead_id` set):

- Backend validates lead exists and `interested_project_id` matches the unit's project
- When lead's `interested_project_id` changes (via leads controller), units in other projects are unlinked automatically (unit sync in `leads.controller.js`)

---

## 7. Module 5: Quotation Module

### 7.1 Purpose

Generates formal price quotations for individual units using configurable pricing templates. Produces immutable snapshots with PDF output for client delivery.

### 7.2 Entry Points

| Route                                  | Component                                |
| -------------------------------------- | ---------------------------------------- |
| `/quotations`                          | `Quotations.tsx` — project list          |
| `/quotations/:projectId`               | `ProjectQuotations.tsx` — 3-tab workflow |
| `/quotations/:projectId/quotation/:id` | `QuotationView.tsx` — detail view        |

### 7.3 Complete Quotation Workflow

```
1. User navigates to /quotations
   → GET /api/projects-with-quotation-status
   → Shows projects with unit_count and template_count

2. User selects project → /quotations/:projectId

3. TAB 1: Particulars Setup
   → Define template_name + particulars (line items)
   → POST /api/quotation-templates
   → Creates versioned template + particulars rows
   → Live preview using example areas

4. TAB 2: Units & Generate
   → GET /api/units/by-project/:projectId
   → User selects unit, fills client name, date
   → Optional: exclude optional particulars
   → POST /api/quotations/generate
   → POST /api/quotations/:id/pdf (download)

5. TAB 3: Generated Quotations
   → GET /api/quotations/by-project/:projectId
   → View detail → /quotations/:projectId/quotation/:id
   → Download PDF again
```

### 7.4 Quotation Template Fields

**API:** `POST /api/quotation-templates`

| Display Name      | Technical Field     | Data Type      | Required | Default | Validation                                                   |
| ----------------- | ------------------- | -------------- | -------- | ------- | ------------------------------------------------------------ |
| Project           | `project_id`        | `integer/UUID` | Yes      | —       | Must exist                                                   |
| Template Name     | `template_name`     | `string`       | Yes      | —       | Trimmed; versions auto-incremented per name per project      |
| Is Active         | `is_active`         | `boolean`      | No       | `true`  | If true, deactivates other active templates for same project |
| Has Terrace Units | `has_terrace_units` | `boolean`      | No       | `false` | Stored but terrace math not implemented                      |
| Particulars       | `particulars[]`     | `array`        | Yes (≥1) | —       | See below                                                    |

#### Quotation Particular Fields

| Display Name        | Technical Field       | Data Type | Required | Default  | Validation                               |
| ------------------- | --------------------- | --------- | -------- | -------- | ---------------------------------------- |
| Label               | `label`               | `string`  | Yes      | —        | Display name (e.g. "GST", "PLC Charges") |
| Calculation Type    | `calculation_type`    | `enum`    | Yes      | —        | See calculation types below              |
| Value               | `value`               | `number`  | Yes      | —        | Numeric input to formula                 |
| Sort Order          | `sort_order`          | `integer` | No       | Index    | Display/calculation sequence             |
| Is Optional         | `is_optional`         | `boolean` | No       | `false`  | Can be excluded at generation time       |
| Applies To          | `applies_to`          | `string`  | Forced   | `"unit"` | Always forced to `"unit"` on save        |
| Include in Subtotal | `include_in_subtotal` | `boolean` | Forced   | `true`   | Always forced to `true` on save          |

#### Calculation Types

| Type               | Code                     | Formula                                 |
| ------------------ | ------------------------ | --------------------------------------- |
| Fixed Amount       | `fixed_amount`           | `amount = value`                        |
| % of Basic Price   | `percent_of_basic_price` | `amount = (value / 100) × basicPrice`   |
| % of Running Total | `percent_of_total`       | `amount = (value / 100) × runningTotal` |
| Rate × Total Area  | `rate_x_total_area`      | `amount = value × totalArea`            |

**Aliases accepted:** `percent_of_basic`, `percent_basic` → `percent_of_basic_price`

### 7.5 Quotation Generation Fields

**API:** `POST /api/quotations/generate`

| Display Name         | Technical Field           | Data Type | Required    | Default          | Validation                              |
| -------------------- | ------------------------- | --------- | ----------- | ---------------- | --------------------------------------- |
| Project              | `project_id`              | `integer` | Yes         | —                | Must match template and unit            |
| Unit                 | `unit_id`                 | `integer` | Yes         | —                | Must belong to project                  |
| Template             | `template_id`             | `UUID`    | Yes         | —                | Must belong to same project             |
| Lead                 | `lead_id`                 | `integer` | No          | Unit's `lead_id` | Falls back to unit assignment           |
| Client Name          | `client_name`             | `string`  | Conditional | —                | Required if no lead assigned            |
| Quotation Date       | `quotation_date`          | `date`    | No          | `CURRENT_DATE`   | Used for quotation number year          |
| Excluded Particulars | `excluded_particular_ids` | `UUID[]`  | No          | `[]`             | IDs of optional particulars to skip     |
| Notes                | `notes`                   | `string`  | No          | —                | Stored in DB; not shown in UI           |
| Status               | `status`                  | `enum`    | No          | `"draft"`        | `draft`, `sent`, `accepted`, `rejected` |

### 7.6 Pricing Calculation Logic

**Shared between backend and frontend:**

- Backend: `api/utils/quotationCalculations.js`
- Frontend: `src/utils/quotationCalculations.ts`

#### Step 1 — Basic Price

```
totalArea     = round2(carpet_area_sqft + super_builtup_area_sqft)
ratePerUnit   = unit.price ?? 0
basicPrice    = round2(totalArea × ratePerUnit)
```

#### Step 2 — Line Items (in order)

1. **Auto row:** `"Total Basic Price"` (`calculation_type: "base_auto"`) = `basicPrice`
2. **Each template particular** (skipping `excluded_particular_ids` for optional items)
3. **Auto row:** `"Grand Total"` (`calculation_type: "sum_auto"`) = cumulative total

**Running total:** Each particular adds to `runningTotal`. `percent_of_total` uses the cumulative total at that point (not just basic price).

#### Step 3 — Quotation Number

Format: `QT-{YYYY}-{NNNNN}` (5-digit zero-padded)  
Generated via `quotation_number_sequences` table in a transaction (prevents duplicates).

### 7.7 Particulars Snapshot (JSONB)

Stored in `quotations.particulars_snapshot`:

```json
{
  "template": {
    "id": "uuid",
    "template_name": "Standard Quotation",
    "version": 2,
    "has_terrace_units": false
  },
  "unit": {
    "id": "uuid",
    "unit_number": "A-101",
    "carpet_area_sqft": 1000,
    "super_builtup_area_sqft": 200,
    "price_per_unit": 5000,
    "total_area": 1200,
    "basic_price": 6000000
  },
  "items": [
    {
      "id": "uuid",
      "label": "Total Basic Price",
      "calculation_type": "base_auto",
      "value": 0,
      "amount": 6000000,
      "sort_order": 0
    },
    {
      "id": "uuid",
      "label": "GST",
      "calculation_type": "percent_of_basic_price",
      "value": 5,
      "amount": 300000,
      "sort_order": 1,
      "is_optional": false
    },
    {
      "id": "uuid",
      "label": "Grand Total",
      "calculation_type": "sum_auto",
      "value": 0,
      "amount": 6300000,
      "sort_order": 99
    }
  ],
  "totals": { "grand_total": 6300000 },
  "generated_at": "2026-06-08T10:30:00.000Z"
}
```

### 7.8 Quotation Status Management

| Status     | Meaning             | Set When                                    |
| ---------- | ------------------- | ------------------------------------------- |
| `draft`    | Initial state       | Default on generation; UI always sends this |
| `sent`     | Delivered to client | Manual (no API to transition)               |
| `accepted` | Client accepted     | Manual; **only one per unit** (DB enforced) |
| `rejected` | Client declined     | Manual (no API to transition)               |

**Constraint:** `uniq_accepted_quotation_per_unit` — attempting a second `accepted` quotation for the same unit returns **409 Conflict**.

**No update or delete API** exists for quotations after creation.

### 7.9 PDF Generation

**API:** `POST /api/quotations/:id/pdf`  
**Library:** `pdf-lib` (embeds letterhead PDF)

**Letterhead resolution order:**

1. `QUOTATION_LETTERHEAD_PATH` or `LETTERHEAD_PDF_PATH` env var
2. `api/public/letterhead/LetterHead.pdf`
3. Legacy: `api/public/LetterHead.pdf`

**PDF contents:**

- Quotation number, date (top-right)
- Client name, project name, unit number
- Carpet area, super built-up, total area, rate, basic price
- Cost breakdown table (Sl. No., Description, Amount INR)
- Grand total
- Terms: 30-day validity; taxes as applicable
- Authorized Signatory block

**Response:** `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="{quotation_number}.pdf"`

---

## 8. Database Schema Reference

### 8.1 `projects`

| Column                | Type         | Constraints      | Purpose                    |
| --------------------- | ------------ | ---------------- | -------------------------- |
| `id`                  | UUID         | PK               | Project identifier         |
| `name`                | VARCHAR      | NOT NULL         | Project name               |
| `description`         | TEXT         |                  | Rich text description      |
| `rera_project_id`     | VARCHAR      |                  | RERA registration ID       |
| `sales`               | VARCHAR/UUID | FK → users       | Assigned sales user        |
| `notify_to_emails`    | TEXT[]       |                  | Notification recipients    |
| `launched_on`         | DATE         |                  | Launch date                |
| `expected_completion` | DATE         |                  | Expected completion        |
| `possession`          | DATE         |                  | Possession/handover date   |
| `is_active`           | BOOLEAN      | DEFAULT TRUE     | Active flag                |
| `inventory`           | BOOLEAN      | DEFAULT FALSE    | Inventory enabled          |
| `enable_vr`           | BOOLEAN      |                  | VR walkthrough enabled     |
| `vr_upload`           | VARCHAR      |                  | VR file filename           |
| `brochure_uploads`    | TEXT[]       |                  | Brochure filenames         |
| `amenities`           | JSONB        |                  | Amenity boolean flags      |
| `search_address`      | TEXT         |                  | Autocomplete search string |
| `address`             | TEXT         |                  | Full address               |
| `street`              | TEXT         |                  | Street                     |
| `locality`            | TEXT         |                  | Locality                   |
| `city`                | TEXT         |                  | City                       |
| `state`               | TEXT         |                  | State                      |
| `country`             | TEXT         |                  | Country                    |
| `zip`                 | VARCHAR      |                  | Pin code                   |
| `latitude`            | VARCHAR      |                  | Map latitude               |
| `longitude`           | VARCHAR      |                  | Map longitude              |
| `office_address`      | TEXT         |                  | Combined office address    |
| `india_property_code` | VARCHAR      |                  | Portal code                |
| `magicbricks_code`    | VARCHAR      |                  | Portal code                |
| `status`              | VARCHAR      |                  | `draft` / `completed`      |
| `completed_steps`     | JSONB        |                  | Wizard progress            |
| `created_by`          | UUID         | FK → users       | Creator                    |
| `project_type`        | VARCHAR(50)  | NULL until setup | L1 inventory type          |
| `project_structure`   | VARCHAR(50)  | NULL until setup | L2 structure               |
| `created_at`          | TIMESTAMPTZ  | DEFAULT NOW()    |                            |
| `updated_at`          | TIMESTAMPTZ  |                  |                            |
| `deleted_at`          | TIMESTAMPTZ  |                  | Soft delete                |

### 8.2 `project_specifications`

| Column        | Type        | Constraints           | Purpose        |
| ------------- | ----------- | --------------------- | -------------- |
| `id`          | UUID        | PK                    |                |
| `project_id`  | UUID        | FK → projects CASCADE | Parent project |
| `title`       | VARCHAR     | NOT NULL              | Spec title     |
| `description` | TEXT        |                       | Spec body      |
| `created_at`  | TIMESTAMPTZ |                       |                |

### 8.3 `project_hierarchy_nodes`

| Column        | Type         | Constraints                  | Purpose                    |
| ------------- | ------------ | ---------------------------- | -------------------------- |
| `id`          | UUID         | PK                           | Node identifier            |
| `project_id`  | UUID         | FK → projects CASCADE        | Parent project             |
| `parent_id`   | UUID         | FK → self CASCADE, NULL = L3 | Parent node                |
| `type_code`   | VARCHAR(50)  | NOT NULL                     | TOWER, SECTOR, FLOOR, etc. |
| `name`        | VARCHAR(255) | NOT NULL                     | Display name               |
| `description` | TEXT         |                              | Optional notes             |
| `created_at`  | TIMESTAMPTZ  | DEFAULT NOW()                |                            |
| `updated_at`  | TIMESTAMPTZ  |                              |                            |
| `deleted_at`  | TIMESTAMPTZ  |                              | Soft delete                |

**Unique indexes:**

- L3: `(project_id, UPPER(BTRIM(name)))` WHERE `parent_id IS NULL AND deleted_at IS NULL`
- L4: `(project_id, parent_id, UPPER(BTRIM(name)))` WHERE `parent_id IS NOT NULL AND deleted_at IS NULL`

### 8.4 `project_units`

| Column                    | Type          | Constraints                   | Purpose                       |
| ------------------------- | ------------- | ----------------------------- | ----------------------------- |
| `id`                      | UUID          | PK                            | Unit identifier               |
| `project_id`              | UUID          | FK → projects CASCADE         | Parent project                |
| `hierarchy_node_id`       | UUID          | FK → hierarchy_nodes RESTRICT | Parent node                   |
| `unit_number`             | VARCHAR(100)  | NOT NULL                      | Unit label (e.g. A-101)       |
| `status`                  | VARCHAR(20)   | CHECK enum                    | available/booked/sold/blocked |
| `carpet_area_sqft`        | NUMERIC(12,2) | NOT NULL, > 0                 | Carpet area                   |
| `super_builtup_area_sqft` | NUMERIC(12,2) | ≥ 0 or NULL                   | Super built-up area           |
| `facing`                  | VARCHAR(100)  |                               | Direction/view                |
| `amenities`               | JSONB         | DEFAULT `[]`, must be array   | Unit amenities                |
| `price`                   | NUMERIC(14,2) | ≥ 0 or NULL                   | Rate per sqft                 |
| `lead_id`                 | TEXT/INTEGER  | FK → leads (soft)             | Assigned lead                 |
| `unit_type_id`            | INTEGER       | FK → unit_types               | Unit type                     |
| `created_at`              | TIMESTAMPTZ   | DEFAULT NOW()                 |                               |
| `updated_at`              | TIMESTAMPTZ   |                               |                               |
| `deleted_at`              | TIMESTAMPTZ   |                               | Soft delete                   |

**Unique index:** `(project_id, UPPER(BTRIM(unit_number)))` WHERE `deleted_at IS NULL`

### 8.5 `unit_types`

| Column                    | Type          | Purpose                           |
| ------------------------- | ------------- | --------------------------------- |
| `id`                      | INTEGER       | PK                                |
| `project_id`              | FK → projects | Scoped to project                 |
| `unit_name`               | VARCHAR       | Config code (e.g. `FLAT`, `PLOT`) |
| `carpet_area_sqft`        | NUMERIC       | Placeholder `1` on auto-sync      |
| `super_builtup_area_sqft` | NUMERIC       | Nullable                          |

Auto-created by `syncProjectUnitTypes()` when L1+L2 setup is saved.

### 8.6 `quotation_templates`

| Column              | Type         | Constraints           | Purpose                       |
| ------------------- | ------------ | --------------------- | ----------------------------- |
| `id`                | UUID         | PK                    |                               |
| `project_id`        | INTEGER      | FK → projects CASCADE |                               |
| `template_name`     | VARCHAR(255) | NOT NULL              | Named template                |
| `version`           | INTEGER      | DEFAULT 1             | Auto-incremented per name     |
| `is_active`         | BOOLEAN      | DEFAULT TRUE          | Active flag                   |
| `has_terrace_units` | BOOLEAN      | DEFAULT FALSE         | Terrace flag (unused in calc) |
| `created_at`        | TIMESTAMPTZ  |                       |                               |
| `updated_at`        | TIMESTAMPTZ  |                       |                               |

### 8.7 `quotation_particulars`

| Column                | Type          | Constraints            | Purpose            |
| --------------------- | ------------- | ---------------------- | ------------------ |
| `id`                  | UUID          | PK                     |                    |
| `template_id`         | UUID          | FK → templates CASCADE |                    |
| `label`               | VARCHAR(255)  | NOT NULL               | Line item name     |
| `calculation_type`    | VARCHAR(50)   | NOT NULL               | Formula type       |
| `value`               | NUMERIC(10,4) | NOT NULL               | Formula input      |
| `applies_to`          | VARCHAR(50)   | DEFAULT 'unit'         | Scope              |
| `include_in_subtotal` | BOOLEAN       | DEFAULT TRUE           | Subtotal inclusion |
| `sort_order`          | INTEGER       | DEFAULT 0              | Display order      |
| `is_optional`         | BOOLEAN       | DEFAULT FALSE          | Can be excluded    |
| `created_at`          | TIMESTAMPTZ   |                        |                    |

### 8.8 `quotations`

| Column                 | Type          | Constraints                | Purpose              |
| ---------------------- | ------------- | -------------------------- | -------------------- |
| `id`                   | UUID          | PK                         |                      |
| `template_id`          | UUID          | FK → templates RESTRICT    | Source template      |
| `project_id`           | INTEGER       | FK → projects CASCADE      |                      |
| `unit_id`              | INTEGER       | FK → project_units CASCADE | Quoted unit          |
| `lead_id`              | INTEGER       | FK → leads SET NULL        | Associated lead      |
| `quotation_number`     | VARCHAR(100)  | UNIQUE                     | QT-YYYY-NNNNN        |
| `client_name`          | VARCHAR(255)  |                            | Client display name  |
| `quotation_date`       | DATE          | DEFAULT CURRENT_DATE       |                      |
| `base_price`           | NUMERIC(15,2) | DEFAULT 0                  | Basic price snapshot |
| `carpet_area`          | NUMERIC(10,2) |                            | Area snapshot        |
| `super_builtup_area`   | NUMERIC(10,2) |                            | Area snapshot        |
| `terrace_area`         | NUMERIC(10,2) |                            | Unused in code       |
| `unit_rate`            | NUMERIC(10,2) |                            | Unused in code       |
| `terrace_rate`         | NUMERIC(10,2) |                            | Unused in code       |
| `total_amount`         | NUMERIC(15,2) | DEFAULT 0                  | Grand total          |
| `particulars_snapshot` | JSONB         | DEFAULT `{}`               | Frozen breakdown     |
| `status`               | VARCHAR(50)   | DEFAULT 'draft'            | Quotation status     |
| `notes`                | TEXT          |                            | Internal notes       |
| `created_at`           | TIMESTAMPTZ   |                            |                      |
| `updated_at`           | TIMESTAMPTZ   |                            |                      |

**Unique partial index:** `(unit_id) WHERE status = 'accepted'` — one accepted quotation per unit.

### 8.9 `quotation_number_sequences`

| Column        | Type              | Purpose                   |
| ------------- | ----------------- | ------------------------- |
| `year`        | INTEGER PK        | Calendar year             |
| `last_number` | INTEGER DEFAULT 0 | Last used sequence number |
| `updated_at`  | TIMESTAMPTZ       |                           |

---

## 9. Entity Relationships (ER Model)

```
users
  │
  ├──< projects (created_by, sales)
  │     │
  │     ├──< project_specifications
  │     │
  │     ├──< project_hierarchy_nodes (self-referencing via parent_id)
  │     │     │
  │     │     └──< project_hierarchy_nodes (L4 children)
  │     │
  │     ├──< project_units
  │     │     ├──→ project_hierarchy_nodes (RESTRICT on delete)
  │     │     ├──→ unit_types
  │     │     └──→ leads (soft reference via lead_id)
  │     │
  │     ├──< unit_types
  │     │
  │     ├──< quotation_templates
  │     │     └──< quotation_particulars
  │     │
  │     └──< quotations
  │           ├──→ quotation_templates (RESTRICT)
  │           ├──→ project_units (CASCADE)
  │           └──→ leads (SET NULL)
  │
  └──< leads (assigned_to)
        │
        └──→ project_units.lead_id (optional)
        └──→ quotations.lead_id (optional)

leads.interested_project_id ──→ projects.id
```

**Relationship rules:**

- A **project** has many hierarchy nodes, units, templates, and quotations
- A **unit** belongs to exactly one hierarchy node and one project
- A **quotation** belongs to one unit, one template, and one project
- A **lead** can be linked to multiple units (one per project) and multiple quotations
- Deleting a project cascades to all child inventory and quotation data
- Deleting a hierarchy node is blocked if units reference it

---

## 10. API Endpoints Reference

### 10.1 Projects

| Method | Endpoint                                | Auth | Description         |
| ------ | --------------------------------------- | ---- | ------------------- |
| POST   | `/api/projects`                         | Yes  | Create project      |
| GET    | `/api/projects`                         | Yes  | List all projects   |
| GET    | `/api/projects/:id`                     | Yes  | Get project by ID   |
| PUT    | `/api/projects/:id`                     | Yes  | Update project      |
| DELETE | `/api/projects/:id`                     | Yes  | Soft delete project |
| GET    | `/api/projects/:id/setup-status`        | Yes  | Get setup progress  |
| PUT    | `/api/projects/:id/initial-setup`       | Yes  | Save L1+L2 setup    |
| POST   | `/api/projects/:id/reset-initial-setup` | Yes  | Reset L1+L2         |

### 10.2 Hierarchy Nodes

| Method | Endpoint                                    | Description      |
| ------ | ------------------------------------------- | ---------------- |
| POST   | `/api/projects/:id/hierarchy-nodes`         | Create node      |
| GET    | `/api/projects/:id/hierarchy-nodes`         | List nodes       |
| PUT    | `/api/projects/:id/hierarchy-nodes/:nodeId` | Update node      |
| DELETE | `/api/projects/:id/hierarchy-nodes/:nodeId` | Soft delete node |

### 10.3 Units

| Method | Endpoint                          | Query Params                            | Description      |
| ------ | --------------------------------- | --------------------------------------- | ---------------- |
| POST   | `/api/projects/:id/units`         | —                                       | Create unit      |
| GET    | `/api/projects/:id/units`         | `hierarchy_node_id`, `status`, `search` | List units       |
| GET    | `/api/projects/:id/units/:unitId` | —                                       | Get unit         |
| PUT    | `/api/projects/:id/units/:unitId` | —                                       | Update unit      |
| DELETE | `/api/projects/:id/units/:unitId` | —                                       | Soft delete unit |

### 10.4 Quotations

| Method | Endpoint                                         | Description                     |
| ------ | ------------------------------------------------ | ------------------------------- |
| GET    | `/api/projects-with-quotation-status`            | Projects + unit/template counts |
| POST   | `/api/quotation-templates`                       | Create template + particulars   |
| GET    | `/api/quotation-templates/by-project/:projectId` | List templates                  |
| GET    | `/api/quotation-templates/:id`                   | Get template with particulars   |
| GET    | `/api/units/by-project/:projectId`               | Units for quotation UI          |
| POST   | `/api/quotations/generate`                       | Generate quotation              |
| GET    | `/api/quotations/:id`                            | Get quotation                   |
| GET    | `/api/quotations/by-project/:projectId`          | List quotations                 |
| POST   | `/api/quotations/:id/pdf`                        | Download PDF                    |

---

## 11. Backend Architecture & Data Flow

### 11.1 Request Flow

```
Browser (React)
  → axiosInstance (Bearer JWT)
  → Express Router (api/routes/*.js)
  → authenticateToken middleware
  → Controller (api/controllers/*.js)
  → Utility helpers (api/utils/*.js)
  → PostgreSQL pool (database/config.js or config.mjs)
```

### 11.2 Key Utility Modules

| File                                 | Purpose                                               |
| ------------------------------------ | ----------------------------------------------------- |
| `api/config/projectConfig.js`        | L1/L2/L3/L4 hierarchy definitions, unit type mappings |
| `api/utils/projectSetupRouting.js`   | Setup status computation, L1/L2 validation            |
| `api/utils/syncProjectUnitTypes.js`  | Auto-create unit_types on setup save                  |
| `api/utils/projectUnitsSchema.js`    | Runtime DB column introspection for units             |
| `api/utils/quotationCalculations.js` | Pricing formula engine                                |
| `api/middleware/auth.js`             | JWT verification                                      |

### 11.3 Project Create Data Flow

```
Step1Form → FormContext → POST /projects (multipart)
  → project.controller.createProject()
  → INSERT projects
  → INSERT project_specifications
  → (optional) sendEmail notifications

Steps 2–6 → PUT /projects/:id
  → project.controller.updateProject()
  → Dynamic UPDATE projects
```

### 11.4 Quotation Generate Data Flow

```
ProjectQuotations.tsx → POST /quotations/generate
  → quotation.controller.generateQuotation()
      1. Validate project, unit, template belong together
      2. Resolve lead_id (body or unit)
      3. Fetch unit areas + price
      4. computeParticularAmount() for each line item
      5. Build particulars_snapshot JSONB
      6. Generate quotation_number (transactional sequence)
      7. INSERT quotations
  → Returns 201 with full quotation row
  → POST /quotations/:id/pdf
  → quotation.controller.generateQuotationPdf()
  → pdf-lib renders PDF with letterhead
  → Binary PDF stream returned
```

---

## 12. Edge Cases & Special Scenarios

### 12.1 Project Edge Cases

| Scenario                                          | Behavior                                            |
| ------------------------------------------------- | --------------------------------------------------- |
| Create with `status: "draft"`                     | Minimal validation; can save incomplete data        |
| Mark `status: "completed"` without all steps      | Cross-step validation fails; 400 returned           |
| Change `project_type` without `project_structure` | L2 cleared; user must re-select                     |
| Delete project with units                         | Soft delete; all child data cascade-deleted         |
| Lead changes project                              | Units in other projects unlinked (leads controller) |
| `inventory: false` on create                      | Warning shown; irreversible in UI                   |

### 12.2 Unit Edge Cases

| Scenario                                        | Behavior                                |
| ----------------------------------------------- | --------------------------------------- |
| Duplicate unit number (same project)            | 409 from API; inline error on frontend  |
| Unit number case difference ("a101" vs "A101")  | Treated as duplicate (case-insensitive) |
| Delete hierarchy node with units                | Blocked — RESTRICT FK                   |
| Assign lead from different project              | 400 validation error                    |
| Missing `unit_type_id` and multiple types exist | 400 with available count                |
| `carpet_area_sqft = 0`                          | 400 — must be > 0                       |

### 12.3 Quotation Edge Cases

| Scenario                                  | Behavior                                        |
| ----------------------------------------- | ----------------------------------------------- |
| Second `accepted` quotation for same unit | 409 Conflict                                    |
| Optional particular excluded              | Skipped in calculation; not in snapshot items   |
| No lead assigned                          | `client_name` required in generate request      |
| Template version bump                     | New row created; old versions preserved         |
| Set `is_active: true` on new template     | Deactivates other active templates for project  |
| Missing letterhead PDF                    | 500 on PDF generation                           |
| Terrace fields in DB                      | Stored on template; calculations ignore terrace |

### 12.4 Schema Compatibility

`projectUnitsSchema.js` introspects `information_schema` at runtime to handle column name variations across environments:

| Logical Field  | Column Candidates (first match wins)            |
| -------------- | ----------------------------------------------- |
| Carpet area    | `carpet_area_sqft`, `carpet_area`, `carpet`     |
| Super built-up | `super_builtup_area_sqft`, `super_builtup_area` |
| Price          | `price`, `base_price`, `unit_price`, `rate`     |
| Lead           | `lead_id`, `assigned_lead_id`                   |
| Unit number    | `unit_number`, `unit_no`, `name`                |

---

## 13. Known Gaps & Implementation Notes

| #   | Gap                                                    | Impact                                                                                       |
| --- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| 1   | No quotation update/delete API                         | Status cannot be changed after creation via API                                              |
| 2   | Terrace pricing not implemented                        | `has_terrace_units`, `terrace_area`, `terrace_rate` columns exist but unused in calculations |
| 3   | `Quotations.tsx` expects `has_active_template` boolean | API returns `template_count` number — badge may always show "Setup needed"                   |
| 4   | `QuotationView.tsx` reads `it.total_amount`            | Snapshot items use `amount` key — line amounts may display ₹0                                |
| 5   | `notes` field accepted by API                          | Not exposed in generate dialog UI                                                            |
| 6   | Dev vs production route differences                    | Dev `projects.js` includes towers/floors/unit-types routes; production file does not         |
| 7   | Mixed ID types in migrations                           | UUID (inventory) vs INTEGER (quotations) for `projects.id` — code uses string coercion       |
| 8   | Legacy tower/floor components                          | Present in codebase but not wired to active `/project-setup` route                           |

---

## Appendix A: File Index

| Category                 | Path                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| Project CRUD controller  | `api/controllers/project.controller.js`                                  |
| Project setup controller | `api/controllers/projectSetup.controller.js`                             |
| Hierarchy controller     | `api/controllers/hierarchyNode.controller.js`                            |
| Unit controller          | `api/controllers/unit.controller.js`                                     |
| Quotation controller     | `api/controllers/quotation.controller.js`                                |
| Project routes           | `api/routes/projects.js`                                                 |
| Quotation routes         | `api/routes/quotations.js`                                               |
| Project config           | `api/config/projectConfig.js`                                            |
| Setup routing utils      | `api/utils/projectSetupRouting.js`                                       |
| Unit schema adapter      | `api/utils/projectUnitsSchema.js`                                        |
| Quotation calculations   | `api/utils/quotationCalculations.js`                                     |
| Create project wizard    | `src/components/projects/CreateProject.tsx`                              |
| Project setup wizard     | `src/components/projects/setup/ProjectSetup.tsx`                         |
| Unit form                | `src/components/projects/setup/UnitForm.tsx`                             |
| Quotation pages          | `src/pages/Quotations.tsx`, `ProjectQuotations.tsx`, `QuotationView.tsx` |
| Dashboard toggle         | `src/pages/Dashboard.tsx`                                                |
| Inventory migration      | `migration/2026-03-24-project-units.sql`                                 |
| Quotation migration      | `migration/2026-05-27-quotations.sql`                                    |
| Phone validation util    | `src/utils/phoneValidation.ts`                                           |

---

_End of documentation._
