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

const router = express.Router();

router.get("/stats", authenticateToken, getTaskStats);
router.get("/team", authenticateToken, getTeamStats);
router.get("/", authenticateToken, getTasks);
router.get("/:id", authenticateToken, getTaskById);
router.post("/", authenticateToken, uploadMiddleware.single("document"), createTask);
router.put("/:id", authenticateToken, uploadMiddleware.single("document"), updateTask);
router.patch("/:id/status", authenticateToken, patchTaskStatus);
router.post("/:id/status", authenticateToken, patchTaskStatus);
router.post("/:id/comments", authenticateToken, addTaskComment);
router.delete("/:id", authenticateToken, deleteTask);

export default router;
