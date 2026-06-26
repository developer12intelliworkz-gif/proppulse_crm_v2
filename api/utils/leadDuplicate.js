/** Inquiry calendar day for duplicate detection (IST). */
export const LEAD_INQUIRY_TZ = "Asia/Kolkata";

export function leadInquiryDateSql(column = "created_at") {
  return `((${column} AT TIME ZONE 'UTC') AT TIME ZONE '${LEAD_INQUIRY_TZ}')::date`;
}

/** Safe single-row lead_types join (avoids duplicate rows when name/id both match). */
export const LEAD_TYPE_JOIN_LATERAL = `
  LEFT JOIN LATERAL (
    SELECT lt.name
    FROM lead_types lt
    WHERE lt.deleted_at IS NULL
      AND (
        l.lead_type::text = lt.id::text
        OR LOWER(TRIM(l.lead_type::text)) = LOWER(TRIM(lt.name))
      )
    ORDER BY CASE WHEN l.lead_type::text = lt.id::text THEN 0 ELSE 1 END
    LIMIT 1
  ) lt ON TRUE
`;

export function normalizeInquiryDate(value) {
  if (value == null || value === "") return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value.trim())) {
    return value.trim().slice(0, 10);
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LEAD_INQUIRY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * True if another active lead shares email or phone on the same inquiry day.
 * @param {object} opts
 * @param {string|null} opts.inquiryDate - YYYY-MM-DD or null for today (IST)
 */
export async function hasLeadOnSameInquiryDay(
  pool,
  { email, phone, inquiryDate = null, excludeLeadId = null },
) {
  const normalizedEmail = email?.trim() || null;
  const normalizedPhone = phone?.trim() || null;
  if (!normalizedEmail && !normalizedPhone) return false;

  const params = [];
  const clauses = ["is_active = TRUE"];
  let n = 1;

  if (excludeLeadId != null) {
    clauses.push(`id != $${n++}`);
    params.push(excludeLeadId);
  }

  const identity = [];
  if (normalizedEmail) {
    identity.push(`LOWER(TRIM(email)) = LOWER(TRIM($${n++}))`);
    params.push(normalizedEmail);
  }
  if (normalizedPhone) {
    identity.push(`TRIM(phone) = TRIM($${n++})`);
    params.push(normalizedPhone);
  }
  clauses.push(`(${identity.join(" OR ")})`);

  if (inquiryDate) {
    clauses.push(`${leadInquiryDateSql("created_at")} = $${n++}::date`);
    params.push(inquiryDate);
  } else {
    clauses.push(
      `${leadInquiryDateSql("created_at")} = (NOW() AT TIME ZONE '${LEAD_INQUIRY_TZ}')::date`,
    );
  }

  const result = await pool.query(
    `SELECT id FROM leads WHERE ${clauses.join(" AND ")} LIMIT 1`,
    params,
  );
  return result.rows.length > 0;
}

/** Digits-only phone for matching (strips country code when 12-digit 91…). */
export function normalizePhoneDigits(phone) {
  if (phone == null || phone === "") return null;
  let digits = String(phone).replace(/\D/g, "");
  if (digits.length < 6) return null;
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length > 15) digits = digits.slice(-15);
  return digits;
}

/**
 * Skip import when the same API row or an active lead with the same email/phone exists.
 */
export async function hasExistingLeadForImport(
  pool,
  { externalId, email, phone },
) {
  if (externalId) {
    const byExt = await pool.query(
      `SELECT 1 FROM leads WHERE is_active = TRUE AND external_id = $1 LIMIT 1`,
      [externalId],
    );
    if (byExt.rows.length > 0) return true;
  }

  const normEmail = email?.trim().toLowerCase() || null;
  const normPhone = normalizePhoneDigits(phone);
  if (!normEmail && !normPhone) return false;

  const parts = [];
  const params = [];
  let n = 1;
  if (normEmail) {
    parts.push(`LOWER(TRIM(email)) = $${n++}`);
    params.push(normEmail);
  }
  if (normPhone) {
    parts.push(`REGEXP_REPLACE(COALESCE(phone, ''), '\\D', '', 'g') = $${n++}`);
    params.push(normPhone);
  }
  const result = await pool.query(
    `SELECT 1 FROM leads WHERE is_active = TRUE AND (${parts.join(" OR ")}) LIMIT 1`,
    params,
  );
  return result.rows.length > 0;
}
