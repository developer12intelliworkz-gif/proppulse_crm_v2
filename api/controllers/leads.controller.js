import pool from "../../database/config.js";
import fetch from "node-fetch";
import XLSX from "xlsx";
import { sendEmailSafe } from "../config/email.js";
import {
  LEAD_TYPE_JOIN_LATERAL,
  hasLeadOnSameInquiryDay,
  normalizeInquiryDate,
} from "../utils/leadDuplicate.js";

/** Inline SQL fragment (production may not have utils/formatDate.js deployed) */
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

// export const getLeads = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search = "", status = "" } = req.query;
//     const offset = (page - 1) * limit;
//     let params = [];
//     let paramCount = 0;

//     let countQuery = "SELECT COUNT(*) FROM public.leads WHERE is_active = TRUE";
//     const countParams = [];
//     let countParamCount = 0;

//     if (search) {
//       countParamCount++;
//       countQuery += ` AND (name ILIKE $${countParamCount} OR email ILIKE $${countParamCount} OR phone ILIKE $${countParamCount})`;
//       countParams.push(`%${search}%`);
//     }

//     if (status) {
//       countParamCount++;
//       countQuery += ` AND status = $${countParamCount}`;
//       countParams.push(status);
//     }

//     const countResult = await pool.query(countQuery, countParams);
//     const total = parseInt(countResult.rows[0].count);

//     let leadsQuery = `
//       SELECT l.*, p.name as project_name
//       FROM public.leads l
//       LEFT JOIN projects p ON l.interested_project_id = p.id
//       WHERE l.is_active = TRUE
//     `;

//     if (search) {
//       paramCount++;
//       leadsQuery += ` AND (l.name ILIKE $${paramCount} OR l.email ILIKE $${paramCount} OR l.phone ILIKE $${paramCount})`;
//       params.push(`%${search}%`);
//     }

//     if (status) {
//       paramCount++;
//       leadsQuery += ` AND l.status = $${paramCount}`;
//       params.push(status);
//     }

//     leadsQuery += ` ORDER BY l.created_at DESC LIMIT $${
//       paramCount + 1
//     } OFFSET $${paramCount + 2}`;
//     params.push(limit, offset);

//     const leadsResult = await pool.query(leadsQuery, params);
//     const leads = [];

//     for (const row of leadsResult.rows) {
//       const lead = { ...row, activities: [], documents: [] };

//       const activityResult = await pool.query(
//         `SELECT id, type, description, date, time, agent, details
//          FROM public.lead_activities
//          WHERE lead_id = $1 AND deleted_at IS NULL
//          ORDER BY date DESC, time DESC`,
//         [lead.id],
//       );
//       lead.activities = activityResult.rows.map((act) => ({
//         id: act.id,
//         type: act.type,
//         description: act.description,
//         date: act.date ? act.date.toISOString().split("T")[0] : null,
//         time: act.time ? act.time.toString().substring(0, 5) : null,
//         agent: act.agent,
//       }));

//       const documentResult = await pool.query(
//         `SELECT id, name, type, document_pdf
//          FROM public.lead_documents
//          WHERE lead_id = $1 AND deleted_at IS NULL
//          ORDER BY created_at DESC`,
//         [lead.id],
//       );
//       lead.documents = documentResult.rows.map((doc) => ({
//         id: doc.id,
//         name: doc.name,
//         type: doc.type,
//         document_name: doc.document_pdf || doc.name,
//       }));

//       // ── Initialize forms (unchanged) ──
//       const now = new Date();
//       const currentDateTime = now.toISOString().slice(0, 16);
//       const endsOn = new Date(now.getTime() + 15 * 60000)
//         .toISOString()
//         .slice(0, 16);
//       const followupScheduleOn = new Date(now.getTime() + 30 * 60000)
//         .toISOString()
//         .slice(0, 16);
//       const followupTime = followupScheduleOn.slice(11, 16);
//       const followupDate = new Date(now.getTime() + 24 * 60 * 60000)
//         .toISOString()
//         .slice(0, 10);
//       let leadsTimezone = "asiakolkata";
//       if (lead.address && lead.address.toLowerCase().includes("kolkata")) {
//         leadsTimezone = "asiakolkata";
//       } else if (lead.address && lead.address.toLowerCase().includes("paris")) {
//         leadsTimezone = "europeparis";
//       } else if (lead.address && lead.address.toLowerCase().includes("pst")) {
//         leadsTimezone = "uspst";
//       }
//       let project = "selectproject";
//       if (lead.interested_project_id) {
//         project = `project${lead.interested_project_id}`;
//       }
//       lead.forms = {
//         note: { notes: "" },
//         documents: { documents: lead.documents },
//         sitevisit: {
//           project,
//           siteVisitType: "selecttype",
//           leadsTimezone,
//           teams: "selectteam",
//           scheduleOn: currentDateTime,
//           endsOn,
//           siteVisitConfirmation: "true",
//           channelPartner: "selectpartner",
//           agenda: "",
//           scheduleFollowup: followupScheduleOn,
//         },
//         followup: {
//           scheduleOn: followupScheduleOn,
//           leadsTimezone,
//           followupType: "call",
//           time: followupTime,
//           subject: "",
//           agenda: "",
//           followupDate,
//         },
//         call: { description: "", date: "", time: "", agent: "" },
//         sms: { description: "", date: "", time: "", agent: "" },
//         wa: { description: "", date: "", time: "", agent: "" },
//         offlinecall: { description: "", date: "", time: "", agent: "" },
//         reassignlead: { description: "", date: "", time: "", agent: "" },
//         conductedsitevisit: { description: "", date: "", time: "", agent: "" },
//       };

