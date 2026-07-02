import pool from "../../database/config.js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { Resvg } from "@resvg/resvg-js";
import {
  getProjectUnitsSchema,
  sqlUnitAlias,
  buildLeadJoin,
  buildHierarchyJoin,
  buildDeletedFilter,
  normalizeUnitRow,
  resolveUnitRatePerUnit,
  resolveUnitBasicPrice,
} from "../utils/projectUnitsSchema.js";
import {
  ALLOWED_CALC_TYPES,
  normalizeCalculationType,
  computeParticularAmount,
} from "../utils/quotationCalculations.js";
import { PROJECT_MEDIA_DIR } from "../utils/projectUploadPaths.js";

const ALLOWED_APPLIES_TO = new Set(["unit", "terrace", "both"]);
const ALLOWED_QUOTATION_STATUS = new Set([
  "draft",
  "sent",
  "accepted",
  "rejected",
]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function asNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function convertHtmlToPlaintext(html) {
  if (!html) return "";
  let text = String(html);
  // Replace <br> and <br /> with newlines
  text = text.replace(/<br\s*\/?>/gi, "\n");
  // Replace </p>, </div>, </li> with newlines
  text = text.replace(/<\/p>/gi, "\n");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<\/li>/gi, "\n");
  // Replace <li> with "• "
  text = text.replace(/<li>/gi, "• ");
  // Strip all other HTML tags
  text = text.replace(/<[^>]+>/g, "");
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  return text.trim();
}

