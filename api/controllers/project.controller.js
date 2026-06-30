// // controllers/project.controller.js
// import pool from "../../database/config.js";
// import { createNotificationsForEmails } from "./notification.controller.js";
// import multer from "multer";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const uploadPath = path.join(__dirname, "../../public/project_vr_app_document");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     try {
//       if (!fs.existsSync(uploadPath)) {
//         fs.mkdirSync(uploadPath, { recursive: true });
//       }
//       cb(null, uploadPath);
//     } catch (err) {
//       cb(err);
//     }
//   },
//   filename: (req, file, cb) => {
//     // Use unique filename to avoid collision
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, `${uniqueSuffix}-${file.originalname}`);
//   },
// });

// const upload = multer({ storage });

// // ---------------- CREATE PROJECT ----------------
// export const createProject = [
//   upload.single("vr_upload"),
//   async (req, res) => {
//     const {
//       name,
//       description,
//       rera_project_id,
//       sales,
//       notify_to_emails,
//       launched_on,
//       expected_completion,
//       possession,
//       is_active,
//       inventory,
//       search_address,
//       address,
//       street,
//       country,
//       state,
//       city,
//       zip,
//       locality,
//       latitude,
//       longitude,
//       enable_vr,
//       // vr_app_id removed
//       amenities,
//       specifications,
//       brochures,
//       price_quotes,
//       india_property_code,
//       magicbricks_code,
//       status,
//       created_by,
//       completed_steps,
//     } = req.body;

//     // Validation
//     const errors = [];
//     // If VR enabled, require uploaded file (or allow body-provided filename if you want)
//     const hasVrUpload = req.file && req.file.filename;
//     if (status === "completed") {
//       if (!name) errors.push("Project name is required");
//       if (!search_address || !address || !city || !state || !country || !zip) {
//         errors.push(
//           "All address fields (search_address, address, city, state, country, zip) are required"
//         );
//       }
//       if (
//         !specifications ||
//         !Array.isArray(specifications) ||
//         specifications.length === 0
//       ) {
//         errors.push("At least one specification is required");
//       }
//       if (!brochures || !Array.isArray(brochures) || brochures.length === 0) {
//         errors.push("At least one brochure is required");
//       }
//       if (
//         !price_quotes ||
//         !Array.isArray(price_quotes) ||
//         price_quotes.length === 0
//       ) {
//         errors.push("At least one price quote is required");
//       }
//       if (!india_property_code && !magicbricks_code) {
//         errors.push("At least one property code is required");
//       }
//       if (enable_vr && !hasVrUpload)
//         errors.push("VR Upload is required when VR is enabled");
//       if (!created_by) errors.push("Created by user ID is required");
//     } else {
//       if (!created_by) errors.push("Created by user ID is required");
//     }

//     // Validate date fields (YYYY-MM-DD)
//     const isValidDate = (dateStr) =>
//       !dateStr ||
//       (/^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(Date.parse(dateStr)));
//     if (launched_on && !isValidDate(launched_on))
//       errors.push("Launched on must be a valid date (YYYY-MM-DD) or null");
//     if (expected_completion && !isValidDate(expected_completion))
//       errors.push(
//         "Expected completion must be a valid date (YYYY-MM-DD) or null"
//       );
//     if (possession && !isValidDate(possession))
//       errors.push("Possession must be a valid date (YYYY-MM-DD) or null");

//     if (errors.length > 0) {
//       // If a file was uploaded but validation failed, you might want to remove it from disk.
//       if (req.file && req.file.path && fs.existsSync(req.file.path)) {
//         try {
//           fs.unlinkSync(req.file.path);
//         } catch (e) {}
//       }
//       return res
//         .status(400)
//         .json({ error: "Validation failed", details: errors });
//     }

//     let client;
//     try {
//       client = await pool.connect();
//       if (typeof client.query !== "function") {
//         throw new Error("Client query method is not a function");
//       }
//       await client.query("BEGIN");

//       // Parse notify_to_emails once
//       const parsedNotifyEmails = notify_to_emails
//         ? notify_to_emails
//             .split(",")
//             .map((e) => e.trim())
//             .filter((e) => e)
//         : [];

//       // Insert main project row (vr_upload instead of vr_app_id)
//       const projectResult = await client.query(
//         `
//         INSERT INTO projects (
//           name, description, rera_project_id, sales, notify_to_emails, launched_on,
//           expected_completion, possession, is_active, inventory, search_address,
//           address, street, country, state, city, zip, locality, latitude, longitude,
//           enable_vr, vr_upload, amenities, india_property_code, magicbricks_code,
//           status, created_by, completed_steps, created_at, updated_at
//         ) VALUES (
//           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
//           $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
//           CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
//         ) RETURNING id, name
//         `,
//         [
//           name || null,
//           description || null,
//           rera_project_id || null,
//           sales || null,
//           parsedNotifyEmails,
//           launched_on || null,
//           expected_completion || null,
//           possession || null,
//           is_active !== undefined ? is_active : true,
//           inventory || false,
//           search_address || null,
//           address || null,
//           street || null,
//           country || null,
//           state || null,
//           city || null,
//           zip || null,
//           locality || null,
//           latitude || null,
//           longitude || null,
//           enable_vr || false,
//           req.file ? req.file.filename : null, // vr_upload
//           amenities || {},
//           india_property_code || null,
//           magicbricks_code || null,
//           status || "draft",
//           created_by,
//           completed_steps || [],
//         ]
//       );

//       const projectId = projectResult.rows[0].id;
//       const projectName = projectResult.rows[0].name;

//       // Insert specifications
//       if (specifications && Array.isArray(specifications)) {
//         for (const spec of specifications) {
//           if (spec.title && spec.description) {
//             await client.query(
//               `
//               INSERT INTO project_specifications (project_id, title, description, created_at)
//               VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
//               `,
//               [projectId, spec.title, spec.description]
//             );
//           }
//         }
//       }

//       // Insert brochures
//       if (brochures && Array.isArray(brochures)) {
//         for (const brochure of brochures) {
//           if (brochure.name && brochure.subject && brochure.content) {
//             await client.query(
//               `
//               INSERT INTO project_brochures (project_id, name, active, subject, content, created_at)
//               VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
//               `,
//               [
//                 projectId,
//                 brochure.name,
//                 brochure.active !== undefined ? brochure.active : true,
//                 brochure.subject,
//                 brochure.content,
//               ]
//             );
//           }
//         }
//       }

//       // Insert price quotes
//       if (price_quotes && Array.isArray(price_quotes)) {
//         for (const quote of price_quotes) {
//           if (quote.subject && quote.content) {
//             await client.query(
//               `
//               INSERT INTO project_price_quotes (project_id, active, subject, content, created_at)
//               VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
//               `,
//               [
//                 projectId,
//                 quote.active !== undefined ? quote.active : true,
//                 quote.subject,
//                 quote.content,
//               ]
//             );
//           }
//         }
//       }

