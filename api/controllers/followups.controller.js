import pool from "../../database/config.js";
import { LEAD_INQUIRY_TZ } from "../utils/leadDuplicate.js";
import { calculateConversionRate } from "../utils/followUpMetrics.js";
import { normalizeDisposition, isConvertedDisposition } from "../utils/followUpDisposition.js";

const IST = LEAD_INQUIRY_TZ;

const ACTIVE_LEAD_STATUSES = `LOWER(l.status) NOT IN ('closed', 'lost')`;

async function getUserRole(userId) {
  const result = await pool.query(
    `SELECT LOWER(TRIM(rp.role_name)) AS role_name
     FROM users u
     LEFT JOIN roles_permissions rp ON u.roles_permissions_id = rp.id
     WHERE u.id::text = $1::text AND u.is_active = TRUE AND u.deleted_at IS NULL`,
    [userId],
  );
  return result.rows[0]?.role_name || "user";
}

function scheduleDateExpr(alias = "la") {
  return `NULLIF(SUBSTRING(COALESCE(${alias}.details->>'scheduleOn', '') FROM 1 FOR 10), '')::date`;
}

function isCompletedExpr(alias = "la") {
  return `(COALESCE(${alias}.details->>'status', '') = 'completed' OR COALESCE(${alias}.details->>'completed', '') = 'true')`;
}

function baseFollowUpJoin(isAdmin, userId) {
  let sql = `
    FROM public.lead_activities la
    INNER JOIN public.leads l ON la.lead_id = l.id
    -- assigned_to may be uuid or varchar — compare as text
    LEFT JOIN public.users u ON u.id::text = l.assigned_to::text
    WHERE la.type = 'followup'
      AND la.deleted_at IS NULL
      AND l.is_active = TRUE
      AND ${ACTIVE_LEAD_STATUSES}
  `;
  const params = [];
  if (!isAdmin) {
    params.push(userId);
    sql += ` AND l.assigned_to::text = $${params.length}::text`;
  }
  return { sql, params };
}

const PIPELINE_STAGE_IDS = [
  "new",
  "contacted",
  "site_visit_negotiation",
  "won",
  "lost",
];

function buildNextFollowUp(scheduleOn, details) {
  const sched = (scheduleOn || "").trim();
  if (!sched || sched.length < 10) return null;
  const followUpStatus = deriveFollowUpStatus(sched, details || {});
  return { scheduleOn: sched, followUpStatus };
}

/** Simplified 5-stage pipeline derived from lead status + next follow-up. */
function derivePipelineStage(lead, nextFollowUp) {
  const status = (lead.status || "new").toLowerCase().trim();
  if (status === "lost") return "lost";
  if (status === "closed") return "won";
  if (["working", "proposal sent", "qualified", "site visit"].includes(status)) {
    return "site_visit_negotiation";
  }
  if (status === "contacted") return "contacted";
  if (nextFollowUp) return "contacted";
  return "new";
}

function countPipelineStages(items) {
  const counts = Object.fromEntries(PIPELINE_STAGE_IDS.map((id) => [id, 0]));
  for (const item of items) {
    const key = PIPELINE_STAGE_IDS.includes(item.stage)
      ? item.stage
      : "new";
    counts[key] += 1;
  }
  return counts;
}

function deriveFollowUpStatus(scheduleOn, details) {
  if (details?.status === "completed" || details?.completed === true || details?.completed === "true") {
    return "completed";
  }
  if (!scheduleOn || scheduleOn.length < 10) return "pending";
  const today = new Date().toLocaleDateString("en-CA", { timeZone: IST });
  const datePart = scheduleOn.slice(0, 10);
  if (datePart < today) return "overdue";
  if (details?.status === "rescheduled") return "rescheduled";
  return "pending";
}

function mapFollowUpType(raw) {
  const t = (raw || "call").toLowerCase();
  if (t === "wa") return "WhatsApp";
  if (t === "sms") return "SMS";
  if (t === "email") return "Email";
  if (t === "meeting") return "In-Person Meeting";
  if (t === "site_visit" || t === "sitevisit") return "Site Visit";
  return "Call";
}

