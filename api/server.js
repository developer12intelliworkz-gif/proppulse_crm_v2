// Register pg DATE parser before any route loads a DB connection
import "../database/config.js";

import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";
import cron from "node-cron";
import { syncLeadsFromSheetInternal } from "./controllers/leads.controller.js";
import crypto from "crypto"; // For Meta webhook signature validation
import axios from "axios"; // For Graph API and Conversions API calls
import path from "path";
import { PROJECT_MEDIA_DIR } from "./utils/projectUploadPaths.js";
import reportsRoutes from "./routes/reports.js";
import chatRoutes from "./routes/chat.routes.js";
import http from "http";
import initSocket from "./socket/socket.js";
import { sync99AcresToDB } from "./config/99acres.service.js";
import { syncHousingToDB } from "./config/housing.service.js";
import { syncShyamGroupsToDB } from "./config/shyamgroups.service.js";
import followupsRoutes from "./routes/followups.js";

// Import routes
import authRoutes from "./auth.js";
import leadsRoutes from "./routes/leads.js";
import projectsRoutes from "./routes/projects.js";
import utilsRoutes from "./routes/utils.js";
import userRoutes from "./routes/user.routes.js";
import notificationRoutes from "./routes/notifications.js";
import taskRoutes from "./routes/tasks.js";
import companyRoutes from "./routes/companys.js";
import leadTypeRoutes from "./routes/leadTypes.js";
import rolesPermissionsRoutes from "./routes/rolesPermissions.routes.js";
import userProjectLeadRoutes from "./routes/userProjectLead.routes.js";
import documentsRoutes from "./routes/documents.js";
import quotationsRoutes from "./routes/quotations.js";
import amenitiesRoutes from "./routes/amenities.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env") });

const app = express();
const port = process.env.PORT || 3001;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((url) => url.trim())
  : [];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === "development") {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, "public")));

app.use(
  "/documents",
  express.static(path.join(process.cwd(), "public", "documents"))
);

// Serve static files from api/uploads using an absolute path
const uploadsPath = process.env.UPLOADS_PATH
  ? join(process.env.UPLOADS_PATH)
  : join(__dirname, "Uploads");

app.use("/api/uploads", express.static(uploadsPath));

// Serve main public folder
app.use(express.static(join(__dirname, "public")));

// CRITICAL: Serve project assets (VR + Brochures) — fixes spaces & (1) in filename
app.use("/project_vr_app_document", express.static(PROJECT_MEDIA_DIR));

// Your other static routes
app.use(
  "/documents",
  express.static(path.join(process.cwd(), "public", "documents"))
);
app.use("/api/uploads", express.static(uploadsPath));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/followups", followupsRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/amenities", amenitiesRoutes);
app.use("/api/utils", utilsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/leadtype", leadTypeRoutes);
app.use("/api/roles-permissions", rolesPermissionsRoutes);
app.use("/api/user-project-lead", userProjectLeadRoutes);
app.use("/api", rolesPermissionsRoutes);
app.use("/api", userRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api", quotationsRoutes);
app.use("/public", express.static("public"));

// FIXED: 99acres sync every 3 minutes (changed from 10)
cron.schedule("*/10 * * * *", async () => {
  try {
    const now = new Date();
    const endDate = now.toISOString().slice(0, 19).replace("T", " ");
    const startDate = new Date(now.getTime() - 48 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " "); // Last 2 days
    await sync99AcresToDB(startDate, endDate);
    console.log("Cron: 99acres sync done.");
  } catch (err) {
    console.error("Cron: 99acres sync failed:", err);
  }
});

// FIXED: Housing sync every 3 minutes (changed from 10)
cron.schedule("*/10 * * * *", async () => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const endTime = now;
    const startTime = now - 48 * 60 * 60; // Last 2 days
    await syncHousingToDB(startTime, endTime);
    console.log("Cron: Housing sync done.");
  } catch (err) {
    console.error("Cron: Housing sync failed:", err);
  }
});

cron.schedule("*/10 * * * *", async () => {
  try {
    await syncShyamGroupsToDB();
    console.log("Cron: Shyam Groups website inquiries sync done.");
  } catch (err) {
    console.error("Cron: Shyam Groups sync failed:", err);
  }
});