//       // Create notifications
//       if (parsedNotifyEmails.length > 0) {
//         console.log(
//           "Attempting to create notifications for emails:",
//           parsedNotifyEmails
//         );
//         await createNotificationsForEmails(
//           client,
//           parsedNotifyEmails,
//           "project_created",
//           `New project "${projectName || "Untitled"}" has been created`,
//           projectId,
//           "project"
//         );
//       } else {
//         console.log("No valid emails provided for notifications");
//       }

//       await client.query("COMMIT");
//       res.json({
//         id: projectId,
//         message:
//           status === "completed"
//             ? "Project created successfully"
//             : "Draft saved successfully",
//       });
//     } catch (error) {
//       if (client) {
//         await client
//           .query("ROLLBACK")
//           .catch((rollbackErr) =>
//             console.error("Rollback error:", rollbackErr)
//           );
//       }
//       // If file was uploaded and error occurred, remove file so disk doesn't fill with invalid uploads
//       if (req.file && req.file.path && fs.existsSync(req.file.path)) {
//         try {
//           fs.unlinkSync(req.file.path);
//         } catch (e) {}
//       }
//       console.error("Error in createProject:", error);
//       res.status(500).json({ error: "Server error", details: error.message });
//     } finally {
//       if (client) client.release();
//     }
//   },
// ];

// // ---------------- UPDATE PROJECT ----------------
// export const updateProject = [
//   upload.single("vr_upload"),
//   async (req, res) => {
//     const { id } = req.params;
//     let {
//       name,
//       description,
//       rera_project_id,
//       sales,
//       notify_to_emails,
//       launched_on,
//       expected_completion,
//       possession,
//       is_active,
//       inventory,
//       search_address,
//       address,
//       street,
//       country,
//       state,
//       city,
//       zip,
//       locality,
//       latitude,
//       longitude,
//       enable_vr,
//       amenities,
//       specifications,
//       brochures,
//       price_quotes,
//       india_property_code,
//       magicbricks_code,
//       status,
//       created_by,
//       completed_steps,
//     } = req.body;

//     // Parse complex fields if they are JSON strings (from FormData)
//     if (typeof amenities === "string") {
//       try {
//         amenities = JSON.parse(amenities);
//       } catch (e) {
//         return res.status(400).json({ error: "Invalid amenities format" });
//       }
//     }
//     if (typeof specifications === "string") {
//       try {
//         specifications = JSON.parse(specifications);
//       } catch (e) {
//         return res.status(400).json({ error: "Invalid specifications format" });
//       }
//     }
//     if (typeof brochures === "string") {
//       try {
//         brochures = JSON.parse(brochures);
//       } catch (e) {
//         return res.status(400).json({ error: "Invalid brochures format" });
//       }
//     }
//     if (typeof price_quotes === "string") {
//       try {
//         price_quotes = JSON.parse(price_quotes);
//       } catch (e) {
//         return res.status(400).json({ error: "Invalid price_quotes format" });
//       }
//     }
//     if (typeof completed_steps === "string") {
//       try {
//         completed_steps = JSON.parse(completed_steps);
//       } catch (e) {
//         return res
//           .status(400)
//           .json({ error: "Invalid completed_steps format" });
//       }
//     }
//     if (typeof sales === "string") {
//       sales = sales; // Already a string, no parse needed
//     }
//     if (typeof notify_to_emails === "string") {
//       const parsedEmails = notify_to_emails
//         .split(",")
//         .map((e) => e.trim())
//         .filter((e) => e);
//       notify_to_emails = parsedEmails;
//     } else {
//       notify_to_emails = null;
//     }

//     // Validation (rest of the code remains the same)
//     const errors = [];
//     const hasVrUpload = req.file && req.file.filename;

//     let client;
//     try {
//       client = await pool.connect();
//       if (typeof client.query !== "function") {
//         throw new Error("Client query method is not a function");
//       }

//       // Fetch existing project to check existing vr_upload if needed
//       const existingRes = await client.query(
//         "SELECT vr_upload FROM projects WHERE id = $1 AND deleted_at IS NULL",
//         [id]
//       );
//       if (existingRes.rows.length === 0) {
//         client.release();
//         return res.status(404).json({ error: "Project not found or deleted" });
//       }
//       const existingVr = existingRes.rows[0].vr_upload;

//       if (status === "completed") {
//         if (!name) errors.push("Project name is required");
//         if (
//           !search_address ||
//           !address ||
//           !city ||
//           !state ||
//           !country ||
//           !zip
//         ) {
//           errors.push(
//             "All address fields (search_address, address, city, state, country, zip) are required"
//           );
//         }
//         if (
//           !specifications ||
//           !Array.isArray(specifications) ||
//           specifications.length === 0
//         ) {
//           errors.push("At least one specification is required");
//         }
//         if (!brochures || !Array.isArray(brochures) || brochures.length === 0) {
//           errors.push("At least one brochure is required");
//         }
//         if (
//           !price_quotes ||
//           !Array.isArray(price_quotes) ||
//           price_quotes.length === 0
//         ) {
//           errors.push("At least one price quote is required");
//         }
//         if (!india_property_code && !magicbricks_code) {
//           errors.push("At least one property code is required");
//         }
//         // if enable_vr require either new upload or existing vr_upload
//         if (enable_vr && !hasVrUpload && !existingVr)
//           errors.push("VR Upload is required when VR is enabled");
//         if (!created_by) errors.push("Created by user ID is required");
//       } else {
//         if (!created_by) errors.push("Created by user ID is required");
//       }

//       // Validate date fields
//       const isValidDate = (dateStr) =>
//         !dateStr ||
//         (/^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(Date.parse(dateStr)));
//       if (launched_on && !isValidDate(launched_on))
//         errors.push("Launched on must be a valid date (YYYY-MM-DD) or null");
//       if (expected_completion && !isValidDate(expected_completion))
//         errors.push(
//           "Expected completion must be a valid date (YYYY-MM-DD) or null"
//         );
//       if (possession && !isValidDate(possession))
//         errors.push("Possession must be a valid date (YYYY-MM-DD) or null");

//       if (errors.length > 0) {
//         // Remove newly uploaded file if validation fails
//         if (req.file && req.file.path && fs.existsSync(req.file.path)) {
//           try {
//             fs.unlinkSync(req.file.path);
//           } catch (e) {}
//         }
//         client.release();
//         return res
//           .status(400)
//           .json({ error: "Validation failed", details: errors });
//       }

//       await client.query("BEGIN");

