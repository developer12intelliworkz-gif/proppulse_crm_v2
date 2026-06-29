import pool from "../../database/config.js";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { LEAD_INQUIRY_TZ } from "../utils/leadDuplicate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IST = LEAD_INQUIRY_TZ;

/** Compare user id to assignees (text[] or uuid[]) without type errors */
function sqlUserInAssignees(paramRef) {
  return `EXISTS (
    SELECT 1 FROM unnest(COALESCE(t.assignees, '{}')) AS assignee_id
    WHERE assignee_id::text = ${paramRef}::text
  )`;
}

function sqlUserTaskAccess(paramRef) {
  return `(${sqlUserInAssignees(paramRef)} OR t.created_by::text = ${paramRef}::text)`;
}

const PRIORITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["open", "in_progress", "on_hold", "completed"];
const ASSOCIATIONS = ["standalone", "lead", "project", "both"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../public/documents/tasks");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `task-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type"));
  },
});

async function ensureUploadDir() {
  const uploadPath = path.join(__dirname, "../../public/documents/tasks");
  await fs.mkdir(uploadPath, { recursive: true });
}

async function getUserRole(userId) {
  const result = await pool.query(
    `SELECT LOWER(TRIM(rp.role_name)) AS role_name
     FROM users u
     LEFT JOIN roles_permissions rp ON u.roles_permissions_id = rp.id
     WHERE u.id::text = $1 AND u.is_active = TRUE AND u.deleted_at IS NULL`,
    [String(userId)],
  );
  return result.rows[0]?.role_name || "user";
}

function isManagerRole(role) {
  return role === "admin" || role === "manager";
}

function parseAssignees(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return [raw];
    }
  }
  return [];
}

function combineDueOn(dateStr, timeStr) {
  if (!dateStr) return null;
  const date = dateStr.slice(0, 10);
  const time = (timeStr || "09:00").slice(0, 5);
  return `${date}T${time}:00`;
}

/** Calendar/list date in IST — avoids UTC slice shifting the day */
function formatTaskDueDate(dueOn) {
  if (!dueOn) return null;
  const d = dueOn instanceof Date ? dueOn : new Date(dueOn);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("en-CA", { timeZone: IST });
  }
  const s = String(dueOn);
  return s.length >= 10 ? s.slice(0, 10) : null;
}

function getDueTime(row) {
  if (row.due_time) return String(row.due_time).slice(0, 5);
  if (!row.due_on) return null;
  if (row.due_on instanceof Date) {
    return row.due_on.toTimeString().slice(0, 5);
  }
  const s = String(row.due_on);
  if (s.includes("T")) {
    return s.split("T")[1]?.slice(0, 5) || null;
  }
  if (s.includes(" ")) {
    return s.split(" ")[1]?.slice(0, 5) || null;
  }
  return null;
}

function resolveAssociation(body) {
  let associationType = (body.association_type || "standalone").toLowerCase();
  const leadId = body.lead_id ? parseInt(body.lead_id, 10) : null;
  const projectId = body.project_id ? parseInt(body.project_id, 10) : null;

  if (leadId && projectId) associationType = "both";
  else if (leadId) associationType = "lead";
  else if (projectId) associationType = "project";
  else associationType = "standalone";

  return { associationType, leadId, projectId };
}

