import pool from "../../database/config.js";

export async function ensureQuotationSchema() {
  try {
    // Add terms_and_conditions to quotation_templates
    await pool.query(`
      ALTER TABLE quotation_templates 
      ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT
    `);

    // Add terms_and_conditions to quotations
    await pool.query(`
      ALTER TABLE quotations 
      ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT
    `);

    console.log("Quotation schema bootstrap complete.");
  } catch (error) {
    console.error("Quotation schema bootstrap failed:", error);
    throw error;
  }
}