//       // Update main project row (use COALESCE to preserve existing values if null passed)
//       const updateResult = await client.query(
//         `
//         UPDATE projects SET
//           name = COALESCE($1, name),
//           description = COALESCE($2, description),
//           rera_project_id = COALESCE($3, rera_project_id),
//           sales = COALESCE($4, sales),
//           notify_to_emails = COALESCE($5, notify_to_emails),
//           launched_on = COALESCE($6, launched_on),
//           expected_completion = COALESCE($7, expected_completion),
//           possession = COALESCE($8, possession),
//           is_active = COALESCE($9, is_active),
//           inventory = COALESCE($10, inventory),
//           search_address = COALESCE($11, search_address),
//           address = COALESCE($12, address),
//           street = COALESCE($13, street),
//           country = COALESCE($14, country),
//           state = COALESCE($15, state),
//           city = COALESCE($16, city),
//           zip = COALESCE($17, zip),
//           locality = COALESCE($18, locality),
//           latitude = COALESCE($19, latitude),
//           longitude = COALESCE($20, longitude),
//           enable_vr = COALESCE($21, enable_vr),
//           vr_upload = COALESCE($22, vr_upload),
//           amenities = COALESCE($23, amenities),
//           india_property_code = COALESCE($24, india_property_code),
//           magicbricks_code = COALESCE($25, magicbricks_code),
//           status = COALESCE($26, status),
//           created_by = COALESCE($27, created_by),
//           completed_steps = COALESCE($28, completed_steps),
//           updated_at = CURRENT_TIMESTAMP
//         WHERE id = $29 AND deleted_at IS NULL
//         RETURNING id, name, vr_upload
//         `,
//         [
//           name || null,
//           description || null,
//           rera_project_id || null,
//           sales || null,
//           notify_to_emails,
//           launched_on || null,
//           expected_completion || null,
//           possession || null,
//           is_active !== undefined ? is_active : null,
//           inventory !== undefined ? inventory : null,
//           search_address || null,
//           address || null,
//           street || null,
//           country || null,
//           state || null,
//           city || null,
//           zip || null,
//           locality || null,
//           latitude || null,
//           longitude || null,
//           enable_vr !== undefined ? enable_vr : null,
//           req.file ? req.file.filename : null, // if null, COALESCE keeps existing vr_upload
//           amenities !== undefined ? amenities : null,
//           india_property_code || null,
//           magicbricks_code || null,
//           status || null,
//           created_by || null,
//           completed_steps || null,
//           id,
//         ]
//       );

//       if (updateResult.rows.length === 0) {
//         await client.query("ROLLBACK");
//         // Remove newly uploaded file if update failed
//         if (req.file && req.file.path && fs.existsSync(req.file.path)) {
//           try {
//             fs.unlinkSync(req.file.path);
//           } catch (e) {}
//         }
//         client.release();
//         return res.status(404).json({ error: "Project not found or deleted" });
//       }

//       const projectId = updateResult.rows[0].id;
//       const projectName = updateResult.rows[0].name;

//       // Update specifications (delete & reinsert)
//       if (specifications && Array.isArray(specifications)) {
//         await client.query(
//           "DELETE FROM project_specifications WHERE project_id = $1",
//           [id]
//         );
//         for (const spec of specifications) {
//           if (spec.title && spec.description) {
//             await client.query(
//               `INSERT INTO project_specifications (project_id, title, description, created_at)
//                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
//               [id, spec.title, spec.description]
//             );
//           }
//         }
//       }

//       // Update brochures
//       if (brochures && Array.isArray(brochures)) {
//         await client.query(
//           "DELETE FROM project_brochures WHERE project_id = $1",
//           [id]
//         );
//         for (const brochure of brochures) {
//           if (brochure.name && brochure.subject && brochure.content) {
//             await client.query(
//               `INSERT INTO project_brochures (project_id, name, active, subject, content, created_at)
//                VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
//               [
//                 id,
//                 brochure.name,
//                 brochure.active !== undefined ? brochure.active : true,
//                 brochure.subject,
//                 brochure.content,
//               ]
//             );
//           }
//         }
//       }

//       // Update price quotes
//       if (price_quotes && Array.isArray(price_quotes)) {
//         await client.query(
//           "DELETE FROM project_price_quotes WHERE project_id = $1",
//           [id]
//         );
//         for (const quote of price_quotes) {
//           if (quote.subject && quote.content) {
//             await client.query(
//               `INSERT INTO project_price_quotes (project_id, active, subject, content, created_at)
//                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
//               [
//                 id,
//                 quote.active !== undefined ? quote.active : true,
//                 quote.subject,
//                 quote.content,
//               ]
//             );
//           }
//         }
//       }

//       // Create notifications for update
//       if (
//         notify_to_emails &&
//         Array.isArray(notify_to_emails) &&
//         notify_to_emails.length > 0
//       ) {
//         console.log(
//           "Attempting to create notifications for emails:",
//           notify_to_emails
//         );
//         await createNotificationsForEmails(
//           client,
//           notify_to_emails,
//           "project_updated",
//           `Project "${projectName || "Untitled"}" has been updated`,
//           projectId,
//           "project"
//         );
//       } else {
//         console.log("No notify_to_emails provided, skipping notifications");
//       }

//       await client.query("COMMIT");

//       // On success, return updated project basic info
//       const updated = updateResult.rows[0];
//       res.json({
//         id: updated.id,
//         name: updated.name,
//         vr_upload: updated.vr_upload || null,
//         message:
//           status === "completed"
//             ? "Project updated successfully"
//             : "Draft updated successfully",
//       });
//     } catch (error) {
//       if (client) {
//         await client
//           .query("ROLLBACK")
//           .catch((rollbackErr) =>
//             console.error("Rollback error:", rollbackErr)
//           );
//       }
//       // Remove newly uploaded file if error occurred
//       if (req.file && req.file.path && fs.existsSync(req.file.path)) {
//         try {
//           fs.unlinkSync(req.file.path);
//         } catch (e) {}
//       }
//       console.error("Error in updateProject:", error);
//       res.status(500).json({ error: "Server error", details: error.message });
//     } finally {
//       if (client) client.release();
//     }
//   },
// ];

// // ---------------- DELETE PROJECT ----------------
// export const deleteProject = async (req, res) => {
//   const { id } = req.params;
//   let client;
//   try {
//     client = await pool.connect();
//     if (typeof client.query !== "function") {
//       throw new Error("Client query method is not a function");
//     }
//     await client.query("BEGIN");

//     const projectResult = await client.query(
//       `
//       UPDATE projects SET deleted_at = CURRENT_TIMESTAMP
//       WHERE id = $1 AND deleted_at IS NULL
//       RETURNING id, name, notify_to_emails, vr_upload
//       `,
//       [id]
//     );

//     if (projectResult.rows.length === 0) {
//       await client.query("ROLLBACK");
//       return res
//         .status(404)
//         .json({ error: "Project not found or already deleted" });
//     }

