import express from "express";
import { authenticateToken } from "../middleware/auth.js";

import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/project.controller.js";

import {
  getProjectSetupStatus,
  saveProjectInitialSetup,
  resetProjectInitialSetup,
  getProjectHasInventory,
} from "../controllers/projectSetup.controller.js";

import {
  createTower,
  getTowersByProject,
  updateTower,
  deleteTower,
} from "../controllers/tower.controller.js";

import {
  createFloor,
  getFloorsByTower,
  updateFloor,
  deleteFloor,
} from "../controllers/floor.controller.js";

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
  patchUnitStatus,
  bulkPatchUnitStatus,
  deleteUnit,
} from "../controllers/unit.controller.js";

import {
  createUnitType,
  getUnitTypesByProject,
} from "../controllers/unitType.controller.js";

import {
  getProjectAmenities,
  createProjectAmenity,
  updateProjectAmenity,
  deleteProjectAmenity,
  setAllProjectAmenitySelection,
} from "../controllers/projectAmenity.controller.js";

import {
  getUnitTypeLabels,
  createUnitTypeLabel,
  updateUnitTypeLabel,
  deleteUnitTypeLabel,
} from "../controllers/unitTypeLabel.controller.js";

import { getOgPreview } from "../controllers/ogPreview.controller.js";

import { requirePermission } from "../middleware/authorize.js";

const router = express.Router();

// ===================== PROJECT LEVEL =====================
router.post("/", authenticateToken, requirePermission("create_projects"), createProject);
router.get("/", authenticateToken, requirePermission("view_projects"), getProjects);
router.get("/og-preview", authenticateToken, requirePermission("view_projects"), getOgPreview);
router.get("/:projectId/setup-status", authenticateToken, requirePermission("view_projects"), getProjectSetupStatus);
router.get("/:projectId/has-inventory", authenticateToken, requirePermission("view_projects"), getProjectHasInventory);
router.put(
  "/:projectId/initial-setup",
  authenticateToken,
  requirePermission("manage_project"),
  saveProjectInitialSetup,
);
router.post(
  "/:projectId/reset-initial-setup",
  authenticateToken,
  requirePermission("manage_project"),
  resetProjectInitialSetup,
);

router.patch(
  "/:projectId/amenities/selection",
  authenticateToken,
  requirePermission("manage_project"),
  setAllProjectAmenitySelection,
);
router.get("/:projectId/amenities", authenticateToken, requirePermission("view_projects"), getProjectAmenities);
router.post("/:projectId/amenities", authenticateToken, requirePermission("manage_project"), createProjectAmenity);
router.put(
  "/:projectId/amenities/:amenityId",
  authenticateToken,
  requirePermission("manage_project"),
  updateProjectAmenity,
);
router.delete(
  "/:projectId/amenities/:amenityId",
  authenticateToken,
  requirePermission("manage_project"),
  deleteProjectAmenity,
);

router.get(
  "/:projectId/unit-type-labels",
  authenticateToken,
  requirePermission("view_projects"),
  getUnitTypeLabels,
);
router.post(
  "/:projectId/unit-type-labels",
  authenticateToken,
  requirePermission("manage_project"),
  createUnitTypeLabel,
);
router.put(
  "/:projectId/unit-type-labels/:typeId",
  authenticateToken,
  requirePermission("manage_project"),
  updateUnitTypeLabel,
);
router.delete(
  "/:projectId/unit-type-labels/:typeId",
  authenticateToken,
  requirePermission("manage_project"),
  deleteUnitTypeLabel,
);

router.get("/:projectId", authenticateToken, requirePermission("view_projects"), getProjectById);
router.put("/:projectId", authenticateToken, requirePermission("edit_projects"), updateProject);
router.delete("/:projectId", authenticateToken, requirePermission("delete_projects"), deleteProject);

// ===================== TOWERS =====================
router.post("/:projectId/towers", authenticateToken, requirePermission("manage_project"), createTower);
router.get("/:projectId/towers", authenticateToken, requirePermission("view_projects"), getTowersByProject);
router.put("/:projectId/towers/:towerId", authenticateToken, requirePermission("manage_project"), updateTower);
router.delete("/:projectId/towers/:towerId", authenticateToken, requirePermission("manage_project"), deleteTower);

// ===================== FLOORS =====================
router.post(
  "/:projectId/towers/:towerId/floors",
  authenticateToken,
  requirePermission("manage_project"),
  createFloor,
);
router.get(
  "/:projectId/towers/:towerId/floors",
  authenticateToken,
  requirePermission("view_projects"),
  getFloorsByTower,
);
router.put(
  "/:projectId/towers/:towerId/floors/:floorId",
  authenticateToken,
  requirePermission("manage_project"),
  updateFloor,
);
router.delete(
  "/:projectId/towers/:towerId/floors/:floorId",
  authenticateToken,
  requirePermission("manage_project"),
  deleteFloor,
);

// ===================== UNIT TYPES =====================
router.post("/:projectId/unit-types", authenticateToken, requirePermission("manage_project"), createUnitType);
router.get("/:projectId/unit-types", authenticateToken, requirePermission("view_projects"), getUnitTypesByProject);

// ===================== HIERARCHY NODES (Level 3 & Level 4) =====================
router.post(
  "/:projectId/hierarchy-nodes",
  authenticateToken,
  requirePermission("manage_project"),
  createHierarchyNode,
);

router.get(
  "/:projectId/hierarchy-nodes",
  authenticateToken,
  requirePermission("view_projects"),
  getHierarchyNodesByProject,
);

router.put(
  "/:projectId/hierarchy-nodes/:nodeId",
  authenticateToken,
  requirePermission("manage_project"),
  updateHierarchyNode,
);

router.delete(
  "/:projectId/hierarchy-nodes/:nodeId",
  authenticateToken,
  requirePermission("manage_project"),
  deleteHierarchyNode,
);

// ===================== UNITS =====================
router.post("/:projectId/units", authenticateToken, requirePermission("manage_project"), createUnit);
router.get("/:projectId/units", authenticateToken, requirePermission("view_projects"), getUnitsByProject);
router.get("/:projectId/units/:unitId", authenticateToken, requirePermission("view_projects"), getUnitById);
router.put("/:projectId/units/:unitId", authenticateToken, requirePermission("manage_project"), updateUnit);
router.patch("/:projectId/units/bulk/status", authenticateToken, requirePermission(["manage_project", "edit_projects", "view_projects"]), bulkPatchUnitStatus);
router.patch("/:projectId/units/:unitId/status", authenticateToken, requirePermission(["manage_project", "edit_projects", "view_projects"]), patchUnitStatus);
router.delete("/:projectId/units/:unitId", authenticateToken, requirePermission("manage_project"), deleteUnit);

export default router;
