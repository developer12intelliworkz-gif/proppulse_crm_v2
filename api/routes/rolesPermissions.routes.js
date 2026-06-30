import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { requirePermission } from "../middleware/authorize.js";
import {
  getAllRolesPermissions,
  createRolesPermissions,
  updateRolesPermissions,
  deleteRolesPermissions,
} from "../controllers/rolesPermissions.controller.js";

const router = express.Router();

router.get("/roles-permissions", authenticateToken, getAllRolesPermissions);
router.post("/roles-permissions", authenticateToken, requirePermission("create_roles"), createRolesPermissions);
router.put("/roles-permissions/:id", authenticateToken, requirePermission("update_roles"), updateRolesPermissions);
router.delete("/roles-permissions/:id", authenticateToken, requirePermission("delete_roles"), deleteRolesPermissions);

export default router;