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

const router = express.Router();

// ===================== PROJECT LEVEL =====================
router.post("/", authenticateToken, createProject);
router.get("/", authenticateToken, getProjects);
router.get("/og-preview", authenticateToken, getOgPreview);
router.get("/:projectId/setup-status", authenticateToken, getProjectSetupStatus);
router.get("/:projectId/has-inventory", authenticateToken, getProjectHasInventory);
router.put(
  "/:projectId/initial-setup",
  authenticateToken,
  saveProjectInitialSetup,
);
router.post(
  "/:projectId/reset-initial-setup",
  authenticateToken,
  resetProjectInitialSetup,
);

router.patch(
  "/:projectId/amenities/selection",
  authenticateToken,
  setAllProjectAmenitySelection,
);
router.get("/:projectId/amenities", authenticateToken, getProjectAmenities);
router.post("/:projectId/amenities", authenticateToken, createProjectAmenity);
router.put(
  "/:projectId/amenities/:amenityId",
  authenticateToken,
  updateProjectAmenity,
);
router.delete(
  "/:projectId/amenities/:amenityId",
  authenticateToken,
  deleteProjectAmenity,
);

router.get(
  "/:projectId/unit-type-labels",
  authenticateToken,
  getUnitTypeLabels,
);
router.post(
  "/:projectId/unit-type-labels",
  authenticateToken,
  createUnitTypeLabel,
);
router.put(
  "/:projectId/unit-type-labels/:typeId",
  authenticateToken,
  updateUnitTypeLabel,
);
router.delete(
  "/:projectId/unit-type-labels/:typeId",
  authenticateToken,
  deleteUnitTypeLabel,
);

router.get("/:projectId", authenticateToken, getProjectById);
router.put("/:projectId", authenticateToken, updateProject);
router.delete("/:projectId", authenticateToken, deleteProject);

// ===================== TOWERS =====================
router.post("/:projectId/towers", authenticateToken, createTower);
router.get("/:projectId/towers", authenticateToken, getTowersByProject);
router.put("/:projectId/towers/:towerId", authenticateToken, updateTower);
router.delete("/:projectId/towers/:towerId", authenticateToken, deleteTower);

// ===================== FLOORS =====================
router.post(
  "/:projectId/towers/:towerId/floors",
  authenticateToken,
  createFloor,
);
router.get(
  "/:projectId/towers/:towerId/floors",
  authenticateToken,
  getFloorsByTower,
);
router.put(
  "/:projectId/towers/:towerId/floors/:floorId",
  authenticateToken,
  updateFloor,
);
router.delete(
  "/:projectId/towers/:towerId/floors/:floorId",
  authenticateToken,
  deleteFloor,
);

// ===================== UNIT TYPES =====================
router.post("/:projectId/unit-types", authenticateToken, createUnitType);
router.get("/:projectId/unit-types", authenticateToken, getUnitTypesByProject);

// ===================== HIERARCHY NODES (Level 3 & Level 4) =====================
router.post(
  "/:projectId/hierarchy-nodes",
  authenticateToken,
  createHierarchyNode,
);

router.get(
  "/:projectId/hierarchy-nodes",
  authenticateToken,
  getHierarchyNodesByProject,
);

router.put(
  "/:projectId/hierarchy-nodes/:nodeId",
  authenticateToken,
  updateHierarchyNode,
);

router.delete(
  "/:projectId/hierarchy-nodes/:nodeId",
  authenticateToken,
  deleteHierarchyNode,
);

// ===================== UNITS =====================
router.post("/:projectId/units", authenticateToken, createUnit);
router.get("/:projectId/units", authenticateToken, getUnitsByProject);
router.get("/:projectId/units/:unitId", authenticateToken, getUnitById);
router.put("/:projectId/units/:unitId", authenticateToken, updateUnit);
router.patch("/:projectId/units/bulk/status", authenticateToken, bulkPatchUnitStatus);
router.patch("/:projectId/units/:unitId/status", authenticateToken, patchUnitStatus);
router.delete("/:projectId/units/:unitId", authenticateToken, deleteUnit);

export default router;