//     const projectId = projectResult.rows[0].id;
//     const projectName = projectResult.rows[0].name;
//     const notifyEmails = projectResult.rows[0].notify_to_emails || [];
//     const vrFilename = projectResult.rows[0].vr_upload;

//     if (notifyEmails.length > 0) {
//       console.log(
//         "Attempting to create notifications for emails:",
//         notifyEmails
//       );
//       await createNotificationsForEmails(
//         client,
//         notifyEmails,
//         "project_deleted",
//         `Project "${projectName || "Untitled"}" has been deleted`,
//         projectId,
//         "project"
//       );
//     } else {
//       console.log("No notify_to_emails found, skipping notifications");
//     }

//     await client.query("COMMIT");

//     res.json({ id: projectId, message: "Project deleted successfully" });
//   } catch (error) {
//     if (client) {
//       await client
//         .query("ROLLBACK")
//         .catch((rollbackErr) => console.error("Rollback error:", rollbackErr));
//     }
//     console.error("Error in deleteProject:", error);
//     res.status(500).json({ error: "Server error", details: error.message });
//   } finally {
//     if (client) client.release();
//   }
// };

// // ---------------- GET ALL PROJECTS ----------------
// export const getProjects = async (req, res) => {
//   let client;
//   try {
//     client = await pool.connect();
//     if (typeof client.query !== "function") {
//       throw new Error("Client query method is not a function");
//     }

//     const result = await client.query(
//       "SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY created_at DESC"
//     );

//     const baseUrl =
//       process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

//     const projects = result.rows.map((p) => ({
//       ...p,
//       vr_upload_url: p.vr_upload
//         ? `${baseUrl}/project_vr_app_document/${p.vr_upload}`
//         : null,
//     }));

//     res.json({ data: projects });
//   } catch (error) {
//     console.error("Error in getProjects:", error);
//     res.status(500).json({ error: "Server error", details: error.message });
//   } finally {
//     if (client) client.release();
//   }
// };

// // ---------------- GET PROJECT BY ID ----------------
// export const getProjectById = async (req, res) => {
//   const { id } = req.params;
//   let client;
//   try {
//     client = await pool.connect();
//     if (typeof client.query !== "function") {
//       throw new Error("Client query method is not a function");
//     }

//     const projectResult = await client.query(
//       "SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL",
//       [id]
//     );

//     if (projectResult.rows.length === 0) {
//       return res.status(404).json({ error: "Project not found or deleted" });
//     }

//     const specifications = await client.query(
//       "SELECT * FROM project_specifications WHERE project_id = $1",
//       [id]
//     );
//     const brochures = await client.query(
//       "SELECT * FROM project_brochures WHERE project_id = $1",
//       [id]
//     );
//     const price_quotes = await client.query(
//       "SELECT * FROM project_price_quotes WHERE project_id = $1",
//       [id]
//     );

//     const project = { ...projectResult.rows[0] };

//     const baseUrl =
//       process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
//     project.vr_upload_url = project.vr_upload
//       ? `${baseUrl}/project_vr_app_document/${project.vr_upload}`
//       : null;

//     res.json({
//       ...project,
//       specifications: specifications.rows,
//       brochures: brochures.rows,
//       price_quotes: price_quotes.rows,
//     });
//   } catch (error) {
//     console.error("Error in getProjectById:", error);
//     res.status(500).json({ error: "Server error", details: error.message });
//   } finally {
//     if (client) client.release();
//   }
// };

// controllers/project.controller.js
// import pool from "../../database/config.js";
// import { createNotificationsForEmails } from "./notification.controller.js";
// import multer from "multer";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const uploadPath = path.join(__dirname, "../../public/project_vr_app_document");

// // Ensure folder exists
// if (!fs.existsSync(uploadPath)) {
//   fs.mkdirSync(uploadPath, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadPath),
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, `${uniqueSuffix}-${file.originalname}`);
//   },
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
// }).fields([
//   { name: "vr_upload", maxCount: 1 },
//   { name: "brochure_uploads", maxCount: 10 },
// ]);

// // Clean up uploaded files on error
// const cleanupFiles = (files) => {
//   if (!files) return;
//   Object.values(files)
//     .flat()
//     .forEach((file) => {
//       if (file?.path && fs.existsSync(file.path)) {
//         try {
//           fs.unlinkSync(file.path);
//         } catch (e) {
//           console.error("Failed to delete file:", file.path, e);
//         }
//       }
//     });
// };

// // ==================== CREATE PROJECT ====================
// export const createProject = [
//   upload,
//   async (req, res) => {
//     const brochureFiles = req.files?.brochure_uploads || [];
//     const brochureFilenames = brochureFiles.map((f) => f.filename);

//     console.log("FRONTEND DATA RECEIVED:", {
//       name: req.body.name,
//       search_address: req.body.search_address,
//       address: req.body.address,
//       street: req.body.street,
//       city: req.body.city,
//       state: req.body.state,
//       country: req.body.country,
//       zip: req.body.zip,
//       brochure_uploads: req.files?.brochure_uploads?.map((f) => f.originalname),
//       vr_upload: req.files?.vr_upload?.[0]?.originalname,
//     });

//     const {
//       name,
//       description,
//       rera_project_id,
//       sales,
//       notify_to_emails,
//       launched_on,
//       expected_completion,
//       possession,
//       is_active,
//       inventory,
//       search_address,
//       address,
//       street,
//       country,
//       state,
//       city,
//       zip,
//       locality,
//       latitude,
//       longitude,
//       enable_vr,
//       amenities,
//       specifications,
//       india_property_code,
//       magicbricks_code,
//       status,
//       created_by,
//       completed_steps,
//     } = req.body;

//     // Parse JSON strings
//     let parsedAmenities = amenities;
//     let parsedSpecifications = specifications;
//     try {
//       if (typeof amenities === "string")
//         parsedAmenities = JSON.parse(amenities);
//       if (typeof specifications === "string")
//         parsedSpecifications = JSON.parse(specifications);
//     } catch (e) {
//       cleanupFiles(req.files);
//       return res
//         .status(400)
//         .json({ error: "Invalid JSON in amenities/specifications" });
//     }

//     const errors = [];
//     if (status === "completed") {
//       if (!name) errors.push("Project name is required");
//       if (!search_address || !address || !city || !state || !country || !zip)
//         errors.push("All address fields are required");
//       if (
//         !parsedSpecifications ||
//         !Array.isArray(parsedSpecifications) ||
//         parsedSpecifications.length === 0
//       )
//         errors.push("At least one specification is required");
//       if (brochureFilenames.length === 0)
//         errors.push("At least one brochure file is required");
//       if (!india_property_code && !magicbricks_code)
//         errors.push("At least one property code is required");
//       if (enable_vr && !req.files?.vr_upload?.[0])
//         errors.push("VR Upload is required when VR is enabled");
//     }
//     if (!created_by) errors.push("Created by user ID is required");

