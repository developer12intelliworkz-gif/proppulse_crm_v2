import pool from "../../database/config.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { assertUserCompanyAccess } from "../utils/tenant.js";
import { linkUserToBrand } from "../utils/onboarding.js";
import { ensureUploadDir, toPublicUploadPath } from "../utils/uploadPaths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = ensureUploadDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    cb(null, `brand-${Date.now()}${path.extname(file.originalname)}`);
  },
});

export const brandUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed for brand logo"));
  },
});

const parseBody = (req) => {
  if (req.body.payload) {
    try {
      return typeof req.body.payload === "string"
        ? JSON.parse(req.body.payload)
        : req.body.payload;
    } catch {
      return req.body;
    }
  }
  return req.body;
};

const resolveLogoUrl = (req, existingUrl = "") => {
  if (req.file) return toPublicUploadPath(req.file.filename);
  return existingUrl || null;
};

export const getBrands = async (req, res) => {
  const companyId = req.query.company_id;
  if (!companyId) {
    return res.status(400).json({ error: "company_id query parameter is required" });
  }

  let client;
  try {
    client = await pool.connect();
    if (req.user) {
      await assertUserCompanyAccess(req, client, companyId);
    }
  } catch (err) {
    if (client) client.release();
    return res.status(err.statusCode || 403).json({ error: err.message });
  }

  try {
    const result = await client.query(
      `SELECT * FROM brands WHERE company_id = $1 ORDER BY created_at DESC`,
      [companyId],
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("getBrands error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  } finally {
    if (client) client.release();
  }
};

export const createBrand = async (req, res) => {
  const body = parseBody(req);
  const {
    company_id,
    brand_display_name,
    website,
    contact_number,
    facebook_link,
    instagram_link,
  } = body;

  if (!company_id) {
    return res.status(400).json({ error: "company_id is required" });
  }
  if (!brand_display_name?.trim()) {
    return res.status(400).json({ error: "brand_display_name is required" });
  }
  if (!website?.trim()) {
    return res.status(400).json({ error: "website is required" });
  }
  if (!contact_number?.trim()) {
    return res.status(400).json({ error: "contact_number is required" });
  }

  let client;
  try {
    client = await pool.connect();
    if (req.user) {
      await assertUserCompanyAccess(req, client, company_id);
    }
  } catch (err) {
    if (client) client.release();
    return res.status(err.statusCode || 403).json({ error: err.message });
  }

  const brand_logo = resolveLogoUrl(req);

  try {
    await client.query("BEGIN");

    const companyCheck = await client.query(
      "SELECT id FROM companies WHERE id = $1 AND deleted_at IS NULL",
      [company_id],
    );
    if (companyCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Company not found" });
    }

    const result = await client.query(
      `INSERT INTO brands (
        company_id, brand_logo, brand_display_name, website,
        contact_number, facebook_link, instagram_link, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        company_id,
        brand_logo,
        brand_display_name.trim(),
        website.trim(),
        contact_number.trim(),
        facebook_link || null,
        instagram_link || null,
      ],
    );

    if (req.user?.id) {
      const userBrandCount = await client.query(
        `SELECT COUNT(*)::int AS c FROM user_brands WHERE user_id = $1`,
        [req.user.id],
      );
      const isFirstForUser = userBrandCount.rows[0]?.c === 0;
      await linkUserToBrand(client, req.user.id, result.rows[0].id, {
        primary: isFirstForUser,
      });
    }

    await client.query("COMMIT");
    res.status(201).json({ data: result.rows[0], message: "Brand created successfully" });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("createBrand error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  } finally {
    if (client) client.release();
  }
};

export const updateBrand = async (req, res) => {
  const { id } = req.params;
  const body = parseBody(req);
  const {
    brand_display_name,
    website,
    contact_number,
    facebook_link,
    instagram_link,
    brand_logo: existingLogo,
  } = body;

  if (!brand_display_name?.trim()) {
    return res.status(400).json({ error: "brand_display_name is required" });
  }
  if (!website?.trim()) {
    return res.status(400).json({ error: "website is required" });
  }
  if (!contact_number?.trim()) {
    return res.status(400).json({ error: "contact_number is required" });
  }

  const brand_logo = resolveLogoUrl(req, existingLogo);

  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      `UPDATE brands SET
        brand_logo = $1,
        brand_display_name = $2,
        website = $3,
        contact_number = $4,
        facebook_link = $5,
        instagram_link = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *`,
      [
        brand_logo,
        brand_display_name.trim(),
        website.trim(),
        contact_number.trim(),
        facebook_link || null,
        instagram_link || null,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Brand not found" });
    }

    res.json({ data: result.rows[0], message: "Brand updated successfully" });
  } catch (error) {
    console.error("updateBrand error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  } finally {
    if (client) client.release();
  }
};

export const deleteBrand = async (req, res) => {
  const { id } = req.params;
  let client;
  try {
    client = await pool.connect();

    const brandRes = await client.query(
      `SELECT id, company_id FROM brands WHERE id = $1`,
      [id],
    );
    if (brandRes.rows.length === 0) {
      return res.status(404).json({ error: "Brand not found" });
    }

    const { company_id: companyId } = brandRes.rows[0];

    if (req.user) {
      await assertUserCompanyAccess(req, client, companyId);
    }

    const countRes = await client.query(
      `SELECT COUNT(*)::int AS c FROM brands WHERE company_id = $1`,
      [companyId],
    );
    if (countRes.rows[0]?.c <= 1) {
      return res.status(400).json({
        error: "You need at least 1 brand. Cannot delete the last brand.",
      });
    }

    const result = await client.query(
      "DELETE FROM brands WHERE id = $1 RETURNING id",
      [id],
    );
    res.json({ message: "Brand deleted successfully" });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("deleteBrand error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  } finally {
    if (client) client.release();
  }
};
