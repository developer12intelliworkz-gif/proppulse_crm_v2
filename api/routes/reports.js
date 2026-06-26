// routes/reports.routes.js
import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  getReportsData,
  getCustomReport,
} from "../controllers/reports.controller.js";

const router = express.Router();

// routes/reports.js
router.get(
  "/:endpoint(by-source|by-project|by-agent|by-status|by-city)",
  getCustomReport
);
router.get("/", authenticateToken, getReportsData);

export default router; 