//     if (errors.length > 0) {
//       cleanupFiles(req.files);
//       return res
//         .status(400)
//         .json({ error: "Validation failed", details: errors });
//     }

//     let client;
//     try {
//       client = await pool.connect();
//       await client.query("BEGIN");

//       const parsedNotifyEmails = notify_to_emails
//         ? notify_to_emails
//             .split(",")
//             .map((e) => e.trim())
//             .filter(Boolean)
//         : [];

//       const projectResult = await client.query(
//         `INSERT INTO projects (
//             name, description, rera_project_id, sales, notify_to_emails, launched_on,
//             expected_completion, possession, is_active, inventory, search_address,
//             address, street, country, state, city, zip, locality, latitude, longitude,
//             enable_vr, vr_upload, amenities, india_property_code, magicbricks_code,
//             status, created_by, completed_steps, brochure_uploads, created_at, updated_at
//           ) VALUES (
//             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
//             $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
//           ) RETURNING id, name`,
//         [
//           name || null,
//           description || null,
//           rera_project_id || null,
//           sales || null,
//           parsedNotifyEmails,
//           launched_on || null,
//           expected_completion || null,
//           possession || null,
//           is_active ?? true,
//           inventory ?? false,
//           search_address || null,
//           address || null,
//           street || null,
//           country || null,
//           state || null,
//           city || null,
//           zip || null,
//           locality || null,
//           latitude || null,
//           longitude || null,
//           enable_vr ?? false,
//           req.files?.vr_upload?.[0]?.filename || null,
//           parsedAmenities || {},
//           india_property_code || null,
//           magicbricks_code || null,
//           status || "draft",
//           created_by,
//           completed_steps || [],
//           brochureFilenames, // $29
//         ]
//       );

//       const projectId = projectResult.rows[0].id;
//       const projectName = projectResult.rows[0].name;

//       // Insert specifications
//       if (Array.isArray(parsedSpecifications)) {
//         for (const spec of parsedSpecifications) {
//           if (spec.title && spec.description) {
//             await client.query(
//               `INSERT INTO project_specifications (project_id, title, description, created_at)
//                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
//               [projectId, spec.title, spec.description]
//             );
//           }
//         }
//       }

//       if (parsedNotifyEmails.length > 0) {
//         await createNotificationsForEmails(
//           client,
//           parsedNotifyEmails,
//           "project_created",
//           `New project "${projectName}" has been created`,
//           projectId,
//           "project"
//         );
//       }

//       await client.query("COMMIT");
//       res.json({ id: projectId, message: "Project created successfully" });
//     } catch (error) {
//       if (client) await client.query("ROLLBACK");
//       cleanupFiles(req.files);
//       console.error("createProject error:", error);
//       res.status(500).json({ error: "Server error", details: error.message });
//     } finally {
//       if (client) client.release();
//     }
//   },
// ];

// // ==================== UPDATE PROJECT ====================
// // ==================== UPDATE PROJECT ====================
// export const updateProject = [
//   upload,
//   async (req, res) => {
//     const { id } = req.params;
//     const newBrochureFiles = req.files?.brochure_uploads || [];
//     const newBrochureFilenames = newBrochureFiles.map((f) => f.filename);

//     console.log("FRONTEND DATA RECEIVED:", {
//       name: req.body.name,
//       search_address: req.body.search_address,
//       address: req.body.address,
//       street: req.body.street,
//       city: req.body.city,
//       state: req.body.state,
//       country: req.body.country,
//       zip: req.body.zip,
//       brochure_uploads: req.files?.brochure_uploads?.map((f) => f.originalname),
//       vr_upload: req.files?.vr_upload?.[0]?.originalname,
//     });

//     let client;
//     try {
//       client = await pool.connect();

//       // Get current data
//       const existingRes = await client.query(
//         "SELECT brochure_uploads, vr_upload FROM projects WHERE id = $1 AND deleted_at IS NULL",
//         [id]
//       );
//       if (existingRes.rows.length === 0) {
//         cleanupFiles(req.files);
//         return res.status(404).json({ error: "Project not found" });
//       }

//       const existingBrochures = existingRes.rows[0].brochure_uploads || [];
//       const updatedBrochures = [...existingBrochures, ...newBrochureFilenames];

//       await client.query("BEGIN");

//       // Build dynamic UPDATE query
//       const updates = [];
//       const values = [];
//       let paramIndex = 1;

//       // Only update fields that were sent
//       if (req.body.name !== undefined) {
//         updates.push(`name = $${paramIndex++}`);
//         values.push(req.body.name || null);
//       }
//       if (req.body.description !== undefined) {
//         updates.push(`description = $${paramIndex++}`);
//         values.push(req.body.description || null);
//       }
//       if (req.files?.vr_upload?.[0]) {
//         updates.push(`vr_upload = $${paramIndex++}`);
//         values.push(req.files.vr_upload[0].filename);
//       }
//       if (newBrochureFilenames.length > 0) {
//         updates.push(`brochure_uploads = $${paramIndex++}`);
//         values.push(updatedBrochures);
//       }
//       if (req.body.status !== undefined) {
//         updates.push(`status = $${paramIndex++}`);
//         values.push(req.body.status);
//       }
//       if (req.body.completed_steps !== undefined) {
//         let steps = req.body.completed_steps;
//         if (typeof steps === "string") steps = JSON.parse(steps);
//         updates.push(`completed_steps = $${paramIndex++}`);
//         values.push(steps || []);
//       }

//       // Always update timestamp
//       updates.push("updated_at = CURRENT_TIMESTAMP");
//       values.push(id); // WHERE id = last param

//       const query = `UPDATE projects SET ${updates.join(
//         ", "
//       )} WHERE id = $${paramIndex} RETURNING id, name`;
//       const result = await client.query(query, values);

//       await client.query("COMMIT");
//       res.json({
//         message: "Project updated successfully",
//         id: result.rows[0].id,
//       });
//     } catch (error) {
//       if (client) await client.query("ROLLBACK");
//       cleanupFiles(req.files);
//       console.error("updateProject error:", error);
//       res.status(500).json({ error: "Server error", details: error.message });
//     } finally {
//       if (client) client.release();
//     }
//   },
// ];

// // ==================== GET PROJECT BY ID ====================
// export const getProjectById = async (req, res) => {
//   const { id } = req.params;
//   let client;
//   try {
//     client = await pool.connect();
//     const result = await client.query(
//       "SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL",
//       [id]
//     );
//     if (result.rows.length === 0)
//       return res.status(404).json({ error: "Project not found" });

//     const project = result.rows[0];
//     const baseUrl =
//       process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

