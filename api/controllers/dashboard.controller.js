// controllers/dashboard.controller.js - WORKS WITHOUT CHANGING AUTH.JS

import pool from "../../database/config.js";

export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user?.id; // UUID string from token

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // =============================================
    // Fetch user role_name from DB using roles_permissions_id
    // =============================================
    const userQuery = `
      SELECT rp.role_name
      FROM users u
      LEFT JOIN roles_permissions rp ON u.roles_permissions_id = rp.id
      WHERE u.id = $1 
        AND u.is_active = TRUE 
        AND u.deleted_at IS NULL
        AND (rp.deleted_at IS NULL OR rp.id IS NULL)
    `;
    const userResult = await pool.query(userQuery, [userId]);

    let roleName = "user"; // fallback
    if (userResult.rows.length > 0 && userResult.rows[0].role_name) {
      roleName = userResult.rows[0].role_name.toLowerCase().trim();
    }

    const isAdmin = roleName === "admin";

    console.log("Dashboard User ID:", userId);
    console.log("Fetched Role Name:", roleName);
    console.log("Is Admin:", isAdmin);

    // =============================================
    // 1. Latest 5 New Leads
    // =============================================
    const latestLeadsQuery = `
      SELECT id, name, phone, lead_type AS source, created_at
      FROM public.leads 
      WHERE is_active = TRUE
      ORDER BY created_at DESC
      LIMIT 5
    `;
    const latestLeadsResult = await pool.query(latestLeadsQuery);
    const latestLeads = latestLeadsResult.rows.map((lead) => ({
      id: lead.id,
      name: lead.name || "Unknown",
      phone: lead.phone ? `${lead.phone.slice(0, 5)}xxxxx` : "N/A",
      source: lead.source || "Website",
      time: formatRelativeTime(lead.created_at),
    }));

    // =============================================
    // 2. Upcoming Follow-ups (today + future)
    // =============================================
    const todayStr = new Date().toISOString().slice(0, 10); // "2026-01-01"

    let followupsQuery = `
      SELECT 
        la.id,
        la.details,
        la.lead_id,
        l.name AS lead_name,
        l.phone AS lead_phone
      FROM public.lead_activities la
      JOIN public.leads l ON la.lead_id = l.id
      WHERE la.type = 'followup'
        AND la.deleted_at IS NULL
        AND l.is_active = TRUE
        AND (la.details->>'scheduleOn') IS NOT NULL
        AND SUBSTRING(la.details->>'scheduleOn' FROM 1 FOR 10) >= $1
    `;

    const params = [todayStr];
    let paramIndex = 2;

    if (!isAdmin) {
      followupsQuery += ` AND l.assigned_to = $${paramIndex}::uuid`;
      params.push(userId);
    }

    followupsQuery += ` ORDER BY (la.details->>'scheduleOn') ASC LIMIT 10`;

    const followupsResult = await pool.query(followupsQuery, params);
    console.log(`Upcoming Followups: ${followupsResult.rows.length} found`);

    const upcomingFollowups = followupsResult.rows.map((row) => {
      const scheduleOn = row.details?.scheduleOn || "";
      const dateObj = new Date(scheduleOn);
      const time = scheduleOn.slice(11, 16) || "N/A";
      const dateStr = dateObj.toLocaleDateString("en-IN");
      const note =
        row.details?.agenda || row.details?.subject || "Follow-up scheduled";

      return {
        id: row.id,
        name: row.lead_name || "Unknown",
        phone: row.lead_phone ? `${row.lead_phone.slice(0, 5)}xxxxx` : "N/A",
        time: `${dateStr} ${time}`,
        note,
      };
    });

    // =============================================
    // 3. Total Filled Follow-ups Count (All Time)
    // =============================================
    let countQuery = `
      SELECT COUNT(*) 
      FROM public.lead_activities la
      JOIN public.leads l ON la.lead_id = l.id
      WHERE la.type = 'followup'
        AND la.deleted_at IS NULL
        AND l.is_active = TRUE
    `;

    const countParams = [];
    if (!isAdmin) {
      countQuery += ` AND l.assigned_to = $1::uuid`;
      countParams.push(userId);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalFollowups = parseInt(countResult.rows[0].count);

    res.json({
      latestLeads,
      todaysFollowups: upcomingFollowups,
      totalPendingFollowups: totalFollowups, // total filled forms
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
};

function formatRelativeTime(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInMin = Math.floor((now - past) / 60000);

  if (diffInMin < 1) return "Just now";
  if (diffInMin < 60) return `${diffInMin} min ago`;
  if (diffInMin < 1440) return `${Math.floor(diffInMin / 60)} hr ago`;

  return new Date(dateString).toLocaleDateString("en-IN");
}
