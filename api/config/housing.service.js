import axios from "axios";
import crypto from "crypto";
import https from "https";
import dotenv from "dotenv";

dotenv.config();

const API_BASE_URL = "https://pahal.housing.com/api/v0/get-builder-leads";
const HOUSING_KEY = process.env.HOUSING_KEY;
const HOUSING_ID = process.env.HOUSING_ID;

if (!HOUSING_KEY || !HOUSING_ID) {
  console.error("❌ HOUSING_KEY and HOUSING_ID must be set in .env");
}

function generateHash(currentTime) {
  return crypto
    .createHmac("sha256", HOUSING_KEY)
    .update(currentTime.toString())
    .digest("hex");
}

export const fetchHousingLeads = async (startDate, endDate) => {
  try {
    if (!HOUSING_KEY || !HOUSING_ID) {
      throw new Error("HOUSING_KEY or HOUSING_ID not set in .env");
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const hash = generateHash(currentTime);

    const params = new URLSearchParams({
      start_date: startDate.toString(),
      end_date: endDate.toString(),
      current_time: currentTime.toString(),
      hash,
      id: HOUSING_ID,
    });

    const url = `${API_BASE_URL}?${params.toString()}`;
    console.log("📤 Housing Request URL:", url);

    const response = await axios.get(url, {
      headers: { "Cache-Control": "no-cache" },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    const data = response.data;
    const leadsRaw = data.data || [];
    const leads = [];

    for (const rawLead of leadsRaw) {
      const lead = {
        leadDate: rawLead.lead_date
          ? new Date(rawLead.lead_date * 1000).toISOString()
          : null,
        name: rawLead.lead_name || "Unknown",
        email: rawLead.lead_email || null,
        phone: rawLead.lead_phone
          ? `${rawLead.country_code || "+91"}-${rawLead.lead_phone}`
          : null,
        apartmentNames: rawLead.apartment_names || "",
        localityName: rawLead.locality_name || "",
        cityName: rawLead.city_name || "",
        minPrice: rawLead.min_price || null,
        maxPrice: rawLead.max_price || null,
        projectId: rawLead.project_id || null,
        propertyField: rawLead.property_field || [],
      };
      leads.push(lead);
    }

    console.log(`✅ Fetched ${leads.length} Housing leads`);
    return { success: true, leads, total: leads.length };
  } catch (error) {
    console.error("❌ Error fetching Housing leads:", error.message);
    if (error.response) console.error("Response:", error.response.data);
    return { success: false, error: error.message };
  }
};

// ... previous code same tak ...

export const syncHousingToDB = async (startDate, endDate) => {
  try {
    const { success, leads, error } = await fetchHousingLeads(
      startDate,
      endDate
    );
    if (!success) throw new Error(`Fetch failed: ${error}`);

    if (leads.length === 0) {
      console.log("ℹ️ No new Housing leads to sync.");
      return { synced: 0, skipped: 0 };
    }

    const { createLead } = await import("../controllers/leads.controller.js");

    let synced = 0;
    let skipped = 0;

    // Track emails to avoid duplicates in same batch
    const seenEmails = new Set();

    for (const lead of leads) {
      let cleanPhone = lead.phone || "";
      if (cleanPhone.startsWith("+91-"))
        cleanPhone = cleanPhone.replace("+91-", "");
      else if (cleanPhone.startsWith("+91"))
        cleanPhone = cleanPhone.replace("+91", "");

      const email = lead.email?.trim().toLowerCase() || null;

      // Skip if email already processed in this batch
      if (email && seenEmails.has(email)) {
        console.log(
          `⏭️ Skipped duplicate email in batch: ${lead.name} (${email})`
        );
        skipped++;
        continue;
      }
      if (email) seenEmails.add(email);

      // Parse budget range into min_budget and max_budget (assuming DB has these columns)
      let minBudget = null;
      let maxBudget = null;
      if (lead.minPrice && lead.maxPrice) {
        minBudget = parseInt(lead.minPrice);
        maxBudget = parseInt(lead.maxPrice);
        if (isNaN(minBudget)) minBudget = null;
        if (isNaN(maxBudget)) maxBudget = null;
      }

      const leadData = {
        name: lead.name?.trim() || "Unknown",
        email: email,
        phone: cleanPhone || null,
        lead_type: "housing",
        address:
          `${lead.localityName || ""}, ${lead.cityName || ""}`.trim() || null,
        property_type:
          lead.propertyField?.join(", ") ||
          lead.apartmentNames ||
          "Residential",
        min_budget: minBudget, // ← Yeh numeric hai
        max_budget: maxBudget, // ← Yeh numeric hai
        // Remove old string budget field
        message: `Interested in ${lead.apartmentNames || "property"} at ${
          lead.localityName || ""
        }, ${lead.cityName || ""}. Budget: ${lead.minPrice || "N/A"} - ${
          lead.maxPrice || "N/A"
        }`,
        interested_project_id: null,
        assigned_to: null,
        interest_level: null,
      };

      console.log(
        `💾 Saving Housing Lead: ${leadData.name} (${leadData.phone}) | Budget: ${minBudget}-${maxBudget}`
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
            `✅ Housing Lead Saved: ${data.name || leadData.name} (ID: ${
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
          console.warn(
            `⚠️ Failed with status ${mockRes.statusCode}: ${leadData.name}`
          );
          skipped++;
        }
      } catch (saveError) {
        console.error(
          `❌ Failed to save Housing lead ${leadData.name}:`,
          saveError.message || saveError
        );

        // Detect duplicate email from DB error
        if (
          saveError.message?.includes("duplicate key") ||
          saveError.message?.includes("already exists")
        ) {
          console.log(`⏭️ Skipped: Duplicate email in DB (${email})`);
        }
        skipped++;
      }
    }

    console.log(`🎉 Housing Sync Done: ${synced} saved, ${skipped} skipped`);
    return { synced, skipped };
  } catch (error) {
    console.error("❌ Housing sync failed:", error.message || error);
    throw error;
  }
};

// Test functions
export const testHousingFetch = async () => {
  const now = Math.floor(Date.now() / 1000);
  await fetchHousingLeads(now - 24 * 3600, now);
};

export const testHousingSync = async () => {
  const now = Math.floor(Date.now() / 1000);
  await syncHousingToDB(now - 48 * 3600, now);
};
