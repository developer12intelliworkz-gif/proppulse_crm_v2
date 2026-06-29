import pool from "../../database/config.js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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
    `SELECT id, project_id, template_name, version, is_active, has_terrace_units, created_at, updated_at
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
    `SELECT id, project_id, template_name, version, is_active, has_terrace_units, created_at, updated_at
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

    res.json({ data: result.rows });
  } catch (error) {
    console.error("getProjectsWithQuotationStatus error:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

export const upsertQuotationTemplate = async (req, res) => {
  const { project_id, template_name, is_active, has_terrace_units, particulars } = req.body;

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
         project_id, template_name, version, is_active, has_terrace_units, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [
        project_id,
        String(template_name).trim(),
        nextVersion,
        willBeActive,
        !!has_terrace_units,
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
         created_at, updated_at
       ) VALUES (
         $1, $2, $3, $4,
         $5, $6, COALESCE($7::date, CURRENT_DATE),
         $8, $9, $10,
         $11, $12::jsonb, $13, $14,
         NOW(), NOW()
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
  try {
    const result = await pool.query(
      `SELECT q.*, p.name AS project_name, u.unit_number
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

    const marginX = 60;
    const topStart = fs.existsSync(letterheadPath) ? 150 : 72;
    const lineGap = 14;
    const tableWidth = pageWidth - marginX * 2;

    const yFromTop = (yTop) => pageHeight - yTop;

    const drawText = (text, x, yTop, size = 10, bold = false) => {
      page.drawText(String(text || ""), {
        x,
        y: yFromTop(yTop),
        size,
        font: bold ? fontBold : fontRegular,
        color: rgb(0, 0, 0),
      });
    };

    const drawLabelValue = (label, value, x, yTop, bold = false) => {
      drawText(`${label}: ${value}`, x, yTop, 10, bold);
    };

    // Meta (top-right)
    drawLabelValue(
      "Quotation No.",
      quotation.quotation_number || "-",
      pageWidth - marginX - 240,
      topStart,
    );
    drawLabelValue(
      "Date",
      formatDateYYYYMMDD(quotation.quotation_date),
      pageWidth - marginX - 240,
      topStart + lineGap,
    );

    let y = topStart + 14;
    const leftX = marginX;

    drawText("Client Details", leftX, y, 11, true);
    y += 18;
    drawLabelValue("Name", quotation.client_name || "-", leftX, y);
    y += lineGap;
    drawLabelValue("Project", quotation.project_name || "-", leftX, y);
    y += lineGap;
    drawLabelValue("Unit", quotation.unit_number || "-", leftX, y);

    y += 26;
    drawText("Unit & Pricing Summary", leftX, y, 11, true);
    y += 18;
    const totalArea = snapshot?.unit?.total_area ?? "-";
    const rate = snapshot?.unit?.price_per_unit ?? 0;
    const basicPrice = snapshot?.unit?.basic_price ?? quotation.base_price ?? 0;
    drawLabelValue("Carpet Area", quotation.carpet_area ?? "-", leftX, y);
    y += lineGap;
    drawLabelValue("Super Built-up Area", quotation.super_builtup_area ?? "-", leftX, y);
    y += lineGap;
    drawLabelValue("Total Area (Super Built-up or Carpet)", totalArea, leftX, y);
    y += lineGap;
    drawLabelValue("Rate (per unit)", `INR ${formatMoneyINR(rate)}`, leftX, y);
    y += lineGap;
    drawLabelValue(
      "Total Basic Price",
      `INR ${formatMoneyINR(basicPrice)}`,
      leftX,
      y,
      true,
    );

    // Requested heading above table
    y += 30;
    drawText("Cost Breakdown", leftX, y, 11, true);
    y += 14;

    // Table header + rows (simple single-page table)
    const colSl = 45;
    const colAmt = 150;
    const colDesc = tableWidth - colSl - colAmt;
    const headerH = 18;
    const rowH = 18;

    const drawRect = (x, yTop, w, h, fill = null) => {
      page.drawRectangle({
        x,
        y: yFromTop(yTop) - h,
        width: w,
        height: h,
        color: fill || undefined,
        borderColor: rgb(0.86, 0.86, 0.86),
        borderWidth: 1,
      });
    };

    const drawCell = (text, x, yTop, w, alignRight = false, bold = false) => {
      const padding = 6;
      const s = String(text ?? "");
      const clipped = s.length > 70 ? `${s.slice(0, 69)}…` : s;
      const tx = alignRight
        ? x + w - padding - clipped.length * 5.2
        : x + padding;
      page.drawText(clipped, {
        x: Math.max(x + padding, tx),
        y: yFromTop(yTop) - 13,
        size: 9.5,
        font: bold ? fontBold : fontRegular,
        color: rgb(0, 0, 0),
      });
    };

    drawRect(leftX, y, tableWidth, headerH, rgb(0.96, 0.96, 0.96));
    drawCell("Sl. No.", leftX, y, colSl, false, true);
    drawCell("Particular Description", leftX + colSl, y, colDesc, false, true);
    drawCell("Amount (INR)", leftX + colSl + colDesc, y, colAmt, true, true);
    y += headerH;

    const rows = items.map((it, idx) => {
      const amount = it?.amount ?? it?.total_amount ?? it?.total ?? 0;
      return {
        sl: idx + 1,
        desc: String(it?.label || "-"),
        amt: `INR ${formatMoneyINR(Number(amount || 0))}`,
      };
    });

    for (const r of rows) {
      if (y + rowH > pageHeight - 140) break;
      drawRect(leftX, y, tableWidth, rowH);
      drawCell(String(r.sl), leftX, y, colSl);
      drawCell(r.desc, leftX + colSl, y, colDesc);
      drawCell(r.amt, leftX + colSl + colDesc, y, colAmt, true);
      y += rowH;
    }

    const grandTotal = snapshot?.totals?.grand_total ?? quotation.total_amount ?? 0;
    y += 18;
    drawText(`Grand Total: INR ${formatMoneyINR(grandTotal)}`, pageWidth - marginX - 240, y, 11, true);

    y += 26;
    drawText(
      "Terms: This quotation is valid for 30 days from the date of issue. Taxes and statutory charges are as applicable.",
      leftX,
      y,
      8.5,
      false,
    );
    drawText("Authorized Signatory", pageWidth - marginX - 160, y + 55, 9, false);

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

