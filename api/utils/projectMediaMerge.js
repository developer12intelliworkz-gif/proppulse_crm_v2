import crypto from "crypto";
import { buildFileUrl, parseJsonBody, parseStringArrayBody, hasArrayRemovals } from "./projectUploadFields.js";

/** Coerce DB / multipart values into a plain array. */
export const normalizeJsonArray = (value) => {
  if (value === undefined || value === null || value === "") return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(value) ? value : [];
};

const parseJsonObject = (value) => {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : null;
    } catch {
      return null;
    }
  }
  return null;
};

export const normalizeGalleryUrlEntry = (entry) => {
  const parsed = parseJsonObject(entry);
  if (!parsed?.url) return null;
  const url = String(parsed.url).trim();
  if (!url) return null;
  return {
    id: parsed.id || crypto.randomUUID(),
    url,
    thumbnail: parsed.thumbnail ?? null,
    name: parsed.name || url,
  };
};

export const normalizeGalleryVideoItems = (items) =>
  normalizeJsonArray(items)
    .map((item) => {
      const parsed = parseJsonObject(item);
      if (!parsed) return null;
      if (parsed.type === "file" || parsed.filename) {
        return {
          id: parsed.id || crypto.randomUUID(),
          type: "file",
          filename: parsed.filename,
          name: parsed.name || parsed.filename,
          url: parsed.url || null,
        };
      }
      if (!parsed.url) return null;
      return {
        id: parsed.id || crypto.randomUUID(),
        type: "url",
        url: String(parsed.url).trim(),
        thumbnail: parsed.thumbnail ?? null,
        name: parsed.name || parsed.url,
      };
    })
    .filter(Boolean);

export const normalizeGalleryImageItems = (items) =>
  normalizeJsonArray(items)
    .map((item) => {
      const parsed = parseJsonObject(item);
      if (!parsed?.id) return null;
      return {
        id: parsed.id,
        filename: parsed.filename,
        name: parsed.name || parsed.filename || parsed.id,
        category: parsed.category || "Elevations",
        url: parsed.url || null,
      };
    })
    .filter(Boolean);

export const enrichGalleryImages = (items, baseUrl) =>
  normalizeGalleryImageItems(items).map((item) => ({
    ...item,
    url: item.url || buildFileUrl(baseUrl, item.filename),
  }));

export const enrichGalleryVideos = (items, baseUrl) =>
  normalizeGalleryVideoItems(items).map((item) => {
    if (item.type === "file" && item.filename) {
      return {
        ...item,
        url: item.url || buildFileUrl(baseUrl, item.filename),
      };
    }
    return item;
  });

export const mergeGalleryImages = (
  existing,
  removedIds,
  newFiles,
  categories,
  baseUrl,
) => {
  const removed = new Set(parseStringArrayBody(removedIds));
  let items = normalizeGalleryImageItems(existing).filter(
    (i) => !removed.has(i.id),
  );
  const cats = parseJsonBody(categories, []);

  newFiles.forEach((file, idx) => {
    items.push({
      id: crypto.randomUUID(),
      filename: file.filename,
      name: file.originalname || file.filename,
      category: cats[idx] || "Elevations",
      url: buildFileUrl(baseUrl, file.filename),
    });
  });

  return items;
};

export const mergeGalleryVideos = (
  existing,
  removedIds,
  urlEntries,
  newFiles,
  baseUrl,
) => {
  const removed = new Set(parseStringArrayBody(removedIds));
  let items = normalizeGalleryVideoItems(existing).filter(
    (i) => !removed.has(i.id),
  );

  const rawUrls = parseJsonBody(urlEntries, []);
  const urlList = Array.isArray(rawUrls) ? rawUrls : rawUrls ? [rawUrls] : [];
  const existingUrlSet = new Set(
    items.filter((i) => i.url).map((i) => String(i.url).trim()),
  );
  const existingIdSet = new Set(items.filter((i) => i.id).map((i) => i.id));

  urlList.forEach((entry) => {
    const normalized = normalizeGalleryUrlEntry(entry);
    if (!normalized) return;
    const { id, url, thumbnail, name } = normalized;
    if (existingUrlSet.has(url) || existingIdSet.has(id)) return;
    existingUrlSet.add(url);
    existingIdSet.add(id);
    items.push({
      id,
      type: "url",
      url,
      thumbnail,
      name,
    });
  });

  newFiles.forEach((file) => {
    items.push({
      id: crypto.randomUUID(),
      type: "file",
      filename: file.filename,
      name: file.originalname || file.filename,
      url: buildFileUrl(baseUrl, file.filename),
    });
  });

  return items;
};

export const mergeFilenameArray = (existing, removed, newFiles) => {
  const removedSet = new Set(parseStringArrayBody(removed));
  const kept = (Array.isArray(existing) ? existing : []).filter(
    (f) => !removedSet.has(f),
  );
  return [...kept, ...newFiles.map((f) => f.filename)];
};

export const enrichProjectMedia = (project, baseUrl) => {
  project.project_logo_url = buildFileUrl(baseUrl, project.project_logo);
  project.gallery_images = enrichGalleryImages(project.gallery_images, baseUrl);
  project.gallery_videos = enrichGalleryVideos(project.gallery_videos, baseUrl);
  project.marketing_brochure_urls = (project.marketing_brochures || []).map((f) =>
    buildFileUrl(baseUrl, f),
  );
  project.rera_document_urls = (project.rera_documents || []).map((f) =>
    buildFileUrl(baseUrl, f),
  );
  project.brochure_upload_urls = (project.brochure_uploads || []).map((f) =>
    buildFileUrl(baseUrl, f),
  );
  project.vr_upload_url = buildFileUrl(baseUrl, project.vr_upload);
  return project;
};
