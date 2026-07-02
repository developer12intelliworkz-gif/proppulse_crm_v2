import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  fetchOnboardingStatus,
  createOnboardingCompany,
  completeOnboarding,
  createOnboardingBrand,
  fetchMyBrands,
  setActiveBrand,
  brandLogoUpload,
  onboardingCompleteUpload,
} from "../controllers/onboarding.controller.js";
import { ensureOnboardingSchema } from "../utils/ensureOnboardingSchema.js";

const router = express.Router();

router.use(async (_req, _res, next) => {
  try {
    await ensureOnboardingSchema();
    next();
  } catch (error) {
    next(error);
  }
});

router.get("/status", authenticateToken, fetchOnboardingStatus);
router.get("/brands/me", authenticateToken, fetchMyBrands);
router.post("/active-brand", authenticateToken, setActiveBrand);
router.post("/company", authenticateToken, createOnboardingCompany);
router.post(
  "/complete",
  authenticateToken,
  onboardingCompleteUpload,
  completeOnboarding,
);
router.post(
  "/brand",
  authenticateToken,
  brandLogoUpload.single("brand_logo"),
  createOnboardingBrand,
);

export default router;
