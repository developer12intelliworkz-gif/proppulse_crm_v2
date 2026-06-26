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

const router = express.Router();

// Multer config (in-memory upload)
const upload = multer({ storage: multer.memoryStorage() });

// ──────────────────────────────
// LEAD ROUTES
// ──────────────────────────────
router.get("/summary", authenticateToken, getDashboardSummary);
router.get("/", authenticateToken, getLeads);
router.get("/:id", authenticateToken, getLeadById);
router.post("/", authenticateToken, createLead);
router.put("/:id", authenticateToken, updateLead);
router.delete("/:id", authenticateToken, deleteLead);
router.get("/sync", authenticateToken, syncLeadsFromSheet);
router.get("/sync-shyamgroups", authenticateToken, syncShyamGroupsFromApi);
router.get(
  "/user/:userId/projects-leads",
  authenticateToken,
  getUserProjectsAndLeads
);
// ──────────────────────────────
// ACTIVITY & DOCUMENT ROUTES
// ──────────────────────────────
router.get("/:id/activities", authenticateToken, getActivityHistory);
router.post("/:id/activities", authenticateToken, addActivity);
router.put("/:id/activities/:activityId", authenticateToken, updateActivity);
router.delete("/:id/activities/:activityId", authenticateToken, deleteActivity);

router.post("/:id/documents", authenticateToken, addDocument);
router.put("/:id/documents/:documentId", authenticateToken, updateDocument);
router.delete("/:id/documents/:documentId", authenticateToken, deleteDocument);
router.get("/:id/documents/:documentId", authenticateToken, getDocument);

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
router.post("/import", authenticateToken, upload.single("file"), importLeads);

export default router;
