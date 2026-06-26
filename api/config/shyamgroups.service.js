import axios from "axios";
import https from "https";
import dotenv from "dotenv";
import pool from "../../database/config.js";
import {
  hasExistingLeadForImport,
  normalizePhoneDigits,
} from "../utils/leadDuplicate.js";

dotenv.config();

const DEFAULT_API_URL =
  "https://www.shyamgroups.co.in/api/all-inquiries";

const INQUIRY_SOURCES = [
  { key: "modal_inquiries", bucket: "modal", dateField: "created_at" },
  { key: "contact_inq", bucket: "contact", dateField: "add_date" },
  { key: "WhatsappInquiry", bucket: "whatsapp", dateField: "created_at" },
];

function buildExternalId(bucket, id) {
  return `shyam:${bucket}:${id}`;
}

function parseApiDate(value) {
  if (!value) return new Date();
  const raw = String(value).trim();
  if (!raw) return new Date();
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const d = new Date(`${normalized}+05:30`);
  if (!Number.isNaN(d.getTime())) return d;
  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
}

function cleanEmail(value) {
  const email = String(value || "").trim();
  if (!email || !email.includes("@")) return null;
  return email.toLowerCase();
}

function cleanPhone(value) {
  const digits = normalizePhoneDigits(value);
  return digits || null;
}

function cleanName(value, fallback) {
  const name = String(value || "").trim();
  return name || fallback;
}

function buildMessage(record, bucket) {
  const subject = String(record.subject || "").trim();
  const comment = String(record.comment || record.message || "").trim();
  if (bucket === "whatsapp") {
    return comment || "WhatsApp inquiry from website";
  }
  if (subject && comment) return `${subject}: ${comment}`;
  return comment || subject || null;
}

function normalizeModalRecord(record) {
  const id = record.id;
  if (id == null || id === "") return null;
  return {
    externalId: buildExternalId("modal", id),
    name: cleanName(record.name, "Website Lead"),
    email: cleanEmail(record.email),
    phone: cleanPhone(record.phone),
    address: String(record.city || "").trim() || null,
    message: buildMessage(record, "modal"),
    createdAt: parseApiDate(record.created_at),
  };
}

function normalizeContactRecord(record) {
  const id = record.id;
  if (id == null || id === "") return null;
  return {
    externalId: buildExternalId("contact", id),
    name: cleanName(record.name, "Website Lead"),
    email: cleanEmail(record.email),
    phone: cleanPhone(record.phone),
    address: String(record.city || "").trim() || null,
    message: buildMessage(record, "contact"),
    createdAt: parseApiDate(record.add_date),
  };
}

function normalizeWhatsappRecord(record) {
  const id = record.id;
  if (id == null || id === "") return null;
  const phone = cleanPhone(record.phone);
  if (!phone) return null;
  return {
    externalId: buildExternalId("whatsapp", id),
    name: "WhatsApp Lead",
    email: null,
    phone,
    address: null,
    message: buildMessage(record, "whatsapp"),
    createdAt: parseApiDate(record.created_at),
  };
}

function normalizeRecord(record, bucket) {
  switch (bucket) {
    case "modal":
      return normalizeModalRecord(record);
    case "contact":
      return normalizeContactRecord(record);
    case "whatsapp":
      return normalizeWhatsappRecord(record);
    default:
      return null;
  }
}

export async function fetchAllShyamInquiries() {
  const url =
    process.env.SHYAMGROUPS_INQUIRIES_API_URL || DEFAULT_API_URL;

  const response = await axios.get(url, {
    timeout: 120000,
    headers: { Accept: "application/json" },
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  });

  const body = response.data;
  if (!body?.status || !body?.data) {
    throw new Error(body?.message || "Invalid response from Shyam Groups API");
  }

  const leads = [];
  for (const { key, bucket } of INQUIRY_SOURCES) {
    const block = body.data[key];
    const records = block?.records || [];
    for (const record of records) {
      const normalized = normalizeRecord(record, bucket);
      if (normalized) leads.push(normalized);
    }
  }

  return { leads, raw: body.data };
}

async function insertWebsiteLead(lead) {
  await pool.query(
    `INSERT INTO leads (
      name, email, phone, lead_type, address, property_type, budget, message,
      status, interest_level, is_active, created_at, interested_project_id,
      external_id, assigned_to
    ) VALUES (
      $1, $2, $3, $4, $5, NULL, NULL, $6, $7, $8, TRUE, $9, NULL, $10, NULL
    )`,
    [
      lead.name,
      lead.email,
      lead.phone,
      "website",
      lead.address,
      lead.message,
      "new",
      null,
      lead.createdAt,
      lead.externalId,
    ],
  );
}

export async function syncShyamGroupsToDB() {
  const { leads } = await fetchAllShyamInquiries();
  if (leads.length === 0) {
    console.log("ℹ️ No Shyam Groups inquiries to process.");
    return { synced: 0, skipped: 0, total: 0 };
  }

  let synced = 0;
  let skipped = 0;
  const seenExternalIds = new Set();

  for (const lead of leads) {
    if (seenExternalIds.has(lead.externalId)) {
      skipped++;
      continue;
    }
    seenExternalIds.add(lead.externalId);

    const exists = await hasExistingLeadForImport(pool, {
      externalId: lead.externalId,
      email: lead.email,
      phone: lead.phone,
    });
    if (exists) {
      skipped++;
      continue;
    }

    if (!lead.email && !lead.phone) {
      skipped++;
      continue;
    }

    try {
      await insertWebsiteLead(lead);
      synced++;
    } catch (err) {
      if (
        err.code === "23505" ||
        err.message?.includes("duplicate key") ||
        err.message?.includes("unique")
      ) {
        skipped++;
        continue;
      }
      throw err;
    }
  }

  console.log(
    `🎉 Shyam Groups sync done: ${synced} saved, ${skipped} skipped (${leads.length} from API)`,
  );
  return { synced, skipped, total: leads.length };
}

export const testShyamGroupsSync = async () => {
  await syncShyamGroupsToDB();
};