//     project.vr_upload_url = project.vr_upload
//       ? `${baseUrl}/project_vr_app_document/${project.vr_upload}`
//       : null;

//     project.brochure_upload_urls = (project.brochure_uploads || []).map(
//       (filename) => `${baseUrl}/project_vr_app_document/${filename}`
//     );

//     // Also fetch related data (specifications, etc.) if needed
//     const specs = await client.query(
//       "SELECT * FROM project_specifications WHERE project_id = $1",
//       [id]
//     );
//     project.specifications = specs.rows;

//     res.json(project);
//   } catch (error) {
//     console.error("getProjectById error:", error);
//     res.status(500).json({ error: "Server error" });
//   } finally {
//     if (client) client.release();
//   }
// };

// // ==================== GET ALL PROJECTS ====================
// export const getProjects = async (req, res) => {
//   let client;
//   try {
//     client = await pool.connect();
//     const result = await client.query(
//       "SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY created_at DESC"
//     );

//     const baseUrl =
//       process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

//     const projects = result.rows.map((p) => ({
//       ...p,
//       vr_upload_url: p.vr_upload
//         ? `${baseUrl}/project_vr_app_document/${p.vr_upload}`
//         : null,
//       brochure_upload_urls: (p.brochure_uploads || []).map(
//         (f) => `${baseUrl}/project_vr_app_document/${f}`
//       ),
//     }));

//     res.json({ data: projects });
//   } catch (error) {
//     console.error("getProjects error:", error);
//     res.status(500).json({ error: "Server error" });
//   } finally {
//     if (client) client.release();
//   }
// };

// // ---------------- DELETE PROJECT ----------------
// export const deleteProject = async (req, res) => {
//   const { id } = req.params;
//   let client;
//   try {
//     client = await pool.connect();
//     if (typeof client.query !== "function") {
//       throw new Error("Client query method is not a function");
//     }
//     await client.query("BEGIN");

//     const projectResult = await client.query(
//       `
//       UPDATE projects SET deleted_at = CURRENT_TIMESTAMP
//       WHERE id = $1 AND deleted_at IS NULL
//       RETURNING id, name, notify_to_emails, vr_upload
//       `,
//       [id]
//     );

//     if (projectResult.rows.length === 0) {
//       await client.query("ROLLBACK");
//       return res
//         .status(404)
//         .json({ error: "Project not found or already deleted" });
//     }

//     const projectId = projectResult.rows[0].id;
//     const projectName = projectResult.rows[0].name;
//     const notifyEmails = projectResult.rows[0].notify_to_emails || [];
//     const vrFilename = projectResult.rows[0].vr_upload;

//     if (notifyEmails.length > 0) {
//       console.log(
//         "Attempting to create notifications for emails:",
//         notifyEmails
//       );
//       await createNotificationsForEmails(
//         client,
//         notifyEmails,
//         "project_deleted",
//         `Project "${projectName || "Untitled"}" has been deleted`,
//         projectId,
//         "project"
//       );
//     } else {
//       console.log("No notify_to_emails found, skipping notifications");
//     }

//     await client.query("COMMIT");

//     res.json({ id: projectId, message: "Project deleted successfully" });
//   } catch (error) {
//     if (client) {
//       await client
//         .query("ROLLBACK")
//         .catch((rollbackErr) => console.error("Rollback error:", rollbackErr));
//     }
//     console.error("Error in deleteProject:", error);
//     res.status(500).json({ error: "Server error", details: error.message });
//   } finally {
//     if (client) client.release();
//   }
// };

// controllers/project.controller.js

import pool from "../../database/config.js";
import { createNotificationsForEmails } from "./notification.controller.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PROJECT_UPLOAD_FIELDS, hasArrayRemovals, parseJsonBody } from "../utils/projectUploadFields.js";
import { PROJECT_MEDIA_DIR } from "../utils/projectUploadPaths.js";
import { getProjectTableColumns } from "../utils/projectTableColumns.js";
import {
  enrichProjectMedia,
  mergeFilenameArray,
  mergeGalleryImages,
  mergeGalleryVideos,
  normalizeGalleryImageItems,
  normalizeGalleryVideoItems,
} from "../utils/projectMediaMerge.js";
import {
  normalizeMonthYearDate,
  parseBoolField,
  parseIntArrayField,
  parseNotifyEmails,
  isAddressStepPayload,
  resolveZipForValidation,
  validateZipRequired,
} from "../utils/projectRequestParse.js";
import {
  isValidAreaUnit,
  normalizeAreaUnitCode,
} from "../utils/areaConversion.js";
import { ensureProjectsAreaColumns } from "../utils/projectsAreaSchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadPath = PROJECT_MEDIA_DIR;

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
}).fields(PROJECT_UPLOAD_FIELDS);

const cleanupFiles = (files) => {
  if (!files) return;
  Object.values(files)
    .flat()
    .forEach((file) => {
      if (file?.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {}
      }
    });
};

