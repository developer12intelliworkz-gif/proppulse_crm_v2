import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticateToken } from "../middleware/auth.js";
import {
  getAllLeadTypes,
  createLeadType,
  updateLeadType,
  reorderLeadTypes,
  deleteLeadType,
} from "../controllers/leadType.controller.js";

import { requirePermission } from "../middleware/authorize.js";

const router = express.Router();

const uploadDir = path.join(process.cwd(), "public", "lead_icons");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const timestamp = Date.now();
    const filename = `${base}-${timestamp}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

// Routes — reorder MUST be registered before /:id
router.get("/", authenticateToken, requirePermission("view_leads"), getAllLeadTypes);
router.post("/", authenticateToken, requirePermission("manage_lead_types"), upload.single("logo_image"), createLeadType);
router.post("/reorder", authenticateToken, requirePermission("manage_lead_types"), reorderLeadTypes);
router.put("/reorder", authenticateToken, requirePermission("manage_lead_types"), reorderLeadTypes);
router.put("/:id", authenticateToken, requirePermission("manage_lead_types"), upload.single("logo_image"), updateLeadType);
router.delete("/:id", authenticateToken, requirePermission("manage_lead_types"), deleteLeadType);

// NO static here — handled in server.mjs

export default router;
