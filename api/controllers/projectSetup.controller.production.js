/**
 * Production copy: rename to projectSetup.controller.js
 * Uses pool from ../config.mjs (same as project.controller.js on server)
 */
import pool from "../config.mjs";
import {
  buildProjectSetupStatus,
  validateProjectTypeAndStructure,
} from "../utils/projectSetupRouting.js";
import { syncProjectUnitTypes } from "../utils/syncProjectUnitTypes.js";
import { hardDeleteProjectInventory } from "../utils/hardDeleteProjectInventory.js";

const getProjectIdFromParams = (req) => req.params.projectId || req.params.id;

const fetchProjectRow = async (client, projectId) => {
  const result = await client.query(
    `SELECT id, name, project_type, project_structure
     FROM projects
     WHERE id = $1 AND deleted_at IS NULL`,
    [projectId],
  );
  return result.rows[0] ?? null;
};

const countLevel3Nodes = async (client, projectId) => {
  const result = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM project_hierarchy_nodes
     WHERE project_id = $1 AND parent_id IS NULL AND deleted_at IS NULL`,
    [projectId],
  );
  return result.rows[0]?.count ?? 0;
};

const countUnits = async (client, projectId) => {
  const result = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM project_units
     WHERE project_id = $1 AND deleted_at IS NULL`,
    [projectId],
  );
  return result.rows[0]?.count ?? 0;
};

const getSetupColumnDiagnostics = async (client) => {
  const result = await client.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'projects'
       AND column_name IN ('project_type', 'project_structure')`,
  );
  const found = new Set(result.rows.map((r) => r.column_name));
  return {
    project_type_column_exists: found.has("project_type"),
    project_structure_column_exists: found.has("project_structure"),
    migration_required:
      !found.has("project_type") || !found.has("project_structure"),
  };
};

export const getProjectSetupStatus = async (req, res) => {
  const projectId = getProjectIdFromParams(req);
  if (!projectId) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  let client;
  try {
    client = await pool.connect();
    const project = await fetchProjectRow(client, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const columnDiagnostics = await getSetupColumnDiagnostics(client);

    if (columnDiagnostics.migration_required) {
      return res.status(503).json({
        error: "Database migration required",
        details:
          "Add project_type and project_structure columns to projects table.",
        diagnostics: columnDiagnostics,
      });
    }

    const level3NodeCount = await countLevel3Nodes(client, projectId);
    const unitCount = await countUnits(client, projectId);
    const status = buildProjectSetupStatus(project, { level3NodeCount, unitCount });

    res.json({
      data: status,
      diagnostics: {
        ...columnDiagnostics,
        rawFromDatabase: {
          project_type: project.project_type,
          project_structure: project.project_structure,
        },
        setupState: status.initialSetupComplete
          ? "complete"
          : status.hasPartialSetup
            ? "partial"
            : "not_started",
        whySkippedInitialSetup: status.initialSetupComplete
          ? "Level 1 and Level 2 are saved — opening hierarchy setup."
          : status.hasPartialSetup
            ? "Only Level 1 or Level 2 is saved — finish both on this screen."
            : "Level 1 and Level 2 are empty — start by selecting project type.",
      },
    });
  } catch (error) {
    console.error("getProjectSetupStatus error:", error);
    res.status(500).json({ error: "Failed to fetch project setup status" });
  } finally {
    if (client) client.release();
  }
};

export const saveProjectInitialSetup = async (req, res) => {
  const projectId = getProjectIdFromParams(req);
  if (!projectId) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  const { project_type: projectType, project_structure: projectStructure } =
    req.body;

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const existing = await fetchProjectRow(client, projectId);
    if (!existing) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Project not found" });
    }

    const nextType = projectType ?? existing.project_type;
    const nextStructure =
      projectStructure !== undefined
        ? projectStructure
        : existing.project_structure;

    const savingBoth =
      projectType !== undefined &&
      projectStructure !== undefined &&
      String(projectStructure ?? "").trim() !== "";

    const typeChanged =
      projectType !== undefined && projectType !== existing.project_type;
    const resolvedStructure = savingBoth
      ? projectStructure
      : typeChanged
        ? null
        : nextStructure;

    if (projectType !== undefined && !projectType?.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Project type cannot be empty" });
    }

    if (resolvedStructure) {
      const validation = validateProjectTypeAndStructure(
        savingBoth ? projectType : nextType,
        resolvedStructure,
      );
      if (!validation.valid) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: validation.error });
      }
    }

    const updates = [];
    const values = [];
    let index = 1;

    if (projectType !== undefined) {
      updates.push(`project_type = $${index++}`);
      values.push(projectType);
      if (typeChanged && !savingBoth) {
        updates.push(`project_structure = $${index++}`);
        values.push(null);
      }
    }

    if (projectStructure !== undefined && (!typeChanged || savingBoth)) {
      updates.push(`project_structure = $${index++}`);
      values.push(projectStructure || null);
    }

    if (updates.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "No setup fields provided to save" });
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(projectId);

    const updateResult = await client.query(
      `UPDATE projects SET ${updates.join(", ")}
       WHERE id = $${index}
       RETURNING id, name, project_type, project_structure`,
      values,
    );

    const saved = updateResult.rows[0];

    if (saved.project_type && saved.project_structure) {
      const validation = validateProjectTypeAndStructure(
        saved.project_type,
        saved.project_structure,
      );
      if (validation.valid) {
        await syncProjectUnitTypes(
          client,
          projectId,
          saved.project_type,
          saved.project_structure,
        );
      }
    }

    await client.query("COMMIT");

    const level3NodeCount = await countLevel3Nodes(client, projectId);
    const unitCount = await countUnits(client, projectId);
    const status = buildProjectSetupStatus(saved, { level3NodeCount, unitCount });

    res.json({
      message: status.initialSetupComplete
        ? "Project type and structure saved successfully"
        : "Project type saved. Select a project structure to complete initial setup.",
      data: saved,
      setupStatus: status,
      verified: {
        project_type: saved.project_type,
        project_structure: saved.project_structure,
        savedToDatabase: true,
      },
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("saveProjectInitialSetup error:", error);
    res.status(500).json({
      error: "Failed to save project setup",
      details: error.message,
    });
  } finally {
    if (client) client.release();
  }
};

export const resetProjectInitialSetup = async (req, res) => {
  const projectId = getProjectIdFromParams(req);
  if (!projectId) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const project = await fetchProjectRow(client, projectId);
    if (!project) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Project not found" });
    }

    const deleted = await hardDeleteProjectInventory(client, projectId);

    await client.query(
      `UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [projectId],
    );

    await client.query("COMMIT");

    const status = buildProjectSetupStatus(project, {
      level3NodeCount: 0,
      unitCount: 0,
    });

    res.json({
      message: `Layout setup reset for "${project.name}". All inventory data permanently deleted.`,
      data: project,
      setupStatus: status,
      deleted,
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("resetProjectInitialSetup error:", error);
    res.status(500).json({
      error: "Failed to reset project setup",
      details: error.message,
    });
  } finally {
    if (client) client.release();
  }
};
