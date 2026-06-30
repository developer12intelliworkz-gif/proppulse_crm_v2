import pool from "../../database/config.js";
import { createNotificationsForEmails } from "./notification.controller.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { ensureUploadDir, toPublicUploadPath } from "../utils/uploadPaths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = ensureUploadDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const prefix = file.fieldname === "logo" ? "company" : "";
    cb(
      null,
      `${prefix ? `${prefix}-` : ""}${Date.now()}${path.extname(file.originalname)}`,
    );
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

export const createCompany = async (req, res) => {
  const {
    name,
    description,
    logo_url,
    website_url,
    time_zone,
    currency,
    custom_reporting_email,
    disclaimer,
    address,
    social_urls,
    contacts,
    marketing_domain,
    email_footer,
    dlt_details,
    notify_to_emails,
    created_by,
  } = req.body;

  const errors = [];
  if (!name) errors.push("Company name is required");
  if (!created_by) errors.push("Created by user ID is required");
  if (
    address &&
    (!address.address_line1 ||
      !address.city ||
      !address.state ||
      !address.country ||
      !address.zip)
  ) {
    errors.push(
      "All address fields (address_line1, city, state, country, zip) are required"
    );
  }
  if (contacts && (!Array.isArray(contacts) || contacts.length === 0)) {
    errors.push("At least one contact is required");
  }

  if (errors.length > 0) {
    return res
      .status(400)
      .json({ error: "Validation failed", details: errors });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const companyResult = await client.query(
      `
      INSERT INTO companies (
        id, name, description, logo_url, website_url, time_zone, currency,
        custom_reporting_email, disclaimer, created_by, created_at, updated_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id
    `,
      [
        name,
        description,
        logo_url,
        website_url,
        time_zone,
        currency,
        custom_reporting_email,
        disclaimer,
        created_by,
      ]
    );

    const companyId = companyResult.rows[0].id;

    // Insert address
    if (address) {
      await client.query(
        `
        INSERT INTO company_addresses (id, company_id, address_line1, address_line2, city, state, country, zip, created_at)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        `,
        [
          companyId,
          address.address_line1,
          address.address_line2,
          address.city,
          address.state,
          address.country,
          address.zip,
        ]
      );
    }

    // Insert social URLs
    if (social_urls) {
      await client.query(
        `
        INSERT INTO company_social_urls (id, company_id, facebook_url, twitter_url, google_plus_url, linkedin_url, youtube_url, instagram_url, created_at)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        `,
        [
          companyId,
          social_urls.facebook_url,
          social_urls.twitter_url,
          social_urls.google_plus_url,
          social_urls.linkedin_url,
          social_urls.youtube_url,
          social_urls.instagram_url,
        ]
      );
    }

    // Insert contacts
    if (contacts && Array.isArray(contacts)) {
      for (const contact of contacts) {
        await client.query(
          `
          INSERT INTO company_contacts (id, company_id, salutation, first_name, last_name, contact_type, phone, email, enable_notification_email, enable_notification_sms, is_primary, created_at)
          VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
          `,
          [
            companyId,
            contact.salutation,
            contact.first_name,
            contact.last_name,
            contact.contact_type,
            contact.phone,
            contact.email,
            contact.enable_notification_email,
            contact.enable_notification_sms,
            contact.is_primary,
          ]
        );
      }
    }

    // Insert marketing domain
    if (marketing_domain) {
      await client.query(
        `
        INSERT INTO company_marketing_domains (id, company_id, domain, created_at)
        VALUES (uuid_generate_v4(), $1, $2, CURRENT_TIMESTAMP)
        `,
        [companyId, marketing_domain.domain]
      );
    }

    // Insert email footer
    if (email_footer) {
      await client.query(
        `
        INSERT INTO company_email_footers (id, company_id, footer_text, created_at)
        VALUES (uuid_generate_v4(), $1, $2, CURRENT_TIMESTAMP)
        `,
        [companyId, email_footer.footer_text]
      );
    }

    // Insert DLT details
    if (dlt_details) {
      await client.query(
        `
        INSERT INTO company_dlt_details (id, company_id, dlt_entity_id, telemarketer_id, created_at)
        VALUES (uuid_generate_v4(), $1, $2, $3, CURRENT_TIMESTAMP)
        `,
        [companyId, dlt_details.dlt_entity_id, dlt_details.telemarketer_id]
      );
    }

    // Create notifications
    if (notify_to_emails) {
      const emails = notify_to_emails
        .split(",")
        .filter((email) => email.trim());
      if (emails.length > 0) {
        await createNotificationsForEmails(
          client,
          emails,
          "company_created",
          `New company "${name || "Untitled"}" has been created`,
          companyId,
          "company"
        );
      }
    }

    await client.query("COMMIT");
    res.json({ id: companyId, message: "Company created successfully" });
  } catch (error) {
    if (client)
      await client
        .query("ROLLBACK")
        .catch((err) => console.error("Rollback error:", err));
    console.error("Error in createCompany:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  } finally {
    if (client) client.release();
  }
};

export const updateCompany = async (req, res) => {
  const { id } = req.params;
  let input = { ...req.body };

  if (typeof req.body.registration === "string") {
    try {
      input = { registration: JSON.parse(req.body.registration) };
    } catch {
      return res.status(400).json({ error: "Invalid registration payload" });
    }
  } else if (typeof req.body.payload === "string") {
    try {
      input = JSON.parse(req.body.payload);
    } catch {
      return res.status(400).json({ error: "Invalid payload" });
    }
  }

  let logo_url = input.basics?.logo || "";
  if (req.file) {
    logo_url = toPublicUploadPath(req.file.filename);
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const companyCheck = await client.query(
      "SELECT id FROM companies WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );
    if (companyCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Company not found or deleted" });
    }

    if (input.basics) {
      const b = input.basics;
      await client.query(
        `
        UPDATE companies SET
          name = $1, description = $2, logo_url = $3, website_url = $4,
          time_zone = $5, currency = $6, custom_reporting_email = $7,
          disclaimer = $8, updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        `,
        [
          b.businessName,
          b.description,
          logo_url,
          b.website,
          b.timeZone,
          b.currency,
          b.customReportingEmail,
          b.disclaimer,
          id,
        ]
      );
    }

    if (input.address) {
      const a = input.address;
      await client.query(
        "DELETE FROM company_addresses WHERE company_id = $1",
        [id]
      );
      if (a.address1) {
        await client.query(
          `
          INSERT INTO company_addresses (id, company_id, address_line1, address_line2, city, state, country, zip, created_at)
          VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
          `,
          [id, a.address1, a.address2, a.city, a.state, a.country, a.zip]
        );
      }
    }

    if (input.socialUrls) {
      const s = input.socialUrls;
      await client.query(
        "DELETE FROM company_social_urls WHERE company_id = $1",
        [id]
      );
      await client.query(
        `
        INSERT INTO company_social_urls (id, company_id, facebook_url, twitter_url, google_plus_url, linkedin_url, youtube_url, instagram_url, created_at)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        `,
        [
          id,
          s.facebook,
          s.twitter,
          s.googlePlus,
          s.linkedIn,
          s.youtube,
          s.instagram,
        ]
      );
    }

    if (input.contacts) {
      await client.query("DELETE FROM company_contacts WHERE company_id = $1", [
        id,
      ]);
      for (const c of input.contacts) {
        await client.query(
          `
          INSERT INTO company_contacts (id, company_id, salutation, first_name, last_name, contact_type, phone, email, enable_notification_email, enable_notification_sms, is_primary, created_at)
          VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
          `,
          [
            id,
            c.salutation,
            c.firstName,
            c.lastName,
            c.contactType,
            c.phone,
            c.email,
            c.enableEmail,
            c.enableSms,
            c.isPrimary,
          ]
        );
      }
    }

    if (input.marketingDomain) {
      await client.query(
        "DELETE FROM company_marketing_domains WHERE company_id = $1",
        [id]
      );
      await client.query(
        `
        INSERT INTO company_marketing_domains (id, company_id, domain, created_at)
        VALUES (uuid_generate_v4(), $1, $2, CURRENT_TIMESTAMP)
        `,
        [id, input.marketingDomain.domains]
      );
    }

    if (input.emailFooter) {
      await client.query(
        "DELETE FROM company_email_footers WHERE company_id = $1",
        [id]
      );
      await client.query(
        `
        INSERT INTO company_email_footers (id, company_id, footer_text, created_at)
        VALUES (uuid_generate_v4(), $1, $2, CURRENT_TIMESTAMP)
        `,
        [id, input.emailFooter.footer]
      );
    }

    if (input.dltDetails) {
      await client.query(
        "DELETE FROM company_dlt_details WHERE company_id = $1",
        [id]
      );
      await client.query(
        `
        INSERT INTO company_dlt_details (id, company_id, dlt_entity_id, telemarketer_id, created_at)
        VALUES (uuid_generate_v4(), $1, $2, $3, CURRENT_TIMESTAMP)
        `,
        [id, input.dltDetails.dltEntityId, input.dltDetails.telemarketerId]
      );
    }

    if (input.registration) {
      const r = input.registration;
      let approvals = r.approvals;
      if (typeof approvals === "string") {
        try {
          approvals = JSON.parse(approvals);
        } catch {
          approvals = [];
        }
      }
      if (!Array.isArray(approvals)) approvals = [];

      const lat =
        r.latitude === "" || r.latitude === null || r.latitude === undefined
          ? null
          : Number(r.latitude);
      const lng =
        r.longitude === "" || r.longitude === null || r.longitude === undefined
          ? null
          : Number(r.longitude);

      await client.query(
        `
        UPDATE companies SET
          name = COALESCE($1, name),
          pan_card = $2,
          gst_no = $3,
          registered_office_address = $4,
          head_office_address = $5,
          contact_person = $6,
          contact_number_1 = $7,
          contact_number_2 = $8,
          company_location_search = $9,
          latitude = $10,
          longitude = $11,
          approvals = $12::jsonb,
          logo_url = COALESCE($13, logo_url),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $14
        `,
        [
          r.companyName || null,
          r.panCard || null,
          r.gstNo || null,
          r.registeredOfficeAddress || null,
          r.headOfficeAddress || null,
          r.contactPerson || null,
          r.contactNumber1 || null,
          r.contactNumber2 || null,
          r.companyLocationPin || null,
          Number.isFinite(lat) ? lat : null,
          Number.isFinite(lng) ? lng : null,
          JSON.stringify(approvals),
          req.file ? logo_url : null,
          id,
        ]
      );
    }

    // Create notifications if provided
    if (input.notify_to_emails) {
      const emails = input.notify_to_emails
        .split(",")
        .filter((email) => email.trim());
      if (emails.length > 0) {
        await createNotificationsForEmails(
          client,
          emails,
          "company_updated",
          `Company has been updated`,
          id,
          "company"
        );
      }
    }

    await client.query("COMMIT");
    res.json({ id, message: "Company updated successfully" });
  } catch (error) {
    if (client)
      await client
        .query("ROLLBACK")
        .catch((err) => console.error("Rollback error:", err));
    console.error("Error in updateCompany:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  } finally {
    if (client) client.release();
  }
};

export const deleteCompany = async (req, res) => {
  const { id } = req.params;
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const companyResult = await client.query(
      `
      UPDATE companies SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
      `,
      [id]
    );

    if (companyResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Company not found or already deleted" });
    }

    await client.query("COMMIT");
    res.json({ id, message: "Company deleted successfully" });
  } catch (error) {
    if (client)
      await client
        .query("ROLLBACK")
        .catch((err) => console.error("Rollback error:", err));
    console.error("Error in deleteCompany:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  } finally {
    if (client) client.release();
  }
};

export const getCompanies = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM companies WHERE deleted_at IS NULL"
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Error in getCompanies:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  } finally {
    if (client) client.release();
  }
};

export const getCompanyById = async (req, res) => {
  const { id } = req.params;
  let client;
  try {
    client = await pool.connect();
    const companyResult = await client.query(
      `
      SELECT c.*, 
             a.address_line1, a.address_line2, a.city, a.state, a.country, a.zip,
             s.facebook_url, s.twitter_url, s.google_plus_url, s.linkedin_url, s.youtube_url, s.instagram_url,
             array_agg(jsonb_build_object(
               'id', cc.id,
               'salutation', cc.salutation,
               'first_name', cc.first_name,
               'last_name', cc.last_name,
               'contact_type', cc.contact_type,
               'phone', cc.phone,
               'email', cc.email,
               'enable_notification_email', cc.enable_notification_email,
               'enable_notification_sms', cc.enable_notification_sms,
               'is_primary', cc.is_primary
             )) as contacts,
             md.domain,
             ef.footer_text,
             d.dlt_entity_id, d.telemarketer_id
      FROM companies c
      LEFT JOIN company_addresses a ON c.id = a.company_id
      LEFT JOIN company_social_urls s ON c.id = s.company_id
      LEFT JOIN company_contacts cc ON c.id = cc.company_id
      LEFT JOIN company_marketing_domains md ON c.id = md.company_id
      LEFT JOIN company_email_footers ef ON c.id = ef.company_id
      LEFT JOIN company_dlt_details d ON c.id = d.company_id
      WHERE c.id = $1 AND c.deleted_at IS NULL
      GROUP BY c.id, a.id, s.id, md.id, ef.id, d.id
      `,
      [id]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: "Company not found or deleted" });
    }

    const company = companyResult.rows[0];
    company.contacts = company.contacts || [];
    if (company.approvals && typeof company.approvals === "string") {
      try {
        company.approvals = JSON.parse(company.approvals);
      } catch {
        company.approvals = [];
      }
    }
    if (!Array.isArray(company.approvals)) {
      company.approvals = [];
    }
    res.json(company);
  } catch (error) {
    console.error("Error in getCompanyById:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  } finally {
    if (client) client.release();
  }
};
