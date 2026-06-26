import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  listAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
} from "../controllers/amenity.controller.js";

const router = express.Router();

router.get("/", authenticateToken, listAmenities);
router.post("/", authenticateToken, createAmenity);
router.put("/:id", authenticateToken, updateAmenity);
router.delete("/:id", authenticateToken, deleteAmenity);

export default router;
