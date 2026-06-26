/**
 * Production project.controller.js
 * Path: /home/crm/public_html/api/controllers/project.controller.js
 *
 * Setup (inventory L1/L2): project_type + project_structure stay NULL on create;
 * updated via PUT /projects/:id/initial-setup or updateProject.
 */
import pool from "../config.mjs";
import { createNotificationsForEmails } from "./notification.controller.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadPath = path.join(__dirname, "../../public/project_vr_app_document");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
}).fields([
  { name: "vr_upload", maxCount: 1 },
  { name: "brochure_uploads", maxCount: 10 },
]);

const cleanupFiles = (files) => {
  if (!files) return;
  Object.values(files)
    .flat()
    .forEach((file) => {
      if (file?.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {}
      }
    });
};

const getProjectIdFromParams = (req) => req.params.projectId || req.params.id;

// ==================== CREATE PROJECT ====================
export const createProject = [
  upload,
  async (req, res) => {
    const brochureFiles = req.files?.brochure_uploads || [];
    const brochureFilenames = brochureFiles.map((f) => f.filename);
    const {
      name,
      description,
      rera_project_id,
      sales,
      notify_to_emails,
      launched_on,
      expected_completion,
      possession,
      is_active,
      inventory,
      search_address,
      address,
      street,
      country,
      state,
      city,
      zip,
      locality,
      latitude,
      longitude,
      enable_vr,
      amenities,
      specifications,
      india_property_code,
      magicbricks_code,
      status,
      created_by,
      completed_steps,
      office_address_line1 = "",
      office_address_line2 = "",
    } = req.body;

    const office_address = [office_address_line1, office_address_line2]
      .filter(Boolean)
      .join(", ");

    let parsedAmenities = amenities;
    let parsedSpecifications = specifications;

    try {
      if (typeof amenities === "string") parsedAmenities = JSON.parse(amenities);
      if (typeof specifications === "string")
        parsedSpecifications = JSON.parse(specifications);
    } catch (e) {
      cleanupFiles(req.files);
      return res.status(400).json({ error: "Invalid JSON" });
    }

    const errors = [];
    if (status === "completed") {
      if (!name) errors.push("Project name is required");
      if (!search_address || !address || !city || !state || !country || !zip)
        errors.push("All address fields are required");
      if (!parsedSpecifications || parsedSpecifications.length === 0)
        errors.push("At least one specification is required");
      if (brochureFilenames.length === 0)
        errors.push("At least one brochure file is required");
      if (!india_property_code && !magicbricks_code)
        errors.push("At least one property code is required");
      if (enable_vr && !req.files?.vr_upload?.[0])
        errors.push("VR Upload is required when VR is enabled");
    }
    if (!created_by) errors.push("Created by user ID is required");

    if (errors.length > 0) {
      cleanupFiles(req.files);
      return res
        .status(400)
        .json({ error: "Validation failed", details: errors });
    }

    let client;
    try {
      client = await pool.connect();
      await client.query("BEGIN");

      const parsedNotifyEmails = notify_to_emails
        ? notify_to_emails.split(",").map((e) => e.trim()).filter(Boolean)
        : [];

      // project_type and project_structure are NOT in INSERT — remain NULL until Project Setup
      const projectResult = await client.query(
        `INSERT INTO projects (
          name, description, rera_project_id, sales, notify_to_emails, launched_on,
          expected_completion, possession, is_active, inventory, search_address,
          address, street, country, state, city, zip, locality, latitude, longitude,
          enable_vr, vr_upload, amenities, india_property_code, magicbricks_code,
          status, created_by, completed_steps, brochure_uploads, office_address,
          created_at, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
          $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
        ) RETURNING id, name`,
        [
          name || null,
          description || null,
          rera_project_id || null,
          sales || null,
          parsedNotifyEmails,
          launched_on || null,
          expected_completion || null,
          possession || null,
          is_active ?? true,
          inventory ?? false,
          search_address || null,
          address || null,
          street || null,
          country || null,
          state || null,
          city || null,
          zip || null,
          locality || null,
          latitude || null,
          longitude || null,
          enable_vr ?? false,
          req.files?.vr_upload?.[0]?.filename || null,
          parsedAmenities || {},
          india_property_code || null,
          magicbricks_code || null,
          status || "draft",
          created_by,
          completed_steps || [],
          brochureFilenames,
          office_address || null,
        ],
      );

      const projectId = projectResult.rows[0].id;

      if (Array.isArray(parsedSpecifications)) {
        for (const spec of parsedSpecifications) {
          if (spec.title && spec.description) {
            await client.query(
              `INSERT INTO project_specifications (project_id, title, description, created_at)
               VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
              [projectId, spec.title, spec.description],
            );
          }
        }
      }

      if (parsedNotifyEmails.length > 0) {
        await createNotificationsForEmails(
          client,
          parsedNotifyEmails,
          "project_created",
          `New project "${name}" has been created`,
          projectId,
          "project",
        );
      }

      await client.query("COMMIT");
      res.json({ id: projectId, message: "Project created successfully" });
    } catch (error) {
      if (client) await client.query("ROLLBACK");
      cleanupFiles(req.files);
      console.error("createProject error:", error);
      res.status(500).json({ error: "Server error", details: error.message });
    } finally {
      if (client) client.release();
    }
  },
];

// ==================== UPDATE PROJECT ====================
export const updateProject = [
  upload,
  async (req, res) => {
    const id = getProjectIdFromParams(req);
    if (!id) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const newBrochureFiles = req.files?.brochure_uploads || [];
    const newBrochureFilenames = newBrochureFiles.map((f) => f.filename);
    const office_address_line1 = req.body.office_address_line1 || "";
    const office_address_line2 = req.body.office_address_line2 || "";
    const office_address = [office_address_line1, office_address_line2]
      .filter(Boolean)
      .join(", ");

    let client;
    try {
      client = await pool.connect();
      const existingRes = await client.query(
        "SELECT brochure_uploads FROM projects WHERE id = $1 AND deleted_at IS NULL",
        [id],
      );

      if (existingRes.rows.length === 0) {
        cleanupFiles(req.files);
        return res.status(404).json({ error: "Project not found" });
      }

      const existingBrochures = existingRes.rows[0].brochure_uploads || [];
      const updatedBrochures = [...existingBrochures, ...newBrochureFilenames];

      await client.query("BEGIN");

      const updates = [];
      const values = [];
      let index = 1;

      if (req.body.name !== undefined) {
        updates.push(`name = $${index++}`);
        values.push(req.body.name);
      }
      if (req.body.description !== undefined) {
        updates.push(`description = $${index++}`);
        values.push(req.body.description);
      }
      if (req.body.search_address !== undefined) {
        updates.push(`search_address = $${index++}`);
        values.push(req.body.search_address);
      }
      if (req.body.address !== undefined) {
        updates.push(`address = $${index++}`);
        values.push(req.body.address);
      }
      if (req.body.street !== undefined) {
        updates.push(`street = $${index++}`);
        values.push(req.body.street);
      }
      if (req.body.city !== undefined) {
        updates.push(`city = $${index++}`);
        values.push(req.body.city);
      }
      if (req.body.state !== undefined) {
        updates.push(`state = $${index++}`);
        values.push(req.body.state);
      }
      if (req.body.country !== undefined) {
        updates.push(`country = $${index++}`);
        values.push(req.body.country);
      }
      if (req.body.zip !== undefined) {
        updates.push(`zip = $${index++}`);
        values.push(req.body.zip);
      }
      if (req.body.locality !== undefined) {
        updates.push(`locality = $${index++}`);
        values.push(req.body.locality);
      }
      if (req.files?.vr_upload?.[0]) {
        updates.push(`vr_upload = $${index++}`);
        values.push(req.files.vr_upload[0].filename);
      }
      if (newBrochureFilenames.length > 0) {
        updates.push(`brochure_uploads = $${index++}`);
        values.push(updatedBrochures);
      }
      if (office_address_line1 || office_address_line2) {
        updates.push(`office_address = $${index++}`);
        values.push(office_address);
      }
      if (req.body.status !== undefined) {
        updates.push(`status = $${index++}`);
        values.push(req.body.status);
      }
      if (req.body.project_type !== undefined) {
        updates.push(`project_type = $${index++}`);
        values.push(req.body.project_type);
      }
      if (req.body.project_structure !== undefined) {
        updates.push(`project_structure = $${index++}`);
        values.push(req.body.project_structure);
      }

      if (updates.length === 0) {
        await client.query("ROLLBACK");
        cleanupFiles(req.files);
        return res.status(400).json({ error: "No fields to update" });
      }

      updates.push("updated_at = CURRENT_TIMESTAMP");
      values.push(id);

      const query = `UPDATE projects SET ${updates.join(
        ", ",
      )} WHERE id = $${index} RETURNING id, name, project_type, project_structure`;

      const updateResult = await client.query(query, values);

      await client.query("COMMIT");

      res.json({
        message: "Project updated successfully",
        data: updateResult.rows[0],
      });
    } catch (error) {
      if (client) await client.query("ROLLBACK");
      cleanupFiles(req.files);
      console.error("updateProject error:", error);
      res.status(500).json({ error: "Server error", details: error.message });
    } finally {
      if (client) client.release();
    }
  },
];

// ==================== GET PROJECT BY ID ====================
export const getProjectById = async (req, res) => {
  const id = getProjectIdFromParams(req);
  if (!id) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = result.rows[0];
    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    project.vr_upload_url = project.vr_upload
      ? `${baseUrl}/project_vr_app_document/${project.vr_upload}`
      : null;

    project.brochure_upload_urls = (project.brochure_uploads || []).map(
      (f) => `${baseUrl}/project_vr_app_document/${encodeURIComponent(f)}`,
    );

    const specs = await client.query(
      "SELECT * FROM project_specifications WHERE project_id = $1",
      [id],
    );
    project.specifications = specs.rows;

    res.json(project);
  } catch (error) {
    console.error("getProjectById error:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (client) client.release();
  }
};

// ==================== GET ALL PROJECTS ====================
export const getProjects = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY created_at DESC",
    );

    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    const projects = result.rows.map((p) => ({
      ...p,
      vr_upload_url: p.vr_upload
        ? `${baseUrl}/project_vr_app_document/${p.vr_upload}`
        : null,
      brochure_upload_urls: (p.brochure_uploads || []).map(
        (f) => `${baseUrl}/project_vr_app_document/${encodeURIComponent(f)}`,
      ),
    }));

    res.json({ data: projects });
  } catch (error) {
    console.error("getProjects error:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (client) client.release();
  }
};

// ==================== DELETE PROJECT ====================
export const deleteProject = async (req, res) => {
  const id = getProjectIdFromParams(req);
  if (!id) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const result = await client.query(
      "UPDATE projects SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id, name",
      [id],
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Project not found or already deleted" });
    }

    await client.query("COMMIT");
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("deleteProject error:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (client) client.release();
  }
};
