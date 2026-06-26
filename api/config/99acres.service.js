import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import dotenv from "dotenv";
import FormData from "form-data";

dotenv.config();

const API_URL =
  process.env.NINETY_NINE_ACRES_API_URL ||
  "https://www.99acres.com/99api/v1/getmy99Response/OeAuXClO43hwseaXEQ/uid/";
const USERNAME = process.env.NINETY_NINE_ACRES_USERNAME;
const PASSWORD = process.env.NINETY_NINE_ACRES_PASSWORD;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function generateRequestXML(startDate, endDate) {
  return `<?xml version="1.0"?>
<query>
  <user_name>${USERNAME}</user_name>
  <pswd>${PASSWORD}</pswd>
  <start_date>${startDate}</start_date>
  <end_date>${endDate}</end_date>
</query>`;
}

export const fetch99AcresLeads = async (startDate, endDate) => {
  try {
    if (!USERNAME || !PASSWORD) throw new Error("99acres credentials missing");

    const requestXML = generateRequestXML(startDate, endDate);
    const formData = new FormData();
    formData.append("xml", requestXML);

    const response = await axios.post(API_URL, formData, {
      headers: { ...formData.getHeaders() },
    });

    const parsed = parser.parse(response.data);
    const actionStatus = parsed.Xml?.["@_ActionStatus"];

    if (actionStatus === "false") {
      throw new Error(
        `99acres API Error: ${parsed.Xml?.ErrorDetail?.Message || "Unknown"}`
      );
    }
    if (actionStatus !== "true")
      throw new Error("Invalid response from 99acres");

    const respArray = Array.isArray(parsed.Xml.Resp)
      ? parsed.Xml.Resp
      : [parsed.Xml.Resp || []];
    const leads = [];

    for (const resp of respArray) {
      if (resp.QryDtl && resp.CntctDtl) {
        const q = resp.QryDtl;
        const c = resp.CntctDtl;

        leads.push({
          name: c.Name || "Unknown",
          email: c.Email || null,
          phone: c.Phone || null,
          queryInfo: q.QryInfo || "",
          compactLabel: q.CmpctLabl || "",
          cityName: q.CityName || "",
          projName: q.ProjName || "",
          price: q.Price || null,
          resType: q["@_ResType"] || "",
          identity: q.IDENTITY || "",
          projId: q.ProjId || null,
        });
      }
    }

    console.log(`✅ Fetched ${leads.length} 99acres leads`);
    return { success: true, leads, total: leads.length };
  } catch (error) {
    console.error("❌ 99acres fetch error:", error.message);
    return { success: false, error: error.message };
  }
};

// ... previous fetch code same ...

export const sync99AcresToDB = async (startDate, endDate) => {
  try {
    const { success, leads, error } = await fetch99AcresLeads(
      startDate,
      endDate
    );
    if (!success) throw new Error(error);

    if (leads.length === 0) {
      console.log("ℹ️ No new 99acres leads");
      return { synced: 0, skipped: 0 };
    }

    const { createLead } = await import("../controllers/leads.controller.js");

    let synced = 0;
    let skipped = 0;
    const seenEmails = new Set();

    for (const lead of leads) {
      let cleanPhone = lead.phone || "";
      if (cleanPhone.startsWith("+91-"))
        cleanPhone = cleanPhone.replace("+91-", "");
      else if (cleanPhone.startsWith("+91"))
        cleanPhone = cleanPhone.replace("+91", "");

      // Safe email handling
      const email =
        typeof lead.email === "string"
          ? lead.email.trim().toLowerCase() || null
          : null;

      // Skip duplicate in batch
      if (email && seenEmails.has(email)) {
        console.log(
          `⏭️ Skipped duplicate email (batch): ${lead.name} (${email})`
        );
        skipped++;
        continue;
      }
      if (email) seenEmails.add(email);

      const budget = lead.price ? parseInt(lead.price) : null;
      const safeBudget = isNaN(budget) ? null : budget;

      const leadData = {
        name:
          (typeof lead.name === "string" ? lead.name.trim() : lead.name) ||
          "Unknown",
        email: email,
        phone: cleanPhone || null,
        lead_type: "99acres",
        address:
          `${lead.cityName || ""} - ${lead.projName || ""}`.trim() || null,
        property_type: lead.resType === "S2M" ? "Residential" : "Unknown",
        min_budget: safeBudget,
        max_budget: safeBudget, // Assuming single price
        message:
          (typeof lead.queryInfo === "string" ? lead.queryInfo.trim() : "") ||
          `Interested in ${lead.compactLabel || "property"}`,
        interested_project_id: null,
        assigned_to: null,
        interest_level: lead.identity === "Hot Lead" ? "High" : "Medium",
      };

      console.log(
        `💾 Saving 99acres Lead: ${leadData.name} (${leadData.phone})`
      );

      const mockReq = { body: leadData };
      const mockRes = {
        statusCode: 200,
        status: function (code) {
          this.statusCode = code;
          return this;
        },
        json: function (data) {
          console.log(
            `✅ 99acres Lead Saved: ${data.name || leadData.name} (ID: ${
              data.id || "N/A"
            })`
          );
          return this;
        },
        send: function () {
          return this;
        },
        end: function () {
          return this;
        },
      };

      try {
        await createLead(mockReq, mockRes);
        if (mockRes.statusCode >= 200 && mockRes.statusCode < 300) {
          synced++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(
          `❌ Failed to save 99acres lead ${leadData.name}:`,
          err.message
        );
        if (
          err.message?.includes("duplicate key") ||
          err.message?.includes("already exists")
        ) {
          console.log(
            `⏭️ Skipped: Already exists in DB (${email || leadData.phone})`
          );
        }
        skipped++;
      }
    }

    console.log(`🎉 99acres Sync Done: ${synced} saved, ${skipped} skipped`);
    return { synced, skipped };
  } catch (error) {
    console.error("❌ 99acres sync failed:", error.message || error);
    throw error;
  }
};

export const test99AcresSync = async () => {
  const now = new Date();
  const endDate = now.toISOString().slice(0, 19).replace("T", " ");
  const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  await sync99AcresToDB(startDate, endDate);
};
