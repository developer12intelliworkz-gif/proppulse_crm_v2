// backend/socket/socket.js

import { Server } from "socket.io";
import http from "http";
import express from "express";
// import { authenticateTokenSocket } from "../middleware/auth.js"; // agar token verify karna hai socket pe
import pool from "../../database/config.js";
import { sendMessage } from "../controllers/chat.controller.js";
import jwt from "jsonwebtoken";

const app = express();

// Tere main server.js mein jo app aur httpServer hai, usko yaha import karenge baad mein
let io;

const onlineUsers = new Set();

export const initSocket = (server) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((url) => url.trim())
    : [];

  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === "development") {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    },
  });

  // Middleware to verify JWT token on socket connection (optional but recommended)
  // io.use(async (socket, next) => {
  //   const token = socket.handshake.auth.token;

  //   if (!token) {
  //     return next(new Error("Authentication error: No token provided"));
  //   }

  //   try {
  //     // JWT verify manually
  //     const jwt = await import("jsonwebtoken");
  //     const decoded = jwt.verify(token, process.env.JWT_SECRET);

  //     // User ko DB se fetch kar (basic details + check if exists)
  //     const result = await pool.query(
  //       `SELECT id, name, photo FROM users
  //      WHERE id = $1
  //      AND is_active = true
  //      AND deleted_at IS NULL`,
  //       [decoded.id]
  //     );

  //     if (result.rows.length === 0) {
  //       return next(new Error("Invalid user"));
  //     }

  //     // Socket pe user attach kar de
  //     socket.user = {
  //       id: result.rows[0].id,
  //       name: result.rows[0].name,
  //       photo: result.rows[0].photo,
  //     };

  //     next(); // Success – connect allow kar
  //   } catch (err) {
  //     console.error("Socket auth error:", err.message);
  //     return next(new Error("Invalid or expired token"));
  //   }
  // });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    console.log(
      "🔑 Socket auth attempt with token:",
      token ? token.slice(0, 20) + "..." : "NO TOKEN"
    );

    if (!token) {
      return next(new Error("No token provided"));
    }

    try {
      // Ab jwt require se aaya hai, direct use kar sakte hain
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log("✅ Token valid for user:", decoded.id);

      const result = await pool.query(
        `SELECT id, name, photo FROM users 
         WHERE id = $1 AND is_active = true AND deleted_at IS NULL`,
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return next(new Error("Invalid user"));
      }

      socket.user = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        photo: result.rows[0].photo,
      };

      next();
    } catch (err) {
      console.error("❌ Socket auth error:", err.message);
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.user.name, socket.user.id);

    // Join own room
    socket.join(socket.user.id.toString());
    onlineUsers.add(socket.user.id.toString());

    // Broadcast online users
    io.emit("onlineUsers", Array.from(onlineUsers));

    // ==================== MESSAGE PAGE (open chat with someone) ====================
    socket.on("message-page", async (otherUserId) => {
      try {
        const result = await pool.query(
          `SELECT id, name, photo 
           FROM users 
           WHERE id = $1 AND deleted_at IS NULL`,
          [otherUserId]
        );

        if (result.rows.length > 0) {
          const userDetails = result.rows[0];
          const payload = {
            _id: userDetails.id,
            name: userDetails.name,
            photo: userDetails.photo
              ? `${
                  process.env.BASE_URL || "http://localhost:3001"
                }/public/profile_photos/${userDetails.photo}`
              : null,
            online: onlineUsers.has(otherUserId.toString()),
          };

          socket.emit("message-user", payload);

          // Load previous messages
          const convResult = await pool.query(
            `SELECT id FROM conversations 
             WHERE (sender_id = $1 AND receiver_id = $2) 
                OR (sender_id = $2 AND receiver_id = $1)`,
            [socket.user.id, otherUserId]
          );

          if (convResult.rows.length > 0) {
            const messagesResult = await pool.query(
              `SELECT 
                 m.id, m.text, m.image_url AS "imageUrl", m.video_url AS "videoUrl",
                 m.sender_id AS "messageByUser", m.created_at AS "createdAt",
                 CASE WHEN mr.user_id = $1 THEN true ELSE false END AS seen
               FROM messages m
               LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = $1
               WHERE m.conversation_id = $2
               ORDER BY m.created_at ASC`,
              [socket.user.id, convResult.rows[0].id]
            );

            socket.emit("message", messagesResult.rows);
          } else {
            socket.emit("message", []);
          }
        }
      } catch (err) {
        console.error("message-page error:", err);
      }
    });

    // ==================== NEW MESSAGE ====================
    // ==================== NEW MESSAGE ====================
    socket.on("new-message", async (data) => {
      try {
        // receiverId UUID string hai, parseInt nahi karna
        const receiverId = data.receiver;

        const newMessage = await sendMessage({
          senderId: socket.user.id,
          receiverId,
          text: data.text || "",
          imageUrl: data.imageUrl || "",
          videoUrl: data.videoUrl || "",
        });

        // Emit to both users
        io.to(socket.user.id).emit("new-message-received", newMessage);
        io.to(receiverId).emit("new-message-received", newMessage);

        // Sidebar refresh
        io.to(socket.user.id).emit("sidebar-update");
        io.to(receiverId).emit("sidebar-update");
      } catch (err) {
        console.error("new-message socket error:", err);
      }
    });

    // ==================== SIDEBAR REFRESH ====================
    socket.on("sidebar", async () => {
      try {
        const result = await pool.query(
          `SELECT 
             c.id AS conversation_id,
             c.updated_at,
             u.id AS other_user_id,
             u.name AS other_user_name,
             u.photo AS other_user_photo,
             m.text AS last_message_text,
             m.sender_id AS last_message_sender,
             CASE WHEN mr.user_id IS NULL AND m.sender_id != $1 THEN 1 ELSE 0 END AS unseen
           FROM conversations c
           JOIN users u ON u.id = CASE WHEN c.sender_id = $1 THEN c.receiver_id ELSE c.sender_id END
           LEFT JOIN LATERAL (
             SELECT text, sender_id 
             FROM messages WHERE conversation_id = c.id 
             ORDER BY created_at DESC LIMIT 1
           ) m ON true
           LEFT JOIN message_reads mr ON mr.message_id = (
             SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1
           ) AND mr.user_id = $1
           WHERE c.sender_id = $1 OR c.receiver_id = $1
           ORDER BY c.updated_at DESC`,
          [socket.user.id]
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
            online: onlineUsers.has(row.other_user_id.toString()),
          },
          lastMessage: row.last_message_text
            ? {
                text: row.last_message_text,
                messageByUser: row.last_message_sender,
              }
            : null,
          unseenCount: row.unseen,
        }));

        socket.emit("conversations", conversations);
      } catch (err) {
        console.error("sidebar socket error:", err);
      }
    });

    // ==================== DISCONNECT ====================
    socket.on("disconnect", () => {
      onlineUsers.delete(socket.user.id.toString());
      io.emit("onlineUsers", Array.from(onlineUsers));
      console.log("User disconnected:", socket.user.name);
    });
  });

  return io;
};

export default initSocket;
