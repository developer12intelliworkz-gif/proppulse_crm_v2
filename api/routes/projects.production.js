/**
 * Production routes — rename to projects.js on server
 * Path: /home/crm/public_html/api/routes/projects.js
 */
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
import {
  getProjectAmenities,
  linkProjectAmenity,
  unlinkProjectAmenity,
} from "../controllers/projectAmenity.controller.js";
import {
  getUnitTypeLabels,
  createUnitTypeLabel,
  updateUnitTypeLabel,
  deleteUnitTypeLabel,
} from "../controllers/unitTypeLabel.controller.js";

const router = express.Router();

router.get("/", authenticateToken, getProjects);
router.post("/", authenticateToken, createProject);

router.get("/:id/setup-status", authenticateToken, getProjectSetupStatus);
router.put("/:id/initial-setup", authenticateToken, saveProjectInitialSetup);
router.post("/:id/reset-initial-setup", authenticateToken, resetProjectInitialSetup);

router.get("/:id/amenities", authenticateToken, getProjectAmenities);
router.post("/:id/amenities", authenticateToken, linkProjectAmenity);
router.delete("/:id/amenities/:amenityId", authenticateToken, unlinkProjectAmenity);

router.get("/:id/unit-type-labels", authenticateToken, getUnitTypeLabels);
router.post("/:id/unit-type-labels", authenticateToken, createUnitTypeLabel);
router.put("/:id/unit-type-labels/:typeId", authenticateToken, updateUnitTypeLabel);
router.delete("/:id/unit-type-labels/:typeId", authenticateToken, deleteUnitTypeLabel);

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
