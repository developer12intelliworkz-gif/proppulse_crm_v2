// routes/reports.routes.js
import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  getReportsData,
  getCustomReport,
} from "../controllers/reports.controller.js";

import { requirePermission } from "../middleware/authorize.js";

const router = express.Router();

// routes/reports.js
router.get(
  "/:endpoint(by-source|by-project|by-agent|by-status|by-city)",
  authenticateToken,
  requirePermission("view_reports"),
  getCustomReport
);
router.get("/", authenticateToken, requirePermission("view_reports"), getReportsData);

export default router; 
