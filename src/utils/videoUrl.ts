const YOUTUBE_PATTERNS = [
  /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]{11}(?:[&?][^\s]*)?$/i,
  /^https?:\/\/(?:www\.)?youtube\.com\/embed\/[\w-]{11}(?:\?[^\s]*)?$/i,
  /^https?:\/\/(?:www\.)?youtube\.com\/shorts\/[\w-]{11}(?:\?[^\s]*)?$/i,
  /^https?:\/\/youtu\.be\/[\w-]{11}(?:\?[^\s]*)?$/i,
];

const VIMEO_PATTERNS = [
  /^https?:\/\/(?:www\.)?vimeo\.com\/\d+(?:\/[\w-]+)?(?:\?[^\s]*)?$/i,
  /^https?:\/\/player\.vimeo\.com\/video\/\d+(?:\?[^\s]*)?$/i,
];

const EMBED_PATTERNS = [
  /^https?:\/\/(?:www\.)?dailymotion\.com\/video\/[\w-]+/i,
  /^https?:\/\/(?:www\.)?dai\.ly\/[\w-]+/i,
  /^https?:\/\/(?:www\.)?wistia\.com\/(?:medias|embed)\/[\w-]+/i,
  /^https?:\/\/fast\.wistia\.net\/embed\/iframe\/[\w-]+/i,
  /^https?:\/\/(?:www\.)?loom\.com\/(?:share|embed)\/[\w-]+/i,
  /^https?:\/\/(?:www\.)?facebook\.com\/.*\/videos\/\d+/i,
  /^https?:\/\/(?:[\w-]+\.)?streamable\.com\/[\w-]+/i,
  /^https?:\/\/(?:[\w-]+\.)?vidyard\.com\/(?:watch|share)\/[\w-]+/i,
];

const DIRECT_VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v|ogg|ogv)(\?.*)?$/i;

export const VIDEO_URL_ERROR =
  "Please enter a valid YouTube/Vimeo link or a direct video file URL";

export type VideoPlaybackKind = "youtube" | "vimeo" | "embed" | "file";

export type VideoPlayback = {
  kind: VideoPlaybackKind;
  url: string;
  embedUrl?: string;
};

const extractYoutubeId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace(/^\//, "").split("/")[0];
      return id && id.length === 11 ? id : null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        const id = parsed.pathname.split("/")[2];
        return id && id.length === 11 ? id : null;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/")[2];
        return id && id.length === 11 ? id : null;
      }
      const v = parsed.searchParams.get("v");
      return v && v.length === 11 ? v : null;
    }
  } catch {
    return null;
  }
  return null;
};

const extractVimeoId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("player.vimeo.com")) {
      const parts = parsed.pathname.split("/");
      const idx = parts.indexOf("video");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.replace(/^\//, "").split("/")[0];
      return id && /^\d+$/.test(id) ? id : null;
    }
  } catch {
    return null;
  }
  return null;
};

const isDirectVideoFileUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    return DIRECT_VIDEO_EXTENSIONS.test(parsed.pathname);
  } catch {
    return false;
  }
};

const isYoutubeUrl = (url: string): boolean =>
  YOUTUBE_PATTERNS.some((pattern) => pattern.test(url)) ||
  extractYoutubeId(url) !== null;

const isVimeoUrl = (url: string): boolean =>
  VIMEO_PATTERNS.some((pattern) => pattern.test(url)) ||
  extractVimeoId(url) !== null;

export const isValidVideoUrl = (raw: string): boolean => {
  const url = raw.trim();
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
  } catch {
    return false;
  }

  if (isYoutubeUrl(url) || isVimeoUrl(url)) return true;
  if (isDirectVideoFileUrl(url)) return true;

  return EMBED_PATTERNS.some((pattern) => pattern.test(url));
};

export const getVideoPlayback = (raw: string): VideoPlayback | null => {
  const url = raw.trim();
  if (!isValidVideoUrl(url)) return null;

  const youtubeId = extractYoutubeId(url);
  if (youtubeId) {
    return {
      kind: "youtube",
      url,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    };
  }

  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return {
      kind: "vimeo",
      url,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
    };
  }

  if (isDirectVideoFileUrl(url)) {
    return { kind: "file", url };
  }

  try {
    const parsed = new URL(url);
    if (parsed.pathname.includes("/embed/")) {
      return { kind: "embed", url, embedUrl: url };
    }
    if (parsed.hostname.includes("loom.com") && parsed.pathname.includes("/share/")) {
      const id = parsed.pathname.split("/share/")[1]?.split("/")[0];
      return id
        ? { kind: "embed", url, embedUrl: `https://www.loom.com/embed/${id}` }
        : { kind: "embed", url, embedUrl: url };
    }
  } catch {
    return null;
  }

  return { kind: "embed", url, embedUrl: url };
};

/** @deprecated Use getVideoPlayback instead */
export const toVideoEmbedUrl = (raw: string): string | null => {
  const playback = getVideoPlayback(raw);
  if (!playback || playback.kind === "file") return null;
  return playback.embedUrl ?? null;
};
