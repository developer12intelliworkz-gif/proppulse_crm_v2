import pool from "../../database/config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let ensured = false;

/**
 * Idempotently applies onboarding migrations (user_brands, brand_id, etc.)
 * so /onboarding/status and /onboarding/brands/me do not 500 on fresh DBs.
 */
export async function ensureOnboardingSchema() {
  if (ensured) return;

  const migrationPath = path.join(
    __dirname,
    "..",
    "..",
    "migration",
    "2026-06-24-onboarding-foundation.sql",
  );
  const brandIdMigration = path.join(
    __dirname,
    "..",
    "..",
    "migration",
    "2026-06-19-users-brand-id.sql",
  );
  const companyBrandsMigration = path.join(
    __dirname,
    "..",
    "..",
    "migration",
    "2026-06-15-company-registration-brands.sql",
  );
  const companyConsolidatedMigration = path.join(
    __dirname,
    "..",
    "..",
    "migration",
    "2026-07-01-company-registration-consolidated.sql",
  );
  const multiTenantMigration = path.join(
    __dirname,
    "..",
    "..",
    "migration",
    "2026-06-18-multi-tenant-foundation.sql",
  );

  const files = [
    companyBrandsMigration,
    companyConsolidatedMigration,
    multiTenantMigration,
    brandIdMigration,
    migrationPath,
  ].filter((f) => fs.existsSync(f));

  for (const file of files) {
    const sql = fs.readFileSync(file, "utf8");
    try {
      await pool.query(sql);
    } catch (error) {
      // Ignore "already exists" from concurrent startups
      if (error.code !== "42P07" && error.code !== "42701") {
        console.warn(`[onboarding-schema] ${path.basename(file)}:`, error.message);
      }
    }
  }

  ensured = true;
}
