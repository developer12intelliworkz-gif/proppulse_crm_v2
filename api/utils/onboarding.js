import pool from "../../database/config.js";

/**
 * Onboarding routing is based on total active user count for now.
 * TODO: Replace user-count heuristic with per-user company linkage once
 * multi-user-per-company onboarding is formalized — user count alone won't stay accurate.
 */
export async function getOnboardingStatusForUser(userId) {
  const userCountRes = await pool.query(
    `SELECT COUNT(*)::int AS count FROM users WHERE deleted_at IS NULL`,
  );
  const userCount = userCountRes.rows[0]?.count ?? 0;

  const userRes = await pool.query(
    `SELECT company_id, brand_id FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [userId],
  );
  const userCompanyId = userRes.rows[0]?.company_id ?? null;
  const userBrandId = userRes.rows[0]?.brand_id ?? null;
  const companyId = userCompanyId;

  let hasCompany = false;
  if (companyId) {
    const companyRes = await pool.query(
      `SELECT id FROM companies WHERE id = $1 LIMIT 1`,
      [companyId],
    );
    hasCompany = companyRes.rowCount > 0;
  }

  if (!hasCompany) {
    return {
      userCount,
      needsOnboarding: true,
      onboardingStep: "company",
      hasCompany: false,
      brandCount: 0,
      userCompanyId: null,
      userBrandId: null,
    };
  }

  const userBrandCountRes = await pool.query(
    `SELECT COUNT(*)::int AS count FROM user_brands WHERE user_id = $1`,
    [userId],
  );
  let brandCount = userBrandCountRes.rows[0]?.count ?? 0;

  if (brandCount === 0) {
    const companyBrandRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM brands WHERE company_id = $1`,
      [companyId],
    );
    brandCount = companyBrandRes.rows[0]?.count ?? 0;
  }

  if (brandCount === 0) {
    return {
      userCount,
      needsOnboarding: true,
      onboardingStep: "brand",
      hasCompany: true,
      brandCount: 0,
      userCompanyId: companyId,
      userBrandId: null,
    };
  }

  return {
    userCount,
    needsOnboarding: false,
    onboardingStep: null,
    hasCompany: true,
    brandCount,
    userCompanyId: companyId,
    userBrandId,
  };
}

export async function getOnboardingStatus() {
  const userCountRes = await pool.query(
    `SELECT COUNT(*)::int AS count FROM users WHERE deleted_at IS NULL`,
  );
  const userCount = userCountRes.rows[0]?.count ?? 0;
  return {
    userCount,
    needsOnboarding: userCount <= 1,
    onboardingStep: userCount <= 1 ? "company" : null,
    hasCompany: false,
    brandCount: 0,
  };
}

export async function linkUserToBrand(db, userId, brandId, { primary = true } = {}) {
  if (primary) {
    await db.query(
      `UPDATE user_brands SET is_primary = FALSE WHERE user_id = $1`,
      [userId],
    );
  }

  await db.query(
    `INSERT INTO user_brands (user_id, brand_id, is_primary)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, brand_id)
     DO UPDATE SET is_primary = EXCLUDED.is_primary`,
    [userId, brandId, primary],
  );

  if (primary) {
    await db.query(
      `UPDATE users SET brand_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [brandId, userId],
    );
  }
}

export async function getUserBrands(userId) {
  const result = await pool.query(
    `SELECT b.id, b.brand_display_name, b.brand_logo, b.brand_description,
            b.company_id, ub.is_primary
     FROM user_brands ub
     JOIN brands b ON b.id = ub.brand_id
     WHERE ub.user_id = $1
     ORDER BY ub.is_primary DESC, b.brand_display_name ASC`,
    [userId],
  );
  return result.rows;
}
