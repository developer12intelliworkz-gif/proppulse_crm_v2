import express from "express";
import pool from "../../database/config.js";

const router = express.Router();

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Real Estate CRM API is running",
    timestamp: new Date().toISOString(),
    database: "Connected",
  });
});

// Database connection test endpoint
router.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() as current_time, version() as version"
    );
    res.json({
      status: "success",
      message: "Database connection successful",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Database test error:", error);
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: error.message,
    });
  }
});

export default router;
