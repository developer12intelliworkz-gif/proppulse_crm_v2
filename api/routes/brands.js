import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  brandUpload,
} from "../controllers/brand.controller.js";

const router = express.Router();

router.get("/", authenticateToken, getBrands);
router.post("/", authenticateToken, brandUpload.single("brand_logo"), createBrand);
router.put("/:id", authenticateToken, brandUpload.single("brand_logo"), updateBrand);
router.delete("/:id", authenticateToken, deleteBrand);

export default router;