//       const latestNote = activityResult.rows.find((a) => a.type === "note");
//       if (latestNote && latestNote.description) {
//         lead.forms.note.notes = latestNote.description;
//       }

//       const latestSiteVisit = activityResult.rows.find(
//         (a) => a.type === "sitevisit",
//       );
//       if (latestSiteVisit && latestSiteVisit.details) {
//         lead.forms.sitevisit = {
//           ...lead.forms.sitevisit,
//           ...latestSiteVisit.details,
//         };
//       }

//       const latestFollowup = activityResult.rows.find(
//         (a) => a.type === "followup",
//       );
//       if (latestFollowup && latestFollowup.details) {
//         lead.forms.followup = {
//           ...lead.forms.followup,
//           ...latestFollowup.details,
//         };
//       }

//       [
//         "call",
//         "sms",
//         "wa",
//         "offlinecall",
//         "reassignlead",
//         "conductedsitevisit",
//       ].forEach((type) => {
//         const latest = activityResult.rows.find((a) => a.type === type);
//         if (latest) {
//           lead.forms[type] = {
//             description: latest.description || "",
//             date: latest.date ? latest.date.toISOString().split("T")[0] : "",
//             time: latest.time ? latest.time.toString().substring(0, 5) : "",
//             agent: latest.agent || "",
//           };
//         }
//       });

//       if (latestSiteVisit && latestSiteVisit.details?.scheduleFollowup) {
//         lead.forms.followup.scheduleOn =
//           latestSiteVisit.details.scheduleFollowup;
//         lead.forms.followup.time =
//           latestSiteVisit.details.scheduleFollowup.slice(11, 16);
//       }

//       leads.push(lead);
//     }

//     res.json({
//       data: leads,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total,
//         pages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching leads:", error);
//     res.status(500).json({ error: "Server error", details: error.message });
//   }
// };

