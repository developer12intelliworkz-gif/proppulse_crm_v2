import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  getFollowUpDashboard,
  markFollowUpComplete,
  rescheduleFollowUp,
  updateFollowUpStatus,
} from "../controllers/followups.controller.js";

import { requirePermission } from "../middleware/authorize.js";

const router = express.Router();

router.get("/dashboard", authenticateToken, requirePermission("view_followups"), getFollowUpDashboard);
// PATCH + POST (POST works when nginx omits PATCH from CORS preflight on :4443)
router.patch("/:activityId/complete", authenticateToken, requirePermission("view_followups"), markFollowUpComplete);
router.post("/:activityId/complete", authenticateToken, requirePermission("view_followups"), markFollowUpComplete);
router.patch("/:activityId/status", authenticateToken, requirePermission("view_followups"), updateFollowUpStatus);
router.post("/:activityId/status", authenticateToken, requirePermission("view_followups"), updateFollowUpStatus);
router.patch("/:activityId/reschedule", authenticateToken, requirePermission("view_followups"), rescheduleFollowUp);
router.post("/:activityId/reschedule", authenticateToken, requirePermission("view_followups"), rescheduleFollowUp);

export default router;
