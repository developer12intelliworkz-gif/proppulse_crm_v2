import type { ProjectFormData } from "@/store/types/projectForm";
import { getPendingProjectLogo } from "@/utils/projectPendingFiles";

const FILE_ARRAY_KEYS = [
  "brochure_uploads",
  "marketing_brochure_uploads",
  "rera_document_uploads",
  "gallery_image_uploads",
  "gallery_video_uploads",
] as const;

const FILE_SINGLE_KEYS = ["vr_upload", "project_logo"] as const;

const SKIP_KEYS = new Set([
  ...FILE_SINGLE_KEYS,
  ...FILE_ARRAY_KEYS,
  "brochure_upload_urls",
  "marketing_brochure_urls",
  "rera_document_urls",
  "project_logo_url",
  "gallery_images",
  "gallery_videos",
  "gallery_video_groups",
  "gallery_images_removed",
  "gallery_videos_removed",
  "marketing_brochures_removed",
  "rera_documents_removed",
  "gallery_video_urls",
  "gallery_image_categories",
  "gallery_video_uploads",
  "brochures",
  "price_quotes",
  "specifications",
  "salesOptions",
]);

const isNonEmptyJsonArray = (value: unknown): boolean => {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  }
  return false;
};

export interface MultipartBuildOptions {
  logoKey?: string;
}

export const projectFormHasFiles = (
  data: Record<string, unknown>,
  options: MultipartBuildOptions = {},
): boolean => {
  if (options.logoKey && getPendingProjectLogo(options.logoKey)) return true;
  if (data.vr_upload instanceof File) return true;
  for (const key of FILE_ARRAY_KEYS) {
    const val = data[key];
    if (Array.isArray(val) && val.length > 0) return true;
  }
  return false;
};

export const buildProjectMultipartBody = (
  data: ProjectFormData | Record<string, unknown>,
  options: MultipartBuildOptions = {},
  extraSkip: string[] = [],
): FormData => {
  const fd = new FormData();
  const skip = new Set([...SKIP_KEYS, ...extraSkip]);

  const pendingLogo = options.logoKey
    ? getPendingProjectLogo(options.logoKey)
    : null;
  if (pendingLogo) {
    fd.append("project_logo", pendingLogo);
  }

  if (data.vr_upload instanceof File) {
    fd.append("vr_upload", data.vr_upload);
  }

  for (const key of FILE_ARRAY_KEYS) {
    const files = data[key as keyof typeof data];
    if (Array.isArray(files)) {
      files.forEach((file) => {
        if (file instanceof File) {
          const fieldName =
            key === "gallery_image_uploads"
              ? "gallery_images"
              : key === "gallery_video_uploads"
                ? "gallery_video_files"
                : key;
          fd.append(fieldName, file);
        }
      });
    }
  }

  if (isNonEmptyJsonArray(data.gallery_image_categories)) {
    fd.append(
      "gallery_image_categories",
      JSON.stringify(data.gallery_image_categories),
    );
  }
  if (isNonEmptyJsonArray(data.gallery_images_removed)) {
    fd.append(
      "gallery_images_removed",
      JSON.stringify(data.gallery_images_removed),
    );
  }
  if (isNonEmptyJsonArray(data.gallery_videos_removed)) {
    fd.append(
      "gallery_videos_removed",
      JSON.stringify(data.gallery_videos_removed),
    );
  }
  if (isNonEmptyJsonArray(data.gallery_video_urls)) {
    fd.append("gallery_video_urls", JSON.stringify(data.gallery_video_urls));
  }
  if (
    data.gallery_video_groups !== undefined &&
    data.gallery_video_groups !== null
  ) {
    fd.append(
      "gallery_video_groups",
      JSON.stringify(data.gallery_video_groups),
    );
  }
  if (isNonEmptyJsonArray(data.marketing_brochures_removed)) {
    fd.append(
      "marketing_brochures_removed",
      JSON.stringify(data.marketing_brochures_removed),
    );
  }
  if (isNonEmptyJsonArray(data.rera_documents_removed)) {
    fd.append(
      "rera_documents_removed",
      JSON.stringify(data.rera_documents_removed),
    );
  }

  fd.append("office_address_line1", String(data.office_address_line1 || ""));
  fd.append("office_address_line2", String(data.office_address_line2 || ""));

  Object.keys(data).forEach((key) => {
    if (skip.has(key) || extraSkip.includes(key)) return;
    const value = data[key as keyof typeof data];
    if (value === null || value === undefined) {
      fd.append(key, "");
    } else if (Array.isArray(value) || typeof value === "object") {
      fd.append(key, JSON.stringify(value));
    } else {
      fd.append(key, String(value));
    }
  });

  return fd;
};