export const getLeads = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      interested_project_id,
    } = req.query;
    const offset = (page - 1) * limit;

    const userId = req.user?.id;
    const userRole = req.user?.role?.toLowerCase();

    // Query user permissions directly
    let hasViewAllLeads = false;
    if (userRole === "admin") {
      hasViewAllLeads = true;
    } else if (userId) {
      const rpQuery = `
        SELECT rp.role_name, rp.permissions
        FROM users u
        JOIN roles_permissions rp ON u.roles_permissions_id = rp.id
        WHERE u.id = $1 AND u.deleted_at IS NULL AND rp.deleted_at IS NULL
      `;
      const rpRes = await pool.query(rpQuery, [userId]);
      if (rpRes.rows.length > 0) {
        const rpRow = rpRes.rows[0];
        const permsObj = rpRow.permissions;
        let permsArray = [];
        if (permsObj) {
          if (Array.isArray(permsObj)) {
            permsArray = permsObj;
          } else if (typeof permsObj === "object") {
            permsArray = permsObj[rpRow.role_name] || permsObj[rpRow.role_name.toLowerCase()] || Object.values(permsObj).flat();
          }
        }
        if (permsArray.includes("view_all_leads")) {
          hasViewAllLeads = true;
        }
      }
    }

    const isRestricted = (userRole === "sales executive" || userRole === "telecaller" || userRole === "sales" || userRole === "agent") && !hasViewAllLeads;

    let countQuery = `SELECT COUNT(*) FROM public.leads l WHERE l.is_active = TRUE`;
    const countParams = [];
    let countParamCount = 0;

    if (isRestricted && userId) {
      countParamCount++;
      countQuery += ` AND l.assigned_to = $${countParamCount}`;
      countParams.push(userId);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (l.name ILIKE $${countParamCount} OR l.email ILIKE $${countParamCount} OR l.phone ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }
    if (status) {
      countParamCount++;
      countQuery += ` AND l.status = $${countParamCount}`;
      countParams.push(status);
    }

    if (interested_project_id) {
      countParamCount++;
      countQuery += ` AND l.interested_project_id::text = $${countParamCount}::text`;
      countParams.push(String(interested_project_id));
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // FIXED QUERY with type casting
    let leadsQuery = `
      SELECT 
        l.*,
        lt.name as lead_type_name,
        p.name as project_name
      FROM public.leads l
      ${LEAD_TYPE_JOIN_LATERAL}
      LEFT JOIN projects p ON l.interested_project_id = p.id
      WHERE l.is_active = TRUE
    `;

    let paramCount = 0;
    const params = [];

    if (isRestricted && userId) {
      paramCount++;
      leadsQuery += ` AND l.assigned_to = $${paramCount}`;
      params.push(userId);
    }

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

    if (interested_project_id) {
      paramCount++;
      leadsQuery += ` AND l.interested_project_id::text = $${paramCount}::text`;
      params.push(String(interested_project_id));
    }

    leadsQuery += ` ORDER BY l.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const leadsResult = await pool.query(leadsQuery, params);

    const seenLeadIds = new Set();
    const leads = [];
    for (const row of leadsResult.rows) {
      if (seenLeadIds.has(row.id)) continue;
      seenLeadIds.add(row.id);
      leads.push({
        ...row,
        lead_type: row.lead_type_name || row.lead_type,
      });
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
      SELECT 
        l.*,
        lt.name as lead_type_name,
        p.name as project_name
      FROM public.leads l
      ${LEAD_TYPE_JOIN_LATERAL}
      LEFT JOIN projects p ON l.interested_project_id = p.id
      WHERE l.id = $1 AND l.is_active = TRUE
    `;

    const leadResult = await pool.query(leadQuery, [id]);

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: "Lead not found or inactive" });
    }

    const lead = {
      ...leadResult.rows[0],
      activities: [],
      documents: [],
    };

    const userId = req.user?.id;
    const userRole = req.user?.role?.toLowerCase();
    let hasViewAllLeads = false;
    if (userRole === "admin") {
      hasViewAllLeads = true;
    } else if (userId) {
      const rpQuery = `
        SELECT rp.role_name, rp.permissions
        FROM users u
        JOIN roles_permissions rp ON u.roles_permissions_id = rp.id
        WHERE u.id = $1 AND u.deleted_at IS NULL AND rp.deleted_at IS NULL
      `;
      const rpRes = await pool.query(rpQuery, [userId]);
      if (rpRes.rows.length > 0) {
        const rpRow = rpRes.rows[0];
        const permsObj = rpRow.permissions;
        let permsArray = [];
        if (permsObj) {
          if (Array.isArray(permsObj)) {
            permsArray = permsObj;
          } else if (typeof permsObj === "object") {
            permsArray = permsObj[rpRow.role_name] || permsObj[rpRow.role_name.toLowerCase()] || Object.values(permsObj).flat();
          }
        }
        if (permsArray.includes("view_all_leads")) {
          hasViewAllLeads = true;
        }
      }
    }

    if (!hasViewAllLeads && userId && lead.assigned_to !== userId) {
      return res.status(403).json({ error: "Access denied: you do not own this lead" });
    }

    if (lead.lead_type_name) {
      lead.lead_type = lead.lead_type_name;
    }

    // Rest of your existing code for activities, documents, forms...
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

    // ── Initialize forms (same as getLeads) ──
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

// export const createLead = async (req, res) => {
//   console.log(
//     "🔍 createLead called with body:",
//     JSON.stringify(req.body, null, 2),
//   );

//   try {
//     const {
//       name,
//       email,
//       phone,
//       lead_type,
//       address,
//       property_type,
//       budget,
//       message,
//       interested_project_id,
//       assigned_to,
//       interest_level,
//       status = "new",
//     } = req.body;

//     if (!name || !email || !phone) {
//       return res
//         .status(400)
//         .json({ error: "Name, Email and Phone are required" });
//     }

//     // Validate assigned user
//     let assignedUserEmail = null;
//     if (assigned_to) {
//       const userCheck = await pool.query(
//         "SELECT email FROM users WHERE id = $1 AND deleted_at IS NULL",
//         [assigned_to],
//       );
//       if (userCheck.rows.length === 0) {
//         return res.status(400).json({ error: "Invalid or inactive user ID" });
//       }
//       assignedUserEmail = userCheck.rows[0].email;
//     }

//     // Duplicate check (email or phone)
//     if (email || phone) {
//       const checkResult = await pool.query(
//         `SELECT email, phone FROM leads
//          WHERE is_active = TRUE
//          AND (LOWER(email) = LOWER($1) OR phone = $2)`,
//         [email?.toLowerCase() || null, phone || null],
//       );

