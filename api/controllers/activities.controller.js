// controllers/activities.controller.js

import pool from "../../database/config.js";
import {
  validateFollowUpDisposition,
  applyDispositionToLead,
  dispositionClosesLead,
} from "../utils/followUpDisposition.js";
import {
  normalizeActivityDate,
  SQL_ACTIVITY_DATE,
  todayInTimeZone,
} from "../utils/formatDate.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Correct backend path: api/public/documents/lead
const uploadPath = path.join(process.cwd(), "public", "documents", "lead");

// Ensure directory exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer config with unique filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const uniqueName = `${base}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// ========================
// GET ACTIVITY HISTORY
// ========================
export const getActivityHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const leadResult = await pool.query(
      `SELECT interested_project_id, address FROM public.leads WHERE id = $1`,
      [id]
    );
    const lead = leadResult.rows[0] || {};

    const activityResult = await pool.query(
      `SELECT id, type, description, ${SQL_ACTIVITY_DATE} AS date, time, agent, details
       FROM public.lead_activities
       WHERE lead_id = $1 AND deleted_at IS NULL
       ORDER BY date DESC, time DESC`,
      [id]
    );

    const documentResult = await pool.query(
      `SELECT id, name, type, document_pdf
       FROM public.lead_documents
       WHERE lead_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [id]
    );

    const now = new Date();
    const currentDateTime = now.toISOString().slice(0, 16);
    const endsOn = new Date(now.getTime() + 15 * 60000)
      .toISOString()
      .slice(0, 16);
    const followupScheduleOn = new Date(now.getTime() + 30 * 60000)
      .toISOString()
      .slice(0, 16);
    const followupTime = followupScheduleOn.slice(11, 16);
    const followupDate = new Date(now.getTime() + 24 * 60 * 60000)
      .toISOString()
      .slice(0, 10);

    let leadsTimezone = "asiakolkata";
    if (lead.address?.toLowerCase().includes("kolkata"))
      leadsTimezone = "asiakolkata";
    else if (lead.address?.toLowerCase().includes("paris"))
      leadsTimezone = "europeparis";
    else if (lead.address?.toLowerCase().includes("pst"))
      leadsTimezone = "uspst";

    let project = "selectproject";
    if (lead.interested_project_id)
      project = `project${lead.interested_project_id}`;

    const forms = {
      note: { notes: "" },
      documents: {
        documents: documentResult.rows.map((doc) => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          document_pdf: doc.document_pdf, // This is the actual stored filename
          document_name: doc.document_pdf, // Original name for display
        })),
      },
      sitevisit: {
        project,
        siteVisitType: "selecttype",
        leadsTimezone,
        teams: "selectteam",
        scheduleOn: currentDateTime,
        endsOn,
        siteVisitConfirmation: "true",
        channelPartner: "selectpartner",
        agenda: "",
        scheduleFollowup: followupScheduleOn,
        status: "scheduled",
      },
      followup: {
        scheduleOn: followupScheduleOn,
        leadsTimezone,
        followupType: "call",
        time: followupTime,
        subject: "",
        agenda: "",
        followupDate,
        status: "scheduled",
      },
      call: { description: "", date: "", time: "", agent: "" },
      sms: { description: "", date: "", time: "", agent: "" },
      wa: { description: "", date: "", time: "", agent: "" },
      offlinecall: { description: "", date: "", time: "", agent: "" },
      reassignlead: { description: "", date: "", time: "", agent: "" },
      conductedsitevisit: { description: "", date: "", time: "", agent: "" },
    };

    // Populate latest values
    const latestNote = activityResult.rows.find((a) => a.type === "note");
    if (latestNote?.description) forms.note.notes = latestNote.description;

    const latestSiteVisit = activityResult.rows.find(
      (a) => a.type === "sitevisit"
    );
    if (latestSiteVisit?.details)
      Object.assign(forms.sitevisit, latestSiteVisit.details);

    const latestFollowup = activityResult.rows.find(
      (a) => a.type === "followup"
    );
    if (latestFollowup?.details)
      Object.assign(forms.followup, latestFollowup.details);

    [
      "call",
      "sms",
      "wa",
      "offlinecall",
      "reassignlead",
      "conductedsitevisit",
    ].forEach((type) => {
      const latest = activityResult.rows.find((a) => a.type === type);
      if (latest) {
        forms[type] = {
          description: latest.description || "",
          date: latest.date || "",
          time: latest.time?.toString().substring(0, 5) || "",
          agent: latest.agent || "",
        };
      }
    });

    if (latestSiteVisit?.details?.scheduleFollowup) {
      forms.followup.scheduleOn = latestSiteVisit.details.scheduleFollowup;
      forms.followup.time = latestSiteVisit.details.scheduleFollowup.slice(
        11,
        16
      );
    }

    res.json({
      lead_id: parseInt(id),
      activities: activityResult.rows.map((row) => ({
        id: row.id,
        type: row.type,
        description: row.description,
        date: row.date || null,
        time: row.time ? row.time.toString().substring(0, 5) : null,
        agent: row.agent,
        details: row.details || {},
      })),
      forms,
    });
  } catch (error) {
    console.error("Error fetching activity history:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const addActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, description, date, time, agent } = req.body;
    const details =
      req.body.details && typeof req.body.details === "object"
        ? { ...req.body.details }
        : {};
    if (
      !type ||
      ![
        "note",
        "call",
        "sms",
        "wa",
        "sitevisit",
        "followup",
        "offlinecall",
        "reassignlead",
        "conductedsitevisit",
      ].includes(type)
    ) {
      return res.status(400).json({ error: "Valid activity type is required" });
    }
    const leadCheck = await pool.query(
      "SELECT 1 FROM public.leads WHERE id = $1 AND is_active = TRUE",
      [id]
    );
    if (leadCheck.rows.length === 0) {
      return res.status(404).json({ error: "Lead not found or inactive" });
    }
    if (type === "sitevisit") {
      if (
        !details?.project ||
        details.project === "selectproject" ||
        !details?.siteVisitType ||
        details.siteVisitType === "selecttype" ||
        !details?.scheduleOn
      ) {
        return res
          .status(400)
          .json({ error: "Required fields missing for site visit" });
      }
      if (!details.endsOn) details.endsOn = details.scheduleOn;
      if (!details.status) details.status = "scheduled";
      if (details.agenda === undefined) details.agenda = "";
    } else if (type === "followup") {
      if (!details?.followupType) {
        return res.status(400).json({ error: "Follow-up type is required" });
      }
      const dispositionCheck = validateFollowUpDisposition(details);
      if (!dispositionCheck.valid) {
        return res.status(400).json({ error: dispositionCheck.error });
      }
      details.disposition = dispositionCheck.disposition;
      if (!details.scheduleOn) {
        details.scheduleOn = `${todayInTimeZone()}T10:00`;
      }
      if (!details.status) details.status = "completed";
      details.completed = true;
      details.completedAt = new Date().toISOString();
      if (details.subject === undefined) details.subject = "";
      if (details.agenda === undefined) details.agenda = "";
    } else if (type === "note") {
      if (!description) {
        return res
          .status(400)
          .json({ error: "Notes are required for note activity" });
      }
    } else if (
      [
        "call",
        "sms",
        "wa",
        "offlinecall",
        "reassignlead",
        "conductedsitevisit",
      ].includes(type)
    ) {
      if (!description) {
        return res.status(400).json({ error: "Description is required" });
      }
    }
    let finalDescription = description;
    if (type === "sitevisit" && !description) {
      finalDescription = `Site visit for ${details.project}: ${details.agenda}`;
    } else if (type === "followup" && !description) {
      finalDescription = `${details.followupType} follow-up: ${details.subject}`;
    }

    let activityDate = normalizeActivityDate(date);
    if (!activityDate && (type === "note" || type === "followup")) {
      activityDate = todayInTimeZone();
    }

    const result = await pool.query(
      `INSERT INTO public.lead_activities (lead_id, type, description, date, time, agent, details)
       VALUES ($1, $2, $3, $4::date, $5, $6, $7)
       RETURNING id, type, description, TO_CHAR(date, 'YYYY-MM-DD') AS date, time, agent, details`,
      [
        id,
        type,
        finalDescription || "",
        activityDate,
        time || null,
        agent || null,
        details || {},
      ]
    );
    const inserted = result.rows[0];

    if (type === "followup" && details?.disposition) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await applyDispositionToLead(client, id, inserted.id, details);
        if (
          details.nextScheduleOn &&
          !dispositionClosesLead(details.disposition)
        ) {
          await client.query(
            `INSERT INTO public.lead_activities (lead_id, type, description, date, time, agent, details)
             VALUES ($1, 'followup', $2, $3::date, $4, $5, $6)`,
            [
              id,
              "Next follow-up scheduled",
              details.nextScheduleOn.slice(0, 10),
              details.nextScheduleOn.length >= 16
                ? details.nextScheduleOn.slice(11, 16)
                : null,
              agent || null,
              {
                followupType: details.followupType || "call",
                subject: "Call back scheduled",
                agenda: details.agenda || "",
                scheduleOn: details.nextScheduleOn,
                status: "scheduled",
                priority: details.priority || "medium",
                leadsTimezone: details.leadsTimezone || "asiakolkata",
              },
            ],
          );
        }
        await client.query("COMMIT");
      } catch (dispErr) {
        await client.query("ROLLBACK");
        throw dispErr;
      } finally {
        client.release();
      }
    }

    res.status(201).json({
      ...inserted,
      time: inserted.time ? inserted.time.toString().substring(0, 5) : null,
    });
  } catch (error) {
    console.error("Error adding activity:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const updateActivity = async (req, res) => {
  try {
    const { id, activityId } = req.params;
    const { type, description, date, time, agent } = req.body;
    const details =
      req.body.details && typeof req.body.details === "object"
        ? { ...req.body.details }
        : {};
    if (
      !type ||
      ![
        "note",
        "call",
        "sms",
        "wa",
        "sitevisit",
        "followup",
        "offlinecall",
        "reassignlead",
        "conductedsitevisit",
      ].includes(type)
    ) {
      return res.status(400).json({ error: "Valid activity type is required" });
    }
    const leadCheck = await pool.query(
      "SELECT 1 FROM public.leads WHERE id = $1 AND is_active = TRUE",
      [id]
    );
    if (leadCheck.rows.length === 0) {
      return res.status(404).json({ error: "Lead not found or inactive" });
    }
    if (type === "sitevisit") {
      if (
        !details?.project ||
        details.project === "selectproject" ||
        !details?.siteVisitType ||
        details.siteVisitType === "selecttype" ||
        !details?.scheduleOn
      ) {
        return res
          .status(400)
          .json({ error: "Required fields missing for site visit" });
      }
      if (!details.endsOn) details.endsOn = details.scheduleOn;
      if (!details.status) details.status = "scheduled";
      if (details.agenda === undefined) details.agenda = "";
    } else if (type === "followup") {
      if (!details?.followupType || !details?.scheduleOn) {
        return res
          .status(400)
          .json({ error: "Required fields missing for followup" });
      }
      if (!details.status) details.status = "scheduled";
      if (details.subject === undefined) details.subject = "";
      if (details.agenda === undefined) details.agenda = "";
    } else if (type === "note") {
      if (!description) {
        return res
          .status(400)
          .json({ error: "Notes are required for note activity" });
      }
    } else if (
      [
        "call",
        "sms",
        "wa",
        "offlinecall",
        "reassignlead",
        "conductedsitevisit",
      ].includes(type)
    ) {
      if (!description) {
        return res.status(400).json({ error: "Description is required" });
      }
    }
    let finalDescription = description;
    if (type === "sitevisit" && !description) {
      finalDescription = `Site visit for ${details.project}: ${details.agenda}`;
    } else if (type === "followup" && !description) {
      finalDescription = `${details.followupType} follow-up: ${details.subject}`;
    }

    const activityDate = normalizeActivityDate(date);

    const result = await pool.query(
      `UPDATE public.lead_activities
       SET type = $2, description = $3, date = $4::date, time = $5, agent = $6, details = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND lead_id = $8 AND deleted_at IS NULL
       RETURNING id, type, description, TO_CHAR(date, 'YYYY-MM-DD') AS date, time, agent, details`,
      [
        activityId,
        type,
        finalDescription || "",
        activityDate,
        time || null,
        agent || null,
        details || {},
        id,
      ]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Activity not found or already deleted" });
    }
    const updated = result.rows[0];
    res.json({
      ...updated,
      time: updated.time ? updated.time.toString().substring(0, 5) : null,
    });
  } catch (error) {
    console.error("Error updating activity:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const deleteActivity = async (req, res) => {
  try {
    const { id, activityId } = req.params;
    const result = await pool.query(
      `UPDATE public.lead_activities
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND lead_id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [activityId, id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Activity not found or already deleted" });
    }
    res.json({ message: "Activity deleted successfully" });
  } catch (error) {
    console.error("Error deleting activity:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// ========================
// ADD DOCUMENT
// ========================
export const addDocument = [
  upload.single("file"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) return res.status(400).json({ error: "No file uploaded" });

      const originalName = file.originalname;
      const ext = path.extname(originalName).slice(1).toLowerCase();
      const type = ["pdf", "png", "jpg", "jpeg", "docx"].includes(ext)
        ? ext
        : "unknown";

      const result = await pool.query(
        `INSERT INTO public.lead_documents (lead_id, name, type, document_pdf)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, type, document_pdf`,
        [id, originalName, type, file.filename]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error adding document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  },
];

// ========================
// UPDATE DOCUMENT (Replace file)
// ========================
export const updateDocument = [
  upload.single("file"),
  async (req, res) => {
    try {
      const { id, documentId } = req.params;
      const { name } = req.body;
      const file = req.file;

      // Fetch old document to delete old file
      const oldDocResult = await pool.query(
        `SELECT document_pdf FROM public.lead_documents WHERE id = $1 AND lead_id = $2`,
        [documentId, id]
      );

      if (oldDocResult.rows.length === 0) {
        return res.status(404).json({ error: "Document not found" });
      }

      const oldFileName = oldDocResult.rows[0].document_pdf;
      const oldFilePath = path.join(uploadPath, oldFileName);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath); // Delete old file
      }

      const newFileName = file ? file.filename : oldFileName;
      const newName =
        name ||
        (file
          ? file.originalname
          : oldDocResult.rows[0].name || "Updated Document");
      const ext = file
        ? path.extname(file.originalname).slice(1).toLowerCase()
        : "unknown";

      const result = await pool.query(
        `UPDATE public.lead_documents
         SET name = $1, type = $2, document_pdf = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 AND lead_id = $5 AND deleted_at IS NULL
         RETURNING id, name, type, document_pdf`,
        [newName, ext, newFileName, documentId, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Document not found or deleted" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ error: "Failed to update document" });
    }
  },
];

// ========================
// DELETE DOCUMENT (Soft + Physical)
// ========================
export const deleteDocument = async (req, res) => {
  try {
    const { id, documentId } = req.params;

    const result = await pool.query(
      `UPDATE public.lead_documents
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND lead_id = $2 AND deleted_at IS NULL
       RETURNING document_pdf`,
      [documentId, id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Document not found or already deleted" });
    }

    // Delete physical file
    const fileName = result.rows[0].document_pdf;
    const filePath = path.join(uploadPath, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
};

// ========================
// GET SINGLE DOCUMENT (Preview/Download)
// ========================
export const getDocument = async (req, res) => {
  try {
    const { leadId, documentId } = req.params;

    const result = await pool.query(
      `SELECT name, type, document_pdf FROM public.lead_documents
       WHERE id = $1 AND lead_id = $2 AND deleted_at IS NULL`,
      [documentId, leadId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    const doc = result.rows[0];
    const filePath = path.join(uploadPath, doc.document_pdf);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    const contentType =
      doc.type === "pdf" ? "application/pdf" : `image/${doc.type}`;
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(doc.name)}"`
    );
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error serving document:", error);
    res.status(500).json({ error: "Failed to load document" });
  }
};
