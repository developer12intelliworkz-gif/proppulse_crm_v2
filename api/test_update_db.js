import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "crm",
  password: process.env.DB_PASSWORD || "1234",
  port: Number(process.env.DB_PORT || 5432),
});

async function main() {
  try {
    const id = 5698;
    const existingLead = await pool.query(
      "SELECT lead_type, assigned_to, email, phone, interested_project_id, created_at FROM leads WHERE id = $1 AND is_active = TRUE",
      [id],
    );

    const currentRow = existingLead.rows[0];
    const finalLeadType = currentRow.lead_type || "unknown";

    console.log("currentRow:", currentRow);
    console.log("finalLeadType:", finalLeadType);

    const query = `
      UPDATE leads
      SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        lead_type = $4,
        address = COALESCE($5, address),
        property_type = COALESCE($6, property_type),
        budget = COALESCE($7, budget),
        message = COALESCE($8, message),
        status = COALESCE($9, status),
        interest_level = COALESCE($10, interest_level),
        interested_project_id = COALESCE($11, interested_project_id),
        assigned_to = COALESCE($12, assigned_to),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13 AND is_active = TRUE
      RETURNING *
    `;

    const params = [
      null, // name
      null, // email
      null, // phone
      finalLeadType, // lead_type
      null, // address
      null, // property_type
      null, // budget
      null, // message
      "contacted", // status
      null, // interest_level
      null, // interested_project_id
      null, // assigned_to
      id,
    ];

    const result = await pool.query(query, params);
    console.log("Update successful! Result row:", result.rows[0]);

  } catch (err) {
    console.error("💥 Error during simulated update query:", err);
  } finally {
    await pool.end();
  }
}

main();