//       if (checkResult.rows.length > 0) {
//         const existing = checkResult.rows[0];
//         if (email && existing.email?.toLowerCase() === email.toLowerCase()) {
//           return res.status(400).json({ error: "Email already exists" });
//         }
//         if (phone && existing.phone === phone) {
//           return res.status(400).json({ error: "Phone number already exists" });
//         }
//       }
//     }

//     // Get project name for email
//     let projectName = "Dholera Plots";
//     if (interested_project_id) {
//       const projectCheck = await pool.query(
//         "SELECT name FROM projects WHERE id = $1 AND deleted_at IS NULL",
//         [interested_project_id],
//       );
//       if (projectCheck.rows.length > 0) {
//         projectName = projectCheck.rows[0].name;
//       }
//     }

//     // FIXED INSERT QUERY
//     const result = await pool.query(
//       `
//       INSERT INTO leads (
//         name, email, phone, lead_type, address, property_type, budget,
//         message, status, interest_level, is_active, created_at,
//         interested_project_id, assigned_to
//       ) VALUES (
//         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
//         TRUE, CURRENT_TIMESTAMP, $11, $12
//       ) RETURNING *
//       `,
//       [
//         name || null,
//         email || null,
//         phone || null,
//         lead_type || "meta",
//         address || null,
//         property_type || null,
//         budget || null,
//         message || null,
//         status,
//         interest_level || null,
//         interested_project_id || null,
//         assigned_to || null,
//       ],
//     );

//     const newLead = result.rows[0];

//     // ── SEND EMAILS ──
//     if (assigned_to && email && assignedUserEmail) {
//       // 1. To the lead
//       const leadHtml = leadWelcomeHtml(name, projectName, phone, email);
//       const leadText = leadWelcomeText(name, projectName, phone, email);
//       await sendEmail(
//         email,
//         "Welcome to Shyam Group! Let's Find Your Dream Property in Dholera",
//         leadText,
//         leadHtml,
//       );

//       // 2. To the assigned user
//       const userHtml = leadAlertHtml(
//         name,
//         projectName,
//         phone,
//         email,
//         budget,
//         message,
//       );
//       const userText = leadAlertText(
//         name,
//         projectName,
//         phone,
//         email,
//         budget,
//         message,
//       );
//       await sendEmail(
//         assignedUserEmail,
//         `New Lead Alert! ${name} Just Registered for ${projectName}`,
//         userText,
//         userHtml,
//       );
//     }

//     res.status(201).json(result.rows[0]);
//   } catch (error) {
//     console.error("💥 createLead ERROR:", error.message); // ← NEW: Debug log
//     res.status(500).json({ error: "Server error", details: error.message });
//   }
// };

