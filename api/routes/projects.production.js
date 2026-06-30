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
import { requirePermission } from "../middleware/authorize.js";

const router = express.Router();

router.get("/", authenticateToken, requirePermission("view_projects"), getProjects);
router.post("/", authenticateToken, requirePermission("create_projects"), createProject);

router.get("/:id/setup-status", authenticateToken, requirePermission("view_projects"), getProjectSetupStatus);
router.put("/:id/initial-setup", authenticateToken, requirePermission("manage_project"), saveProjectInitialSetup);
router.post("/:id/reset-initial-setup", authenticateToken, requirePermission("manage_project"), resetProjectInitialSetup);

router.get("/:id/amenities", authenticateToken, requirePermission("view_projects"), getProjectAmenities);
router.post("/:id/amenities", authenticateToken, requirePermission("manage_project"), linkProjectAmenity);
router.delete("/:id/amenities/:amenityId", authenticateToken, requirePermission("manage_project"), unlinkProjectAmenity);

router.get("/:id/unit-type-labels", authenticateToken, requirePermission("view_projects"), getUnitTypeLabels);
router.post("/:id/unit-type-labels", authenticateToken, requirePermission("manage_project"), createUnitTypeLabel);
router.put("/:id/unit-type-labels/:typeId", authenticateToken, requirePermission("manage_project"), updateUnitTypeLabel);
router.delete("/:id/unit-type-labels/:typeId", authenticateToken, requirePermission("manage_project"), deleteUnitTypeLabel);

router.get("/:id", authenticateToken, requirePermission("view_projects"), getProjectById);
router.put("/:id", authenticateToken, requirePermission("edit_projects"), updateProject);
router.delete("/:id", authenticateToken, requirePermission("delete_projects"), deleteProject);

router.post("/:id/hierarchy-nodes", authenticateToken, requirePermission("manage_project"), createHierarchyNode);
router.get("/:id/hierarchy-nodes", authenticateToken, requirePermission("view_projects"), getHierarchyNodesByProject);
router.put("/:id/hierarchy-nodes/:nodeId", authenticateToken, requirePermission("manage_project"), updateHierarchyNode);
router.delete("/:id/hierarchy-nodes/:nodeId", authenticateToken, requirePermission("manage_project"), deleteHierarchyNode);

router.post("/:id/units", authenticateToken, requirePermission("manage_project"), createUnit);
router.get("/:id/units", authenticateToken, requirePermission("view_projects"), getUnitsByProject);
router.get("/:id/units/:unitId", authenticateToken, requirePermission("view_projects"), getUnitById);
router.put("/:id/units/:unitId", authenticateToken, requirePermission("manage_project"), updateUnit);
router.delete("/:id/units/:unitId", authenticateToken, requirePermission("manage_project"), deleteUnit);

export default router;
