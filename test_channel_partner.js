import pool from "./database/config.js";
import jwt from "jsonwebtoken";
import axios from "axios";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

async function test() {
  try {
    // 1. Get Manthan Panchal's info
    const userRes = await pool.query(
      "SELECT u.*, rp.role_name AS role FROM users u LEFT JOIN roles_permissions rp ON u.roles_permissions_id = rp.id WHERE u.email = 'developer12.intelliworkz@gmail.com'"
    );
    const user = userRes.rows[0];
    console.log("Found user:", user.name, "with role:", user.role);

    // 2. Generate token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    console.log("Generated token:", token);

    // 3. Request /leads
    try {
      console.log("Calling GET http://localhost:3001/leads...");
      const leadsRes = await axios.get("http://localhost:3001/leads", {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("GET /leads response:", leadsRes.status, leadsRes.data.length, "leads");
    } catch (err) {
      console.error("GET /leads failed:", err.response?.status, JSON.stringify(err.response?.data, null, 2));
    }

    // 4. Request /projects
    try {
      console.log("Calling GET http://localhost:3001/projects...");
      const projectsRes = await axios.get("http://localhost:3001/projects", {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("GET /projects response:", projectsRes.status, projectsRes.data.length, "projects");
    } catch (err) {
      console.error("GET /projects failed:", err.response?.status, JSON.stringify(err.response?.data, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

test();