async function logActivity(client, taskId, user, action, field, oldVal, newVal) {
  await client.query(
    `INSERT INTO task_activity_log (task_id, user_id, user_name, action, field_name, old_value, new_value)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      taskId,
      user?.id || null,
      user?.name || "System",
      action,
      field || null,
      oldVal != null ? String(oldVal) : null,
      newVal != null ? String(newVal) : null,
    ],
  );
}

async function enrichTasks(rows) {
  if (!rows.length) return [];
  const userIds = [...new Set(rows.flatMap((r) => r.assignees || []))];
  const leadIds = [...new Set(rows.map((r) => r.lead_id).filter(Boolean))];
  const projectIds = [...new Set(rows.map((r) => r.project_id).filter(Boolean))];

  let usersMap = {};
  if (userIds.length) {
    const uRes = await pool.query(
      `SELECT id::text AS id, name FROM users WHERE id::text = ANY($1)`,
      [userIds.map(String)],
    );
    usersMap = Object.fromEntries(uRes.rows.map((u) => [u.id, u.name]));
  }

  let leadsMap = {};
  if (leadIds.length) {
    const lRes = await pool.query(
      `SELECT id, name FROM leads WHERE id = ANY($1::int[])`,
      [leadIds],
    );
    leadsMap = Object.fromEntries(lRes.rows.map((l) => [l.id, l.name]));
  }

  let projectsMap = {};
  if (projectIds.length) {
    const pRes = await pool.query(
      `SELECT id, name FROM projects WHERE id = ANY($1::int[])`,
      [projectIds],
    );
    projectsMap = Object.fromEntries(pRes.rows.map((p) => [p.id, p.name]));
  }

  return rows.map((row) => ({
    ...row,
    assignee_names: (row.assignees || []).map((id) => usersMap[String(id)] || id),
    lead_name: row.lead_id ? leadsMap[row.lead_id] || null : null,
    project_name: row.project_id ? projectsMap[row.project_id] || null : null,
    due_date: formatTaskDueDate(row.due_on),
    due_time: getDueTime(row),
  }));
}

function mapTaskRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    due_on: row.due_on,
    due_date: formatTaskDueDate(row.due_on),
    due_time: getDueTime(row),
    assignees: row.assignees || [],
    remark: row.remark,
    priority: row.priority,
    status: row.status || "open",
    document: row.document,
    created_by: row.created_by,
    project_id: row.project_id,
    lead_id: row.lead_id,
    association_type: row.association_type || "standalone",
    reminder_at: row.reminder_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const getTaskStats = async (req, res) => {
  try {
    const userId = String(req.user?.id);
    const role = await getUserRole(userId);
    const isManager = isManagerRole(role);

    const scope = isManager ? "" : `AND ${sqlUserTaskAccess("$1")}`;
    const params = isManager ? [] : [userId];

    const q = `
      SELECT
        COUNT(*) FILTER (WHERE t.status != 'completed' AND t.due_on::date = (NOW() AT TIME ZONE '${IST}')::date) AS due_today,
        COUNT(*) FILTER (WHERE t.status != 'completed' AND t.due_on::date < (NOW() AT TIME ZONE '${IST}')::date) AS overdue,
        COUNT(*) FILTER (
          WHERE t.status != 'completed'
            AND t.due_on::date >= (NOW() AT TIME ZONE '${IST}')::date
            AND t.due_on::date <= (NOW() AT TIME ZONE '${IST}')::date + INTERVAL '7 days'
        ) AS this_week,
        COUNT(*) FILTER (WHERE t.status = 'completed') AS completed_count,
        COUNT(*) AS total_count
      FROM tasks t
      WHERE t.deleted_at IS NULL ${scope}
    `;
    const row = (await pool.query(q, params)).rows[0];
    const total = Number(row.total_count) || 0;
    const completed = Number(row.completed_count) || 0;

    res.json({
      dueToday: Number(row.due_today) || 0,
      overdue: Number(row.overdue) || 0,
      thisWeek: Number(row.this_week) || 0,
      completionRate: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
    });
  } catch (error) {
    console.error("getTaskStats:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const getTeamStats = async (req, res) => {
  try {
    const userId = String(req.user?.id);
    const role = await getUserRole(userId);
    if (!isManagerRole(role)) {
      return res.status(403).json({ error: "Admin or Manager access required" });
    }

    const result = await pool.query(`
      SELECT
        u.id::text AS id,
        u.name,
        COUNT(t.id) FILTER (WHERE t.status = 'open')::int AS open_count,
        COUNT(t.id) FILTER (
          WHERE t.status != 'completed' AND t.due_on::date < (NOW() AT TIME ZONE '${IST}')::date
        )::int AS overdue_count,
        COUNT(t.id) FILTER (WHERE t.status = 'completed')::int AS completed_count,
        COUNT(t.id)::int AS total_count
      FROM users u
      LEFT JOIN tasks t ON t.deleted_at IS NULL
        AND EXISTS (
          SELECT 1 FROM unnest(COALESCE(t.assignees, '{}')) AS assignee_id
          WHERE assignee_id::text = u.id::text
        )
      WHERE u.is_active = TRUE AND u.deleted_at IS NULL
      GROUP BY u.id, u.name
      HAVING COUNT(t.id) > 0
      ORDER BY u.name
    `);

    res.json({
      data: result.rows.map((r) => {
        const total = Number(r.total_count) || 0;
        const completed = Number(r.completed_count) || 0;
        return {
          id: r.id,
          name: r.name,
          open: Number(r.open_count) || 0,
          overdue: Number(r.overdue_count) || 0,
          completed,
          total,
          completionRate: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
        };
      }),
    });
  } catch (error) {
    console.error("getTeamStats:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const userId = String(req.user?.id);
    const role = await getUserRole(userId);
    const isManager = isManagerRole(role);

    const {
      view = "all",
      lead_id,
      project_id,
      status,
      priority,
      search,
      sort = "due_on",
      order = "asc",
    } = req.query;

    let sql = `
      SELECT t.id, t.title, t.description, t.due_on, t.due_time, t.assignees, t.remark,
        t.priority, t.status, t.document, t.created_by, t.project_id, t.lead_id,
        t.association_type, t.reminder_at, t.created_at, t.updated_at
      FROM tasks t
      WHERE t.deleted_at IS NULL
    `;
    const params = [];
    let idx = 1;

    if (!isManager) {
      sql += ` AND ${sqlUserTaskAccess(`$${idx}`)}`;
      params.push(userId);
      idx++;
    }

    if (lead_id) {
      sql += ` AND t.lead_id = $${idx}`;
      params.push(parseInt(lead_id, 10));
      idx++;
    }
    if (project_id) {
      sql += ` AND t.project_id = $${idx}`;
      params.push(parseInt(project_id, 10));
      idx++;
    }
    if (status) {
      sql += ` AND t.status = $${idx}`;
      params.push(status);
      idx++;
    }
    if (priority) {
      sql += ` AND t.priority = $${idx}`;
      params.push(priority);
      idx++;
    }
    if (search?.trim()) {
      sql += ` AND (LOWER(t.title) LIKE $${idx} OR LOWER(COALESCE(t.description,'')) LIKE $${idx})`;
      params.push(`%${search.trim().toLowerCase()}%`);
      idx++;
    }

    const todayExpr = `(NOW() AT TIME ZONE '${IST}')::date`;
    if (view === "my") {
      sql += ` AND ${sqlUserInAssignees(`$${idx}`)}`;
      params.push(userId);
      idx++;
    } else if (view === "overdue") {
      sql += ` AND t.status != 'completed' AND t.due_on::date < ${todayExpr}`;
    } else if (view === "today") {
      sql += ` AND t.status != 'completed' AND t.due_on::date = ${todayExpr}`;
    } else if (view === "week") {
      sql += ` AND t.status != 'completed' AND t.due_on::date >= ${todayExpr} AND t.due_on::date <= ${todayExpr} + INTERVAL '7 days'`;
    } else if (view === "completed") {
      sql += ` AND t.status = 'completed'`;
    }

    const sortCol =
      sort === "title"
        ? "t.title"
        : sort === "priority"
          ? "t.priority"
          : sort === "status"
            ? "t.status"
            : "t.due_on";
    sql += ` ORDER BY ${sortCol} ${order === "desc" ? "DESC" : "ASC"} NULLS LAST`;

    const result = await pool.query(sql, params);
    const data = await enrichTasks(result.rows.map(mapTaskRow));
    res.json({ data, total: data.length });
  } catch (error) {
    console.error("getTasks:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const taskRes = await pool.query(
      `SELECT * FROM tasks WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    if (!taskRes.rows.length) {
      return res.status(404).json({ error: "Task not found" });
    }

    const [enriched] = await enrichTasks([mapTaskRow(taskRes.rows[0])]);

    const comments = await pool.query(
      `SELECT id, task_id, user_id, user_name, body, created_at
       FROM task_comments WHERE task_id = $1 ORDER BY created_at ASC`,
      [id],
    );

    const activity = await pool.query(
      `SELECT id, action, field_name, old_value, new_value, user_id, user_name, created_at
       FROM task_activity_log WHERE task_id = $1 ORDER BY created_at DESC`,
      [id],
    );

    res.json({
      ...enriched,
      comments: comments.rows,
      activity: activity.rows,
    });
  } catch (error) {
    console.error("getTaskById:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const createTask = async (req, res) => {
  await ensureUploadDir();
  const userId = String(req.user?.id);
  const role = await getUserRole(userId);
  const isManager = isManagerRole(role);
  const userName = req.user?.name || "User";

  const body = req.body;
  const errors = [];
  if (!body.title?.trim()) errors.push("Title is required");
  if (!body.due_date?.trim() && !body.due_on?.trim()) {
    errors.push("Due date is required");
  }

  const assignees = parseAssignees(body.assignees || body["assignees[]"]);
  if (!isManager) {
    if (!assignees.includes(userId)) assignees.push(userId);
  } else if (assignees.length === 0) {
    errors.push("At least one assignee is required");
  }

  const { associationType, leadId, projectId } = resolveAssociation(body);
  if (associationType === "lead" && !leadId) errors.push("Lead is required");
  if (associationType === "project" && !projectId) errors.push("Project is required");
  if (associationType === "both" && (!leadId || !projectId)) {
    errors.push("Both lead and project are required");
  }

  const priority = (body.priority || "medium").toLowerCase();
  const status = (body.status || "open").toLowerCase();
  if (!PRIORITIES.includes(priority)) errors.push("Invalid priority");
  if (!STATUSES.includes(status)) errors.push("Invalid status");
  if (!isManager && status !== "open") {
    errors.push("Only managers can set initial status other than open");
  }

  if (errors.length) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  const dueOn = combineDueOn(body.due_date || body.due_on, body.due_time);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (leadId) {
      const lc = await client.query(
        `SELECT id FROM leads WHERE id = $1 AND is_active = TRUE`,
        [leadId],
      );
      if (!lc.rows.length) throw new Error("Lead not found");
    }
    if (projectId) {
      const pc = await client.query(
        `SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL`,
        [projectId],
      );
      if (!pc.rows.length) throw new Error("Project not found");
    }

    const file = req.file;
    const ins = await client.query(
      `INSERT INTO tasks (
        title, description, due_on, due_time, assignees, remark, priority, status,
        document, created_by, project_id, lead_id, association_type, reminder_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING id`,
      [
        body.title.trim(),
        body.description || null,
        dueOn,
        body.due_time?.slice(0, 5) || null,
        assignees,
        body.remark || null,
        priority,
        status,
        file?.filename || null,
        userId,
        projectId,
        leadId,
        associationType,
        body.reminder_at || null,
      ],
    );

    const taskId = ins.rows[0].id;
    await logActivity(client, taskId, { id: userId, name: userName }, "created", null, null, body.title);

    await client.query("COMMIT");
    res.status(201).json({ id: taskId, message: "Task created" });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("createTask:", error);
    res.status(500).json({ error: error.message || "Server error" });
  } finally {
    client.release();
  }
};

export const updateTask = async (req, res) => {
  await ensureUploadDir();
  const { id } = req.params;
  const userId = String(req.user?.id);
  const role = await getUserRole(userId);
  const isManager = isManagerRole(role);
  const userName = req.user?.name || "User";
  const body = req.body;

  const existing = await pool.query(
    `SELECT * FROM tasks WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  if (!existing.rows.length) {
    return res.status(404).json({ error: "Task not found" });
  }
  const prev = existing.rows[0];
  const isAssignee = (prev.assignees || []).map(String).includes(userId);

  const assignees =
    body.assignees !== undefined
      ? parseAssignees(body.assignees || body["assignees[]"])
      : prev.assignees;

  const canEditFull = isManager || String(prev.created_by) === userId;
  const canEditStatus = canEditFull || isAssignee;

  if (!canEditStatus) {
    return res.status(403).json({ error: "Not allowed to edit this task" });
  }

  if (!canEditFull) {
    const extraKeys = Object.keys(body).filter(
      (k) =>
        !["status"].includes(k) &&
        body[k] !== undefined &&
        body[k] !== "",
    );
    if (extraKeys.length > 0) {
      return res.status(403).json({ error: "Assignees can only update status" });
    }
  }

  let status = body.status !== undefined ? body.status : prev.status;

  const { associationType, leadId, projectId } =
    body.association_type !== undefined
      ? resolveAssociation({ ...body, lead_id: body.lead_id ?? prev.lead_id, project_id: body.project_id ?? prev.project_id })
      : {
          associationType: prev.association_type,
          leadId: prev.lead_id,
          projectId: prev.project_id,
        };

  const dueOn =
    body.due_date !== undefined || body.due_on !== undefined || body.due_time !== undefined
      ? combineDueOn(
          body.due_date || body.due_on || (prev.due_on ? String(prev.due_on).slice(0, 10) : null),
          body.due_time ?? (prev.due_time ? String(prev.due_time).slice(0, 5) : null),
        )
      : prev.due_on;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let documentFilename = prev.document;
    if (req.file) {
      documentFilename = req.file.filename;
      if (prev.document) {
        const oldPath = path.join(__dirname, "../../public/documents/tasks", prev.document);
        await fs.unlink(oldPath).catch(() => {});
      }
    }

    await client.query(
      `UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        due_on = COALESCE($3, due_on),
        due_time = COALESCE($4, due_time),
        assignees = COALESCE($5, assignees),
        remark = COALESCE($6, remark),
        priority = COALESCE($7, priority),
        status = COALESCE($8, status),
        document = COALESCE($9, document),
        project_id = $10,
        lead_id = $11,
        association_type = $12,
        reminder_at = COALESCE($13, reminder_at),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14`,
      [
        body.title?.trim() || null,
        body.description !== undefined ? body.description : null,
        dueOn,
        body.due_time?.slice(0, 5) || null,
        assignees,
        body.remark !== undefined ? body.remark : null,
        body.priority || null,
        status,
        documentFilename,
        projectId,
        leadId,
        associationType,
        body.reminder_at !== undefined ? body.reminder_at : null,
        id,
      ],
    );

    if (body.status && body.status !== prev.status) {
      await logActivity(client, id, { id: userId, name: userName }, "status_changed", "status", prev.status, body.status);
    } else {
      await logActivity(client, id, { id: userId, name: userName }, "updated", null, null, null);
    }

    await client.query("COMMIT");
    res.json({ id, message: "Task updated", promptFollowUp: body.status === "completed" });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    res.status(500).json({ error: error.message || "Server error" });
  } finally {
    client.release();
  }
};

export const patchTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  req.body = { status };
  return updateTask(req, res);
};

export const deleteTask = async (req, res) => {
  const { id } = req.params;
  const userId = String(req.user?.id);
  const role = await getUserRole(userId);
  if (!isManagerRole(role)) {
    return res.status(403).json({ error: "Only Admin/Manager can delete tasks" });
  }

  const result = await pool.query(
    `UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING document`,
    [id],
  );
  if (!result.rows.length) {
    return res.status(404).json({ error: "Task not found" });
  }
  res.json({ message: "Task deleted" });
};

export const addTaskComment = async (req, res) => {
  const { id } = req.params;
  const { body: commentBody } = req.body;
  const userId = String(req.user?.id);
  const userName = req.user?.name || "User";

  if (!commentBody?.trim()) {
    return res.status(400).json({ error: "Comment is required" });
  }

  const taskCheck = await pool.query(
    `SELECT id FROM tasks WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  if (!taskCheck.rows.length) {
    return res.status(404).json({ error: "Task not found" });
  }

  const ins = await pool.query(
    `INSERT INTO task_comments (task_id, user_id, user_name, body) VALUES ($1,$2,$3,$4) RETURNING *`,
    [id, userId, userName, commentBody.trim()],
  );

  await pool.query(
    `INSERT INTO task_activity_log (task_id, user_id, user_name, action) VALUES ($1,$2,$3,'comment_added')`,
    [id, userId, userName],
  );

  res.status(201).json(ins.rows[0]);
};

export { upload as uploadMiddleware };
