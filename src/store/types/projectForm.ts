export interface Specification {
  title: string;
  description: string;
}

export interface Brochure {
  name: string;
  active: boolean;
  subject: string;
  content: string;
}

export interface PriceQuote {
  active: boolean;
  subject: string;
  content: string;
}

export type GalleryImageCategory =
  | "Elevations"
  | "Landscapes"
  | "Amenities"
  | "Construction Progress"
  | "Others";

export interface GalleryImageItem {
  id: string;
  filename?: string;
  name?: string;
  url: string;
  category: GalleryImageCategory;
}

export interface GalleryVideoItem {
  id: string;
  type: "url" | "file";
  url: string;
  filename?: string;
  name?: string;
  thumbnail?: string | null;
}

export interface GalleryVideoGroup {
  id: string;
  name: string;
  videos: GalleryVideoItem[];
}

export interface OptionType {
  label: string;
  value: string;
}

export interface ProjectFormData {
  name: string;
  description: string;
  rera_project_id: string;
  sales: string;
  notify_to_emails: string;
  launched_on: string;
  expected_completion: string;
  possession: string;
  is_active: boolean;
  inventory: boolean;
  search_address: string;
  address: string;
  street: string;
  country: string;
  state: string;
  city: string;
  zip: string;
  locality: string;
  latitude: string;
  longitude: string;
  enable_vr: boolean;
  vr_upload: File | null;
  vr_upload_url: string | null;
  amenities: Record<string, boolean>;
  specifications: Specification[];
  brochures: Brochure[];
  price_quotes: PriceQuote[];
  india_property_code: string;
  magicbricks_code: string;
  status: string;
  created_by: string;
  completed_steps: number[];
  brochure_uploads: File[];
  brochure_upload_urls: string[];
  project_logo_url: string | null;
  gallery_images: GalleryImageItem[];
  gallery_videos: GalleryVideoItem[];
  gallery_video_groups: GalleryVideoGroup[];
  gallery_image_uploads: File[];
  gallery_image_categories: GalleryImageCategory[];
  gallery_video_uploads: File[];
  gallery_images_removed: string[];
  gallery_videos_removed: string[];
  gallery_video_urls: { id?: string; url: string }[];
  marketing_brochure_uploads: File[];
  marketing_brochure_urls: string[];
  marketing_brochures_removed: string[];
  rera_document_uploads: File[];
  rera_document_urls: string[];
  rera_documents_removed: string[];
  portal_selection: string;
  portal_reference_key: string;
  portal_sync_status: string;
  office_address_line1: string;
  office_address_line2: string;
}

export const initialProjectFormData: ProjectFormData = {
  name: "",
  description: "",
  rera_project_id: "",
  sales: "",
  notify_to_emails: "",
  launched_on: "",
  expected_completion: "",
  possession: "",
  is_active: true,
  inventory: false,
  search_address: "",
  address: "",
  street: "",
  country: "",
  state: "",
  city: "",
  zip: "",
  locality: "",
  latitude: "",
  longitude: "",
  enable_vr: false,
  vr_upload: null,
  vr_upload_url: null,
  amenities: {},
  specifications: [],
  brochures: [],
  price_quotes: [],
  india_property_code: "",
  magicbricks_code: "",
  status: "draft",
  created_by: "",
  completed_steps: [],
  brochure_uploads: [],
  brochure_upload_urls: [],
  project_logo_url: null,
  gallery_images: [],
  gallery_videos: [],
  gallery_video_groups: [],
  gallery_image_uploads: [],
  gallery_image_categories: [],
  gallery_video_uploads: [],
  gallery_images_removed: [],
  gallery_videos_removed: [],
  gallery_video_urls: [],
  marketing_brochure_uploads: [],
  marketing_brochure_urls: [],
  marketing_brochures_removed: [],
  rera_document_uploads: [],
  rera_document_urls: [],
  rera_documents_removed: [],
  portal_selection: "",
  portal_reference_key: "",
  portal_sync_status: "",
  office_address_line1: "",
  office_address_line2: "",
};
