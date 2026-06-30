import express from "express";
import pool from "../../database/config.js";
import { authenticateToken } from "../middleware/auth.js";
import { requirePermission } from "../middleware/authorize.js";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "public", "profile_photos");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    let baseName = path.basename(file.originalname, ext);
    let fileName = file.originalname;
    let counter = 1;

    while (fs.existsSync(path.join(uploadDir, fileName))) {
      fileName = `${baseName}-${counter}${ext}`;
      counter++;
    }

    cb(null, fileName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 },
});

const router = express.Router();

// GET all users
router.get("/users", authenticateToken, requirePermission("manage_users"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.phone, rp.role_name AS role, u.is_active, u.created_at, u.last_login, u.photo, u.roles_permissions_id 
      FROM users u
      LEFT JOIN roles_permissions rp ON u.roles_permissions_id = rp.id
      WHERE u.deleted_at IS NULL AND (rp.id IS NULL OR rp.deleted_at IS NULL)
        ${req.query.include_inactive === "true" || req.query.include_inactive === "1" ? "" : "AND u.is_active = TRUE"}
      ORDER BY u.created_at DESC
    `);
    const users = result.rows.map((user) => ({
      ...user,
      photo: user.photo
        ? `${req.protocol}://${req.get("host")}/public/profile_photos/${
            user.photo
          }`
        : null,
    }));
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

// POST create user
router.post("/users", authenticateToken, requirePermission("create_users"), upload.single("photo"), async (req, res) => {
  const { name, email, phone, roles_permissions_id, status, password } =
    req.body;
  const photo = req.file ? req.file.filename : null;

  if (
    !name ||
    !email ||
    !phone ||
    !roles_permissions_id ||
    typeof status === "undefined" ||
    !password
  ) {
    return res.status(400).json({
      error:
        "All fields are required: name, email, phone, roles_permissions_id, status, password",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const isActive = status === "true" || status === true;

    const roleCheck = await pool.query(
      "SELECT role_name FROM roles_permissions WHERE id = $1 AND status = TRUE AND deleted_at IS NULL",
      [roles_permissions_id]
    );
    if (roleCheck.rowCount === 0) {
      return res
        .status(400)
        .json({ error: "Invalid, inactive, or deleted role" });
    }

    const result = await pool.query(
      "INSERT INTO users (name, email, phone, roles_permissions_id, is_active, password, photo) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        name,
        email,
        phone,
        roles_permissions_id,
        isActive,
        hashedPassword,
        photo,
      ]
    );
    const user = {
      ...result.rows[0],
      role: roleCheck.rows[0].role_name,
      roles_permissions_id: result.rows[0].roles_permissions_id,
      password: undefined,
      photo: result.rows[0].photo
        ? `${req.protocol}://${req.get("host")}/public/profile_photos/${
            result.rows[0].photo
          }`
        : null,
    };
    res.status(201).json(user);
  } catch (error) {
    console.error("❌ Database error:", error);
    if (error.code === "23505") {
      return res
        .status(400)
        .json({ error: "A user with this email already exists." });
    }
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

// PUT change password
router.put("/users/change-password", authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Current password and new password are required" });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ error: "New password must be at least 6 characters long" });
  }

  try {
    const userResult = await pool.query(
      "SELECT password FROM users WHERE id = $1",
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password
    );
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [hashedNewPassword, userId]
    );
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

// PUT update profile
router.put(
  "/profile",
  upload.single("photo"),
  authenticateToken,
  async (req, res) => {
    const { name, email, phone, roles_permissions_id } = req.body;
    const userId = req.user.id;

    if (!name || !phone || !roles_permissions_id) {
      return res
        .status(400)
        .json({ error: "Name, phone, and roles_permissions_id are required" });
    }

    try {
      // Check for duplicate email
      if (email) {
        const emailCheck = await pool.query(
          "SELECT id FROM users WHERE email = $1 AND id != $2 AND deleted_at IS NULL",
          [email, userId]
        );
        if (emailCheck.rowCount > 0) {
          return res
            .status(400)
            .json({ error: "A user with this email already exists." });
        }
      }

      const roleCheck = await pool.query(
        "SELECT role_name FROM roles_permissions WHERE id = $1 AND status = TRUE AND deleted_at IS NULL",
        [roles_permissions_id]
      );
      if (roleCheck.rowCount === 0) {
        return res
          .status(400)
          .json({ error: "Invalid, inactive, or deleted role" });
      }

      const currentUserResult = await pool.query(
        "SELECT photo FROM users WHERE id = $1",
        [userId]
      );
      const currentPhoto = currentUserResult.rows[0]?.photo;

      let photo;
      if (req.file) {
        photo = req.file.filename;
        if (currentPhoto) {
          const oldPhotoPath = path.join(uploadDir, currentPhoto);
          if (fs.existsSync(oldPhotoPath)) fs.unlinkSync(oldPhotoPath);
        }
      } else {
        photo = currentPhoto;
      }

      const updateResult = await pool.query(
        "UPDATE users SET name = $1, email = $2, phone = $3, roles_permissions_id = $4, photo = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 AND deleted_at IS NULL RETURNING *",
        [
          name,
          email || req.user.email,
          phone,
          roles_permissions_id,
          photo,
          userId,
        ]
      );

      if (updateResult.rowCount === 0) {
        return res
          .status(404)
          .json({ error: "User not found or already deleted" });
      }

      const updatedUser = {
        ...updateResult.rows[0],
        role: roleCheck.rows[0].role_name,
        roles_permissions_id,
        photo: updateResult.rows[0].photo
          ? `${req.protocol}://${req.get("host")}/public/profile_photos/${
              updateResult.rows[0].photo
            }`
          : null,
      };

      res
        .status(200)
        .json({ message: "Profile updated successfully", updatedUser });
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error.code === "23505") {
        return res
          .status(400)
          .json({ error: "A user with this email already exists." });
      }
      res
        .status(500)
        .json({ error: `Internal server error: ${error.message}` });
    }
  }
);

// PUT update user (admin)
router.put(
  "/users/:id",
  upload.single("photo"),
  authenticateToken,
  requirePermission("manage_users"),
  async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, roles_permissions_id, status } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !roles_permissions_id ||
      typeof status === "undefined"
    ) {
      return res.status(400).json({
        error:
          "Name, email, phone, roles_permissions_id, and status are required",
      });
    }

    try {
      const roleCheck = await pool.query(
        "SELECT role_name FROM roles_permissions WHERE id = $1 AND status = TRUE AND deleted_at IS NULL",
        [roles_permissions_id]
      );
      if (roleCheck.rowCount === 0) {
        return res
          .status(400)
          .json({ error: "Invalid, inactive, or deleted role" });
      }

      const userResult = await pool.query(
        "SELECT photo FROM users WHERE id = $1",
        [id]
      );
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      const currentPhoto = userResult.rows[0].photo;

      let photo;
      if (req.file) {
        photo = req.file.filename;
        if (currentPhoto) {
          const oldPhotoPath = path.join(uploadDir, currentPhoto);
          if (fs.existsSync(oldPhotoPath)) fs.unlinkSync(oldPhotoPath);
        }
      } else {
        photo = currentPhoto;
      }

      const isActive = status === "true" || status === true;
      await pool.query(
        "UPDATE users SET name = $1, email = $2, phone = $3, roles_permissions_id = $4, is_active = $5, photo = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 AND deleted_at IS NULL",
        [name, email, phone, roles_permissions_id, isActive, photo, id]
      );

      res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
      console.error("Error updating user:", error);
      if (error.code === "23505") {
        return res
          .status(400)
          .json({ error: "A user with this email already exists." });
      }
      res
        .status(500)
        .json({ error: `Internal server error: ${error.message}` });
    }
  }
);

// DELETE user (soft delete)
router.delete("/users/:id", authenticateToken, requirePermission("manage_users"), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "User not found or already deleted" });
    }

    if (result.rows[0].photo) {
      const photoPath = path.join(uploadDir, result.rows[0].photo);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

// Serve uploaded photos
router.use("/public/profile_photos", express.static(uploadDir));

export default router;
