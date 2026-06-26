/** Fetch Open Graph / Twitter image for a URL (for video link previews). */

const extractMeta = (html, property) => {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`,
      "i",
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
};

const getYoutubeThumbnail = (url) => {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
};

export const getOgPreview = async (req, res) => {
  const rawUrl = req.query.url;
  if (!rawUrl || typeof rawUrl !== "string") {
    return res.status(400).json({ error: "url query parameter is required" });
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return res.status(400).json({ error: "Only http/https URLs are allowed" });
  }

  const yt = getYoutubeThumbnail(rawUrl);
  if (yt) {
    return res.json({
      url: rawUrl,
      thumbnail: yt,
      title: "YouTube Video",
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(rawUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CRMPreviewBot/1.0; +https://localhost)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.json({ url: rawUrl, thumbnail: null, title: parsed.hostname });
    }

    const html = await response.text();
    const thumbnail =
      extractMeta(html, "og:image") ||
      extractMeta(html, "twitter:image") ||
      extractMeta(html, "twitter:image:src");
    const title =
      extractMeta(html, "og:title") ||
      extractMeta(html, "twitter:title") ||
      parsed.hostname;

    let absoluteThumb = thumbnail;
    if (thumbnail && !thumbnail.startsWith("http")) {
      try {
        absoluteThumb = new URL(thumbnail, rawUrl).href;
      } catch {
        absoluteThumb = thumbnail;
      }
    }

    return res.json({
      url: rawUrl,
      thumbnail: absoluteThumb,
      title,
    });
  } catch (error) {
    console.error("getOgPreview error:", error.message);
    return res.json({ url: rawUrl, thumbnail: null, title: parsed.hostname });
  }
};
