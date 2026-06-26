import type { ProjectFormData } from "@/store/types/projectForm";
import type { EditProjectFormData } from "@/store/types/editProjectForm";

const FILE_KEYS = [
  "project_logo",
  "vr_upload",
  "brochure_uploads",
  "marketing_brochure_uploads",
  "rera_document_uploads",
  "gallery_image_uploads",
  "gallery_video_uploads",
] as const;

export const sanitizeProjectFormForRedux = <T extends ProjectFormData>(
  data: T,
): T => {
  const copy = { ...data } as T & Record<string, unknown>;
  for (const key of FILE_KEYS) {
    delete copy[key];
  }
  return copy as T;
};

/** Strip display-only gallery arrays from API payloads — server merges from urls/files/removals. */
export const stripGalleryFromApiPayload = <T extends Record<string, unknown>>(
  data: T,
): T => {
  const copy = { ...data };
  delete copy.gallery_images;
  delete copy.gallery_videos;
  delete copy.gallery_video_groups;
  return copy;
};

const ADDRESS_FIELD_KEYS = [
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
  "office_address_line1",
  "office_address_line2",
] as const;

/** Build API payload for a wizard step — omits fields that belong to other steps. */
export const buildStepApiPayload = (
  step: number,
  data: Record<string, unknown>,
  options: { forMultipart?: boolean } = {},
): Record<string, unknown> => {
  const payload = { ...data };

  delete payload.gallery_images;
  delete payload.gallery_videos;
  // gallery_video_groups is sent to the API on step 3 save

  if (!options.forMultipart) {
    for (const key of FILE_KEYS) {
      delete payload[key];
    }
  }

  if (step === 1) {
    for (const key of ADDRESS_FIELD_KEYS) {
      delete payload[key];
    }
  }

  return payload;
};

export const sanitizeEditFormForRedux = <T extends EditProjectFormData>(
  data: T,
): T => sanitizeProjectFormForRedux(data as unknown as ProjectFormData) as T;
