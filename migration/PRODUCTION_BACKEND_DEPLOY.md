# Production backend deploy — Project setup (inventory L1/L2)

Server path: `/home/crm/public_html/api`  
Database: `crm` (PostgreSQL) — **your verification already passed**

---

## 1. Database status (from your psql output)

| Check | Your result | Action |
|-------|-------------|--------|
| `project_type` nullable | YES | None |
| `project_structure` nullable | YES | None |
| No column defaults | empty | None |
| `project_hierarchy_nodes` table | exists | None |
| `project_units` table | exists | None |
| Projects setup | all `NOT_STARTED` (NULL) | None |

**Do not run** `2026-05-23-fix-project-setup-defaults.sql` step 3 (mass UPDATE) unless you want to clear L1/L2 again — data is already correct.

**Optional** — re-check anytime:

```sql
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'projects'
  AND column_name IN ('project_type', 'project_structure');
```

---

## 2. Files to ADD on production

| Local file | Upload to production |
|------------|-------------------|
| `api/utils/projectSetupRouting.js` | `public_html/api/utils/projectSetupRouting.js` (create `utils/` folder) |
| `api/controllers/projectSetup.controller.js` | `public_html/api/controllers/projectSetup.controller.js` |

**Import fix for production** — first line of `projectSetup.controller.js` must match your pool import:

```javascript
import pool from "../config.mjs";
```

(not `../../database/config.js`)

`projectSetupRouting.js` has no pool import — copy as-is.

`config/projectConfig.js` — **already on server** — no change.

`controllers/hierarchyNode.controller.js` — **already on server** — verify import uses `../config/projectConfig.js`.

---

## 3. Files to UPDATE on production

### A) `controllers/project.controller.js`

Your production file uses `const { id } = req.params` and does **not** save `project_type` / `project_structure`.

Apply these edits:

**1) Add once** (before `export const updateProject`):

```javascript
const getProjectIdFromParams = (req) => req.params.projectId || req.params.id;
```

**2) In `updateProject`** — replace:

```javascript
const { id } = req.params;
```

with:

```javascript
const id = getProjectIdFromParams(req);
if (!id) {
  return res.status(400).json({ error: "Project ID is required" });
}
```

**3) In `updateProject`** — after `if (req.body.status !== undefined) { ... }` block, add:

```javascript
      if (req.body.project_type !== undefined) {
        updates.push(`project_type = $${index++}`);
        values.push(req.body.project_type);
      }
      if (req.body.project_structure !== undefined) {
        updates.push(`project_structure = $${index++}`);
        values.push(req.body.project_structure);
      }
```

**4) In `updateProject`** — change RETURNING line from:

```javascript
) WHERE id = $${index} RETURNING id`;
```

to:

```javascript
) WHERE id = $${index} RETURNING id, name, project_type, project_structure`;
```

and change response to:

```javascript
      const updateResult = await client.query(query, values);
      await client.query("COMMIT");
      res.json({
        message: "Project updated successfully",
        data: updateResult.rows[0],
      });
```

**5) In `getProjectById`** — replace:

```javascript
const { id } = req.params;
```

with:

```javascript
const id = getProjectIdFromParams(req);
if (!id) return res.status(400).json({ error: "Project ID is required" });
```

**6) In `deleteProject`** — same as (5).

`createProject` — **no change required** (INSERT does not set L1/L2; NULL stays NULL).

---

### B) `routes/projects.js`

Replace entire file with production version below (uses `:id` like your server; setup routes **before** `GET /:id`).

See section 4 in this doc — or copy from repo `routes/projects.production.js` if created.

---

## 4. Production `routes/projects.js` (full file)

```javascript
import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/project.controller.js";
import {
  getProjectSetupStatus,
  saveProjectInitialSetup,
  resetProjectInitialSetup,
} from "../controllers/projectSetup.controller.js";
import {
  createHierarchyNode,
  getHierarchyNodesByProject,
  updateHierarchyNode,
  deleteHierarchyNode,
} from "../controllers/hierarchyNode.controller.js";
import {
  createUnit,
  getUnitsByProject,
  getUnitById,
  updateUnit,
  deleteUnit,
} from "../controllers/unit.controller.js";

const router = express.Router();

router.get("/", authenticateToken, getProjects);
router.post("/", authenticateToken, createProject);

// --- Setup routes MUST be above /:id ---
router.get("/:id/setup-status", authenticateToken, getProjectSetupStatus);
router.put("/:id/initial-setup", authenticateToken, saveProjectInitialSetup);
router.post("/:id/reset-initial-setup", authenticateToken, resetProjectInitialSetup);

router.get("/:id", authenticateToken, getProjectById);
router.put("/:id", authenticateToken, updateProject);
router.delete("/:id", authenticateToken, deleteProject);

router.post("/:id/hierarchy-nodes", authenticateToken, createHierarchyNode);
router.get("/:id/hierarchy-nodes", authenticateToken, getHierarchyNodesByProject);
router.put("/:id/hierarchy-nodes/:nodeId", authenticateToken, updateHierarchyNode);
router.delete("/:id/hierarchy-nodes/:nodeId", authenticateToken, deleteHierarchyNode);

router.post("/:id/units", authenticateToken, createUnit);
router.get("/:id/units", authenticateToken, getUnitsByProject);
router.get("/:id/units/:unitId", authenticateToken, getUnitById);
router.put("/:id/units/:unitId", authenticateToken, updateUnit);
router.delete("/:id/units/:unitId", authenticateToken, deleteUnit);

export default router;
```

If `auth` middleware path differs (e.g. `auth.js` vs `auth.mjs`), keep your existing import.

---

## 5. Restart API

```bash
cd /home/crm/public_html/api
# however you restart — e.g. pm2 restart all, or node server.mjs
```

---

## 6. Post-deploy verification (psql + curl)

### SQL — save test for project id 103

```sql
-- Before test
SELECT id, name, project_type, project_structure FROM projects WHERE id = 103;

-- After API test (below), run again — expect RESIDENTIAL + TOWER_BASED or your choices
```

### API (replace TOKEN and host)

```bash
# Setup status
curl -s -H "Authorization: Bearer TOKEN" \
  "https://YOUR_DOMAIN/api/projects/103/setup-status"

# Save Level 1
curl -s -X PUT -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"project_type":"RESIDENTIAL"}' \
  "https://YOUR_DOMAIN/api/projects/103/initial-setup"

# Save Level 2
curl -s -X PUT -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"project_structure":"TOWER_BASED"}' \
  "https://YOUR_DOMAIN/api/projects/103/initial-setup"
```

### SQL confirm

```sql
SELECT id, name, project_type, project_structure
FROM projects WHERE id = 103;
```

---

## 7. Checklist

- [ ] `utils/projectSetupRouting.js` uploaded
- [ ] `controllers/projectSetup.controller.js` uploaded (`import pool from "../config.mjs"`)
- [ ] `project.controller.js` patched (6 edits)
- [ ] `routes/projects.js` replaced (setup routes before `/:id`)
- [ ] API restarted
- [ ] `setup-status` + `initial-setup` curl OK
- [ ] Frontend points to same API base URL

---

## 8. What you do NOT need on production DB

- `2026-05-23-fix-project-setup-defaults.sql` — already nullable, data already NULL
- `2026-03-24-project-units.sql` — tables/columns already exist
