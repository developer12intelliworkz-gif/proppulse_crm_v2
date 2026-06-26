// controllers/chat.controller.js

import pool from "../../database/config.js";

// Helper: Get or Create Conversation (UUID supported)
const getOrCreateConversation = async (user1Id, user2Id) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Find existing conversation (order doesn't matter)
    let result = await client.query(
      `SELECT * FROM conversations 
       WHERE (sender_id = $1 AND receiver_id = $2) 
          OR (sender_id = $2 AND receiver_id = $1)`,
      [user1Id, user2Id]
    );

    let conversation = result.rows[0];

    if (!conversation) {
      // Create new conversation
      result = await client.query(
        `INSERT INTO conversations (sender_id, receiver_id) 
         VALUES ($1, $2) 
         RETURNING *`,
        [user1Id, user2Id]
      );
      conversation = result.rows[0];
    }

    await client.query("COMMIT");
    return conversation;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// REST: Get messages for a conversation (optional – socket bhi use kar sakte ho)
export const getMessages = async (req, res) => {
  const { otherUserId } = req.params;
  const currentUserId = req.user.id;

  try {
    const conversation = await getOrCreateConversation(
      currentUserId,
      otherUserId
    );

    const result = await pool.query(
      `SELECT 
         m.id, 
         m.text, 
         m.image_url AS "imageUrl", 
         m.video_url AS "videoUrl",
         m.sender_id AS "messageByUser", 
         m.created_at AS "createdAt",
         CASE WHEN mr.user_id = $1 THEN true ELSE false END AS seen
       FROM messages m
       LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = $1
       WHERE m.conversation_id = $2
       ORDER BY m.created_at ASC`,
      [currentUserId, conversation.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Failed to load messages" });
  }
};

// Socket + Future use: Send new message → returns only the message object
export const sendMessage = async (data) => {
  const {
    senderId,
    receiverId,
    text = "",
    imageUrl = "",
    videoUrl = "",
  } = data;

  // Get or create conversation
  const conversation = await getOrCreateConversation(senderId, receiverId);

  // Insert message
  const result = await pool.query(
    `INSERT INTO messages 
     (conversation_id, sender_id, text, image_url, video_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING 
       id, 
       text, 
       image_url AS "imageUrl", 
       video_url AS "videoUrl",
       sender_id AS "messageByUser", 
       created_at AS "createdAt"`,
    [conversation.id, senderId, text, imageUrl, videoUrl]
  );

  const newMessage = result.rows[0];

  // Update conversation timestamp
  await pool.query(
    `UPDATE conversations 
     SET updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1`,
    [conversation.id]
  );

  // Auto mark as seen by sender
  await pool.query(
    `INSERT INTO message_reads (message_id, user_id) 
     VALUES ($1, $2) 
     ON CONFLICT (message_id, user_id) DO NOTHING`,
    [newMessage.id, senderId]
  );

  // ← IMPORTANT: Sirf message return kar – frontend expects this format
  return newMessage;
};

// REST: Get sidebar conversations (not needed anymore since socket handles it, but keep if you want)
export const getSidebar = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT 
         c.id AS conversation_id,
         c.updated_at,
         u.id AS other_user_id,
         u.name AS other_user_name,
         u.photo AS other_user_photo,
         lm.text AS last_message_text,
         lm.image_url AS last_message_image,
         lm.video_url AS last_message_video,
         lm.sender_id AS last_message_sender,
         lm.created_at AS last_message_time,
         CASE WHEN mr.user_id IS NULL AND lm.sender_id != $1 THEN 1 ELSE 0 END AS unseen
       FROM conversations c
       JOIN users u ON u.id = CASE WHEN c.sender_id = $1 THEN c.receiver_id ELSE c.sender_id END
       LEFT JOIN LATERAL (
         SELECT text, image_url, video_url, sender_id, created_at
         FROM messages 
         WHERE conversation_id = c.id 
         ORDER BY created_at DESC 
         LIMIT 1
       ) lm ON true
       LEFT JOIN message_reads mr ON mr.message_id = lm.id AND mr.user_id = $1
       WHERE c.sender_id = $1 OR c.receiver_id = $1
       ORDER BY c.updated_at DESC`,
      [userId]
    );

    const conversations = result.rows.map((row) => ({
      conversationId: row.conversation_id,
      otherUser: {
        id: row.other_user_id,
        name: row.other_user_name,
        photo: row.other_user_photo
          ? `${
              process.env.BASE_URL || "http://localhost:3001"
            }/public/profile_photos/${row.other_user_photo}`
          : null,
      },
      lastMessage:
        row.last_message_text ||
        row.last_message_image ||
        row.last_message_video
          ? {
              text: row.last_message_text,
              imageUrl: row.last_message_image,
              videoUrl: row.last_message_video,
              messageByUser: row.last_message_sender,
              createdAt: row.last_message_time,
            }
          : null,
      unseenCount: row.unseen || 0,
    }));

    res.json(conversations);
  } catch (error) {
    console.error("Sidebar error:", error);
    res.status(500).json({ error: "Failed to load sidebar" });
  }
};

// Optional: Mark messages as seen
export const markAsSeen = async (req, res) => {
  const { messageIds } = req.body;
  const userId = req.user.id;

  try {
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: "messageIds array required" });
    }

    await pool.query(
      `INSERT INTO message_reads (message_id, user_id)
       SELECT unnest($1::uuid[]), $2
       ON CONFLICT (message_id, user_id) DO NOTHING`,
      [messageIds, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Mark as seen error:", error);
    res.status(500).json({ error: "Failed to mark as seen" });
  }
};
