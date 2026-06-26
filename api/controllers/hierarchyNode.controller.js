// controllers/project/hierarchyNode.controller.js
import pool from "../../database/config.js";
import { PROJECT_CONFIG } from "../config/projectConfig.js";

const getProjectConfig = async (projectId) => {
  const res = await pool.query(
    "SELECT project_type, project_structure FROM projects WHERE id = $1 AND deleted_at IS NULL",
    [projectId],
  );
  if (res.rows.length === 0) throw new Error("Project not found");
  const { project_type, project_structure } = res.rows[0];
  const config =
    PROJECT_CONFIG.level3_level4_hierarchy_by_structure?.[project_type]?.[
      project_structure
    ];
  if (!config)
    throw new Error("Invalid project type or structure configuration");
  return config;
};

const resolveLevelConfig = ({
  config,
  isLevel4,
  mode_code,
  requestedTypeCode,
}) => {
  if (!isLevel4) {
    return config.level3;
  }

  if (config.level4) {
    return config.level4;
  }

  if (Array.isArray(config.level4_modes) && config.level4_modes.length > 0) {
    const matchedMode = config.level4_modes.find((mode) => {
      if (mode_code && mode.mode_code === mode_code) {
        return true;
      }

      if (
        requestedTypeCode &&
        mode.level4?.type_code === requestedTypeCode
      ) {
        return true;
      }

      return false;
    });

    if (matchedMode?.level4) {
      return matchedMode.level4;
    }

    const supportedModes = config.level4_modes
      .map((mode) => mode.mode_code)
      .filter(Boolean);

    if (config.level4_modes.length === 1 && config.level4_modes[0].level4) {
      return config.level4_modes[0].level4;
    }

    throw new Error(
      `This project structure requires a valid level4 mode. Supported modes: ${supportedModes.join(", ")}`,
    );
  }

  return null;
};

const ensureUniqueNodeName = async ({
  projectId,
  parentId,
  name,
  excludeNodeId,
}) => {
  const params = [projectId, name.trim()];
  const conditions = [
    "project_id = $1",
    "UPPER(BTRIM(name)) = UPPER(BTRIM($2))",
    "deleted_at IS NULL",
  ];

  if (parentId) {
    params.push(parentId);
    conditions.push(`parent_id = $${params.length}`);
  } else {
    conditions.push("parent_id IS NULL");
  }

  if (excludeNodeId) {
    params.push(excludeNodeId);
    conditions.push(`id <> $${params.length}`);
  }

  const result = await pool.query(
    `SELECT id FROM project_hierarchy_nodes WHERE ${conditions.join(" AND ")} LIMIT 1`,
    params,
  );

  if (result.rowCount > 0) {
    throw new Error(
      parentId
        ? "A Level 4 node with this name already exists under the selected parent"
        : "A Level 3 node with this name already exists in this project",
    );
  }
};

