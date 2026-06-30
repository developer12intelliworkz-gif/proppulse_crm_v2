import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  listAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
} from "../controllers/amenity.controller.js";

import { requirePermission } from "../middleware/authorize.js";

const router = express.Router();

router.get("/", authenticateToken, listAmenities);
router.post("/", authenticateToken, requirePermission("manage_project"), createAmenity);
router.put("/:id", authenticateToken, requirePermission("manage_project"), updateAmenity);
router.delete("/:id", authenticateToken, requirePermission("manage_project"), deleteAmenity);

export default router;
