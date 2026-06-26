import pool from "../../database/config.js";

export const createNotification = async (
  client,
  userId,
  type,
  message,
  entityId,
  entityType
) => {
  try {
    await client.query(
      `
      INSERT INTO notifications (user_id, type, message, entity_id, entity_type, is_read, created_at, status)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)
    `,
      [
        userId,
        type,
        message,
        entityId,
        entityType,
        false,
        userId ? "active" : "user_not_found",
      ]
    );
    if (userId) {
      console.log(`Notification created for user ${userId}, type: ${type}`);
    } else {
      console.log(
        `Notification created with null user_id for type: ${type}, email not found`
      );
    }
  } catch (error) {
    console.error(
      `Error creating notification for user ${userId || "null"}:`,
      error
    );
    throw error;
  }
};

export const createNotificationsForEmails = async (
  client,
  emails,
  type,
  message,
  entityId,
  entityType
) => {
  try {
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      console.warn("No valid emails provided for notifications");
      return;
    }
    for (const email of emails) {
      const userResult = await client.query(
        "SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL",
        [email.trim()]
      );
      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;
        await createNotification(
          client,
          userId,
          type,
          message,
          entityId,
          entityType
        );
      } else {
        console.warn(
          `No user found for email: ${email}, creating notification with null user_id`
        );
        await createNotification(
          client,
          null,
          type,
          message,
          entityId,
          entityType
        );
      }
    }
  } catch (error) {
    console.error("Error creating notifications for emails:", error);
    throw error;
  }
};

export const getNotifications = async (req, res) => {
  const { userId } = req.user;
  let client;
  try {
    client = await pool.connect();
    if (typeof client.query !== "function") {
      throw new Error("Client query method is not a function");
    }

    const result = await client.query(
      `
      SELECT * FROM notifications 
      WHERE (user_id = $1 OR user_id IS NULL) AND deleted_at IS NULL
      ORDER BY created_at DESC
    `,
      [userId]
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Error in getNotifications:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  } finally {
    if (client) {
      client.release();
    }
  }
};

export const markNotificationAsRead = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  let client;
  try {
    client = await pool.connect();
    if (typeof client.query !== "function") {
      throw new Error("Client query method is not a function");
    }

    const result = await client.query(
      `
      UPDATE notifications 
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND (user_id = $2 OR user_id IS NULL) AND deleted_at IS NULL
      RETURNING *
    `,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Notification not found or not authorized" });
    }

    res.json({ id, message: "Notification marked as read" });
  } catch (error) {
    console.error("Error in markNotificationAsRead:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  } finally {
    if (client) {
      client.release();
    }
  }
};