export const createHierarchyNode = async (req, res) => {
  const { projectId } = req.params;
  const { parent_id, name, description, mode_code, type_code: bodyTypeCode } =
    req.body;

  try {
    const config = await getProjectConfig(projectId);
    const isLevel4 = !!parent_id;
    const levelConfig = resolveLevelConfig({
      config,
      isLevel4,
      mode_code,
      requestedTypeCode: bodyTypeCode,
    });
    const levelKey = isLevel4 ? "level4" : "level3";

    if (!levelConfig) {
      return res.status(400).json({
        error: `No ${levelKey} configuration for this project structure`,
      });
    }

    if (isLevel4 && !parent_id) {
      return res
        .status(400)
        .json({ error: "Level 4 node requires a parent_id (Level 3 node)" });
    }
    if (!isLevel4 && parent_id) {
      return res
        .status(400)
        .json({ error: "Level 3 node cannot have parent_id" });
    }

    if (levelConfig.required && !name?.trim()) {
      return res
        .status(400)
        .json({ error: `${levelConfig.default_label} name is required` });
    }

    // Validate parent if Level 4
    if (isLevel4) {
      const parentCheck = await pool.query(
        "SELECT type_code FROM project_hierarchy_nodes WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL",
        [parent_id, projectId],
      );
      if (parentCheck.rowCount === 0) {
        return res.status(400).json({
          error: "Invalid parent_id or does not belong to this project",
        });
      }
    }

    await ensureUniqueNodeName({
      projectId,
      parentId: parent_id || null,
      name,
    });

    const resolvedTypeCode = levelConfig.type_code;

    const result = await pool.query(
      `INSERT INTO project_hierarchy_nodes 
        (project_id, parent_id, type_code, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, project_id, parent_id, type_code, name, description, created_at`,
      [
        projectId,
        parent_id || null,
        resolvedTypeCode,
        name.trim(),
        description?.trim() || null,
      ],
    );

    res.status(201).json({
      message: `${levelConfig.default_label || "Hierarchy node"} created successfully`,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("createHierarchyNode error:", error);
    const message = error.message || "Failed to create hierarchy node";
    if (
      message.includes("already exists") ||
      message.includes("requires a valid level4 mode") ||
      message.includes("Project not found") ||
      message.includes("Invalid project type") ||
      message.includes("configuration")
    ) {
      return res.status(400).json({ error: message });
    }
    if (error.code === "42P01") {
      return res.status(500).json({
        error: "Hierarchy tables are missing. Run migration/2026-03-24-project-units.sql",
        details: message,
      });
    }
    res.status(500).json({
      error: "Failed to create hierarchy node",
      details: message,
    });
  }
};

export const getHierarchyNodesByProject = async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, parent_id, type_code, name, description, created_at, updated_at
       FROM project_hierarchy_nodes 
       WHERE project_id = $1 AND deleted_at IS NULL 
       ORDER BY parent_id ASC NULLS FIRST, name ASC`,
      [projectId],
    );

    // Build tree structure
    const nodeMap = {};
    const roots = [];

    result.rows.forEach((node) => {
      node.children = [];
      nodeMap[node.id] = node;
      if (!node.parent_id) {
        roots.push(node);
      } else if (nodeMap[node.parent_id]) {
        nodeMap[node.parent_id].children.push(node);
      }
    });

    res.json({ count: roots.length, data: roots });
  } catch (error) {
    console.error("getHierarchyNodesByProject error:", error);
    res.status(500).json({ error: "Failed to fetch hierarchy nodes" });
  }
};

export const updateHierarchyNode = async (req, res) => {
  const { projectId, nodeId } = req.params;
  const { name, description } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: "Name is required for update" });
  }

  try {
    const nodeResult = await pool.query(
      `SELECT parent_id
       FROM project_hierarchy_nodes
       WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
      [nodeId, projectId],
    );

    if (nodeResult.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Node not found or does not belong to this project" });
    }

    await ensureUniqueNodeName({
      projectId,
      parentId: nodeResult.rows[0].parent_id,
      name,
      excludeNodeId: nodeId,
    });

    const result = await pool.query(
      `UPDATE project_hierarchy_nodes 
       SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND project_id = $4 AND deleted_at IS NULL
       RETURNING id, name, description, updated_at`,
      [name.trim(), description?.trim() || null, nodeId, projectId],
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Node not found or does not belong to this project" });
    }

    res.json({ message: "Node updated successfully", data: result.rows[0] });
  } catch (error) {
    if (error.message?.includes("already exists")) {
      return res.status(400).json({ error: error.message });
    }
    res
      .status(500)
      .json({ error: "Failed to update node", details: error.message });
  }
};

export const deleteHierarchyNode = async (req, res) => {
  const { projectId, nodeId } = req.params;
  const cascade =
    req.query.cascade === "true" ||
    req.query.cascade === "1" ||
    req.body?.cascade === true;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const nodeRes = await client.query(
      `SELECT id, parent_id, name FROM project_hierarchy_nodes
       WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
      [nodeId, projectId],
    );
    if (nodeRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Node not found or already deleted" });
    }

    const softDeleteUnitsOnNode = async (id) => {
      await client.query(
        `UPDATE project_units
         SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE hierarchy_node_id = $1 AND deleted_at IS NULL`,
        [id],
      );
    };

    const softDeleteNodeTree = async (id) => {
      const children = await client.query(
        `SELECT id FROM project_hierarchy_nodes
         WHERE parent_id = $1 AND project_id = $2 AND deleted_at IS NULL`,
        [id, projectId],
      );
      for (const child of children.rows) {
        await softDeleteNodeTree(child.id);
      }
      await softDeleteUnitsOnNode(id);
      await client.query(
        `UPDATE project_hierarchy_nodes
         SET deleted_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
        [id, projectId],
      );
    };

    if (cascade) {
      await softDeleteNodeTree(nodeId);
    } else {
      const unitCheck = await client.query(
        "SELECT 1 FROM project_units WHERE hierarchy_node_id = $1 AND deleted_at IS NULL LIMIT 1",
        [nodeId],
      );
      if (unitCheck.rowCount > 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Cannot delete node with existing units" });
      }

      const childCheck = await client.query(
        `SELECT 1 FROM project_hierarchy_nodes
         WHERE parent_id = $1 AND project_id = $2 AND deleted_at IS NULL LIMIT 1`,
        [nodeId, projectId],
      );
      if (childCheck.rowCount > 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Cannot delete node with child floors. Use cascade delete." });
      }

      await client.query(
        `UPDATE project_hierarchy_nodes
         SET deleted_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
        [nodeId, projectId],
      );
    }

    await client.query("COMMIT");

    res.json({
      message: cascade
        ? "Node and descendants soft-deleted successfully"
        : "Node soft-deleted successfully",
      data: nodeRes.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res
      .status(500)
      .json({ error: "Failed to delete node", details: error.message });
  } finally {
    client.release();
  }
};