export const createLead = async (req, res) => {
  console.log(
    "🔍 createLead called with body:",
    JSON.stringify(req.body, null, 2),
  );

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

    // Validate assigned user
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

    // Get project name
    let projectName = "Dholera Plots";
    if (interested_project_id) {
      const projectCheck = await pool.query(
        "SELECT name FROM projects WHERE id = $1 AND deleted_at IS NULL",
        [interested_project_id],
      );
      if (projectCheck.rows.length > 0) {
        projectName = projectCheck.rows[0].name;
      }
    }

    // ==================== MAIN INSERT ====================
    const result = await pool.query(
      `
      INSERT INTO leads (
        name, email, phone, lead_type, address, property_type, budget, 
        message, status, interest_level, is_active, created_at, 
        interested_project_id, assigned_to
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
        TRUE, CURRENT_TIMESTAMP, $11, $12
      ) RETURNING *
      `,
      [
        name || null,
        email || null,
        phone || null,
        lead_type || "meta",
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

    res.status(201).json({ data: newLead });
  } catch (error) {
    console.error("💥 createLead ERROR:", error.message);
    res.status(500).json({
      error: "Server error",
      details: error.message,
    });
  }
};

// export const updateLead = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {
//       name,
//       email,
//       phone,
//       lead_type,
//       address,
//       property_type,
//       budget,
//       message,
//       status,
//       interested_project_id,
//       assigned_to,
//       interest_level, // New field
//     } = req.body;

//     // UNIT LINK SYNC CHANGE:
//     // Also load `interested_project_id` so unit assignments can be cleaned up
//     // if the lead is moved to a different project from the Lead Detail page.
//     const existingLead = await pool.query(
//       "SELECT lead_type, assigned_to, email, interested_project_id FROM leads WHERE id = $1 AND is_active = TRUE",
//       [id],
//     );
//     if (existingLead.rows.length === 0) {
//       return res.status(404).json({ error: "Lead not found or inactive" });
//     }

//     const currentAssignedTo = existingLead.rows[0].assigned_to;
//     const finalLeadType =
//       lead_type || existingLead.rows[0].lead_type || "unknown";

//     let assignedUserEmail = null;
//     if (assigned_to !== undefined) {
//       const userCheck = await pool.query(
//         "SELECT email FROM users WHERE id = $1 AND deleted_at IS NULL",
//         [assigned_to],
//       );
//       if (assigned_to && userCheck.rows.length === 0) {
//         return res.status(400).json({ error: "Invalid or inactive user ID" });
//       }
//       assignedUserEmail = userCheck.rows[0]?.email;
//     }

//     let projectName = "Dholera Plots";
//     if (interested_project_id) {
//       const projectCheck = await pool.query(
//         "SELECT name FROM projects WHERE id = $1 AND deleted_at IS NULL",
//         [interested_project_id],
//       );
//       if (projectCheck.rows.length === 0) {
//         return res.status(400).json({ error: "Invalid project ID" });
//       }
//       projectName = projectCheck.rows[0].name;
//     }

//     if (email || phone) {
//       const checkQuery = `
//         SELECT email, phone
//         FROM leads
//         WHERE is_active = TRUE AND id != $1
//         AND (LOWER(email) = LOWER($2) OR phone = $3)
//       `;
//       const checkResult = await pool.query(checkQuery, [
//         id,
//         email?.toLowerCase() || null,
//         phone || null,
//       ]);

//       if (checkResult.rows.length > 0) {
//         const existing = checkResult.rows[0];
//         if (email && existing.email?.toLowerCase() === email.toLowerCase()) {
//           return res.status(400).json({ error: "Email already exists" });
//         }
//         if (phone && existing.phone === phone) {
//           return res.status(400).json({ error: "Phone number already exists" });
//         }
//       }
//     }

//     const result = await pool.query(
//       `
//       UPDATE leads
//       SET
//         name = COALESCE($1, name),
//         email = COALESCE($2, email),
//         phone = COALESCE($3, phone),
//         lead_type = $4,
//         address = COALESCE($5, address),
//         property_type = COALESCE($6, property_type),
//         budget = COALESCE($7, budget),
//         message = COALESCE($8, message),
//         status = COALESCE($9, status),
//         interest_level = COALESCE($10, interest_level),  -- New field
//         interested_project_id = COALESCE($11, interested_project_id),
//         assigned_to = COALESCE($12, assigned_to),
//         updated_at = CURRENT_TIMESTAMP
//       WHERE id = $13 AND is_active = TRUE
//       RETURNING *
//     `,
//       [
//         name || null,
//         email || null,
//         phone || null,
//         finalLeadType,
//         address || null,
//         property_type || null,
//         budget || null,
//         message || null,
//         status || "new",
//         interest_level || null, // New field
//         interested_project_id || null,
//         assigned_to || null,
//         id,
//       ],
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: "Lead not found or inactive" });
//     }

//     const updatedLead = result.rows[0];

//     // UNIT LINK SYNC CHANGE:
//     // If a lead is moved to another project, clear linked units from other
//     // projects so unit assignment stays consistent with the lead's project.
//     if (
//       `${updatedLead.interested_project_id || ""}` !==
//       `${existingLead.rows[0].interested_project_id || ""}`
//     ) {
//       await pool.query(
//         `UPDATE project_units
//          SET lead_id = NULL,
//              updated_at = CURRENT_TIMESTAMP
//          WHERE lead_id = $1
//            AND deleted_at IS NULL
//            AND ($2::text IS NULL OR project_id::text <> $2::text)`,
//         [id, updatedLead.interested_project_id || null],
//       );
//     }

//     // ── SEND EMAILS (only when assignment changes or first assignment) ──
//     if (
//       assigned_to &&
//       assignedUserEmail &&
//       (assigned_to !== currentAssignedTo || !currentAssignedTo) &&
//       email
//     ) {
//       const leadHtml = leadWelcomeHtml(name, projectName, phone, email);
//       const leadText = leadWelcomeText(name, projectName, phone, email);
//       await sendEmail(
//         email,
//         "Welcome to Shyam Group! Let's Find Your Dream Property in Dholera",
//         leadText,
//         leadHtml,
//       );

//       const userHtml = leadAlertHtml(
//         name,
//         projectName,
//         phone,
//         email,
//         budget,
//         message,
//       );
//       const userText = leadAlertText(
//         name,
//         projectName,
//         phone,
//         email,
//         budget,
//         message,
//       );
//       await sendEmail(
//         assignedUserEmail,
//         `New Lead Alert! ${name} Just Registered for ${projectName}`,
//         userText,
//         userHtml,
//       );
//     }

