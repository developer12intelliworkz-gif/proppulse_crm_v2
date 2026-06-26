import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  getProjectsWithQuotationStatus,
  upsertQuotationTemplate,
  getQuotationTemplatesByProject,
  getQuotationTemplateById,
  getUnitsByProjectForQuotations,
  generateQuotation,
  getQuotationById,
  getQuotationsByProject,
  generateQuotationPdf,
} from "../controllers/quotation.controller.js";

const router = express.Router();

// Projects list with template existence
router.get(
  "/projects-with-quotation-status",
  authenticateToken,
  getProjectsWithQuotationStatus,
);

// Template CRUD (versioned)
router.post("/quotation-templates", authenticateToken, upsertQuotationTemplate);
router.get(
  "/quotation-templates/by-project/:projectId",
  authenticateToken,
  getQuotationTemplatesByProject,
);
router.get(
  "/quotation-templates/:id",
  authenticateToken,
  getQuotationTemplateById,
);

// Units list for quotation generation (includes assigned lead)
router.get(
  "/units/by-project/:projectId",
  authenticateToken,
  getUnitsByProjectForQuotations,
);

// Quotations
router.post("/quotations/generate", authenticateToken, generateQuotation);
router.get("/quotations/:id", authenticateToken, getQuotationById);
router.get(
  "/quotations/by-project/:projectId",
  authenticateToken,
  getQuotationsByProject,
);
router.post("/quotations/:id/pdf", authenticateToken, generateQuotationPdf);

export default router;

