import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  getMessages,
  getSidebar,
  markAsSeen,
} from "../controllers/chat.controller.js";
import pool from "../../database/config.js";

const router = express.Router();

// GET all active users (except current user) for chat sidebar
router.get("/all-users", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id; // authenticateToken se aayega (UUID string)

    const result = await pool.query(
      `SELECT 
         id, 
         name, 
         email, 
         photo 
       FROM users 
       WHERE id != $1 
         AND is_active = true 
         AND deleted_at IS NULL
       ORDER BY name ASC`,
      [currentUserId]
    );

    const users = result.rows.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      photo: user.photo
        ? `${
            process.env.BASE_URL || "http://localhost:3001"
          }/public/profile_photos/${user.photo}`
        : null,
    }));

    res.json(users);
  } catch (error) {
    console.error("Error fetching all users for chat:", error);
    res.status(500).json({ error: "Failed to load users" });
  }
});

router.get("/messages/:otherUserId", authenticateToken, getMessages);
router.get("/sidebar", authenticateToken, getSidebar);
router.post("/mark-seen", authenticateToken, markAsSeen);

export default router;