// Meta Webhook for Lead Ads
app.get("/api/webhook/meta-leads", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    console.log("Meta Webhook verified successfully!");
    return res.status(200).send(challenge);
  } else {
    console.error("Meta Webhook verification failed");
    return res.sendStatus(403);
  }
});

const httpServer = http.createServer(app);
initSocket(httpServer); // socket.io attach

// FIXED: Send conversion event to Meta Conversions API (moved outside for scope)
async function sendConversionToMeta(leadData, eventType = "Lead") {
  try {
    const userData = {
      em: leadData.email
        ? crypto
            .createHash("sha256")
            .update(leadData.email.toLowerCase().trim())
            .digest("hex")
        : undefined,
      // Add other fields like phone (ph), first_name (fn) if available
    };

    const eventData = {
      event_name: eventType,
      event_time: Math.floor(Date.now() / 1000),
      user_data: userData,
      action_source: "system_generated",
    };

    await axios.post(
      `https://graph.facebook.com/v20.0/${process.env.META_PIXEL_ID}/events?access_token=${process.env.META_CONVERSIONS_ACCESS_TOKEN}`,
      { data: [eventData] }
    );
    console.log(`Conversion event (${eventType}) sent to Meta`);
  } catch (error) {
    console.error(
      "Error sending conversion to Meta:",
      error.response ? error.response.data : error.message
    );
  }
}

// FIXED: Only httpServer.listen (removed duplicate app.listen at end)
httpServer.listen(port, () => {
  console.log(`Server running on port ${port} with Chat Enabled 🚀`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Database test: http://localhost:${port}/test-db`);
  console.log(`Meta Webhook: http://localhost:${port}/api/webhook/meta-leads`);

  // For Production and Testing the upcoming functions for leads 
  // OPTIONAL: Test sync on startup (uncomment for one-time test, then comment out)
  // test99AcresSync();
  // testHousingSync();
});

app.post("/api/webhook/meta-leads", async (req, res) => {
  const body = req.body;

  // Optional: Validate Meta's signature
  const signature = req.headers["x-hub-signature"];
  if (signature && process.env.META_APP_SECRET) {
    const expectedHash = crypto
      .createHmac("sha1", process.env.META_APP_SECRET)
      .update(JSON.stringify(body))
      .digest("hex");
    if (signature !== `sha1=${expectedHash}`) {
      console.error("Invalid Meta webhook signature");
      return res.sendStatus(403);
    }
  }

  // Process leadgen webhook
  if (body.object === "page") {
    for (const entry of body.entry) {
      for (const change of entry.changes || []) {
        if (change.field === "leadgen") {
          const leadgenId = change.value.leadgen_id;
          try {
            // Fetch full lead data from Graph API
            const leadResponse = await axios.get(
              `https://graph.facebook.com/v20.0/${leadgenId}?access_token=${process.env.META_PAGE_ACCESS_TOKEN}`
            );
            const leadData = leadResponse.data.field_data;

            // Parse lead data into a usable object
            const parsedLead = {};
            leadData.forEach((field) => {
              parsedLead[field.name] = field.values[0];
            });

            // Store in CRM (assumes /api/leads accepts POST with lead data)
            // FIXED: If self-CRM, use internal URL (add auth if needed)
            // await axios.post(`http://localhost:${port}/api/leads`, parsedLead, { headers: { Authorization: `Bearer ${process.env.JWT_SECRET}` } });
            await axios.post(
              `https://intelliworkz.digital:4443/api/leads`, // Keep external if needed
              parsedLead,
              {
                headers: { "Content-Type": "application/json" },
                // Add auth token if your /api/leads requires it
              }
            );

            // Send conversion event to Meta
            await sendConversionToMeta(parsedLead);

            console.log("Lead processed and stored:", parsedLead);
          } catch (error) {
            console.error(
              "Error processing lead:",
              error.response ? error.response.data : error.message
            );
          }
        }
      }
    }
  }

  // Always acknowledge Meta's webhook
  res.sendStatus(200);
});

// Schedule lead sync every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  try {
    await syncLeadsFromSheetInternal();
    console.log("Scheduled lead sync completed.");
  } catch (error) {
    console.error("Scheduled lead sync failed:", error);
  }
});

export { app as default };
