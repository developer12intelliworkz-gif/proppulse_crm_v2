import express from "express";
import {
  getAllRolesPermissions,
  createRolesPermissions,
  updateRolesPermissions,
  deleteRolesPermissions,
} from "../controllers/rolesPermissions.controller.js";

const router = express.Router();

router.get("/roles-permissions", getAllRolesPermissions);
router.post("/roles-permissions", createRolesPermissions);
router.put("/roles-permissions/:id", updateRolesPermissions);
router.delete("/roles-permissions/:id", deleteRolesPermissions);

export default router;