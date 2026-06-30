import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../database/config.js";
import { sendEmail } from "./config/email.js";

const router = express.Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Function to generate a 4-digit OTP
const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email and join roles_permissions to get their role
    const userQuery = `
      SELECT u.*, rp.role_name AS role
      FROM users u
      LEFT JOIN roles_permissions rp ON u.roles_permissions_id = rp.id
      WHERE u.email = $1
      AND u.is_active = true
      AND u.deleted_at IS NULL
    `;
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = userResult.rows[0];

    // Check password
    console.log("Login attempt for email:", email);
    console.log("Provided password:", password);
    console.log("Stored hash:", user.password);
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log("Password match:", isValidPassword);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const updateQuery =
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1";
    await pool.query(updateQuery, [user.id]);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Register endpoint (for admin to create users)
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, phone, role = "agent" } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: "Email, password, and name are required" });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const insertQuery = `
      INSERT INTO users (email, password, name, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, phone, role, created_at
    `;

    const result = await pool.query(insertQuery, [
      email,
      hashedPassword,
      name,
      phone,
      role,
    ]);
    const newUser = result.rows[0];

    res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST request OTP for forgot password
router.post("/request-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const client = await pool.connect(); // Transaction for safety
  try {
    await client.query("BEGIN");

    // Check if email exists (with active/soft-delete filter)
    const userResult = await client.query(
      "SELECT id FROM users WHERE email = $1 AND is_active = true AND deleted_at IS NULL",
      [email]
    );
    if (userResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "This email does not exist" });
    }

    // Generate and store OTP (5 min expiry)
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    console.log(
      `[OTP DEBUG] Generated: ${otp} for ${email}, expires: ${expiresAt.toISOString()}`
    );

    await client.query(
      "INSERT INTO otp_records (email, otp, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP",
      [email, otp, expiresAt]
    );

    // Dev bypass for testing (set true to log OTP in console, false for real email)
    const DEV_BYPASS_EMAIL = false; // Testing ke liye true rakh, baad mein false

    if (DEV_BYPASS_EMAIL) {
      console.log(`[DEV BYPASS] OTP "${otp}" sent to ${email} (check console)`);
    } else {
      // Simple template like leads code (spam avoid)
      const subject = `Shyam Group - Your OTP for Password Reset`;
      const text = `Hi,\n\nYour OTP: ${otp} (valid 5 mins).\n\nIgnore if not requested.\n\nShyam Group\nwww.shyamgroups.co.in`;
      const html = `<p>Hi,</p><p>Your OTP: <strong>${otp}</strong> (5 mins valid).</p><p>Ignore if not requested.</p><p>Shyam Group | <a href="https://www.shyamgroups.co.in">www.shyamgroups.co.in</a></p>`;

      await sendEmail(email, subject, text, html);
      console.log(`[OTP EMAIL SUCCESS] To ${email}`);
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error requesting OTP:", error);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  } finally {
    client.release();
  }
});

// POST verify OTP (do NOT delete OTP here - delay until reset)
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM otp_records WHERE email = $1 AND otp = $2 AND expires_at > CURRENT_TIMESTAMP",
      [email, otp]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Do NOT delete here - keep for re-verification in reset-password
    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

// POST reset password
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  console.log("Received reset-password request:", { email, otp, newPassword });

  if (!email || !otp || !newPassword) {
    console.log("Missing required fields");
    return res.status(400).json({
      error: "Email, OTP, and new password are required",
    });
  }

  if (newPassword.length < 6) {
    console.log("Password too short");
    return res
      .status(400)
      .json({ error: "New password must be at least 6 characters long" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Re-verify OTP
    console.log("Verifying OTP for email:", email);
    const otpResult = await client.query(
      "SELECT * FROM otp_records WHERE email = $1 AND otp = $2 AND expires_at > CURRENT_TIMESTAMP",
      [email, otp]
    );
    if (otpResult.rowCount === 0) {
      await client.query("ROLLBACK");
      console.log("Invalid or expired OTP for email:", email);
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    console.log("Checking user existence for email:", email);
    const userResult = await client.query(
      "SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL",
      [email]
    );
    if (userResult.rowCount === 0) {
      await client.query("ROLLBACK");
      console.log("User not found for email:", email);
      return res.status(404).json({ error: "This email does not exist" });
    }

    console.log("Hashing new password");
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("Updating user password for email:", email);
    const updateResult = await client.query(
      "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2 RETURNING id",
      [hashedPassword, email]
    );
    console.log("Update result:", updateResult.rowCount);

    // Delete OTP after successful reset
    await client.query("DELETE FROM otp_records WHERE email = $1", [email]);

    await client.query("COMMIT");
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error resetting password:", error);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  } finally {
    client.release();
  }
});

export default router;
