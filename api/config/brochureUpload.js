// utils/brochureUpload.js
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NOTE: folder must be **public/brochure_files** (same as the static route)
export const brochureUploadPath = path.join(
  __dirname,
  "../../public/brochure_files"
);

const brochureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(brochureUploadPath)) {
      fs.mkdirSync(brochureUploadPath, { recursive: true });
    }
    cb(null, brochureUploadPath);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

export const uploadBrochureFile = multer({
  storage: brochureStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF, PPT, PPTX files are allowed"));
  },
});
