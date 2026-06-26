import pool from "../config.mjs";
import fetch from "node-fetch";
import XLSX from "xlsx";
import { sendEmailSafe } from "../config/email.js";
import {
  LEAD_TYPE_JOIN_LATERAL,
  hasLeadOnSameInquiryDay,
  normalizeInquiryDate,
} from "../utils/leadDuplicate.js";

/** Inline SQL fragment (avoids missing utils/formatDate.js on production deploy) */
const SQL_ACTIVITY_DATE = `TO_CHAR(date, 'YYYY-MM-DD')`;

// ──────────────────────────────────────────────────────────────
//  IMPORT EMAIL TEMPLATES
// ──────────────────────────────────────────────────────────────
import {
  leadWelcomeHtml,
  leadWelcomeText,
  leadAlertHtml,
  leadAlertText,
} from "../config/emailTemplates.js";

export const getLeads = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "" } = req.query;
    const offset = (page - 1) * limit;
    let params = [];
    let paramCount = 0;

    let countQuery = "SELECT COUNT(*) FROM public.leads WHERE is_active = TRUE";
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (name ILIKE $${countParamCount} OR email ILIKE $${countParamCount} OR phone ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (status) {
      countParamCount++;
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    let leadsQuery = `
      SELECT l.*, lt.name as lead_type_name, p.name as project_name
      FROM public.leads l
      ${LEAD_TYPE_JOIN_LATERAL}
      LEFT JOIN projects p ON l.interested_project_id = p.id
      WHERE l.is_active = TRUE
    `;

    if (search) {
      paramCount++;
      leadsQuery += ` AND (l.name ILIKE $${paramCount} OR l.email ILIKE $${paramCount} OR l.phone ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (status) {
      paramCount++;
      leadsQuery += ` AND l.status = $${paramCount}`;
      params.push(status);
    }

    leadsQuery += ` ORDER BY l.created_at DESC LIMIT $${
      paramCount + 1
    } OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const leadsResult = await pool.query(leadsQuery, params);
    const leads = [];
    const seenLeadIds = new Set();

    for (const row of leadsResult.rows) {
      if (seenLeadIds.has(row.id)) continue;
      seenLeadIds.add(row.id);

      const lead = {
        ...row,
        lead_type: row.lead_type_name || row.lead_type,
        activities: [],
        documents: [],
      };

      const activityResult = await pool.query(
        `SELECT id, type, description, ${SQL_ACTIVITY_DATE} AS date, time, agent, details
         FROM public.lead_activities
         WHERE lead_id = $1 AND deleted_at IS NULL
         ORDER BY date DESC, time DESC`,
        [lead.id],
      );
      lead.activities = activityResult.rows.map((act) => ({
        id: act.id,
        type: act.type,
        description: act.description,
        date: act.date || null,
        time: act.time ? act.time.toString().substring(0, 5) : null,
        agent: act.agent,
      }));

      const documentResult = await pool.query(
        `SELECT id, name, type, document_pdf
         FROM public.lead_documents
         WHERE lead_id = $1 AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [lead.id],
      );
      lead.documents = documentResult.rows.map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        document_name: doc.document_pdf || doc.name,
      }));

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
      if (lead.address && lead.address.toLowerCase().includes("kolkata")) {
        leadsTimezone = "asiakolkata";
      } else if (lead.address && lead.address.toLowerCase().includes("paris")) {
        leadsTimezone = "europeparis";
      } else if (lead.address && lead.address.toLowerCase().includes("pst")) {
        leadsTimezone = "uspst";
      }
      let project = "selectproject";
      if (lead.interested_project_id) {
        project = `project${lead.interested_project_id}`;
      }
      lead.forms = {
        note: { notes: "" },
        documents: { documents: lead.documents },
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
        },
        followup: {
          scheduleOn: followupScheduleOn,
          leadsTimezone,
          followupType: "call",
          time: followupTime,
          subject: "",
          agenda: "",
          followupDate,
        },
        call: { description: "", date: "", time: "", agent: "" },
        sms: { description: "", date: "", time: "", agent: "" },
        wa: { description: "", date: "", time: "", agent: "" },
        offlinecall: { description: "", date: "", time: "", agent: "" },
        reassignlead: { description: "", date: "", time: "", agent: "" },
        conductedsitevisit: {
          description: "",
          date: "",
          time: "",
          agent: "",
        },
      };

      const latestNote = activityResult.rows.find((a) => a.type === "note");
      if (latestNote && latestNote.description) {
        lead.forms.note.notes = latestNote.description;
      }

      const latestSiteVisit = activityResult.rows.find(
        (a) => a.type === "sitevisit",
      );
      if (latestSiteVisit && latestSiteVisit.details) {
        lead.forms.sitevisit = {
          ...lead.forms.sitevisit,
          ...latestSiteVisit.details,
        };
      }

      const latestFollowup = activityResult.rows.find(
        (a) => a.type === "followup",
      );
      if (latestFollowup && latestFollowup.details) {
        lead.forms.followup = {
          ...lead.forms.followup,
          ...latestFollowup.details,
        };
      }

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
          lead.forms[type] = {
            description: latest.description || "",
            date: latest.date || "",
            time: latest.time ? latest.time.toString().substring(0, 5) : "",
            agent: latest.agent || "",
          };
        }
      });

      if (latestSiteVisit && latestSiteVisit.details?.scheduleFollowup) {
        lead.forms.followup.scheduleOn =
          latestSiteVisit.details.scheduleFollowup;
        lead.forms.followup.time =
          latestSiteVisit.details.scheduleFollowup.slice(11, 16);
      }

      leads.push(lead);
    }

    res.json({
      data: leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;

    const leadQuery = `
      SELECT l.*, lt.name as lead_type_name, p.name as project_name
      FROM public.leads l
      ${LEAD_TYPE_JOIN_LATERAL}
      LEFT JOIN projects p ON l.interested_project_id = p.id
      WHERE l.id = $1 AND l.is_active = TRUE
    `;

    const leadResult = await pool.query(leadQuery, [id]);

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: "Lead not found or inactive" });
    }

    const lead = { ...leadResult.rows[0], activities: [], documents: [] };
    if (lead.lead_type_name) {
      lead.lead_type = lead.lead_type_name;
    }

    const activityResult = await pool.query(
      `SELECT id, type, description, ${SQL_ACTIVITY_DATE} AS date, time, agent, details
       FROM public.lead_activities
       WHERE lead_id = $1 AND deleted_at IS NULL
       ORDER BY date DESC, time DESC`,
      [lead.id],
    );
    lead.activities = activityResult.rows.map((act) => ({
      id: act.id,
      type: act.type,
      description: act.description,
      date: act.date || null,
      time: act.time ? act.time.toString().substring(0, 5) : null,
      agent: act.agent,
    }));

    const documentResult = await pool.query(
      `SELECT id, name, type, document_pdf
       FROM public.lead_documents
       WHERE lead_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [lead.id],
    );
    lead.documents = documentResult.rows.map((doc) => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      document_name: doc.document_pdf || doc.name,
    }));

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
    if (lead.address && lead.address.toLowerCase().includes("kolkata")) {
      leadsTimezone = "asiakolkata";
    } else if (lead.address && lead.address.toLowerCase().includes("paris")) {
      leadsTimezone = "europeparis";
    } else if (lead.address && lead.address.toLowerCase().includes("pst")) {
      leadsTimezone = "uspst";
    }
    let project = "selectproject";
    if (lead.interested_project_id) {
      project = `project${lead.interested_project_id}`;
    }
    lead.forms = {
      note: { notes: "" },
      documents: { documents: lead.documents },
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
      },
      followup: {
        scheduleOn: followupScheduleOn,
        leadsTimezone,
        followupType: "call",
        time: followupTime,
        subject: "",
        agenda: "",
        followupDate,
      },
      call: { description: "", date: "", time: "", agent: "" },
      sms: { description: "", date: "", time: "", agent: "" },
      wa: { description: "", date: "", time: "", agent: "" },
      offlinecall: { description: "", date: "", time: "", agent: "" },
      reassignlead: { description: "", date: "", time: "", agent: "" },
      conductedsitevisit: { description: "", date: "", time: "", agent: "" },
    };

    const latestNote = activityResult.rows.find((a) => a.type === "note");
    if (latestNote && latestNote.description) {
      lead.forms.note.notes = latestNote.description;
    }

    const latestSiteVisit = activityResult.rows.find(
      (a) => a.type === "sitevisit",
    );
    if (latestSiteVisit && latestSiteVisit.details) {
      lead.forms.sitevisit = {
        ...lead.forms.sitevisit,
        ...latestSiteVisit.details,
      };
    }

    const latestFollowup = activityResult.rows.find(
      (a) => a.type === "followup",
    );
    if (latestFollowup && latestFollowup.details) {
      lead.forms.followup = {
        ...lead.forms.followup,
        ...latestFollowup.details,
      };
    }

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
        lead.forms[type] = {
          description: latest.description || "",
          date: latest.date || "",
          time: latest.time ? latest.time.toString().substring(0, 5) : "",
          agent: latest.agent || "",
        };
      }
    });

    if (latestSiteVisit && latestSiteVisit.details?.scheduleFollowup) {
      lead.forms.followup.scheduleOn = latestSiteVisit.details.scheduleFollowup;
      lead.forms.followup.time = latestSiteVisit.details.scheduleFollowup.slice(
        11,
        16,
      );
    }

    res.json({ data: lead });
  } catch (error) {
    console.error("Error fetching lead by ID:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const createLead = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      lead_type,
      address,
      property_type,
      budget,
      message,
      interested_project_id,
      assigned_to,
      interest_level,
      status = "new",
    } = req.body;

    if (!name || !email || !phone) {
      return res
        .status(400)
        .json({ error: "Name, Email and Phone are required" });
    }

    const finalLeadType = lead_type || "meta";

    let assignedUserEmail = null;
    if (assigned_to) {
      const userCheck = await pool.query(
        "SELECT email FROM users WHERE id = $1 AND deleted_at IS NULL",
        [assigned_to],
      );
      if (userCheck.rows.length === 0) {
        return res.status(400).json({ error: "Invalid or inactive user ID" });
      }
      assignedUserEmail = userCheck.rows[0].email;
    }

    let projectName = "Dholera Plots";
    if (interested_project_id) {
      const projectCheck = await pool.query(
        "SELECT name FROM projects WHERE id = $1 AND deleted_at IS NULL",
        [interested_project_id],
      );
      if (projectCheck.rows.length === 0) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      projectName = projectCheck.rows[0].name;
    }

    const duplicateOnToday = await hasLeadOnSameInquiryDay(pool, {
      email,
      phone,
      inquiryDate: null,
    });
    if (duplicateOnToday) {
      return res.status(400).json({
        error:
          "A lead with this email or phone already exists for today. The same person can be added again on a different inquiry date.",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO leads (
        name, email, phone, lead_type, address, property_type, budget, message, status,
        interest_level, is_active, created_at, interested_project_id, external_id, assigned_to
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, CURRENT_TIMESTAMP, $11, NULL, $12
      ) RETURNING *
    `,
      [
        name || null,
        email || null,
        phone || null,
        finalLeadType,
        address || null,
        property_type || null,
        budget || null,
        message || null,
        status,
        interest_level || null,
        interested_project_id || null,
        assigned_to || null,
      ],
    );

    const newLead = result.rows[0];

    if (assigned_to && email && assignedUserEmail) {
      const leadHtml = leadWelcomeHtml(name, projectName, phone, email);
      const leadText = leadWelcomeText(name, projectName, phone, email);
      await sendEmailSafe(
        email,
        "Welcome to Shyam Group! Let's Find Your Dream Property in Dholera",
        leadText,
        leadHtml,
      );

      const userHtml = leadAlertHtml(
        name,
        projectName,
        phone,
        email,
        budget,
        message,
      );
      const userText = leadAlertText(
        name,
        projectName,
        phone,
        email,
        budget,
        message,
      );
      await sendEmailSafe(
        assignedUserEmail,
        `New Lead Alert! ${name} Just Registered for ${projectName}`,
        userText,
        userHtml,
      );
    }

    res.status(201).json(newLead);
  } catch (error) {
    console.error("Error creating lead:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      lead_type,
      address,
      property_type,
      budget,
      message,
      status,
      interested_project_id,
      assigned_to,
      interest_level,
    } = req.body;

    // UNIT SYNC CHANGE: load current project as well so unit assignment cleanup
    // can happen only when the lead is moved between projects.
    const existingLead = await pool.query(
      "SELECT lead_type, assigned_to, interested_project_id, email, phone, created_at FROM leads WHERE id = $1 AND is_active = TRUE",
      [id],
    );
    if (existingLead.rows.length === 0) {
      return res.status(404).json({ error: "Lead not found or inactive" });
    }

    const currentRow = existingLead.rows[0];
    const emailChanged =
      email !== undefined &&
      (email || "").toLowerCase() !== (currentRow.email || "").toLowerCase();
    const phoneChanged =
      phone !== undefined && (phone || "").trim() !== (currentRow.phone || "").trim();

    if (emailChanged || phoneChanged) {
      const inquiryDate = normalizeInquiryDate(currentRow.created_at);
      const conflict = await hasLeadOnSameInquiryDay(pool, {
        email: email !== undefined ? email : currentRow.email,
        phone: phone !== undefined ? phone : currentRow.phone,
        inquiryDate,
        excludeLeadId: id,
      });
      if (conflict) {
        return res.status(400).json({
          error:
            "Another lead with this email or phone already exists for this inquiry date.",
        });
      }
    }

    const currentAssignedTo = currentRow.assigned_to;
    const finalLeadType = lead_type || currentRow.lead_type || "unknown";

    let assignedUserEmail = null;
    if (assigned_to !== undefined) {
      const userCheck = await pool.query(
        "SELECT email FROM users WHERE id = $1 AND deleted_at IS NULL",
        [assigned_to],
      );
      if (assigned_to && userCheck.rows.length === 0) {
        return res.status(400).json({ error: "Invalid or inactive user ID" });
      }
      assignedUserEmail = userCheck.rows[0]?.email;
    }

    let projectName = "Dholera Plots";
    if (interested_project_id) {
      const projectCheck = await pool.query(
        "SELECT name FROM projects WHERE id = $1 AND deleted_at IS NULL",
        [interested_project_id],
      );
      if (projectCheck.rows.length === 0) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      projectName = projectCheck.rows[0].name;
    }

    const result = await pool.query(
      `
      UPDATE leads
      SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        lead_type = $4,
        address = COALESCE($5, address),
        property_type = COALESCE($6, property_type),
        budget = COALESCE($7, budget),
        message = COALESCE($8, message),
        status = COALESCE($9, status),
        interest_level = COALESCE($10, interest_level),
        interested_project_id = COALESCE($11, interested_project_id),
        assigned_to = COALESCE($12, assigned_to),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13 AND is_active = TRUE
      RETURNING *
    `,
      [
        name || null,
        email || null,
        phone || null,
        finalLeadType,
        address || null,
        property_type || null,
        budget || null,
        message || null,
        status || "new",
        interest_level || null,
        interested_project_id || null,
        assigned_to || null,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lead not found or inactive" });
    }

    const updatedLead = result.rows[0];

    // UNIT SYNC CHANGE: if lead project changes, unlink units from other
    // projects so stale unit allocations are not left behind.
    if (
      `${updatedLead.interested_project_id || ""}` !==
      `${currentRow.interested_project_id || ""}`
    ) {
      await pool.query(
        `UPDATE project_units
         SET lead_id = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE lead_id = $1
           AND deleted_at IS NULL
           AND ($2::text IS NULL OR project_id::text <> $2::text)`,
        [id, updatedLead.interested_project_id || null],
      );
    }

    if (
      assigned_to &&
      assignedUserEmail &&
      (assigned_to !== currentAssignedTo || !currentAssignedTo) &&
      updatedLead.email
    ) {
      const leadHtml = leadWelcomeHtml(
        updatedLead.name,
        projectName,
        updatedLead.phone,
        updatedLead.email,
      );
      const leadText = leadWelcomeText(
        updatedLead.name,
        projectName,
        updatedLead.phone,
        updatedLead.email,
      );
      await sendEmailSafe(
        updatedLead.email,
        "Welcome to Shyam Group! Let's Find Your Dream Property in Dholera",
        leadText,
        leadHtml,
      );

      const userHtml = leadAlertHtml(
        updatedLead.name,
        projectName,
        updatedLead.phone,
        updatedLead.email,
        updatedLead.budget,
        updatedLead.message,
      );
      const userText = leadAlertText(
        updatedLead.name,
        projectName,
        updatedLead.phone,
        updatedLead.email,
        updatedLead.budget,
        updatedLead.message,
      );
      await sendEmailSafe(
        assignedUserEmail,
        `New Lead Alert! ${updatedLead.name} Just Registered for ${projectName}`,
        userText,
        userHtml,
      );
    }

    res.json(updatedLead);
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE leads
      SET is_active = FALSE, deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = TRUE
      RETURNING *
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Lead not found or already deleted" });
    }

    // UNIT SYNC CHANGE: when lead is deleted, remove any live unit mapping
    // that still references this lead.
    await pool.query(
      `UPDATE project_units
       SET lead_id = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE lead_id = $1 AND deleted_at IS NULL`,
      [id],
    );

    res.json({ message: "Lead deleted successfully" });
  } catch (error) {
    console.error("Error deleting lead:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const syncLeadsFromSheetInternal = async () => {
  try {
    const spreadsheetId = "1jka4qPHsdKkz50A5BylYrQtTYJmGzA8Td-EC5DkSanA";
    const range = "Sheet1!A1:Z";
    const apiKey = process.env.GOOGLE_API_KEY;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

    const response = await fetch(url, { method: "GET", redirect: "follow" });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Details:", errorText);
      throw new Error(
        `Failed to fetch JSON: ${response.status} - ${response.statusText}`,
      );
    }

    const data = await response.json();
    const values = data.values || [];
    if (values.length === 0) {
      console.log("No data found in the sheet.");
      return 0;
    }

    const headers = values[0].map((header) => header.toLowerCase());
    const leads = values.slice(1).map((row) => {
      const lead = {};
      headers.forEach((header, index) => {
        lead[header] = row[index] || null;
      });
      return lead;
    });

    let added = 0;
    for (const lead of leads) {
      const external_id = lead.id?.trim();
      if (!external_id) continue;

      const check = await pool.query(
        "SELECT 1 FROM leads WHERE external_id = $1",
        [external_id],
      );
      if (check.rows.length > 0) continue;

      const name = lead.full_name?.trim() || null;
      const email = lead.email?.trim() || null;
      const phone = lead.phone_number?.replace(/^p:/, "")?.trim() || null;
      const lead_type = lead.lead_type?.trim() || "unknown";
      const address = lead.city?.trim() || null;
      const status = lead.lead_status?.trim() || "new";
      const interest_level = lead.interest_level?.trim() || null;

      await pool.query(
        `
        INSERT INTO leads (
          name, email, phone, lead_type, address, property_type, budget, message, status,
          interest_level, is_active, created_at, interested_project_id, external_id, assigned_to
        ) VALUES (
          $1, $2, $3, $4, $5, NULL, NULL, NULL, $6, $7, TRUE, CURRENT_TIMESTAMP, NULL, $8, NULL
        ) RETURNING *
        `,
        [
          name,
          email,
          phone,
          lead_type,
          address,
          status,
          interest_level,
          external_id,
        ],
      );
      added++;
    }
    return added;
  } catch (error) {
    console.error("Sync error details:", error);
    throw error;
  }
};

export const syncLeadsFromSheet = async (req, res) => {
  try {
    const added = await syncLeadsFromSheetInternal();
    res.json({ message: `Synced ${added} new leads successfully.` });
  } catch (error) {
    console.error("Sync error details:", error);
    res
      .status(500)
      .json({ error: "Failed to sync leads", details: error.message });
  }
};

export const importLeads = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!sheetData.length) {
      return res.status(400).json({ error: "No data found in file" });
    }

    let added = 0;
    let duplicates = 0;

    for (const row of sheetData) {
      const {
        Name: name,
        Email: email,
        Phone: phone,
        Address: address,
        "Interested Project ID": interested_project_id,
        "Property Type": property_type,
        Budget: budget,
        Message: message,
        "Lead Type": lead_type,
        Status: status,
        "Interest Level": interest_level,
        "Created Date": created_date,
        "Assigned To": assigned_to,
      } = row;

      const finalLeadType = (lead_type || "").toString().trim() || "own_crm";

      let created_at = null;
      if (created_date != null) {
        const raw = String(created_date).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          created_at = raw;
        } else if (!isNaN(Number(raw))) {
          const serial = Number(raw);
          const utc_days = Math.floor(serial - 25569);
          const date = new Date(utc_days * 86400 * 1000);
          created_at = date.toISOString().split("T")[0];
        }
      }

      if (assigned_to) {
        const userCheck = await pool.query(
          "SELECT 1 FROM users WHERE id = $1 AND deleted_at IS NULL",
          [assigned_to],
        );
        if (userCheck.rows.length === 0) {
          duplicates++;
          continue;
        }
      }

      const inquiryDate =
        normalizeInquiryDate(created_at) ||
        normalizeInquiryDate(new Date().toISOString());
      const isDuplicate = await hasLeadOnSameInquiryDay(pool, {
        email: email ? email.toString() : null,
        phone: phone ? phone.toString() : null,
        inquiryDate,
      });
      if (isDuplicate) {
        duplicates++;
        continue;
      }

      const insertQuery = `
        INSERT INTO leads (
          name, email, phone, lead_type, address, property_type, budget, message,
          status, interest_level, is_active, created_at,
          interested_project_id, external_id, assigned_to
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE,
          $11, $12, NULL, $13
        ) RETURNING id, created_at
      `;

      const insertValues = [
        name || null,
        email || null,
        phone || null,
        finalLeadType,
        address || null,
        property_type || null,
        budget || null,
        message || null,
        status || "new",
        interest_level || null,
        created_at || new Date().toISOString(),
        interested_project_id || null,
        assigned_to || null,
      ];

      const result = await pool.query(insertQuery, insertValues);
      console.log(
        `Inserted lead ID=${result.rows[0].id}, created_at=${result.rows[0].created_at}`,
      );
      added++;
    }

    res.json({ added, duplicates, total: sheetData.length });
  } catch (err) {
    console.error("IMPORT ERROR:", err);
    res
      .status(500)
      .json({ error: "Failed to import leads", details: err.message });
  }
};

export const getUserProjectsAndLeads = async (req, res) => {
  try {
    const { userId } = req.params;

    const userCheck = await pool.query(
      `SELECT rp.role_name
       FROM users u
       LEFT JOIN roles_permissions rp ON u.roles_permissions_id = rp.id
       WHERE u.id = $1::uuid AND u.deleted_at IS NULL`,
      [userId],
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const roleName = userCheck.rows[0].role_name?.toLowerCase();

    if (roleName === "admin") {
      return res.json({ projects: [], leads: [] });
    }

    const result = await pool.query(
      `SELECT
         l.*,
         p.name AS project_name,
         u.name AS assigned_to_name
       FROM leads l
       LEFT JOIN projects p ON l.interested_project_id = p.id
       LEFT JOIN users u ON u.id::text = l.assigned_to
       WHERE l.assigned_to = $1 AND l.is_active = TRUE
       ORDER BY l.created_at DESC`,
      [userId],
    );

    const leads = result.rows;
    const projectIds = [
      ...new Set(leads.map((l) => l.interested_project_id).filter(Boolean)),
    ];
    const projects = projectIds.map((id) => ({ id }));

    console.log(`✅ SUCCESS: ${leads.length} leads loaded for user ${userId}`);
    res.json({ projects, leads });
  } catch (err) {
    console.error("❌ getUserProjectsAndLeads error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const downloadAllLeadsBasic = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        phone,
        email
      FROM public.leads
      WHERE is_active = TRUE
      ORDER BY created_at DESC
    `);

    const leads = result.rows;

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="all-leads-basic.json"',
    );

    res.json({
      success: true,
      count: leads.length,
      data: leads,
    });
  } catch (error) {
    console.error("Error in downloadAllLeadsBasic:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching leads for download",
      details: error.message,
    });
  }
};
