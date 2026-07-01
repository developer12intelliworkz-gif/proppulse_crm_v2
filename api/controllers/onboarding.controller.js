import pool from "../../database/config.js";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import {
  getOnboardingStatusForUser,
  getUserBrands,
  linkUserToBrand,
} from "../utils/onboarding.js";
import { ensureUploadDir, toPublicUploadPath } from "../utils/uploadPaths.js";
import { saveRegistrationBundle } from "../utils/companyRegistration.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = ensureUploadDir();

const companyLogoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    cb(null, `company-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const brandLogoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    cb(null, `brand-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const imageFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only image files are allowed"));
};

export const companyLogoUpload = multer({
  storage: companyLogoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter,
});

export const brandLogoUpload = multer({
  storage: brandLogoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter,
});

export const onboardingCompleteUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const prefix = file.fieldname === "company_logo" ? "company" : "brand";
      cb(null, `${prefix}-${Date.now()}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter,
}).fields([
  { name: "brand_logo", maxCount: 1 },
  { name: "company_logo", maxCount: 1 },
]);

async function resolveAdminRoleId(client) {
  const adminRes = await client.query(
    `SELECT id FROM roles_permissions
     WHERE LOWER(role_name) = 'admin' AND status = TRUE AND deleted_at IS NULL
     LIMIT 1`,
  );
  if (adminRes.rowCount > 0) return adminRes.rows[0].id;

  const anyRes = await client.query(
    `SELECT id FROM roles_permissions
     WHERE status = TRUE AND deleted_at IS NULL
     LIMIT 1`,
  );
  return anyRes.rows[0]?.id ?? null;
}

async function insertCompany(client, registration, userId, logoUrl = null) {
  const companyName = registration.companyName?.trim();
  if (!companyName) {
    const err = new Error("Company name is required");
    err.statusCode = 400;
    throw err;
  }

  const companyRes = await client.query(
    `INSERT INTO companies (name, logo_url, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    [companyName, logoUrl, userId],
  );

  const company = companyRes.rows[0];
  await saveRegistrationBundle(client, company.id, registration, logoUrl);
  return company;
}

export const fetchOnboardingStatus = async (req, res) => {
  try {
    const status = await getOnboardingStatusForUser(req.user.id);
    res.json(status);
  } catch (error) {
    console.error("fetchOnboardingStatus error:", error);
    res.status(500).json({ error: "Failed to load onboarding status" });
  }
};

