import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Single uploads directory used by multer and static file serving. */
export function getUploadDir() {
  if (process.env.UPLOADS_PATH) {
    return process.env.UPLOADS_PATH;
  }
  return path.join(__dirname, "..", "uploads");
}

export function ensureUploadDir() {
  const dir = getUploadDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function toPublicUploadPath(filename) {
  return `/api/uploads/${filename}`;
}