// ==================== CREATE PROJECT ====================
// ==================== CREATE PROJECT ====================
export const createProject = [
  upload,
  async (req, res) => {
    const brochureFiles = req.files?.brochure_uploads || [];
    const brochureFilenames = brochureFiles.map((f) => f.filename);

    const {
      name,
      description,
      rera_project_id,
      sales,
      notify_to_emails,
      launched_on,
      expected_completion,
      possession,
      is_active,
      inventory,
      search_address,
      address,
      street,
      country,
      state,
      city,
      zip,
      locality,
      latitude,
      longitude,
      enable_vr,
      amenities,
      specifications,
      india_property_code,
      magicbricks_code,
      status,
      created_by,
      completed_steps,
      office_address_line1 = "",
      office_address_line2 = "",
    } = req.body;

    const office_address = [office_address_line1, office_address_line2]
      .filter(Boolean)
      .join(", ");

    let parsedAmenities = amenities;
    let parsedSpecifications = specifications;
    try {
      if (typeof amenities === "string")
        parsedAmenities = JSON.parse(amenities);
      if (typeof specifications === "string")
        parsedSpecifications = JSON.parse(specifications);
    } catch (e) {
      cleanupFiles(req.files);
      return res.status(400).json({ error: "Invalid JSON" });
    }

    const errors = [];
    if (status === "completed") {
      if (!name) errors.push("Project name is required");
      if (!search_address || !address || !city || !state || !country || !zip)
        errors.push("All address fields are required");
    }
    if (isAddressStepPayload(req.body)) {
      const zipError = validateZipRequired(zip);
      if (zipError) errors.push(zipError);
    }
    if (!created_by) errors.push("Created by user ID is required");

    if (errors.length > 0) {
      cleanupFiles(req.files);
      return res
        .status(400)
        .json({ error: "Validation failed", details: errors });
    }

    let client;
    try {
      client = await pool.connect();
      await client.query("BEGIN");

      const parsedNotifyEmails = parseNotifyEmails(notify_to_emails);
      const parsedCompletedSteps = parseIntArrayField(completed_steps);
      const normalizedLaunchedOn = normalizeMonthYearDate(launched_on);
      const normalizedPossession = normalizeMonthYearDate(possession);
      const normalizedExpectedCompletion = normalizeMonthYearDate(expected_completion);

      // 31 COLUMNS → 31 VALUES → $1 to $31
      const projectResult = await client.query(
        `INSERT INTO projects (
    name, description, rera_project_id, sales, notify_to_emails, launched_on,
    expected_completion, possession, is_active, inventory, search_address,
    address, street, country, state, city, zip, locality, latitude, longitude,
    enable_vr, vr_upload, amenities, india_property_code, magicbricks_code,
    status, created_by, completed_steps, brochure_uploads, office_address,
    project_logo, created_at, updated_at
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
    $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
  ) RETURNING id, name`,
        [
          name || null,
          description || null,
          rera_project_id || null,
          sales || null,
          parsedNotifyEmails,
          normalizedLaunchedOn,
          normalizedExpectedCompletion,
          normalizedPossession,
          parseBoolField(is_active),
          parseBoolField(inventory),
          search_address || null,
          address || null,
          street || null,
          country || null,
          state || null,
          city || null,
          zip || null,
          locality || null,
          latitude || null,
          longitude || null,
          enable_vr ?? false,
          req.files?.vr_upload?.[0]?.filename || null,
          {},
          india_property_code || null,
          magicbricks_code || null,
          status || "draft",
          created_by,
          parsedCompletedSteps,
          brochureFilenames,
          office_address || null,
          req.files?.project_logo?.[0]?.filename || null,
        ]
      );

      const projectId = projectResult.rows[0].id;

      const baseUrl =
        process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
      const newGalleryImages = req.files?.gallery_images || [];
      const newGalleryVideos = req.files?.gallery_video_files || [];
      const mergedGalleryImages = mergeGalleryImages(
        [],
        req.body.gallery_images_removed,
        newGalleryImages,
        req.body.gallery_image_categories,
        baseUrl,
      );
      const mergedGalleryVideos = mergeGalleryVideos(
        [],
        req.body.gallery_videos_removed,
        req.body.gallery_video_urls,
        newGalleryVideos,
        baseUrl,
      );
      if (
        mergedGalleryImages.length > 0 ||
        mergedGalleryVideos.length > 0
      ) {
        await client.query(
          `UPDATE projects SET gallery_images = $1::jsonb, gallery_videos = $2::jsonb WHERE id = $3`,
          [
            JSON.stringify(normalizeGalleryImageItems(mergedGalleryImages)),
            JSON.stringify(normalizeGalleryVideoItems(mergedGalleryVideos)),
            projectId,
          ],
        );
      }

      if (Array.isArray(parsedSpecifications)) {
        for (const spec of parsedSpecifications) {
          if (spec.title && spec.description) {
            await client.query(
              `INSERT INTO project_specifications (project_id, title, description, created_at)
               VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
              [projectId, spec.title, spec.description]
            );
          }
        }
      }

      if (parsedNotifyEmails.length > 0) {
        await createNotificationsForEmails(
          client,
          parsedNotifyEmails,
          "project_created",
          `New project "${name}" has been created`,
          projectId,
          "project"
        );
      }

      await client.query("COMMIT");

      const createdRow = await client.query(
        "SELECT * FROM projects WHERE id = $1",
        [projectId],
      );
      const project = enrichProjectMedia(createdRow.rows[0], baseUrl);

      res.json({
        id: projectId,
        data: project,
        message: "Project created successfully",
      });
    } catch (error) {
      if (client) await client.query("ROLLBACK");
      cleanupFiles(req.files);
      console.error("createProject error:", error);
      res.status(500).json({ error: "Server error", details: error.message });
    } finally {
      if (client) client.release();
    }
  },
];
// ==================== UPDATE PROJECT ====================
const getProjectIdFromParams = (req) => req.params.projectId || req.params.id;

export const updateProject = [
  upload,
  async (req, res) => {
    const id = getProjectIdFromParams(req);
    if (!id) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    let client;
    try {
      client = await pool.connect();

      const existingRes = await client.query(
        "SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL",
        [id]
      );
      if (existingRes.rows.length === 0) {
        cleanupFiles(req.files);
        return res.status(404).json({ error: "Project not found" });
      }

      const existing = existingRes.rows[0];
      if (isAddressStepPayload(req.body)) {
        const zipToValidate = resolveZipForValidation(req.body, existing.zip);
        const zipError = validateZipRequired(zipToValidate);
        if (zipError) {
          cleanupFiles(req.files);
          return res.status(400).json({
            error: "Validation failed",
            details: [zipError],
          });
        }
      }

      const newBrochureFiles = req.files?.brochure_uploads || [];
      const newBrochureFilenames = newBrochureFiles.map((f) => f.filename);
      const newMarketingFiles = req.files?.marketing_brochure_uploads || [];
      const newReraFiles = req.files?.rera_document_uploads || [];
      const newGalleryImages = req.files?.gallery_images || [];
      const newGalleryVideos = req.files?.gallery_video_files || [];

      const updatedBrochures = [
        ...(existing.brochure_uploads || []),
        ...newBrochureFiles.map((f) => f.filename),
      ];
      const updatedMarketing = mergeFilenameArray(
        existing.marketing_brochures,
        req.body.marketing_brochures_removed,
        newMarketingFiles,
      );
      const updatedRera = mergeFilenameArray(
        existing.rera_documents,
        req.body.rera_documents_removed,
        newReraFiles,
      );
      const updatedGalleryImages = mergeGalleryImages(
        existing.gallery_images || [],
        req.body.gallery_images_removed,
        newGalleryImages,
        req.body.gallery_image_categories,
        baseUrl,
      );
      const updatedGalleryVideos = mergeGalleryVideos(
        existing.gallery_videos || [],
        req.body.gallery_videos_removed,
        req.body.gallery_video_urls,
        newGalleryVideos,
        baseUrl,
      );

      const office_address_line1 = req.body.office_address_line1 || "";
      const office_address_line2 = req.body.office_address_line2 || "";
      const office_address = [office_address_line1, office_address_line2]
        .filter(Boolean)
        .join(", ");

      await client.query("BEGIN");

      const projectColumns = await getProjectTableColumns(client);

      const updates = [];
      const values = [];
      let index = 1;

      const setField = (column, value) => {
        if (!projectColumns.has(column)) return;
        updates.push(`${column} = $${index++}`);
        values.push(value);
      };

      const setJsonbField = (column, value, normalize) => {
        if (!projectColumns.has(column)) return;
        const normalized = normalize(value);
        updates.push(`${column} = $${index++}::jsonb`);
        values.push(JSON.stringify(normalized));
      };

      const scalarFields = [
        "name",
        "description",
        "rera_project_id",
        "sales",
        "launched_on",
        "expected_completion",
        "possession",
        "is_active",
        "inventory",
        "search_address",
        "address",
        "street",
        "country",
        "state",
        "city",
        "zip",
        "locality",
        "latitude",
        "longitude",
        "enable_vr",
        "india_property_code",
        "magicbricks_code",
        "status",
        "project_type",
        "project_structure",
        "portal_selection",
        "portal_reference_key",
        "portal_sync_status",
      ];

      scalarFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          let val = req.body[field];
          if (field === "is_active" || field === "inventory" || field === "enable_vr") {
            val = parseBoolField(val);
          }
          if (field === "launched_on" || field === "possession" || field === "expected_completion") {
            val = normalizeMonthYearDate(val);
          }
          setField(field, val === "" ? null : val);
        }
      });

      if (req.body.notify_to_emails !== undefined) {
        const emails = parseNotifyEmails(req.body.notify_to_emails);
        setField("notify_to_emails", emails);
      }

      if (req.body.completed_steps !== undefined) {
        const steps = parseIntArrayField(req.body.completed_steps);
        setField("completed_steps", steps);
      }

      if (req.body.default_area_unit !== undefined) {
        await ensureProjectsAreaColumns();
        const normalizedUnit = normalizeAreaUnitCode(req.body.default_area_unit);
        if (!isValidAreaUnit(normalizedUnit)) {
          await client.query("ROLLBACK");
          cleanupFiles(req.files);
          return res.status(400).json({
            error: "default_area_unit must be sqft, sqyd, sqm, acre, bigha, or sector",
          });
        }
        setField("default_area_unit", normalizedUnit);
      }

      if (req.files?.vr_upload?.[0]) {
        setField("vr_upload", req.files.vr_upload[0].filename);
      }
      if (req.files?.project_logo?.[0]) {
        setField("project_logo", req.files.project_logo[0].filename);
      }
      if (newBrochureFilenames.length > 0) {
        setField("brochure_uploads", updatedBrochures);
      }
      if (
        newMarketingFiles.length > 0 ||
        hasArrayRemovals(req.body.marketing_brochures_removed)
      ) {
        setField("marketing_brochures", updatedMarketing);
      }
      if (
        newReraFiles.length > 0 ||
        hasArrayRemovals(req.body.rera_documents_removed)
      ) {
        setField("rera_documents", updatedRera);
      }
      if (
        newGalleryImages.length > 0 ||
        hasArrayRemovals(req.body.gallery_images_removed)
      ) {
        setJsonbField(
          "gallery_images",
          updatedGalleryImages,
          normalizeGalleryImageItems,
        );
      }
      if (
        newGalleryVideos.length > 0 ||
        hasArrayRemovals(req.body.gallery_videos_removed) ||
        parseJsonBody(req.body.gallery_video_urls, []).length > 0
      ) {
        setJsonbField(
          "gallery_videos",
          updatedGalleryVideos,
          normalizeGalleryVideoItems,
        );
      }
      if (office_address_line1 || office_address_line2 || req.body.office_address_line1 !== undefined) {
        setField("office_address", office_address || null);
      }

      if (updates.length === 0) {
        await client.query("ROLLBACK");
        cleanupFiles(req.files);
        return res.status(400).json({ error: "No fields to update" });
      }

      updates.push("updated_at = CURRENT_TIMESTAMP");
      values.push(id);

      const query = `UPDATE projects SET ${updates.join(
        ", "
      )} WHERE id = $${index} RETURNING *`;
      const updateResult = await client.query(query, values);

      await client.query("COMMIT");

      const project = enrichProjectMedia(updateResult.rows[0], baseUrl);
      res.json({
        message: "Project updated successfully",
        data: project,
        id: project.id,
      });
    } catch (error) {
      if (client) await client.query("ROLLBACK");
      cleanupFiles(req.files);
      console.error("updateProject error:", error);
      res.status(500).json({ error: "Server error", details: error.message });
    } finally {
      if (client) client.release();
    }
  },
];

// ==================== GET PROJECT BY ID ====================
export const getProjectById = async (req, res) => {
  const id = getProjectIdFromParams(req);
  if (!id) {
    return res.status(400).json({ error: "Project ID is required" });
  }
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Project not found" });

    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    const project = enrichProjectMedia(result.rows[0], baseUrl);

    const specs = await client.query(
      "SELECT * FROM project_specifications WHERE project_id = $1",
      [id]
    );
    project.specifications = specs.rows;

    if (project.office_address && !project.office_address_line1) {
      const parts = String(project.office_address).split(", ");
      project.office_address_line1 = parts[0] || "";
      project.office_address_line2 = parts.slice(1).join(", ") || "";
    }

    res.json(project);
  } catch (error) {
    console.error("getProjectById error:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (client) client.release();
  }
};

// ==================== GET ALL PROJECTS ====================
export const getProjects = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY created_at DESC"
    );

    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    const projectRows = result.rows;
    const unitCountMap = {};

    if (projectRows.length > 0) {
      // Build parameterized placeholders: $1, $2, ... for each project id
      const placeholders = projectRows.map((_, i) => `$${i + 1}`).join(", ");
      const ids = projectRows.map((p) => p.id);
      const unitCountResult = await client.query(
        `SELECT 
           project_id, 
           COUNT(*)::int AS total_properties,
           COUNT(CASE WHEN status = 'sold' THEN 1 END)::int AS sold_properties
         FROM project_units
         WHERE project_id IN (${placeholders}) AND deleted_at IS NULL
         GROUP BY project_id`,
        ids
      );
      unitCountResult.rows.forEach((r) => {
        unitCountMap[r.project_id] = {
          total_properties: r.total_properties,
          sold_properties: r.sold_properties,
        };
      });
    }

    const projects = projectRows.map((p) => {
      const stats = unitCountMap[p.id] || { total_properties: 0, sold_properties: 0 };
      return enrichProjectMedia(
        {
          ...p,
          unit_count: stats.total_properties,
          total_properties: stats.total_properties,
          sold_properties: stats.sold_properties,
        },
        baseUrl
      );
    });

    res.json({ data: projects });
  } catch (error) {
    console.error("getProjects error:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (client) client.release();
  }
};

// ==================== DELETE PROJECT ====================
export const deleteProject = async (req, res) => {
  const id = getProjectIdFromParams(req);
  if (!id) {
    return res.status(400).json({ error: "Project ID is required" });
  }
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const result = await client.query(
      "UPDATE projects SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id, name",
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Project not found or already deleted" });
    }

    await client.query("COMMIT");
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("deleteProject error:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (client) client.release();
  }
};