//     res.json(result.rows[0]);
//   } catch (error) {
//     console.error("Error updating lead:", error);
//     res.status(500).json({ error: "Server error", details: error.message });
//   }
// };

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
      interest_level, // Optional
    } = req.body;

    const existingLead = await pool.query(
      "SELECT lead_type, assigned_to, email, phone, interested_project_id, created_at FROM leads WHERE id = $1 AND is_active = TRUE",
      [id],
    );

    if (existingLead.rows.length === 0) {
      return res.status(404).json({ error: "Lead not found or inactive" });
    }

    const currentRow = existingLead.rows[0];

    const userId = req.user?.id;
    const userRole = req.user?.role?.toLowerCase();
    let hasEditAllLeads = false;
    if (userRole === "admin") {
      hasEditAllLeads = true;
    } else if (userId) {
      const rpQuery = `
        SELECT rp.role_name, rp.permissions
        FROM users u
        JOIN roles_permissions rp ON u.roles_permissions_id = rp.id
        WHERE u.id = $1 AND u.deleted_at IS NULL AND rp.deleted_at IS NULL
      `;
      const rpRes = await pool.query(rpQuery, [userId]);
      if (rpRes.rows.length > 0) {
        const rpRow = rpRes.rows[0];
        const permsObj = rpRow.permissions;
        let permsArray = [];
        if (permsObj) {
          if (Array.isArray(permsObj)) {
            permsArray = permsObj;
          } else if (typeof permsObj === "object") {
            permsArray = permsObj[rpRow.role_name] || permsObj[rpRow.role_name.toLowerCase()] || Object.values(permsObj).flat();
          }
        }
        if (permsArray.includes("edit_all_leads") || permsArray.includes("view_all_leads")) {
          // If they can view all leads, let them edit too, or keep it strict
          hasEditAllLeads = true;
        }
      }
    }

    if (!hasEditAllLeads && userId && currentRow.assigned_to !== userId) {
      return res.status(403).json({ error: "Access denied: you do not own this lead" });
    }
    const emailChanged =
      email !== undefined &&
      (email || "").toLowerCase() !== (currentRow.email || "").toLowerCase();
    const phoneChanged =
      phone !== undefined &&
      (phone || "").trim() !== (currentRow.phone || "").trim();

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

    // Build update query dynamically to avoid COALESCE resetting statuses,
    // and to correctly support setting fields (like assigned_to, interested_project_id) to NULL.
    const updates = [];
    const params = [];
    let paramIndex = 1;

    const allowedFields = [
      { name: "name", type: "string" },
      { name: "email", type: "string" },
      { name: "phone", type: "string" },
      { name: "lead_type", type: "string" },
      { name: "address", type: "string" },
      { name: "property_type", type: "string" },
      { name: "budget", type: "numeric" },
      { name: "message", type: "string" },
      { name: "status", type: "string" },
      { name: "interest_level", type: "string" },
      { name: "interested_project_id", type: "int" },
      { name: "assigned_to", type: "uuid" },
    ];

    for (const field of allowedFields) {
      if (req.body[field.name] !== undefined) {
        let val = req.body[field.name];

        // Normalize blank or placeholder values to null
        if (
          val === "" ||
          val === "none" ||
          val === "null" ||
          val === "Unassigned" ||
          val === "N/A"
        ) {
          val = null;
        }

        // Properly parse data types to prevent SQL execution failures
        if (val !== null) {
          if (field.type === "int") {
            val = parseInt(val, 10);
            if (isNaN(val)) val = null;
          } else if (field.type === "numeric") {
            if (typeof val === "string") {
              val = val.replace(/[^\d.]/g, "");
            }
            val = parseFloat(val);
            if (isNaN(val)) val = null;
          } else if (field.type === "string") {
            if (field.name === "interest_level") {
              const lowerVal = val.toLowerCase();
              if (lowerVal === "medium") {
                val = "warm";
              } else if (lowerVal === "high") {
                val = "hot";
              } else if (lowerVal === "low") {
                val = "cold";
              } else {
                val = lowerVal;
              }
            } else if (field.name === "status") {
              val = val.toLowerCase();
            }
          }
        }

        updates.push(`${field.name} = $${paramIndex}`);
        params.push(val);
        paramIndex++;
      }
    }

    let updatedLead = currentRow;
    if (updates.length > 0) {
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(id);
      
      const updateQuery = `
        UPDATE leads
        SET ${updates.join(", ")}
        WHERE id = $${paramIndex} AND is_active = TRUE
        RETURNING *
      `;
      
      const result = await pool.query(updateQuery, params);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Lead not found or inactive" });
      }
      updatedLead = result.rows[0];
    }

    const finalAssignedTo = updatedLead.assigned_to;
    const finalInterestedProjectId = updatedLead.interested_project_id;

    let assignedUserEmail = null;
    if (finalAssignedTo) {
      const userCheck = await pool.query(
        "SELECT email FROM users WHERE id = $1 AND deleted_at IS NULL",
        [finalAssignedTo],
      );
      if (userCheck.rows.length > 0) {
        assignedUserEmail = userCheck.rows[0].email;
      }
    }

    let projectName = "Dholera Plots";
    if (finalInterestedProjectId) {
      const projectCheck = await pool.query(
        "SELECT name FROM projects WHERE id = $1 AND deleted_at IS NULL",
        [finalInterestedProjectId],
      );
      if (projectCheck.rows.length > 0) {
        projectName = projectCheck.rows[0].name;
      }
    }

    // Project change hone par units clear karo
    if (
      `${updatedLead.interested_project_id || ""}` !==
      `${currentRow.interested_project_id || ""}`
    ) {
      await pool.query(
        `UPDATE project_units SET lead_id = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE lead_id = $1 AND deleted_at IS NULL`,
        [id],
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

    res.json({ data: updatedLead });
  } catch (error) {
    console.error("💥 updateLead ERROR:", error.message);
    res.status(500).json({
      error: "Server error",
      details: error.message,
    });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    const leadCheck = await pool.query(
      "SELECT assigned_to FROM leads WHERE id = $1 AND is_active = TRUE",
      [id]
    );
    if (leadCheck.rows.length === 0) {
      return res.status(404).json({ error: "Lead not found or already deleted" });
    }

    const userId = req.user?.id;
    const userRole = req.user?.role?.toLowerCase();
    let hasDeleteAllLeads = false;
    if (userRole === "admin") {
      hasDeleteAllLeads = true;
    } else if (userId) {
      const rpQuery = `
        SELECT rp.role_name, rp.permissions
        FROM users u
        JOIN roles_permissions rp ON u.roles_permissions_id = rp.id
        WHERE u.id = $1 AND u.deleted_at IS NULL AND rp.deleted_at IS NULL
      `;
      const rpRes = await pool.query(rpQuery, [userId]);
      if (rpRes.rows.length > 0) {
        const rpRow = rpRes.rows[0];
        const permsObj = rpRow.permissions;
        let permsArray = [];
        if (permsObj) {
          if (Array.isArray(permsObj)) {
            permsArray = permsObj;
          } else if (typeof permsObj === "object") {
            permsArray = permsObj[rpRow.role_name] || permsObj[rpRow.role_name.toLowerCase()] || Object.values(permsObj).flat();
          }
        }
        if (permsArray.includes("delete_all_leads") || permsArray.includes("view_all_leads")) {
          hasDeleteAllLeads = true;
        }
      }
    }

    if (!hasDeleteAllLeads && userId && leadCheck.rows[0].assigned_to !== userId) {
      return res.status(403).json({ error: "Access denied: you do not own this lead" });
    }

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

    // UNIT LINK SYNC CHANGE:
    // When a lead is deleted, unlink it from all assigned units to avoid
    // stale `lead_id` references in the inventory records.
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
    const url =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2lXlqRU1sn_Aa98J14Oi5Spa2rjvj10_h8RcElLqPmqMI7V1x_9_4B34NtSAQkvcy3wvUCF2-qNZH/pub?gid=0&single=true&output=csv";

    const response = await fetch(url, { method: "GET", redirect: "follow" });
    if (!response.ok)
      throw new Error(`Failed to fetch CSV: ${response.status}`);

    const csvText = await response.text();
    const workbook = XLSX.read(csvText, { type: "string", raw: false });
    const sheetName = workbook.SheetNames[0];
    const values = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: "",
    });

    if (values.length < 2) return 0;

    const headers = values[0].map((header) =>
      header.toString().toLowerCase().trim().replace(/\s+/g, " "),
    );
    const dataRows = values.slice(1);

    const leads = dataRows.map((row) => {
      let lead = {};
      headers.forEach((header, index) => {
        lead[header] = row[index] ?? "";
      });
      return lead;
    });

    let added = 0;
    for (const lead of leads) {
      const email = String(lead["email"] || "").trim();
      const phone = String(lead["phone"] || "").trim();

      if (!email && !phone) continue;

      const check = await pool.query(
        "SELECT 1 FROM leads WHERE is_active = TRUE AND (LOWER(email) = LOWER($1) OR phone = $2)",
        [email || null, phone || null],
      );
      if (check.rows.length > 0) continue;

      const name = String(lead["name"] || "").trim() || null;
      const address = String(lead["city"] || "").trim() || null;
      const subject = String(lead["subject"] || "").trim() || null;
      const comment = String(lead["comment"] || "").trim() || null;
      const message = comment
        ? subject
          ? `${subject}: ${comment}`
          : comment
        : subject || null;

      let created_at = null;
      const created_at_str = String(lead["created at"] || "").trim();
      if (created_at_str) {
        const dateObj = new Date(
          created_at_str.replace(" ", "T") +
            (created_at_str.includes("T") ? "" : "Z"),
        );
        if (!isNaN(dateObj.getTime())) created_at = dateObj;
      }

      const lead_type = "website";
      const status = "new";
      const interest_level = null;

      await pool.query(
        `INSERT INTO leads (name, email, phone, lead_type, address, property_type, budget, message, status, interest_level, is_active, created_at, interested_project_id, external_id, assigned_to)
         VALUES ($1, $2, $3, $4, $5, NULL, NULL, $6, $7, $8, TRUE, $9, NULL, NULL, NULL)`,
        [
          name,
          email || null,
          phone || null,
          lead_type,
          address,
          message,
          status,
          interest_level,
          created_at || new Date(),
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

export const syncShyamGroupsFromApi = async (req, res) => {
  try {
    const { syncShyamGroupsToDB } = await import(
      "../config/shyamgroups.service.js"
    );
    const result = await syncShyamGroupsToDB();
    res.json({
      message: `Shyam Groups sync complete: ${result.synced} added, ${result.skipped} skipped.`,
      ...result,
    });
  } catch (error) {
    console.error("Shyam Groups sync error:", error);
    res.status(500).json({ error: "Failed to sync Shyam Groups inquiries." });
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
        "Lead Source": lead_source,
        Status: status,
        "Interest Level": interest_level,
        "Created Date": created_date, // ← NEW
        "Assigned To": assigned_to,
      } = row;

      // 1. Default lead_type = "own_crm"
      const finalLeadType =
        (lead_type || lead_source || "").trim() || "own_crm";

      // 2. Validate created_date format (YYYY-MM-DD)
      let created_at = null;
      if (created_date) {
        const dateStr = String(created_date).trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(dateStr)) {
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            created_at = parsed;
          }
        }
        if (!created_at) {
          console.warn(`Invalid date format for lead ${name}: ${dateStr}`);
        }
      }

      // 3. Validate assigned_to
      if (assigned_to) {
        const userCheck = await pool.query(
          "SELECT 1 FROM users WHERE id = $1 AND deleted_at IS NULL",
          [assigned_to],
        );
        if (userCheck.rows.length === 0) {
          console.warn(
            `Skipping lead with invalid assigned_to: ${assigned_to}`,
          );
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

      // 5. Insert with created_at
      await pool.query(
        `INSERT INTO leads (
          name, email, phone, lead_type, address, property_type, budget, message, status,
          interest_level, is_active, created_at, interested_project_id, external_id, assigned_to
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, $11, $12, NULL, $13
        )`,
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
          created_at || new Date(), // Use user date or now
          interested_project_id || null,
          assigned_to || null,
        ],
      );

      added++;
    }

    res.json({ added, duplicates, total: sheetData.length });
  } catch (err) {
    console.error("Error importing leads:", err);
    res
      .status(500)
      .json({ error: "Failed to import leads", details: err.message });
  }
};

