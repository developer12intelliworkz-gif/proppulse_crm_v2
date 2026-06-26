// api/routes/notifications.js
import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  getNotifications,
  markNotificationAsRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", authenticateToken, getNotifications);
router.put("/:id/read", authenticateToken, markNotificationAsRead);

export default router;
