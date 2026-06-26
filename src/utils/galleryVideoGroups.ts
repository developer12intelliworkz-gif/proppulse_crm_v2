import type {
  GalleryVideoGroup,
  GalleryVideoItem,
} from "@/store/types/projectForm";

export const newGalleryGroupId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `group-${Date.now()}`;

export const coerceGalleryVideoGroups = (
  groups?: GalleryVideoGroup[],
  flatVideos?: GalleryVideoItem[],
): GalleryVideoGroup[] => {
  if (groups?.length) return groups;
  if (flatVideos?.length) {
    return [{ id: newGalleryGroupId(), name: "General", videos: flatVideos }];
  }
  return [{ id: newGalleryGroupId(), name: "Walkthrough", videos: [] }];
};
