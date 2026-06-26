import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";
import cron from "node-cron";
import helmet from "helmet";
import { syncLeadsFromSheetInternal } from "./controllers/leads.controller.js";
import chatRoutes from "./routes/chat.routes.js";
import http from "http";
import initSocket from "./socket/socket.js";
import quotationsRoutes from "./routes/quotations.js";
import followupsRoutes from "./routes/followups.js";

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
import documentsRoutes from "./routes/documents.js";
import reportsRoutes from "./routes/reports.js";
import webhooksRoutes from "./routes/webhooks.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = process.env.PORT || 3001;

dotenv.config({ path: join(__dirname, ".env") });

const app = express();

console.log("Current __dirname:", __dirname);
console.log("Current process.cwd():", process.cwd());

app.use(
  "/api/public/documents",
  express.static("/home/crm/public_html/api/public/documents"),
);

const uploadsPath = process.env.UPLOADS_PATH
  ? join(process.env.UPLOADS_PATH)
  : join(__dirname, "uploads");

console.log("Uploads path:", uploadsPath);
app.use("/api/public", express.static(uploadsPath));

const leadIconsPath = join(__dirname, "public", "lead_icons");
console.log("Lead icons path:", leadIconsPath);
app.use("/api/public/lead_icons", express.static(leadIconsPath));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "connect-src": ["'self'", "https://intelliworkz.digital:4443"],
      },
    },
  }),
);

// CORS — PATCH required for task Kanban + follow-up status/complete/reschedule
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://intelliworkz.digital");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, X-Requested-With",
  );
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`,
  );
  next();
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/", utilsRoutes);
app.use("/api", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/leadtype", leadTypeRoutes);
app.use("/api", rolesPermissionsRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api", webhooksRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/followups", followupsRoutes);
app.use("/api", quotationsRoutes);

cron.schedule(
  "*/5 * * * *",
  async () => {
    try {
      console.log("Attempting scheduled lead sync at:", new Date().toISOString());
      await syncLeadsFromSheetInternal();
      console.log("Scheduled lead sync completed at:", new Date().toISOString());
    } catch (error) {
      console.error("Scheduled lead sync failed:", error);
    }
  },
  { scheduled: false },
);

app.set("trust proxy", true);
app.use((req, res, next) => {
  const proto = req.headers["x-forwarded-proto"];
  if (proto === "http" && process.env.NODE_ENV === "production") {
    const host = req.headers.host || req.hostname;
    return res.redirect(`https://${host}${req.originalUrl}`);
  }
  next();
});

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port} with Chat Enabled 🚀`);
  console.log(`✅ Real Estate CRM API running on port ${port}`);
  console.log(`🌐 Health check: https://intelliworkz.digital:${port}/health`);
});

export default app;
