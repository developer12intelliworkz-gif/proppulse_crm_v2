import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Single source of truth — repo root public/project_vr_app_document */
export const PROJECT_MEDIA_DIR = path.join(
  __dirname,
  "../../public/project_vr_app_document",
);