/** @deprecated Step 1 now stores a client draft; use completeOnboarding instead. */
export const createOnboardingCompany = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { registration } = req.body;
  if (!registration?.companyName?.trim()) {
    return res.status(400).json({ error: "Company name is required" });
  }

  let client;
  try {
    const status = await getOnboardingStatusForUser(userId);
    if (!status.needsOnboarding || status.onboardingStep !== "company") {
      return res.status(400).json({
        error: "Company onboarding is not required in the current state",
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const existingCompany = await client.query(
      `SELECT company_id FROM users WHERE id = $1`,
      [userId],
    );
    if (existingCompany.rows[0]?.company_id) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "User already belongs to a company" });
    }

    const adminRoleId = await resolveAdminRoleId(client);
    const company = await insertCompany(client, registration, userId);

    await client.query(
      `UPDATE users SET
         company_id = $1,
         roles_permissions_id = COALESCE($2, roles_permissions_id),
         status = 'active',
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [company.id, adminRoleId, userId],
    );

    await client.query("COMMIT");

    res.status(201).json({
      data: company,
      message: "Company created. Continue to brand setup.",
      nextStep: "brand",
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("createOnboardingCompany error:", error);
    res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Failed to create company" });
  } finally {
    if (client) client.release();
  }
};

export const completeOnboarding = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  let registration;
  let brandPayload;
  try {
    registration =
      typeof req.body.registration === "string"
        ? JSON.parse(req.body.registration)
        : req.body.registration;
    brandPayload = req.body.payload ? JSON.parse(req.body.payload) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid request payload" });
  }

  const {
    brand_display_name,
    website,
    contact_number,
    facebook_link,
    instagram_link,
  } = brandPayload || {};

  if (!registration?.companyName?.trim()) {
    return res.status(400).json({ error: "Company name is required" });
  }
  if (!brand_display_name?.trim()) {
    return res.status(400).json({ error: "Brand display name is required" });
  }
  if (!website?.trim()) {
    return res.status(400).json({ error: "website is required" });
  }
  if (!contact_number?.trim()) {
    return res.status(400).json({ error: "contact_number is required" });
  }

  const brandLogoFile = req.files?.brand_logo?.[0];
  const companyLogoFile = req.files?.company_logo?.[0];
  const brandLogo = brandLogoFile
    ? toPublicUploadPath(brandLogoFile.filename)
    : null;
  const companyLogo = companyLogoFile
    ? toPublicUploadPath(companyLogoFile.filename)
    : null;

  let client;
  try {
    const status = await getOnboardingStatusForUser(userId);
    if (!status.needsOnboarding) {
      return res.status(400).json({ error: "Onboarding is already complete" });
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const userRes = await client.query(
      `SELECT company_id FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [userId],
    );
    let companyId = userRes.rows[0]?.company_id;
    let company;

    if (companyId) {
      const companyRes = await client.query(
        `SELECT id FROM companies WHERE id = $1 LIMIT 1`,
        [companyId],
      );
      if (companyRes.rowCount === 0) companyId = null;
    }

    if (!companyId) {
      const adminRoleId = await resolveAdminRoleId(client);
      company = await insertCompany(client, registration, userId, companyLogo);
      companyId = company.id;

      await client.query(
        `UPDATE users SET
           company_id = $1,
           roles_permissions_id = COALESCE($2, roles_permissions_id),
           status = 'active',
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [companyId, adminRoleId, userId],
      );
    } else {
      const existing = await client.query(
        `SELECT * FROM companies WHERE id = $1`,
        [companyId],
      );
      company = existing.rows[0];
      if (companyLogo) {
        const updated = await client.query(
          `UPDATE companies SET logo_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
          [companyLogo, companyId],
        );
        company = updated.rows[0];
      }
    }

    const brandRes = await client.query(
      `INSERT INTO brands (
         company_id, brand_logo, brand_display_name, website,
         contact_number, facebook_link, instagram_link, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        companyId,
        brandLogo,
        brand_display_name.trim(),
        website.trim(),
        contact_number.trim(),
        facebook_link || null,
        instagram_link || null,
      ],
    );

    const brand = brandRes.rows[0];
    await linkUserToBrand(client, userId, brand.id, { primary: true });

    await client.query("COMMIT");

    res.status(201).json({
      data: { company, brand },
      message: "Onboarding completed successfully",
      nextStep: "dashboard",
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("completeOnboarding error:", error);
    res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Failed to complete onboarding" });
  } finally {
    if (client) client.release();
  }
};

export const createOnboardingBrand = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const body = req.body.payload ? JSON.parse(req.body.payload) : req.body;
  const { brand_display_name, brand_description } = body;

  if (!brand_display_name?.trim()) {
    return res.status(400).json({ error: "Brand name is required" });
  }
  if (!req.file) {
    return res.status(400).json({ error: "Brand logo is required" });
  }

  let client;
  try {
    const status = await getOnboardingStatusForUser(userId);
    if (!status.needsOnboarding || status.onboardingStep !== "brand") {
      return res.status(400).json({
        error: "Brand onboarding is not required in the current state",
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const userRes = await client.query(
      `SELECT company_id FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [userId],
    );
    const companyId = userRes.rows[0]?.company_id;
    if (!companyId) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Create a company before adding a brand" });
    }

    const brandLogo = req.file ? toPublicUploadPath(req.file.filename) : null;
    const isFirstBrand =
      (await client.query(`SELECT COUNT(*)::int AS c FROM brands WHERE company_id = $1`, [companyId]))
        .rows[0].c === 0;

    const brandRes = await client.query(
      `INSERT INTO brands (
         company_id, brand_display_name, brand_description, brand_logo,
         created_at, updated_at
       ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        companyId,
        brand_display_name.trim(),
        brand_description?.trim() || null,
        brandLogo,
      ],
    );

    const brand = brandRes.rows[0];
    await linkUserToBrand(client, userId, brand.id, { primary: isFirstBrand });

    await client.query("COMMIT");

    res.status(201).json({
      data: brand,
      message: "Brand created successfully",
      canAddAnother: true,
      nextStep: "dashboard",
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("createOnboardingBrand error:", error);
    res.status(500).json({ error: "Failed to create brand" });
  } finally {
    if (client) client.release();
  }
};

export const fetchMyBrands = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    let brands = await getUserBrands(userId);

    if (brands.length === 0) {
      const userRow = await pool.query(
        `SELECT brand_id FROM users WHERE id = $1`,
        [userId],
      );
      const activeBrandId = userRow.rows[0]?.brand_id;
      if (activeBrandId) {
        const fallback = await pool.query(
          `SELECT id, brand_display_name, brand_logo, brand_description, company_id,
                  TRUE AS is_primary
           FROM brands WHERE id = $1`,
          [activeBrandId],
        );
        brands = fallback.rows;
      }
    }

    res.json({ data: brands });
  } catch (error) {
    console.error("fetchMyBrands error:", error);
    res.status(500).json({ error: "Failed to load brands" });
  }
};

export const setActiveBrand = async (req, res) => {
  const userId = req.user?.id;
  const { brand_id: brandId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (!brandId) {
    return res.status(400).json({ error: "brand_id is required" });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const membership = await client.query(
      `SELECT 1 FROM user_brands WHERE user_id = $1 AND brand_id = $2`,
      [userId, brandId],
    );
    if (membership.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Brand is not assigned to this user" });
    }

    await linkUserToBrand(client, userId, brandId, { primary: true });
    await client.query("COMMIT");

    const brands = await getUserBrands(userId);
    res.json({ message: "Active brand updated", data: brands });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("setActiveBrand error:", error);
    res.status(500).json({ error: "Failed to set active brand" });
  } finally {
    if (client) client.release();
  }
};
