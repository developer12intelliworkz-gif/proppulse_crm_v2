import express from "express";
import multer from "multer";
import path from "path"; // ← ADD THIS IMPORT
import { authenticateToken } from "../middleware/auth.js";
import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  syncLeadsFromSheet,
  syncShyamGroupsFromApi,
  importLeads,
  getLeadById,
  getUserProjectsAndLeads,
} from "../controllers/leads.controller.js";
import {
  getActivityHistory,
  addActivity,
  addDocument,
  updateActivity,
  deleteActivity,
  updateDocument,
  deleteDocument,
  getDocument,
} from "../controllers/activities.controller.js";
import { getDashboardSummary } from "../controllers/dashboard.controller.js";

import { requirePermission } from "../middleware/authorize.js";

const router = express.Router();

// Multer config (in-memory upload)
const upload = multer({ storage: multer.memoryStorage() });

// ──────────────────────────────
// LEAD ROUTES
// ──────────────────────────────
router.get("/summary", authenticateToken, requirePermission("view_leads"), getDashboardSummary);
router.get("/", authenticateToken, requirePermission("view_leads"), getLeads);
router.get("/:id", authenticateToken, requirePermission("view_leads"), getLeadById);
router.post("/", authenticateToken, requirePermission("create_leads"), createLead);
router.put("/:id", authenticateToken, requirePermission("edit_leads"), updateLead);
router.delete("/:id", authenticateToken, requirePermission("delete_leads"), deleteLead);
router.get("/sync", authenticateToken, requirePermission("import_leads"), syncLeadsFromSheet);
router.get("/sync-shyamgroups", authenticateToken, requirePermission("import_leads"), syncShyamGroupsFromApi);
router.get(
  "/user/:userId/projects-leads",
  authenticateToken,
  requirePermission("view_leads"),
  getUserProjectsAndLeads
);
// ──────────────────────────────
// ACTIVITY & DOCUMENT ROUTES
// ──────────────────────────────
router.get("/:id/activities", authenticateToken, requirePermission("view_leads"), getActivityHistory);
router.post("/:id/activities", authenticateToken, requirePermission("edit_leads"), addActivity);
router.put("/:id/activities/:activityId", authenticateToken, requirePermission("edit_leads"), updateActivity);
router.delete("/:id/activities/:activityId", authenticateToken, requirePermission("edit_leads"), deleteActivity);

router.post("/:id/documents", authenticateToken, requirePermission("edit_leads"), addDocument);
router.put("/:id/documents/:documentId", authenticateToken, requirePermission("edit_leads"), updateDocument);
router.delete("/:id/documents/:documentId", authenticateToken, requirePermission("edit_leads"), deleteDocument);
router.get("/:id/documents/:documentId", authenticateToken, requirePermission("view_leads"), getDocument);

// ──────────────────────────────
// SERVE LEAD DOCUMENTS STATICALLY (ADD THIS LINE)
// ──────────────────────────────
router.use(
  "/documents/lead",
  express.static(path.join(process.cwd(), "public", "documents", "lead"))
);

// ──────────────────────────────
// IMPORT LEADS
// ──────────────────────────────
router.post("/import", authenticateToken, requirePermission("import_leads"), upload.single("file"), importLeads);

export default router;
