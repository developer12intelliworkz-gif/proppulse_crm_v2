/** Multer field config for project create/update uploads */
export const PROJECT_UPLOAD_FIELDS = [
  { name: "vr_upload", maxCount: 1 },
  { name: "brochure_uploads", maxCount: 20 },
  { name: "project_logo", maxCount: 1 },
  { name: "gallery_images", maxCount: 30 },
  { name: "gallery_video_files", maxCount: 10 },
  { name: "marketing_brochure_uploads", maxCount: 20 },
  { name: "rera_document_uploads", maxCount: 20 },
];

export const buildFileUrl = (baseUrl, filename) =>
  filename ? `${baseUrl}/project_vr_app_document/${encodeURIComponent(filename)}` : null;

export const parseJsonBody = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const parseStringArrayBody = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const hasArrayRemovals = (value) =>
  parseStringArrayBody(value).length > 0;
