import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  getFollowUpDashboard,
  markFollowUpComplete,
  rescheduleFollowUp,
  updateFollowUpStatus,
} from "../controllers/followups.controller.js";

const router = express.Router();

router.get("/dashboard", authenticateToken, getFollowUpDashboard);
// PATCH + POST (POST works when nginx omits PATCH from CORS preflight on :4443)
router.patch("/:activityId/complete", authenticateToken, markFollowUpComplete);
router.post("/:activityId/complete", authenticateToken, markFollowUpComplete);
router.patch("/:activityId/status", authenticateToken, updateFollowUpStatus);
router.post("/:activityId/status", authenticateToken, updateFollowUpStatus);
router.patch("/:activityId/reschedule", authenticateToken, rescheduleFollowUp);
router.post("/:activityId/reschedule", authenticateToken, rescheduleFollowUp);

export default router;
