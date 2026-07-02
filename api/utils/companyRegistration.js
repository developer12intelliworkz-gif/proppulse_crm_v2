function formatAddressLines(address = {}) {
  const lines = [
    address.address1,
    address.address2,
    [address.city, address.state, address.zip].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean);
  return lines.join("\n");
}

function serializeHeadOfficeAddress(headOffice) {
  if (!headOffice || typeof headOffice !== "object") return null;
  return JSON.stringify(headOffice);
}

function normalizeApprovals(approvals) {
  if (typeof approvals === "string") {
    try {
      approvals = JSON.parse(approvals);
    } catch {
      approvals = [];
    }
  }
  return Array.isArray(approvals) ? approvals : [];
}

function normalizeContacts(contacts) {
  if (!Array.isArray(contacts)) return [];
  let normalized = contacts.map((c) => ({
    salutation: c.salutation || "",
    firstName: c.firstName || "",
    lastName: c.lastName || "",
    contactType: c.contactType || "",
    phone: c.phone || "",
    email: c.email || "",
    enableEmail: Boolean(c.enableEmail),
    enableSms: Boolean(c.enableSms),
    isPrimary: Boolean(c.isPrimary),
  }));

  const primaryIndexes = normalized
    .map((c, i) => (c.isPrimary ? i : -1))
    .filter((i) => i >= 0);

  if (primaryIndexes.length > 1) {
    normalized = normalized.map((c, i) => ({
      ...c,
      isPrimary: i === primaryIndexes[0],
    }));
  } else if (primaryIndexes.length === 0 && normalized.length > 0) {
    normalized[0] = { ...normalized[0], isPrimary: true };
  }

  return normalized;
}

let companyRegistrationSchemaEnsured = false;

async function ensureCompanyRegistrationColumns(client) {
  if (companyRegistrationSchemaEnsured) return;
  await client.query(`
    ALTER TABLE companies
      ADD COLUMN IF NOT EXISTS display_name TEXT,
      ADD COLUMN IF NOT EXISTS approval_notes TEXT;
  `);
  companyRegistrationSchemaEnsured = true;
}

export async function saveRegistrationBundle(
  client,
  companyId,
  registration,
  logoUrl,
) {
  const r = registration;
  const approvals = normalizeApprovals(r.approvals);

  const lat =
    r.latitude === "" || r.latitude === null || r.latitude === undefined
      ? null
      : Number(r.latitude);
  const lng =
    r.longitude === "" || r.longitude === null || r.longitude === undefined
      ? null
      : Number(r.longitude);

  const registeredOffice = r.registeredOffice || {};
  const headOffice = r.headOfficeSameAsRegistered
    ? registeredOffice
    : r.headOffice || {};

  await ensureCompanyRegistrationColumns(client);

  await client.query(
    `
    UPDATE companies SET
      name = COALESCE($1, name),
      display_name = $2,
      description = $3,
      website_url = $4,
      time_zone = $5,
      currency = $6,
      custom_reporting_email = $7,
      disclaimer = $8,
      pan_card = $9,
      gst_no = $10,
      registered_office_address = $11,
      head_office_address = $12,
      company_location_search = $13,
      latitude = $14,
      longitude = $15,
      approvals = $16::jsonb,
      approval_notes = $17,
      logo_url = CASE
        WHEN $18::boolean THEN NULL
        WHEN $19::text IS NOT NULL THEN $19::text
        ELSE logo_url
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $20
    `,
    [
      r.companyName || null,
      r.displayName || null,
      r.description || null,
      r.website || null,
      r.timeZone || null,
      r.currency || null,
      r.customReportingEmail || null,
      r.disclaimer || null,
      r.panCard || null,
      r.gstNo || null,
      formatAddressLines(registeredOffice) || null,
      serializeHeadOfficeAddress(headOffice),
      r.companyLocationPin || null,
      Number.isFinite(lat) ? lat : null,
      Number.isFinite(lng) ? lng : null,
      JSON.stringify(approvals),
      r.approvalNotes || null,
      Boolean(r.clearLogo),
      logoUrl || null,
      companyId,
    ],
  );

  await client.query("DELETE FROM company_addresses WHERE company_id = $1", [
    companyId,
  ]);
  if (registeredOffice.address1) {
    await client.query(
      `
      INSERT INTO company_addresses (id, company_id, address_line1, address_line2, city, state, country, zip, created_at)
      VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      `,
      [
        companyId,
        registeredOffice.address1,
        registeredOffice.address2 || null,
        registeredOffice.city,
        registeredOffice.state,
        registeredOffice.country,
        registeredOffice.zip,
      ],
    );
  }

  const social = r.socialUrls || {};
  await client.query("DELETE FROM company_social_urls WHERE company_id = $1", [
    companyId,
  ]);
  await client.query(
    `
    INSERT INTO company_social_urls (id, company_id, facebook_url, twitter_url, google_plus_url, linkedin_url, youtube_url, instagram_url, created_at)
    VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    `,
    [
      companyId,
      social.facebook || null,
      social.twitter || null,
      social.googleBusiness || null,
      social.linkedIn || null,
      social.youtube || null,
      social.instagram || null,
    ],
  );

  const contacts = normalizeContacts(r.contacts);
  await client.query("DELETE FROM company_contacts WHERE company_id = $1", [
    companyId,
  ]);
  for (const c of contacts) {
    await client.query(
      `
      INSERT INTO company_contacts (id, company_id, salutation, first_name, last_name, contact_type, phone, email, enable_notification_email, enable_notification_sms, is_primary, created_at)
      VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      `,
      [
        companyId,
        c.salutation,
        c.firstName,
        c.lastName,
        c.contactType,
        c.phone,
        c.email,
        c.enableEmail,
        c.enableSms,
        c.isPrimary,
      ],
    );
  }

  await client.query(
    "DELETE FROM company_marketing_domains WHERE company_id = $1",
    [companyId],
  );
  if (r.marketingDomains) {
    await client.query(
      `
      INSERT INTO company_marketing_domains (id, company_id, domain, created_at)
      VALUES (uuid_generate_v4(), $1, $2, CURRENT_TIMESTAMP)
      `,
      [companyId, r.marketingDomains],
    );
  }

  await client.query("DELETE FROM company_email_footers WHERE company_id = $1", [
    companyId,
  ]);
  if (r.emailFooter) {
    await client.query(
      `
      INSERT INTO company_email_footers (id, company_id, footer_text, created_at)
      VALUES (uuid_generate_v4(), $1, $2, CURRENT_TIMESTAMP)
      `,
      [companyId, r.emailFooter],
    );
  }

  await client.query("DELETE FROM company_dlt_details WHERE company_id = $1", [
    companyId,
  ]);
  if (r.dltEntityId || r.telemarketerId) {
    await client.query(
      `
      INSERT INTO company_dlt_details (id, company_id, dlt_entity_id, telemarketer_id, created_at)
      VALUES (uuid_generate_v4(), $1, $2, $3, CURRENT_TIMESTAMP)
      `,
      [companyId, r.dltEntityId || null, r.telemarketerId || null],
    );
  }
}
