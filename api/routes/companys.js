import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  upload,
} from "../controllers/company.controller.js";

const router = express.Router();

router.get("/", authenticateToken, getCompanies);
router.get("/:id", authenticateToken, getCompanyById);
router.post("/", authenticateToken, upload.single("logo"), createCompany);
router.put("/:id", authenticateToken, upload.single("logo"), updateCompany);
router.delete("/:id", authenticateToken, deleteCompany);

export default router;