// Get projects and leads that belong to a specific sales user
export const getUserProjectsAndLeads = async (req, res) => {
  try {
    const { userId } = req.params;

    // Fixed: Get role_name from roles_permissions table
    const userResult = await pool.query(
      `SELECT u.id, rp.role_name 
       FROM users u
       LEFT JOIN roles_permissions rp ON u.roles_permissions_id = rp.id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userRole = userResult.rows[0].role_name?.toLowerCase();

    // Admins don't use this endpoint — return empty (frontend handles it)
    if (userRole === "admin") {
      return res.json({ projects: [], leads: [] });
    }

    // Get leads assigned to this sales user
    const result = await pool.query(
      `SELECT 
         l.*,
         p.name AS project_name,
         u.name AS assigned_to_name
       FROM leads l
       LEFT JOIN projects p ON l.interested_project_id = p.id
       LEFT JOIN users u ON l.assigned_to = u.id
       WHERE l.assigned_to = $1 
         AND l.is_active = TRUE
       ORDER BY l.created_at DESC`,
      [userId],
    );

    const leads = result.rows;

    // Extract unique project IDs from leads
    const projectIds = [
      ...new Set(leads.map((l) => l.interested_project_id).filter(Boolean)),
    ];

    const projects = projectIds.map((id) => ({ id }));

    res.json({ projects, leads });
  } catch (err) {
    console.error("Error in getUserProjectsAndLeads:", err);
    res.status(500).json({ message: "Server error" });
  }
};
