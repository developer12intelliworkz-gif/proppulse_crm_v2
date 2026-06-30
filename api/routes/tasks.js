import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  getTasks,
  getTaskById,
  getTaskStats,
  getTeamStats,
  createTask,
  updateTask,
  patchTaskStatus,
  deleteTask,
  addTaskComment,
  uploadMiddleware,
} from "../controllers/task.controller.js";

import { requirePermission } from "../middleware/authorize.js";

const router = express.Router();

router.get("/stats", authenticateToken, requirePermission("view_tasks"), getTaskStats);
router.get("/team", authenticateToken, requirePermission("view_tasks"), getTeamStats);
router.get("/", authenticateToken, requirePermission("view_tasks"), getTasks);
router.get("/:id", authenticateToken, requirePermission("view_tasks"), getTaskById);
router.post("/", authenticateToken, requirePermission("view_tasks"), uploadMiddleware.single("document"), createTask);
router.put("/:id", authenticateToken, requirePermission("view_tasks"), uploadMiddleware.single("document"), updateTask);
router.patch("/:id/status", authenticateToken, requirePermission("view_tasks"), patchTaskStatus);
router.post("/:id/status", authenticateToken, requirePermission("view_tasks"), patchTaskStatus);
router.post("/:id/comments", authenticateToken, requirePermission("view_tasks"), addTaskComment);
router.delete("/:id", authenticateToken, requirePermission("view_tasks"), deleteTask);

export default router;