export const getFollowUpDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const roleName = await getUserRole(userId);
    const isAdmin = roleName === "admin";

    const {
      page = "1",
      limit = "25",
      search = "",
      salesperson = "",
      stage = "",
      status = "",
      followupType = "",
      priority = "",
      sortBy = "next_followup",
      dateFrom = "",
      dateTo = "",
      dateField = "next",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const offset = (pageNum - 1) * limitNum;

    const todayResult = await pool.query(
      `SELECT (NOW() AT TIME ZONE '${IST}')::date AS today`,
    );
    const today = todayResult.rows[0].today;
    const todayStr =
      typeof today === "string"
        ? today.slice(0, 10)
        : today.toISOString().slice(0, 10);

    const { sql: baseJoin, params: baseParams } = baseFollowUpJoin(
      isAdmin,
      userId,
    );
    const scheduleExpr = scheduleDateExpr();
    const completedExpr = isCompletedExpr("la");

    const leadScope = isAdmin
      ? {
          sql: `FROM public.leads l
                LEFT JOIN public.users u ON u.id::text = l.assigned_to::text
                WHERE l.is_active = TRUE`,
          params: [],
        }
      : {
          sql: `FROM public.leads l
                LEFT JOIN public.users u ON u.id::text = l.assigned_to::text
                WHERE l.is_active = TRUE AND l.assigned_to::text = $1::text`,
          params: [userId],
        };

    const statsQuery = `
      WITH scoped AS (
        SELECT la.id, la.lead_id, la.details, ${scheduleExpr} AS sched_date, ${completedExpr} AS is_done
        ${baseJoin}
      ),
      scoped_leads AS (
        SELECT l.id, l.status
        ${leadScope.sql}
      ),
      all_followup_leads AS (
        SELECT DISTINCT la.lead_id
        FROM public.lead_activities la
        INNER JOIN public.leads l ON la.lead_id = l.id
        WHERE la.type = 'followup'
          AND la.deleted_at IS NULL
          AND l.is_active = TRUE
          ${isAdmin ? "" : "AND l.assigned_to::text = $1::text"}
      )
      SELECT
        (SELECT COUNT(*) FROM scoped WHERE is_done = FALSE AND sched_date = $${baseParams.length + 1}::date) AS today_count,
        (SELECT COUNT(*) FROM scoped WHERE is_done = FALSE AND sched_date < $${baseParams.length + 1}::date AND sched_date IS NOT NULL) AS overdue_count,
        (SELECT COUNT(*) FROM scoped WHERE is_done = TRUE AND date_trunc('month', COALESCE((details->>'completedAt')::timestamptz, NOW())) = date_trunc('month', NOW())) AS completed_month,
        (SELECT COUNT(*) FROM scoped WHERE is_done = FALSE AND sched_date >= date_trunc('month', (NOW() AT TIME ZONE '${IST}')::date)::date AND sched_date < (date_trunc('month', (NOW() AT TIME ZONE '${IST}')::date) + INTERVAL '1 month')::date) AS pending_month,
        (SELECT COUNT(*) FROM all_followup_leads) AS leads_with_followups,
        (SELECT COUNT(DISTINCT la.lead_id)
         FROM public.lead_activities la
         INNER JOIN all_followup_leads afl ON afl.lead_id = la.lead_id
         WHERE la.type = 'followup' AND la.deleted_at IS NULL
           AND (
             COALESCE(la.details->>'disposition', '') = 'converted'
             OR LOWER(COALESCE(la.details->>'outcome', '')) LIKE '%converted%'
           )
        ) AS converted_leads,
        (SELECT COUNT(*) FROM scoped) AS total_followups,
        (SELECT COUNT(*) FROM scoped WHERE is_done = FALSE) AS pending_all
    `;
    const statsParams = [...baseParams, todayStr];
    const statsRow = (await pool.query(statsQuery, statsParams)).rows[0];

    const totalFollowups = Number(statsRow.total_followups) || 0;
    const leadsWithFollowups = Number(statsRow.leads_with_followups) || 0;
    const convertedLeads = Number(statsRow.converted_leads) || 0;
    const conversionRate = calculateConversionRate(
      convertedLeads,
      leadsWithFollowups,
    );
    const completedMonth = Number(statsRow.completed_month) || 0;
    const pendingMonth = Number(statsRow.pending_month) || 0;
    const avgPerLead =
      leadsWithFollowups > 0
        ? Math.round((totalFollowups / leadsWithFollowups) * 10) / 10
        : 0;

    const prevMonthQuery = `
      SELECT COUNT(*) AS cnt FROM public.lead_activities la
      INNER JOIN public.leads l ON la.lead_id = l.id
      WHERE la.type = 'followup' AND la.deleted_at IS NULL AND l.is_active = TRUE
        AND la.created_at >= date_trunc('month', NOW() - INTERVAL '1 month')
        AND la.created_at < date_trunc('month', NOW())
        ${isAdmin ? "" : "AND l.assigned_to::text = $1::text"}
    `;
    const prevMonthParams = isAdmin ? [] : [userId];
    const prevMonthCount = Number(
      (await pool.query(prevMonthQuery, prevMonthParams)).rows[0]?.cnt || 0,
    );
    const trendTotal =
      prevMonthCount > 0
        ? Math.round(((totalFollowups - prevMonthCount) / prevMonthCount) * 100)
        : totalFollowups > 0
          ? 100
          : 0;

    const rowsQuery = `
      WITH lead_stats AS (
        SELECT
          l.id AS lead_id,
          l.name AS lead_name,
          l.phone AS lead_phone,
          l.email AS lead_email,
          l.lead_type,
          l.status AS lead_status,
          l.interest_level,
          l.assigned_to,
          u.name AS assignee_name,
          (SELECT COUNT(*)::int FROM public.lead_activities x
           WHERE x.lead_id = l.id AND x.type = 'followup' AND x.deleted_at IS NULL) AS followup_count,
          (SELECT MAX(x.date) FROM public.lead_activities x
           WHERE x.lead_id = l.id AND x.type = 'followup' AND x.deleted_at IS NULL) AS last_followup_date,
          (SELECT x.id FROM public.lead_activities x
           WHERE x.lead_id = l.id AND x.type = 'followup' AND x.deleted_at IS NULL
             AND (x.details->>'scheduleOn') IS NOT NULL
             AND NOT (${isCompletedExpr("x")})
           ORDER BY x.details->>'scheduleOn' ASC NULLS LAST LIMIT 1) AS next_activity_id,
          (SELECT x.details FROM public.lead_activities x
           WHERE x.lead_id = l.id AND x.type = 'followup' AND x.deleted_at IS NULL
             AND (x.details->>'scheduleOn') IS NOT NULL
             AND NOT (${isCompletedExpr("x")})
           ORDER BY x.details->>'scheduleOn' ASC NULLS LAST LIMIT 1) AS next_details,
          (SELECT x.details->>'scheduleOn' FROM public.lead_activities x
           WHERE x.lead_id = l.id AND x.type = 'followup' AND x.deleted_at IS NULL
             AND (x.details->>'scheduleOn') IS NOT NULL
             AND NOT (${isCompletedExpr("x")})
           ORDER BY x.details->>'scheduleOn' ASC NULLS LAST LIMIT 1) AS next_schedule_on,
          (SELECT x.description FROM public.lead_activities x
           WHERE x.lead_id = l.id AND x.deleted_at IS NULL
           ORDER BY x.date DESC NULLS LAST, x.time DESC NULLS LAST LIMIT 1) AS last_note
        ${leadScope.sql}
      )
      SELECT * FROM lead_stats WHERE 1=1
    `;

    const rowParams = [...leadScope.params];
    let paramIdx = rowParams.length + 1;
    const filters = [];

    if (search.trim()) {
      filters.push(
        `(LOWER(lead_name) LIKE $${paramIdx} OR LOWER(COALESCE(lead_phone, '')) LIKE $${paramIdx} OR LOWER(COALESCE(lead_email, '')) LIKE $${paramIdx} OR LOWER(COALESCE(lead_type, '')) LIKE $${paramIdx})`,
      );
      rowParams.push(`%${search.trim().toLowerCase()}%`);
      paramIdx++;
    }
    if (salesperson && salesperson !== "all") {
      filters.push(`assigned_to = $${paramIdx}`);
      rowParams.push(salesperson);
      paramIdx++;
    }

    let filteredSql = rowsQuery;
    if (filters.length) filteredSql += ` AND ${filters.join(" AND ")}`;

    const allRows = (await pool.query(filteredSql, rowParams)).rows;

    let items = allRows.map((row) => {
      const details = row.next_details || {};
      const scheduleOn = row.next_schedule_on || "";
      const followUpStatus = deriveFollowUpStatus(scheduleOn, details);
      const nextFollowUp = buildNextFollowUp(scheduleOn, details);
      const pipelineStage = derivePipelineStage(
        { status: row.lead_status, interest_level: row.interest_level },
        nextFollowUp,
      );
      const priority =
        (details.priority || row.interest_level || "medium").toLowerCase();

      const tableStatus =
        row.lead_status === "closed" || row.lead_status === "lost"
          ? "Closed"
          : followUpStatus === "overdue"
            ? "Overdue"
            : scheduleOn && scheduleOn.slice(0, 10) === todayStr
              ? "Due Today"
              : scheduleOn
                ? "Upcoming"
                : "Pending";

      return {
        leadId: row.lead_id,
        activityId: row.next_activity_id,
        leadName: row.lead_name || "Unknown",
        phone: row.lead_phone,
        email: row.lead_email,
        companySource: row.lead_type || "—",
        assigneeId: row.assigned_to,
        assigneeName: row.assignee_name || "Unassigned",
        stage: pipelineStage,
        leadStatus: row.lead_status,
        tableStatus,
        lastFollowUpDate: row.last_followup_date,
        nextFollowUpDate: scheduleOn ? scheduleOn.slice(0, 10) : null,
        nextFollowUpTime: scheduleOn ? scheduleOn.slice(11, 16) : null,
        followUpType: mapFollowUpType(details.followupType),
        followUpCount: row.followup_count || 0,
        status: followUpStatus,
        priority,
        notesPreview:
          details.agenda ||
          details.subject ||
          row.last_note ||
          "",
        outcome: details.outcome || null,
        rescheduleCount: Number(details.rescheduleCount) || 0,
      };
    });

    const pipelineCounts = countPipelineStages(items);

    const stageFilterList = stage
      ? stage.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    if (stageFilterList.length) {
      items = items.filter((i) => stageFilterList.includes(i.stage));
    }
    if (status && status !== "all") {
      const map = {
        missed: "overdue",
        overdue: "overdue",
        today: "today",
      };
      const want = map[status] || status;
      if (want === "today") {
        items = items.filter(
          (i) =>
            i.nextFollowUpDate === todayStr &&
            i.status !== "overdue" &&
            i.status !== "completed" &&
            !["closed", "lost"].includes((i.leadStatus || "").toLowerCase()),
        );
      } else {
        items = items.filter((i) => i.status === want);
      }
    }
    if (followupType && followupType !== "all") {
      items = items.filter(
        (i) => i.followUpType.toLowerCase() === followupType.toLowerCase(),
      );
    }
    if (priority && priority !== "all") {
      items = items.filter((i) => i.priority === priority.toLowerCase());
    }
    if (dateFrom) {
      items = items.filter((i) => {
        const d =
          dateField === "last"
            ? i.lastFollowUpDate
            : i.nextFollowUpDate;
        if (!d) return false;
        return String(d).slice(0, 10) >= dateFrom;
      });
    }
    if (dateTo) {
      items = items.filter((i) => {
        const d =
          dateField === "last"
            ? i.lastFollowUpDate
            : i.nextFollowUpDate;
        if (!d) return false;
        return String(d).slice(0, 10) <= dateTo;
      });
    }

    const sortFns = {
      next_followup: (a, b) =>
        (a.nextFollowUpDate || "9999").localeCompare(b.nextFollowUpDate || "9999"),
      last_activity: (a, b) =>
        (b.lastFollowUpDate || "").localeCompare(a.lastFollowUpDate || ""),
      lead_name: (a, b) => a.leadName.localeCompare(b.leadName),
      followup_count: (a, b) => b.followUpCount - a.followUpCount,
    };
    const sortFn = sortFns[sortBy] || sortFns.next_followup;
    items.sort(sortFn);

    const totalItems = items.length;

    // When a stage is selected, expose the exact filtered count for that stage.
    const selectedStageCount =
      stageFilterList.length === 1 ? totalItems : null;

    const pagedItems = items.slice(offset, offset + limitNum);

    const leaderboardQuery = `
      WITH user_stats AS (
        SELECT
          u.id,
          u.name,
          COUNT(la.id) FILTER (
            WHERE la.type = 'followup'
              AND la.deleted_at IS NULL
              AND COALESCE(la.details->>'status', '') = 'completed'
              AND la.created_at >= date_trunc('month', NOW())
          )::int AS done_month,
          COUNT(la.id) FILTER (
            WHERE la.type = 'followup'
              AND la.deleted_at IS NULL
              AND NOT (${completedExpr})
              AND ${scheduleExpr} IS NOT NULL
              AND ${scheduleExpr} < (NOW() AT TIME ZONE '${IST}')::date
          )::int AS missed_count,
          COUNT(DISTINCT l.id) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM public.lead_activities fx
              WHERE fx.lead_id = l.id AND fx.type = 'followup' AND fx.deleted_at IS NULL
            )
          )::int AS leads_with_followups,
          COUNT(DISTINCT l.id) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM public.lead_activities fx
              WHERE fx.lead_id = l.id AND fx.type = 'followup' AND fx.deleted_at IS NULL
                AND (
                  COALESCE(fx.details->>'disposition', '') = 'converted'
                  OR LOWER(COALESCE(fx.details->>'outcome', '')) LIKE '%converted%'
                )
            )
          )::int AS converted_leads
        FROM public.users u
        LEFT JOIN public.leads l ON l.assigned_to::text = u.id::text AND l.is_active = TRUE
        LEFT JOIN public.lead_activities la ON la.lead_id = l.id
        WHERE u.is_active = TRUE AND u.deleted_at IS NULL
        GROUP BY u.id, u.name
        HAVING COUNT(la.id) > 0 OR COUNT(l.id) > 0
        ORDER BY done_month DESC
        LIMIT 20
      )
      SELECT * FROM user_stats
    `;
    const leaderboard = (await pool.query(leaderboardQuery)).rows.map((r) => {
      const done = Number(r.done_month) || 0;
      const missed = Number(r.missed_count) || 0;
      const leadsWithFu = Number(r.leads_with_followups) || 0;
      const converted = Number(r.converted_leads) || 0;
      return {
        id: r.id,
        name: r.name,
        totalThisMonth: done,
        missedCount: missed,
        conversionRate: calculateConversionRate(converted, leadsWithFu),
      };
    });

    const alertsQuery = `
      SELECT la.id AS activity_id, la.lead_id, la.details, l.name AS lead_name,
        ${scheduleExpr} AS sched_date, ${completedExpr} AS is_done
      ${baseJoin}
        AND (la.details->>'scheduleOn') IS NOT NULL
    `;
    const alertRows = (await pool.query(alertsQuery, baseParams)).rows;

    const overdue = [];
    const dueToday = [];

    const now = Date.now();
    for (const row of alertRows) {
      const sched =
        row.sched_date instanceof Date
          ? row.sched_date.toISOString().slice(0, 10)
          : String(row.sched_date || "").slice(0, 10);
      const st = deriveFollowUpStatus(
        row.details?.scheduleOn || sched,
        row.details || {},
      );
      const entry = {
        activityId: row.activity_id,
        leadId: row.lead_id,
        leadName: row.lead_name,
        scheduleOn: row.details?.scheduleOn || sched,
        status: st,
        daysOverdue:
          st === "overdue" && sched
            ? Math.max(
                0,
                Math.floor(
                  (new Date(todayStr).getTime() - new Date(sched).getTime()) /
                    86400000,
                ),
              )
            : 0,
      };
      if (st === "overdue") overdue.push(entry);
      else if (sched === todayStr && st !== "completed") dueToday.push(entry);
    }
    overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);

    const calendarQuery = `
      SELECT la.id AS activity_id, la.lead_id, l.name AS lead_name, la.details,
        la.details->>'scheduleOn' AS schedule_on,
        ${completedExpr} AS is_done,
        ${scheduleExpr} AS sched_date
      ${baseJoin}
        AND (la.details->>'scheduleOn') IS NOT NULL
        AND ${scheduleExpr} >= (NOW() AT TIME ZONE '${IST}')::date - INTERVAL '30 days'
        AND ${scheduleExpr} <= (NOW() AT TIME ZONE '${IST}')::date + INTERVAL '60 days'
    `;
    const calendarRows = (await pool.query(calendarQuery, baseParams)).rows;
    const calendar = calendarRows.map((r) => {
      const sched = r.schedule_on || "";
      const st = deriveFollowUpStatus(sched, r.details || {});
      let color = "upcoming";
      if (st === "completed") color = "done";
      else if (st === "overdue") color = "overdue";
      else if (
        (r.sched_date instanceof Date
          ? r.sched_date.toISOString().slice(0, 10)
          : String(r.sched_date || "").slice(0, 10)) === todayStr
      )
        color = "today";
      const schedDate =
        r.sched_date instanceof Date
          ? r.sched_date.toISOString().slice(0, 10)
          : String(r.sched_date || "").slice(0, 10);
      return {
        activityId: r.activity_id,
        leadId: r.lead_id,
        leadName: r.lead_name,
        date: schedDate,
        time: sched.slice(11, 16),
        status: st,
        color,
      };
    });

    res.json({
      stats: {
        todayFollowups: Number(statsRow.today_count) || 0,
        overdue: Number(statsRow.overdue_count) || 0,
        conversionRate,
        monthDone: completedMonth,
        monthPending: pendingMonth,
        // Advanced stats (secondary view)
        totalFollowups,
        pendingAll: Number(statsRow.pending_all) || 0,
        avgFollowupsPerLead: avgPerLead,
        trendTotal,
        leadsWithFollowups,
        convertedLeads,
      },
      formulas: {
        todayFollowups:
          "Incomplete follow-ups scheduled for today (active leads only).",
        overdue:
          "Incomplete follow-ups past scheduled date (active leads only), oldest first.",
        conversionRate:
          '(Leads with "Converted" disposition) ÷ (Leads with ≥1 follow-up) × 100, max 100%.',
        monthDonePending:
          "Follow-ups completed this month vs pending scheduled this month.",
      },
      pipeline: pipelineCounts,
      selectedStage: stageFilterList.length === 1 ? stageFilterList[0] : null,
      selectedStageCount,
      items: pagedItems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalItems,
        totalPages: Math.ceil(totalItems / limitNum) || 1,
      },
      leaderboard,
      alerts: {
        overdue: overdue.slice(0, 20),
        dueToday: dueToday.slice(0, 20),
      },
      calendar,
      today: todayStr,
    });
  } catch (error) {
    console.error("Follow-up dashboard error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const markFollowUpComplete = async (req, res) => {
  try {
    const { activityId } = req.params;
    const result = await pool.query(
      `UPDATE public.lead_activities
       SET details = COALESCE(details, '{}'::jsonb) || jsonb_build_object(
         'status', 'completed',
         'completed', true,
         'completedAt', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
       ),
       updated_at = NOW()
       WHERE id = $1 AND type = 'followup' AND deleted_at IS NULL
       RETURNING id, lead_id, details`,
      [activityId],
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "Follow-up not found" });
    }
    res.json({ success: true, activity: result.rows[0] });
  } catch (error) {
    console.error("Mark follow-up complete error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const updateFollowUpStatus = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { status } = req.body;
    const allowed = [
      "scheduled",
      "pending",
      "in_progress",
      "completed",
      "rescheduled",
      "cancelled",
      "missed",
      "overdue",
    ];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: "Valid status is required" });
    }
    const patch = { status };
    if (status === "completed") {
      patch.completed = true;
      patch.completedAt = new Date().toISOString();
    }
    const result = await pool.query(
      `UPDATE public.lead_activities
       SET details = COALESCE(details, '{}'::jsonb) || $2::jsonb,
           updated_at = NOW()
       WHERE id = $1 AND type = 'followup' AND deleted_at IS NULL
       RETURNING id, lead_id, details`,
      [activityId, JSON.stringify(patch)],
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "Follow-up not found" });
    }
    res.json({ success: true, activity: result.rows[0] });
  } catch (error) {
    console.error("Update follow-up status error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const rescheduleFollowUp = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { scheduleOn, notes } = req.body;
    if (!scheduleOn) {
      return res.status(400).json({ error: "scheduleOn is required" });
    }
    const existing = await pool.query(
      `SELECT details FROM public.lead_activities WHERE id = $1 AND type = 'followup' AND deleted_at IS NULL`,
      [activityId],
    );
    if (!existing.rows.length) {
      return res.status(404).json({ error: "Follow-up not found" });
    }
    const prev = existing.rows[0].details || {};
    const count = (Number(prev.rescheduleCount) || 0) + 1;
    const result = await pool.query(
      `UPDATE public.lead_activities
       SET details = COALESCE(details, '{}'::jsonb) || jsonb_build_object(
         'scheduleOn', $2::text,
         'status', 'rescheduled',
         'rescheduleCount', $3::int,
         'rescheduleNote', $4::text
       ),
       date = $5::date,
       time = $6::time,
       updated_at = NOW()
       WHERE id = $1
       RETURNING id, details`,
      [
        activityId,
        scheduleOn,
        count,
        notes || "",
        scheduleOn.slice(0, 10),
        scheduleOn.length >= 16 ? scheduleOn.slice(11, 16) : null,
      ],
    );
    res.json({ success: true, activity: result.rows[0] });
  } catch (error) {
    console.error("Reschedule follow-up error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