function formatMoneyINR(value) {
  const n = Number(value || 0);
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateYYYYMMDD(value) {
  if (!value) return "-";
  const d = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(d.getTime())) return String(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function safeReadLogoDataUrl() {
  const absoluteLogoPath =
    "C:\\Users\\jeet\\OneDrive\\Desktop\\supabase-to-postgres-flow\\supabase-to-postgres-flow\\src\\components\\layout\\logo.png";

  try {
    if (!fs.existsSync(absoluteLogoPath)) return null;
    const buffer = fs.readFileSync(absoluteLogoPath);
    const base64 = buffer.toString("base64");
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
}

function getLetterheadPdfPath() {
  const envPath =
    process.env.QUOTATION_LETTERHEAD_PATH ||
    process.env.LETTERHEAD_PDF_PATH ||
    "";
  if (envPath && fs.existsSync(envPath)) return envPath;

  const srcLetterhead = path.join(
    __dirname,
    "..",
    "..",
    "src",
    "components",
    "LetterHead.pdf",
  );
  if (fs.existsSync(srcLetterhead)) return srcLetterhead;

  // Default: api/public/letterhead/LetterHead.pdf (Linux-friendly)
  const repoRelative = path.join(
    __dirname,
    "..",
    "public",
    "letterhead",
    "LetterHead.pdf",
  );
  if (fs.existsSync(repoRelative)) return repoRelative;

  // Backward-compatible: older location api/public/LetterHead.pdf
  const legacyRelative = path.join(__dirname, "..", "public", "LetterHead.pdf");
  if (fs.existsSync(legacyRelative)) return legacyRelative;

  return envPath || repoRelative;
}

async function getTemplateById(templateId) {
  const tpl = await pool.query(
    `SELECT id, project_id, template_name, version, is_active, has_terrace_units, terms_and_conditions, theme, created_at, updated_at
     FROM quotation_templates
     WHERE id = $1
     LIMIT 1`,
    [templateId],
  );
  if (tpl.rowCount === 0) return null;

  const parts = await pool.query(
    `SELECT id, template_id, label, calculation_type, value, applies_to, include_in_subtotal, sort_order, is_optional, created_at
     FROM quotation_particulars
     WHERE template_id = $1
     ORDER BY sort_order ASC, created_at ASC`,
    [templateId],
  );

  return { ...tpl.rows[0], particulars: parts.rows };
}

async function listTemplatesByProject(projectId) {
  const res = await pool.query(
    `SELECT id, project_id, template_name, version, is_active, has_terrace_units, terms_and_conditions, theme, created_at, updated_at
     FROM quotation_templates
     WHERE project_id = $1
     ORDER BY is_active DESC, created_at DESC`,
    [projectId],
  );
  return res.rows;
}

async function generateQuotationNumber(client, quotationDate = new Date()) {
  const year = quotationDate.getUTCFullYear();
  await client.query(
    `INSERT INTO quotation_number_sequences (year, last_number)
     VALUES ($1, 0)
     ON CONFLICT (year) DO NOTHING`,
    [year],
  );

  const res = await client.query(
    `UPDATE quotation_number_sequences
     SET last_number = last_number + 1,
         updated_at = NOW()
     WHERE year = $1
     RETURNING last_number`,
    [year],
  );

  const next = res.rows[0]?.last_number || 1;
  const padded = String(next).padStart(5, "0");
  return `QT-${year}-${padded}`;
}

export const getProjectsWithQuotationStatus = async (req, res) => {
  try {
    const unitsSchema = await getProjectUnitsSchema();
    const unitDeletedFilter = buildDeletedFilter(unitsSchema, "u");

    const result = await pool.query(
      `SELECT
         p.id,
         p.name,
         p.project_type,
         p.project_structure,
         p.project_logo,
         (
           SELECT COUNT(1)
           FROM project_units u
           WHERE u.project_id = p.id ${unitDeletedFilter}
         ) AS unit_count,
        (
          SELECT COUNT(1)
          FROM quotation_templates qt
          WHERE qt.project_id = p.id
        ) AS template_count
       FROM projects p
       WHERE p.deleted_at IS NULL
       ORDER BY p.created_at DESC`,
    );

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const data = result.rows.map((row) => ({
      ...row,
      project_logo_url: row.project_logo
        ? `${baseUrl}/project_vr_app_document/${encodeURIComponent(row.project_logo)}`
        : null,
    }));

    res.json({ data });
  } catch (error) {
    console.error("getProjectsWithQuotationStatus error:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

export const upsertQuotationTemplate = async (req, res) => {
  const { project_id, template_name, is_active, has_terrace_units, particulars, terms_and_conditions, theme } = req.body;

  if (!project_id) {
    return res.status(400).json({ error: "project_id is required" });
  }
  if (!template_name || !String(template_name).trim()) {
    return res.status(400).json({ error: "template_name is required" });
  }
  if (!Array.isArray(particulars)) {
    return res.status(400).json({ error: "particulars must be an array" });
  }

  let normalizedParticulars;
  try {
    const withLabels = particulars.filter((p) => String(p?.label || "").trim());
    if (withLabels.length === 0) {
      return res.status(400).json({
        error: "Add at least one particular with a label before saving",
      });
    }

    normalizedParticulars = withLabels.map((p, idx) => {
      const label = String(p.label || "").trim();
      const calculation_type = normalizeCalculationType(p.calculation_type);
      const value = asNumberOrNull(p.value);

      if (!ALLOWED_CALC_TYPES.has(calculation_type)) {
        throw new Error(
          `Particular #${idx + 1}: invalid calculation_type: ${calculation_type}`,
        );
      }
      if (value === null) {
        throw new Error(`Particular #${idx + 1}: value is required`);
      }

      return {
        label,
        calculation_type,
        value,
        applies_to: "unit",
        include_in_subtotal: true,
        sort_order: Number.isFinite(Number(p.sort_order)) ? Number(p.sort_order) : idx,
        is_optional: p.is_optional === true,
      };
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Invalid particulars" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ensure project exists
    const project = await client.query(
      "SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL",
      [project_id],
    );
    if (project.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Project not found" });
    }

    // bump version within same template_name
    const versionRes = await client.query(
      `SELECT COALESCE(MAX(version), 0) AS max_version
       FROM quotation_templates
       WHERE project_id = $1 AND LOWER(BTRIM(template_name)) = LOWER(BTRIM($2))`,
      [project_id, String(template_name).trim()],
    );
    const nextVersion = Number(versionRes.rows[0]?.max_version || 0) + 1;
    const willBeActive = is_active !== false;

    // Legacy DBs may still have uniq_active_quotation_template_per_project (one active row per project).
    if (willBeActive) {
      await client.query(
        `UPDATE quotation_templates
         SET is_active = false, updated_at = NOW()
         WHERE project_id = $1 AND is_active = true`,
        [project_id],
      );
    }

    const tpl = await client.query(
      `INSERT INTO quotation_templates (
         project_id, template_name, version, is_active, has_terrace_units, terms_and_conditions, theme, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [
        project_id,
        String(template_name).trim(),
        nextVersion,
        willBeActive,
        !!has_terrace_units,
        terms_and_conditions || null,
        theme || 'gold',
      ],
    );

    for (const p of normalizedParticulars) {
      await client.query(
        `INSERT INTO quotation_particulars (
           template_id, label, calculation_type, value, applies_to,
           include_in_subtotal, sort_order, is_optional, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          tpl.rows[0].id,
          p.label,
          p.calculation_type,
          p.value,
          p.applies_to,
          p.include_in_subtotal,
          p.sort_order,
          p.is_optional,
        ],
      );
    }

    await client.query("COMMIT");

    const created = await getTemplateById(tpl.rows[0].id);
    res.status(201).json({ data: created });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("upsertQuotationTemplate error:", error);
    if (error.code === "23505") {
      return res.status(409).json({
        error:
          "Could not save template: another active template exists for this project. Run migration/2026-05-28-quotation-templates-multi.sql to allow multiple templates, or save again.",
      });
    }
    res.status(400).json({ error: error.message || "Failed to save template" });
  } finally {
    client.release();
  }
};

export const getQuotationTemplatesByProject = async (req, res) => {
  const { projectId } = req.params;
  try {
    const templates = await listTemplatesByProject(projectId);
    res.json({ count: templates.length, data: templates });
  } catch (error) {
    console.error("getQuotationTemplatesByProject error:", error);
    res.status(500).json({ error: "Failed to fetch quotation templates" });
  }
};

export const getQuotationTemplateById = async (req, res) => {
  const { id } = req.params;
  try {
    const tpl = await getTemplateById(id);
    if (!tpl) return res.status(404).json({ error: "Template not found" });
    res.json({ data: tpl });
  } catch (error) {
    console.error("getQuotationTemplateById error:", error);
    res.status(500).json({ error: "Failed to fetch quotation template" });
  }
};

export const getUnitsByProjectForQuotations = async (req, res) => {
  const { projectId } = req.params;
  try {
    const schema = await getProjectUnitsSchema();
    const hierarchy = buildHierarchyJoin(schema);
    const leadJoin = buildLeadJoin(schema);
    const deletedFilter = buildDeletedFilter(schema);

    const unitNumberExpr = schema.unitNumberCol
      ? `u.${schema.unitNumberCol} AS unit_number`
      : "CAST(u.id AS TEXT) AS unit_number";
    const statusExpr = schema.statusCol
      ? `u.${schema.statusCol} AS status`
      : "'available'::text AS status";

    const result = await pool.query(
      `SELECT
         u.id,
         ${unitNumberExpr},
         ${statusExpr},
         ${sqlUnitAlias(schema.carpetCol, "carpet_area_sqft")},
         ${sqlUnitAlias(schema.superBuiltupCol, "super_builtup_area_sqft")},
         ${sqlUnitAlias(schema.priceCol, "price", "NULL::numeric")},
         ${sqlUnitAlias(schema.baseRateCol, "base_rate", "NULL::numeric")},
         ${sqlUnitAlias(schema.totalPriceCol, "total_price", "NULL::numeric")},
         ${sqlUnitAlias(schema.leadCol, "lead_id", "NULL::text")},
         ${hierarchy.nameSelect},
         ${hierarchy.typeSelect},
         l.name AS lead_name,
         l.phone AS lead_phone,
         EXISTS (
           SELECT 1 FROM quotations q
           WHERE q.unit_id = u.id AND q.project_id = u.project_id
         ) AS has_any_quotation
       FROM project_units u
       ${hierarchy.join}
       ${leadJoin}
        WHERE u.project_id = $1
        AND (u.${schema.statusCol || 'status'} IS NULL OR LOWER(CAST(u.${schema.statusCol || 'status'} AS TEXT)) != 'sold')
        ${deletedFilter}
       ORDER BY ${schema.unitNumberCol ? `u.${schema.unitNumberCol}` : "u.id"} ASC`,
      [projectId],
    );

    res.json({
      count: result.rowCount,
      data: result.rows.map((row) => normalizeUnitRow(row, schema)),
    });
  } catch (error) {
    console.error("getUnitsByProjectForQuotations error:", error);
    res.status(500).json({
      error: "Failed to fetch units",
      details: error.message,
      hint:
        "Run migration/2026-05-27-project-units-quotation-columns.sql in pgAdmin to add carpet_area_sqft, super_builtup_area_sqft, and lead_id on project_units.",
    });
  }
};

export const generateQuotation = async (req, res) => {
  const {
    project_id,
    unit_id,
    template_id,
    lead_id,
    client_name,
    quotation_date,
    excluded_particular_ids,
    notes,
    status,
  } = req.body;

  if (!project_id || !unit_id || !template_id) {
    return res
      .status(400)
      .json({ error: "project_id, unit_id and template_id are required" });
  }

  const requestedStatus = status ? String(status).trim().toLowerCase() : "draft";
  if (!ALLOWED_QUOTATION_STATUS.has(requestedStatus)) {
    return res.status(400).json({ error: "Invalid quotation status" });
  }

  const tpl = await getTemplateById(template_id);
  if (!tpl) {
    return res.status(400).json({ error: "Quotation template not found" });
  }
  if (String(tpl.project_id) !== String(project_id)) {
    return res.status(400).json({ error: "Template does not belong to this project" });
  }

  const schema = await getProjectUnitsSchema();
  const deletedFilter = buildDeletedFilter(schema);

  const unitRes = await pool.query(
    `SELECT
       u.id,
       u.project_id,
       u.unit_number,
       ${sqlUnitAlias(schema.carpetCol, "carpet_area_sqft")},
       ${sqlUnitAlias(schema.superBuiltupCol, "super_builtup_area_sqft")},
       ${sqlUnitAlias(schema.priceCol, "price", "NULL::numeric")},
       ${sqlUnitAlias(schema.baseRateCol, "base_rate", "NULL::numeric")},
       ${sqlUnitAlias(schema.totalPriceCol, "total_price", "NULL::numeric")},
       ${sqlUnitAlias(schema.leadCol, "lead_id", "NULL::text")}
     FROM project_units u
     WHERE u.id = $1 AND u.project_id = $2
     ${deletedFilter}`,
    [unit_id, project_id],
  );
  if (unitRes.rowCount === 0) {
    return res.status(404).json({ error: "Unit not found" });
  }

  const unit = normalizeUnitRow(unitRes.rows[0], schema);
  const effectiveLeadId =
    lead_id === undefined || lead_id === null || lead_id === ""
      ? unit.lead_id
        ? unit.lead_id
        : null
      : String(lead_id).trim();

  const sanitizedClientName = String(client_name || "").trim();
  if (!effectiveLeadId && !sanitizedClientName) {
    return res
      .status(400)
      .json({ error: "client_name is required when no lead is assigned" });
  }

  const superBuiltup = asNumberOrNull(unit.super_builtup_area_sqft);
  const carpet = asNumberOrNull(unit.carpet_area_sqft);

  const totalArea = round2((carpet || 0) + (superBuiltup || 0));
  const ratePerUnit = resolveUnitRatePerUnit(unit);
  const basicPrice = resolveUnitBasicPrice(unit);

  const excludedSet = new Set(
    Array.isArray(excluded_particular_ids)
      ? excluded_particular_ids.map((id) => String(id))
      : [],
  );

  const computedItems = [];
  let runningTotal = basicPrice;

  // Row 1: Total Basic Price (auto)
  computedItems.push({
    id: "basic_price",
    label: "Total Basic Price",
    calculation_type: "base_auto",
    value: null,
    amount: basicPrice,
    sort_order: -1,
  });

  for (const p of tpl.particulars) {
    const isExcluded = p.is_optional && excludedSet.has(String(p.id));
    if (isExcluded) continue;

    const amount = computeParticularAmount({
      particular: p,
      basicPrice,
      totalArea,
      runningTotal,
    });
    runningTotal = round2(runningTotal + amount);

    computedItems.push({
      id: p.id,
      label: p.label,
      calculation_type: p.calculation_type,
      value: Number(p.value),
      amount,
      is_optional: p.is_optional,
      sort_order: p.sort_order,
    });
  }

  // Last Row: Grand Total (auto sum)
  computedItems.push({
    id: "grand_total",
    label: "Grand Total",
    calculation_type: "sum_auto",
    value: null,
    amount: runningTotal,
    sort_order: 999999,
  });

  const snapshot = {
    template: {
      id: tpl.id,
      template_name: tpl.template_name,
      version: tpl.version,
      has_terrace_units: tpl.has_terrace_units,
    },
    unit: {
      id: unit.id,
      unit_number: unit.unit_number,
      carpet_area_sqft: carpet,
      super_builtup_area_sqft: superBuiltup,
      price_per_unit: ratePerUnit,
      total_area: totalArea,
      basic_price: basicPrice,
    },
    items: computedItems,
    totals: {
      grand_total: runningTotal,
    },
    generated_at: new Date().toISOString(),
  };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const quotationNo = await generateQuotationNumber(
      client,
      quotation_date ? new Date(quotation_date) : new Date(),
    );

    const insert = await client.query(
      `INSERT INTO quotations (
         template_id, project_id, unit_id, lead_id,
         quotation_number, client_name, quotation_date,
         base_price, carpet_area, super_builtup_area,
         total_amount, particulars_snapshot, status, notes,
         terms_and_conditions, theme, created_at, updated_at
       ) VALUES (
         $1, $2, $3, $4,
         $5, $6, COALESCE($7::date, CURRENT_DATE),
         $8, $9, $10,
         $11, $12::jsonb, $13, $14,
         $15, $16, NOW(), NOW()
       )
       RETURNING *`,
      [
        tpl.id,
        project_id,
        unit_id,
        effectiveLeadId ? String(effectiveLeadId) : null,
        quotationNo,
        sanitizedClientName || null,
        quotation_date || null,
        basicPrice,
        carpet,
        superBuiltup,
        runningTotal,
        JSON.stringify(snapshot),
        requestedStatus,
        notes || null,
        tpl.terms_and_conditions || null,
        tpl.theme || 'gold',
      ],
    );

    await client.query("COMMIT");
    res.status(201).json({ data: insert.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("generateQuotation error:", error);
    if (error.code === "23505" && String(error.constraint || "").includes("uniq_accepted")) {
      return res
        .status(409)
        .json({ error: "An accepted quotation already exists for this unit" });
    }
    res.status(500).json({ error: "Failed to generate quotation", details: error.message });
  } finally {
    client.release();
  }
};

export const getQuotationById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT
         q.*,
         p.name AS project_name,
         u.unit_number
       FROM quotations q
       JOIN projects p ON p.id = q.project_id
       JOIN project_units u ON u.id = q.unit_id
       WHERE q.id = $1`,
      [id],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error("getQuotationById error:", error);
    res.status(500).json({ error: "Failed to fetch quotation" });
  }
};

export const getQuotationsByProject = async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await pool.query(
      `SELECT
         q.id,
         q.quotation_number,
         q.quotation_date,
         q.status,
         q.total_amount,
         q.client_name,
         q.unit_id,
         u.unit_number,
         q.lead_id,
         l.name AS lead_name,
         q.created_at
       FROM quotations q
       JOIN project_units u ON u.id = q.unit_id
       LEFT JOIN leads l ON l.id = q.lead_id
       WHERE q.project_id = $1
       ORDER BY q.created_at DESC`,
      [projectId],
    );
    res.json({ count: result.rowCount, data: result.rows });
  } catch (error) {
    console.error("getQuotationsByProject error:", error);
    res.status(500).json({ error: "Failed to fetch quotations" });
  }
};

export const generateQuotationPdf = async (req, res) => {
  const { id } = req.params;
  const { signature_type } = req.body || {};
  const signatureType = signature_type || "digital";

  try {
    const result = await pool.query(
      `SELECT q.*, 
              p.name AS project_name, p.address AS project_address, p.street AS project_street,
              p.city AS project_city, p.state AS project_state, p.country AS project_country,
              p.zip AS project_zip, p.rera_project_id, p.project_logo,
              u.unit_number
       FROM quotations q
       JOIN projects p ON p.id = q.project_id
       JOIN project_units u ON u.id = q.unit_id
       WHERE q.id = $1`,
      [id],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });

    const quotation = result.rows[0];
    const snapshot = quotation.particulars_snapshot || {};
    const items = Array.isArray(snapshot.items) ? snapshot.items : [];

    // Fetch first company profile (name, website, address, contacts)
    const companyRes = await pool.query(`SELECT * FROM companies LIMIT 1`);
    const company = companyRes.rows[0] || {};
    
    let companyAddress = null;
    let companyContact = null;
    
    if (company.id) {
      const addrRes = await pool.query(`SELECT * FROM company_addresses WHERE company_id = $1 LIMIT 1`, [company.id]);
      companyAddress = addrRes.rows[0];
      
      const contRes = await pool.query(`SELECT * FROM company_contacts WHERE company_id = $1 ORDER BY is_primary DESC, created_at ASC LIMIT 1`, [company.id]);
      companyContact = contRes.rows[0];
    }

    // Build project address strings
    const addressParts = [];
    if (quotation.project_address) addressParts.push(quotation.project_address);
    if (quotation.project_street) addressParts.push(quotation.project_street);
    if (quotation.project_city) addressParts.push(quotation.project_city);
    if (quotation.project_state) addressParts.push(quotation.project_state);
    if (quotation.project_country) addressParts.push(quotation.project_country);
    if (quotation.project_zip) addressParts.push(quotation.project_zip);

    // Fallback to company address if project has none
    if (addressParts.length === 0 && companyAddress) {
      if (companyAddress.address_line1) addressParts.push(companyAddress.address_line1);
      if (companyAddress.address_line2) addressParts.push(companyAddress.address_line2);
      if (companyAddress.city) addressParts.push(companyAddress.city);
      if (companyAddress.state) addressParts.push(companyAddress.state);
      if (companyAddress.country) addressParts.push(companyAddress.country);
      if (companyAddress.zip) addressParts.push(companyAddress.zip);
    }
    const formattedAddress = addressParts.join(", ");

    // Fetch logged-in user profile details (name, email, phone) to override footer contacts
    let loggedInUser = {};
    if (req.user && req.user.id) {
      try {
        const userRes = await pool.query(`SELECT name, email, phone FROM users WHERE id = $1`, [req.user.id]);
        if (userRes.rowCount > 0) {
          loggedInUser = userRes.rows[0];
        }
      } catch (userErr) {
        console.warn("Could not fetch logged-in user for contacts:", userErr.message);
      }
    }

    const contactPhone = loggedInUser.phone || companyContact?.phone || "";
    const contactEmail = loggedInUser.email || companyContact?.email || "";
    const companyWebsite = company?.website_url || "";

    const letterheadPath = getLetterheadPdfPath();
    let outDoc;
    let page;

    if (fs.existsSync(letterheadPath)) {
      const baseDoc = await PDFDocument.load(fs.readFileSync(letterheadPath));
      outDoc = await PDFDocument.create();
      [page] = await outDoc.copyPages(baseDoc, [0]);
      outDoc.addPage(page);
    } else {
      outDoc = await PDFDocument.create();
      page = outDoc.addPage([595.28, 841.89]);
      console.warn(
        `Letterhead PDF not found at ${letterheadPath}; generating plain PDF`,
      );
    }

    const { width: pageWidth, height: pageHeight } = page.getSize();
    const fontRegular = await outDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await outDoc.embedFont(StandardFonts.HelveticaBold);

    const marginX = 35;
    const topStart = 35;
    const lineGap = 14;
    const tableWidth = pageWidth - marginX * 2;

    const yFromTop = (yTop) => pageHeight - yTop;

    // Dynamic Color Schemes supporting 4 distinct themes
    const THEMES = {
      gold: {
        headerBlue: rgb(0.11, 0.16, 0.24), // #1c2a3d Dark slate blue
        goldColor: rgb(0.79, 0.60, 0.18),  // #c9992f Gold
        goldLight: rgb(0.90, 0.78, 0.47),  // #e6c778 Light Gold
        accentGold: rgb(0.66, 0.46, 0.16), // #a9762a Accent Gold
        borderGrey: rgb(0.93, 0.91, 0.85), // #ece7d9 Card Border
        rowZebra: rgb(0.98, 0.98, 0.96),   // Even row light beige
        textGrey: rgb(0.42, 0.45, 0.50),   // #6b7280
        textBlack: rgb(0.13, 0.14, 0.17),  // #20242b
      },
      indigo: {
        headerBlue: rgb(0.12, 0.11, 0.29), // #1e1b4b Dark indigo
        goldColor: rgb(0.39, 0.40, 0.95),  // #6366f1 Indigo Accent
        goldLight: rgb(0.64, 0.66, 0.98),  // #a5b4fc Light Indigo
        accentGold: rgb(0.31, 0.27, 0.70), // #4f46e5 Darker Indigo Accent
        borderGrey: rgb(0.88, 0.90, 0.96), // Light blue-grey border
        rowZebra: rgb(0.95, 0.96, 0.99),   // Even row light indigo tint
        textGrey: rgb(0.40, 0.43, 0.50),
        textBlack: rgb(0.10, 0.11, 0.15),
      },
      emerald: {
        headerBlue: rgb(0.02, 0.16, 0.12), // #064e3b Deep Emerald
        goldColor: rgb(0.02, 0.59, 0.41),  // #059669 Emerald Accent
        goldLight: rgb(0.43, 0.82, 0.67),  // #6ee7b7 Light Emerald
        accentGold: rgb(0.04, 0.47, 0.33), // #047857 Darker Emerald
        borderGrey: rgb(0.86, 0.92, 0.89), // Light green-grey border
        rowZebra: rgb(0.95, 0.98, 0.96),   // Even row light emerald tint
        textGrey: rgb(0.38, 0.45, 0.41),
        textBlack: rgb(0.08, 0.12, 0.10),
      },
      orange: {
        headerBlue: rgb(0.27, 0.10, 0.01), // #451a03 Warm Dark Brown / Terracotta
        goldColor: rgb(0.85, 0.47, 0.02),  // #d97706 Amber / Orange
        goldLight: rgb(0.99, 0.76, 0.39),  // #fcd34d Light Amber
        accentGold: rgb(0.71, 0.34, 0.02), // #b45309 Accent Amber
        borderGrey: rgb(0.94, 0.90, 0.84), // Light brown-grey border
        rowZebra: rgb(0.99, 0.97, 0.94),   // Even row warm tint
        textGrey: rgb(0.46, 0.42, 0.38),
        textBlack: rgb(0.15, 0.12, 0.10),
      }
    };

    const activeThemeKey = String(quotation.theme || "gold").toLowerCase();
    const activeTheme = THEMES[activeThemeKey] || THEMES.gold;
    const { headerBlue, goldColor, goldLight, accentGold, borderGrey, rowZebra, textGrey, textBlack } = activeTheme;
    const bgLight = rgb(1, 1, 1);             // Plain white background

    const drawText = (text, x, yTop, size = 10, bold = false, colorVal = rgb(0, 0, 0)) => {
      page.drawText(String(text || ""), {
        x,
        y: yFromTop(yTop),
        size,
        font: bold ? fontBold : fontRegular,
        color: colorVal,
      });
    };

    const drawLabelValue = (label, value, x, yTop, bold = false, colorVal = rgb(0, 0, 0)) => {
      drawText(`${label}: ${value}`, x, yTop, 10, bold, colorVal);
    };

    // Draw Watermark (Project Logo or Text Fallback)
    let hasWatermark = false;
    if (quotation.project_logo) {
      const logoPath = path.join(PROJECT_MEDIA_DIR, quotation.project_logo);
      if (fs.existsSync(logoPath)) {
        try {
          let watermarkImage;
          const fileBytes = fs.readFileSync(logoPath);
          if (logoPath.toLowerCase().endsWith(".png")) {
            watermarkImage = await outDoc.embedPng(fileBytes);
          } else if (logoPath.toLowerCase().endsWith(".jpg") || logoPath.toLowerCase().endsWith(".jpeg")) {
            watermarkImage = await outDoc.embedJpg(fileBytes);
          } else if (logoPath.toLowerCase().endsWith(".svg")) {
            const resvg = new Resvg(fileBytes, { fitTo: { mode: "width", value: 300 } });
            const pngBuffer = resvg.render().asPng();
            watermarkImage = await outDoc.embedPng(pngBuffer);
          }
          
          if (watermarkImage) {
            hasWatermark = true;
            const { width: imgW, height: imgH } = watermarkImage.scale(1.0);
            const maxW = 60;
            const maxH = 60;
            const scale = Math.min(maxW / imgW, maxH / imgH, 1.0);
            const w = imgW * scale;
            const h = imgH * scale;
            
            // Draw a staggered tiled grid of watermarks across the page
            const cols = 5;
            const rows = 7;
            const colSpacing = pageWidth / cols;
            const rowSpacing = pageHeight / rows;

            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                // Offset alternate rows for staggered grid pattern
                const shiftX = (r % 2 === 0) ? 0 : colSpacing / 2;
                const targetX = c * colSpacing + shiftX - w / 2;
                const targetY = r * rowSpacing + rowSpacing / 2 - h / 2;

                // Draw if within horizontal/vertical safety padding
                if (targetX > 10 && targetX < pageWidth - w - 10 &&
                    targetY > 60 && targetY < pageHeight - h - 40) {
                  page.drawImage(watermarkImage, {
                    x: targetX,
                    y: targetY,
                    width: w,
                    height: h,
                    opacity: 0.08,
                    rotate: degrees(35),
                  });
                }
              }
            }
          }
        } catch (logoErr) {
          console.warn("Could not embed project logo watermark:", logoErr.message);
        }
      }
    }

    if (!hasWatermark) {
      const fallbackText = String(quotation.project_name || company.name || "shyam Group");
      const htmlRows = [20, 160, 300, 440, 580, 720, 860, 1000, 1140];
      const htmlCols = [-40, 110, 260, 410, 560, 710];
      const scaleX = pageWidth / 794;
      const scaleY = pageHeight / 1123;
      const watermarkColor = rgb(0.77, 0.61, 0.29); // #c49b4a

      for (const ry of htmlRows) {
        for (const cx of htmlCols) {
          const targetX = cx * scaleX;
          const targetY = ry * scaleY;

          if (targetY > 40 && targetY < pageHeight - 50) {
            page.drawText(fallbackText, {
              x: targetX,
              y: yFromTop(targetY),
              size: 8.5,
              font: fontRegular,
              color: watermarkColor,
              rotate: degrees(35),
              opacity: 0.16,
            });
          }
        }
      }
    }

    // Embed Project Logo for header
    let logoImage = null;
    let logoW = 0;
    let logoH = 36;

    if (quotation.project_logo) {
      const logoPath = path.join(PROJECT_MEDIA_DIR, quotation.project_logo);
      if (fs.existsSync(logoPath)) {
        try {
          const fileBytes = fs.readFileSync(logoPath);
          if (logoPath.toLowerCase().endsWith(".png")) {
            logoImage = await outDoc.embedPng(fileBytes);
          } else if (logoPath.toLowerCase().endsWith(".jpg") || logoPath.toLowerCase().endsWith(".jpeg")) {
            logoImage = await outDoc.embedJpg(fileBytes);
          } else if (logoPath.toLowerCase().endsWith(".svg")) {
            const resvg = new Resvg(fileBytes, { fitTo: { mode: "width", value: 300 } });
            const pngBuffer = resvg.render().asPng();
            logoImage = await outDoc.embedPng(pngBuffer);
          }
          if (logoImage) {
            const { width: imgW, height: imgH } = logoImage.scale(1.0);
            const maxW = 160;
            const maxH = 65;
            const scale = Math.min(maxW / imgW, maxH / imgH, 1.0);
            logoW = imgW * scale;
            logoH = imgH * scale;
          }
        } catch (logoErr) {
          console.warn("Could not embed logo image:", logoErr.message);
        }
      }
    }

    // Draw Brand Logo (left)
    if (logoImage) {
      page.drawImage(logoImage, {
        x: marginX,
        y: yFromTop(topStart + logoH),
        width: logoW,
        height: logoH,
      });
    } else {
      // Fallback: draw circular brand mark and text
      page.drawCircle({
        x: marginX + 23,
        y: yFromTop(topStart + 23),
        size: 23,
        color: goldColor,
      });
      // S in circle
      page.drawText("S", {
        x: marginX + 16,
        y: yFromTop(topStart + 31),
        size: 22,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
      // shyam Group text
      page.drawText("shyam", {
        x: marginX + 56,
        y: yFromTop(topStart + 22),
        size: 27,
        font: fontBold,
        color: rgb(0.75, 0.54, 0.18),
      });
      page.drawText("GROUP", {
        x: marginX + 58,
        y: yFromTop(topStart + 38),
        size: 9,
        font: fontRegular,
        color: textGrey,
      });
    }

    // Quotation right side details
    const rightX = pageWidth - marginX - 180;
    page.drawText("QUOTATION", {
      x: pageWidth - marginX - fontBold.widthOfTextAtSize("QUOTATION", 24),
      y: yFromTop(topStart + 22),
      size: 24,
      font: fontBold,
      color: headerBlue,
    });
    
    // Draw No and Date detail strings
    const noPrefix = "No: ";
    const noVal = quotation.quotation_number || "-";
    const datePrefix = "  •  Date: ";
    const dateVal = formatDateYYYYMMDD(quotation.quotation_date);
    
    const wPrefix1 = fontRegular.widthOfTextAtSize(noPrefix, 9.5);
    const wVal1 = fontBold.widthOfTextAtSize(noVal, 9.5);
    const wPrefix2 = fontRegular.widthOfTextAtSize(datePrefix, 9.5);
    const wVal2 = fontBold.widthOfTextAtSize(dateVal, 9.5);
    const totalMetaW = wPrefix1 + wVal1 + wPrefix2 + wVal2;
    
    let curMetaX = pageWidth - marginX - totalMetaW;
    page.drawText(noPrefix, { x: curMetaX, y: yFromTop(topStart + 38), size: 9.5, font: fontRegular, color: textGrey });
    curMetaX += wPrefix1;
    page.drawText(noVal, { x: curMetaX, y: yFromTop(topStart + 38), size: 9.5, font: fontBold, color: textBlack });
    curMetaX += wVal1;
    page.drawText(datePrefix, { x: curMetaX, y: yFromTop(topStart + 38), size: 9.5, font: fontRegular, color: textGrey });
    curMetaX += wPrefix2;
    page.drawText(dateVal, { x: curMetaX, y: yFromTop(topStart + 38), size: 9.5, font: fontBold, color: textBlack });

    // Gold Divider line (placed 45pt below bottom of logo to clear any padding)
    const dividerY = topStart + logoH + 45;
    page.drawLine({
      start: { x: marginX, y: yFromTop(dividerY) },
      end: { x: pageWidth - marginX, y: yFromTop(dividerY) },
      color: goldColor,
      thickness: 3,
    });

    // Project Strip (spaced out to avoid stickiness)
    const subHeaderY = dividerY + 22;
    drawText(quotation.project_name || company.name || "Shyam 242", marginX, subHeaderY, 16, true, headerBlue);
    drawText("Premium Residential Projects, Ahmedabad, Gujarat", marginX, subHeaderY + 16, 11, false, textGrey);

    const rightTextStr = "Prepared by Authorized Sales Team";
    const rightTextX = pageWidth - marginX - fontRegular.widthOfTextAtSize(rightTextStr, 11);
    drawText(rightTextStr, rightTextX, subHeaderY + 8, 11, false, textGrey);

    // Border line below Project Strip
    page.drawLine({
      start: { x: marginX, y: yFromTop(dividerY + 54) },
      end: { x: pageWidth - marginX, y: yFromTop(dividerY + 54) },
      color: borderGrey,
      thickness: 1,
    });

    let y = dividerY + 66;
    const cardW = 244;
    const cardH = 65;

    const carpetArea = Number(quotation.carpet_area);
    const superArea = Number(quotation.super_builtup_area);
    const rateVal = snapshot?.unit?.price_per_unit ?? 0;

    // Draw Card 1: Client Details
    page.drawRectangle({
      x: marginX,
      y: yFromTop(y + cardH),
      width: cardW,
      height: cardH,
      color: bgLight,
      borderColor: borderGrey,
      borderWidth: 1,
    });
    // Accent rule bar on left side of card
    page.drawRectangle({
      x: marginX,
      y: yFromTop(y + cardH - 12),
      width: 3,
      height: cardH - 24,
      color: goldColor,
    });
    drawText("CLIENT DETAILS", marginX + 15, y + 14, 8.5, true, accentGold);
    
    // Customer row
    drawText("Customer Name", marginX + 15, y + 32, 10, false, textGrey);
    const custVal = quotation.client_name || "-";
    const custValW = fontBold.widthOfTextAtSize(custVal, 10);
    drawText(custVal, marginX + cardW - 15 - custValW, y + 32, 10, true, headerBlue);

    // Unit No. row
    drawText("Unit No.", marginX + 15, y + 48, 10, false, textGrey);
    const unitVal = quotation.unit_number || "-";
    const unitValW = fontBold.widthOfTextAtSize(unitVal, 10);
    drawText(unitVal, marginX + cardW - 15 - unitValW, y + 48, 10, true, headerBlue);


    // Draw Card 2: Property Details
    const card2X = pageWidth - marginX - cardW;
    page.drawRectangle({
      x: card2X,
      y: yFromTop(y + cardH),
      width: cardW,
      height: cardH,
      color: bgLight,
      borderColor: borderGrey,
      borderWidth: 1,
    });
    // Accent rule bar on left side of card
    page.drawRectangle({
      x: card2X,
      y: yFromTop(y + cardH - 12),
      width: 3,
      height: cardH - 24,
      color: goldColor,
    });
    drawText("PROPERTY DETAILS", card2X + 15, y + 14, 8.5, true, accentGold);

    // Carpet Area row
    drawText("Carpet Area", card2X + 15, y + 32, 10, false, textGrey);
    const areaValStr = carpetArea > 0 ? `${carpetArea} Sq.ft` : (superArea > 0 ? `${superArea} Sq.ft` : "-");
    const areaValW = fontBold.widthOfTextAtSize(areaValStr, 10);
    drawText(areaValStr, card2X + cardW - 15 - areaValW, y + 32, 10, true, headerBlue);

    // Rate row
    drawText("Rate", card2X + 15, y + 48, 10, false, textGrey);
    const rateValStr = `${formatMoneyINR(rateVal)} / Sq.ft`;
    const rateValW = fontBold.widthOfTextAtSize(rateValStr, 10);
    drawText(rateValStr, card2X + cardW - 15 - rateValW, y + 48, 10, true, headerBlue);

    y += cardH + 18;

    // Investment Breakup Section Heading
    page.drawText("Investment Breakup", {
      x: marginX,
      y: yFromTop(y + 13.5),
      size: 12,
      font: fontBold,
      color: headerBlue,
    });

    // Horizontal line extending from heading
    const textW = fontBold.widthOfTextAtSize("Investment Breakup", 12);
    page.drawLine({
      start: { x: marginX + textW + 12, y: yFromTop(y + 10) },
      end: { x: pageWidth - marginX, y: yFromTop(y + 10) },
      color: borderGrey,
      thickness: 1,
    });

    y += 30;

    // Table settings
    const colSl = 34;
    const colAmt = 120;
    const colDesc = tableWidth - colSl - colAmt;
    const headerH = 22;
    const rowH = 24;

    const drawHeaderCell = (text, x, yTop, w, alignRight = false) => {
      const s = String(text ?? "");
      const tx = alignRight
        ? x + w - fontBold.widthOfTextAtSize(s, 8.5)
        : x;
      page.drawText(s, {
        x: tx,
        y: yFromTop(yTop + 14),
        size: 8.5,
        font: fontBold,
        color: accentGold,
      });
    };

    drawHeaderCell("#", marginX, y, colSl);
    drawHeaderCell("Particular", marginX + colSl, y, colDesc);
    drawHeaderCell("Amount (INR)", marginX + colSl + colDesc, y, colAmt, true);
    y += headerH;

    // Line below header (2px goldColor)
    page.drawLine({
      start: { x: marginX, y: yFromTop(y) },
      end: { x: pageWidth - marginX, y: yFromTop(y) },
      color: goldColor,
      thickness: 2,
    });

    // Filter out redundant Basic Price and Grand Total rows
    const filteredItems = items.filter(
      (it) => it.id !== "basic_price" && it.id !== "grand_total" &&
              it.label !== "Total Basic Price" && it.label !== "Grand Total"
    );

    const rows = filteredItems.map((it, idx) => {
      const amount = it?.amount ?? it?.total_amount ?? it?.total ?? 0;
      const paddedSl = String(idx + 1).padStart(2, "0");
      return {
        sl: paddedSl,
        desc: String(it?.label || "-"),
        amt: `${formatMoneyINR(Number(amount || 0))}`,
      };
    });

    let rowIndex = 0;
    for (const r of rows) {
      if (y + rowH > pageHeight - 160) break;
      
      // Even row light beige striping
      if (rowIndex % 2 === 1) {
        page.drawRectangle({
          x: marginX,
          y: yFromTop(y + rowH),
          width: tableWidth,
          height: rowH,
          color: rowZebra,
        });
      }

      // Sl number (gold bold)
      page.drawText(r.sl, {
        x: marginX,
        y: yFromTop(y + 16),
        size: 9,
        font: fontBold,
        color: goldColor,
      });

      // Particular label (dark blue normal)
      page.drawText(r.desc, {
        x: marginX + colSl,
        y: yFromTop(y + 16),
        size: 9,
        font: fontRegular,
        color: textBlack,
      });

      // Amount (dark blue bold)
      const valW = fontBold.widthOfTextAtSize(r.amt, 9);
      page.drawText(r.amt, {
        x: pageWidth - marginX - valW,
        y: yFromTop(y + 16),
        size: 9,
        font: fontBold,
        color: headerBlue,
      });

      y += rowH;

      // Divider line below row
      page.drawLine({
        start: { x: marginX, y: yFromTop(y) },
        end: { x: pageWidth - marginX, y: yFromTop(y) },
        color: rgb(0.95, 0.93, 0.88),
        thickness: 0.75,
      });
      
      rowIndex++;
    }

    const grandTotal = snapshot?.totals?.grand_total ?? quotation.total_amount ?? 0;
    y += 12;

    // Draw Grand Total Box
    page.drawRectangle({
      x: marginX,
      y: yFromTop(y + 45),
      width: tableWidth,
      height: 45,
      color: headerBlue,
      borderRadius: 6,
    });
    
    // Right accent bar in gold
    page.drawRectangle({
      x: pageWidth - marginX - 5,
      y: yFromTop(y + 45),
      width: 5,
      height: 45,
      color: goldColor,
    });
    
    // Grand Total Left
    page.drawText("Grand Total (INR)", {
      x: marginX + 20,
      y: yFromTop(y + 26),
      size: 9.5,
      font: fontBold,
      color: rgb(0.81, 0.84, 0.88),
    });
    
    // Grand Total Right
    const totalValStr = `${formatMoneyINR(grandTotal)}`;
    const totalValStrW = fontBold.widthOfTextAtSize(totalValStr, 18);
    page.drawText(totalValStr, {
      x: pageWidth - marginX - 20 - totalValStrW,
      y: yFromTop(y + 30),
      size: 18,
      font: fontBold,
      color: goldLight,
    });

    y += 65;

    // Dynamic Terms and Conditions Section
    page.drawText("Terms & Conditions", {
      x: marginX,
      y: yFromTop(y),
      size: 9,
      font: fontBold,
      color: accentGold,
    });
    y += 14;

    const rawTerms = convertHtmlToPlaintext(quotation.terms_and_conditions || "This quotation is valid for 30 days from the date of issue. Taxes and statutory charges are as applicable.");
    const termsLines = String(rawTerms).split("\n");
    for (const line of termsLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Basic wrapping
      const maxCharsPerLine = 95;
      for (let i = 0; i < trimmed.length; i += maxCharsPerLine) {
        if (y + 12 > pageHeight - 95) break;
        const chunk = trimmed.slice(i, i + maxCharsPerLine);
        drawText(chunk, marginX, y, 8.5, false, textGrey);
        y += 12;
      }
      y += 4;
    }

    // Signature Area
    y += 50;
    if (signatureType === "digital") {
      drawText("Note: This is a computer generated document, no signature required.", marginX, y, 8.5, false, textGrey);
    } else {
      const sigLineW = 160;
      const sigLineX = pageWidth - marginX - sigLineW;
      page.drawLine({
        start: { x: sigLineX, y: yFromTop(y + 25) },
        end: { x: pageWidth - marginX, y: yFromTop(y + 25) },
        color: goldColor,
        thickness: 0.75,
      });
      const sigText = "Authorized Signatory";
      const sigTextW = fontBold.widthOfTextAtSize(sigText, 9);
      const sigTextX = sigLineX + (sigLineW - sigTextW) / 2;
      drawText(sigText, sigTextX, y + 36, 9, true, headerBlue);
    }

    // Footer Details Band (Moved up to avoid cutting off)
    const footerLineY = pageHeight - 95;
    page.drawLine({
      start: { x: marginX, y: yFromTop(footerLineY) },
      end: { x: pageWidth - marginX, y: yFromTop(footerLineY) },
      color: borderGrey,
      thickness: 1.2,
      opacity: 0.8,
    });

    const footerText1 = `Project: ${quotation.project_name || "Real Estate"}  |  Address: ${formattedAddress || "N/A"}  |  RERA No: ${quotation.rera_project_id || "N/A"}`;
    const footerText2 = `Contact Phone: ${contactPhone || "N/A"}  |  Contact Email: ${contactEmail || "N/A"}`;

    page.drawText(footerText1, {
      x: marginX,
      y: yFromTop(footerLineY + 15),
      size: 7.5,
      font: fontRegular,
      color: textGrey,
    });

    page.drawText(footerText2, {
      x: marginX,
      y: yFromTop(footerLineY + 26),
      size: 7.5,
      font: fontRegular,
      color: textGrey,
    });

    // Right brand text
    const brandText = "SHYAM GROUP";
    const brandTextW = fontBold.widthOfTextAtSize(brandText, 8.5);
    page.drawText(brandText, {
      x: pageWidth - marginX - brandTextW,
      y: yFromTop(footerLineY + 20),
      size: 8.5,
      font: fontBold,
      color: goldColor,
    });

    const buffer = Buffer.from(await outDoc.save());

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${quotation.quotation_number || "quotation"}.pdf"`,
    );
    res.send(buffer);
  } catch (error) {
    console.error("generateQuotationPdf error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};

