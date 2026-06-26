import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Eye,
  FileText,
  FolderPlus,
  ImagePlus,
  Loader2,
  Pencil,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import { newGalleryGroupId } from "@/utils/galleryVideoGroups";
import {
  isValidVideoUrl,
  getVideoPlayback,
  VIDEO_URL_ERROR,
} from "@/utils/videoUrl";
import { cn } from "@/lib/utils";
import type {
  GalleryImageCategory,
  GalleryImageItem,
  GalleryVideoGroup,
} from "@/store/types/projectForm";

const IMAGE_CATEGORIES: GalleryImageCategory[] = [
  "Elevations",
  "Landscapes",
  "Amenities",
  "Construction Progress",
  "Others",
];

const ALL_CATEGORY = "All";

const isImageFile = (name: string) =>
  /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name);

const isPdfFile = (name: string) => /\.pdf$/i.test(name);

interface MediaGallerySectionProps {
  galleryImages: GalleryImageItem[];
  galleryVideoGroups: GalleryVideoGroup[];
  newImageFiles: File[];
  newImageCategories: GalleryImageCategory[];
  newVideoUrl: string;
  onNewImageFiles: (files: File[], categories: GalleryImageCategory[]) => void;
  onRemoveImage: (id: string) => void;
  onVideoGroupsChange: (groups: GalleryVideoGroup[]) => void;
  onVideoUrlChange: (url: string) => void;
}

type PreviewState =
  | { type: "image"; url: string; name: string }
  | { type: "pdf"; url: string; name: string }
  | { type: "url"; url: string; name: string }
  | { type: "video"; url: string; embedUrl?: string; playbackKind: "youtube" | "vimeo" | "embed" | "file"; name: string };

const MediaGallerySection = ({
  galleryImages,
  galleryVideoGroups,
  newImageFiles,
  newImageCategories,
  newVideoUrl,
  onNewImageFiles,
  onRemoveImage,
  onVideoGroupsChange,
  onVideoUrlChange,
}: MediaGallerySectionProps) => {
  const [pendingCategory, setPendingCategory] =
    useState<GalleryImageCategory>("Elevations");
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORY);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [fetchingOg, setFetchingOg] = useState(false);
  const [activeVideoGroupId, setActiveVideoGroupId] = useState(
    () => galleryVideoGroups[0]?.id || "",
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [videoUrlError, setVideoUrlError] = useState("");

  const pendingImagePreviews = useMemo(
    () =>
      newImageFiles.map((file, idx) => ({
        id: `pending-img-${idx}`,
        key: `${file.name}-${idx}`,
        url: URL.createObjectURL(file),
        category: newImageCategories[idx] || pendingCategory,
        name: file.name,
        isPending: true as const,
      })),
    [newImageFiles, newImageCategories, pendingCategory],
  );

  const allMediaItems = useMemo(() => {
    const saved = galleryImages.map((img) => ({
      id: img.id,
      url: img.url,
      name: img.name || img.filename || "File",
      category: img.category,
      isPending: false as const,
    }));
    return [...saved, ...pendingImagePreviews];
  }, [galleryImages, pendingImagePreviews]);

  const filteredMedia = useMemo(() => {
    if (categoryFilter === ALL_CATEGORY) return allMediaItems;
    return allMediaItems.filter((item) => item.category === categoryFilter);
  }, [allMediaItems, categoryFilter]);

  const selectedVideoGroupId =
    galleryVideoGroups.some((g) => g.id === activeVideoGroupId)
      ? activeVideoGroupId
      : galleryVideoGroups[0]?.id || "";

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const categories = files.map(() => pendingCategory);
    onNewImageFiles([...newImageFiles, ...files], [
      ...newImageCategories,
      ...categories,
    ]);
    e.target.value = "";
  };

  const handleAddVideoCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const id = newGalleryGroupId();
    const next = [...galleryVideoGroups, { id, name, videos: [] }];
    onVideoGroupsChange(next);
    setActiveVideoGroupId(id);
    setNewCategoryName("");
  };

  const handleRemoveVideoCategory = (groupId: string) => {
    const group = galleryVideoGroups.find((g) => g.id === groupId);
    if (!group) return;
    if (
      group.videos.length > 0 &&
      !window.confirm(
        `Delete category "${group.name}" and all ${group.videos.length} video(s)?`,
      )
    ) {
      return;
    }
    const next = galleryVideoGroups.filter((g) => g.id !== groupId);
    onVideoGroupsChange(
      next.length
        ? next
        : [{ id: newGalleryGroupId(), name: "Walkthrough", videos: [] }],
    );
    if (activeVideoGroupId === groupId) {
      setActiveVideoGroupId(next[0]?.id || "");
    }
  };

  const startEditCategory = (group: GalleryVideoGroup) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const saveEditCategory = () => {
    if (!editingGroupId) return;
    const name = editingGroupName.trim();
    if (!name) return;
    onVideoGroupsChange(
      galleryVideoGroups.map((g) =>
        g.id === editingGroupId ? { ...g, name } : g,
      ),
    );
    setEditingGroupId(null);
    setEditingGroupName("");
  };

  const handleAddVideoUrl = async () => {
    const url = newVideoUrl.trim();
    if (!url || !selectedVideoGroupId) return;

    if (!isValidVideoUrl(url)) {
      setVideoUrlError(VIDEO_URL_ERROR);
      return;
    }
    setVideoUrlError("");

    setFetchingOg(true);
    try {
      const res = await axiosInstance.get("/projects/og-preview", {
        params: { url },
      });
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `id-${Date.now()}`;
      const video = {
        id,
        type: "url" as const,
        url,
        thumbnail: res.data?.thumbnail ?? null,
        name: res.data?.title || url,
      };
      onVideoGroupsChange(
        galleryVideoGroups.map((g) =>
          g.id === selectedVideoGroupId
            ? { ...g, videos: [...g.videos, video] }
            : g,
        ),
      );
      onVideoUrlChange("");
    } catch {
      if (!isValidVideoUrl(url)) {
        setVideoUrlError(VIDEO_URL_ERROR);
        return;
      }
      const id = `id-${Date.now()}`;
      onVideoGroupsChange(
        galleryVideoGroups.map((g) =>
          g.id === selectedVideoGroupId
            ? {
                ...g,
                videos: [
                  ...g.videos,
                  {
                    id,
                    type: "url" as const,
                    url,
                    thumbnail: null,
                    name: url,
                  },
                ],
              }
            : g,
        ),
      );
      onVideoUrlChange("");
    } finally {
      setFetchingOg(false);
    }
  };

  const handleRemoveVideo = (groupId: string, videoId: string) => {
    onVideoGroupsChange(
      galleryVideoGroups.map((g) =>
        g.id === groupId
          ? { ...g, videos: g.videos.filter((v) => v.id !== videoId) }
          : g,
      ),
    );
  };

  const openVideoPreview = (url: string, name: string) => {
    const playback = getVideoPlayback(url);
    if (!playback) {
      setVideoUrlError(VIDEO_URL_ERROR);
      return;
    }
    setPreview({
      type: "video",
      url: playback.url,
      embedUrl: playback.embedUrl,
      playbackKind: playback.kind,
      name,
    });
  };

  const openPreview = (url: string, name: string) => {
    if (isImageFile(name)) {
      setPreview({ type: "image", url, name });
    } else if (isPdfFile(name)) {
      setPreview({ type: "pdf", url, name });
    } else {
      setPreview({ type: "url", url, name });
    }
  };

  const downloadFile = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  const removePendingImage = (pendingId: string) => {
    const idx = Number(pendingId.replace("pending-img-", ""));
    if (!Number.isFinite(idx)) return;
    onNewImageFiles(
      newImageFiles.filter((_, i) => i !== idx),
      newImageCategories.filter((_, i) => i !== idx),
    );
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div>
        <h2 className="text-2xl font-bold">Media Gallery</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage project images and video links organized by category.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Image Gallery Upload</CardTitle>
          <CardDescription>
            Upload and organize files categorized by visual sections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2 min-w-0">
              <Label>Category for new uploads</Label>
              <Select
                value={pendingCategory}
                onValueChange={(v) =>
                  setPendingCategory(v as GalleryImageCategory)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-0">
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <Label
                  htmlFor="gallery_files"
                  className="cursor-pointer text-sm text-primary font-medium"
                >
                  Choose files (images, PDFs, etc.)
                </Label>
                <Input
                  id="gallery_files"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleImagePick}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={categoryFilter === ALL_CATEGORY ? "default" : "outline"}
              onClick={() => setCategoryFilter(ALL_CATEGORY)}
            >
              All
            </Button>
            {IMAGE_CATEGORIES.map((cat) => (
              <Button
                key={cat}
                type="button"
                size="sm"
                variant={categoryFilter === cat ? "default" : "outline"}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          {filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-lg">
              <ImagePlus className="h-10 w-10 mb-2" />
              <p className="text-sm">No files in this category yet</p>
            </div>
          ) : (
            <div
              className={cn(
                "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3",
                filteredMedia.length > 8 &&
                  "max-h-[19.5rem] overflow-y-auto pr-1 scrollbar-thin",
              )}
            >
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-card border rounded-lg p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col items-center text-center">
                    {isImageFile(item.name) ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="h-20 w-full object-cover rounded mb-2"
                      />
                    ) : (
                      <FileText className="h-16 w-16 text-muted-foreground mb-2" />
                    )}
                    <p className="text-xs font-medium line-clamp-2 w-full">
                      {item.name}
                    </p>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {item.category}
                      {item.isPending ? " · new" : ""}
                    </Badge>
                  </div>
                  <div className="absolute top-1 right-1 flex gap-0.5">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      onClick={() => openPreview(item.url, item.name)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      onClick={() => downloadFile(item.url, item.name)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7"
                      onClick={() =>
                        item.isPending
                          ? removePendingImage(item.id)
                          : onRemoveImage(item.id)
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Video URLs by Category</CardTitle>
          <CardDescription>
            Create custom categories and add video or walkthrough links to each
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="New video category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddVideoCategory()}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              disabled={!newCategoryName.trim()}
              onClick={handleAddVideoCategory}
            >
              <FolderPlus className="h-4 w-4 mr-1" />
              Add Category
            </Button>
          </div>

          {galleryVideoGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
              Add a video category to get started
            </p>
          ) : (
            <div className="space-y-4">
              {galleryVideoGroups.map((group) => (
                <div
                  key={group.id}
                  className={`border rounded-lg p-4 space-y-3 ${
                    selectedVideoGroupId === group.id
                      ? "ring-2 ring-primary/30"
                      : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {editingGroupId === group.id ? (
                      <div className="flex flex-1 gap-2 min-w-0">
                        <Input
                          value={editingGroupName}
                          onChange={(e) => setEditingGroupName(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && saveEditCategory()
                          }
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={saveEditCategory}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingGroupId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="font-medium text-left hover:underline"
                          onClick={() => setActiveVideoGroupId(group.id)}
                        >
                          {group.name}
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {group.videos.length} video
                            {group.videos.length === 1 ? "" : "s"}
                          </Badge>
                        </button>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => startEditCategory(group)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleRemoveVideoCategory(group.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  {selectedVideoGroupId === group.id && (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          placeholder="Paste YouTube, Vimeo, or embeddable video URL"
                          value={newVideoUrl}
                          onChange={(e) => {
                            onVideoUrlChange(e.target.value);
                            if (videoUrlError) setVideoUrlError("");
                          }}
                          className="flex-1 min-w-0"
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleAddVideoUrl()
                          }
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          className="shrink-0"
                          disabled={
                            fetchingOg ||
                            !newVideoUrl.trim() ||
                            !isValidVideoUrl(newVideoUrl.trim())
                          }
                          onClick={handleAddVideoUrl}
                        >
                          {fetchingOg ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Fetching…
                            </>
                          ) : (
                            "Add URL"
                          )}
                        </Button>
                      </div>
                      {videoUrlError && (
                        <p className="text-sm text-destructive">{videoUrlError}</p>
                      )}
                    </div>
                  )}

                  {group.videos.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No videos in this category yet
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {group.videos.map((video) => {
                        const name = video.name || video.url;
                        const thumb = video.thumbnail;
                        return (
                          <div
                            key={video.id}
                            className="group relative border rounded-lg p-3 bg-card"
                          >
                            <div className="flex gap-3 items-start">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt=""
                                  className="h-20 w-28 object-cover rounded shrink-0"
                                />
                              ) : (
                                <div className="h-20 w-28 bg-muted rounded flex items-center justify-center shrink-0">
                                  <Video className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-2">
                                  {name}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2 break-all mt-1">
                                  {video.url}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-end gap-1 mt-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => openVideoPreview(video.url, name)}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Preview
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleRemoveVideo(group.id, video.id)
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-3xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{preview?.name}</DialogTitle>
          </DialogHeader>
          {preview?.type === "image" && (
            <img
              src={preview.url}
              alt={preview.name}
              className="max-h-[70vh] w-full object-contain rounded"
            />
          )}
          {preview?.type === "pdf" && (
            <iframe
              src={preview.url}
              title={preview.name}
              className="w-full h-[70vh] rounded border"
            />
          )}
          {preview?.type === "video" && preview.playbackKind === "file" && (
            <video
              src={preview.url}
              controls
              playsInline
              className="w-full max-h-[70vh] rounded border bg-black"
            />
          )}
          {preview?.type === "video" && preview.playbackKind !== "file" && preview.embedUrl && (
            <div className="relative w-full aspect-video rounded overflow-hidden border bg-black">
              <iframe
                src={preview.embedUrl}
                title={preview.name}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}
          {preview?.type === "url" && (
            <div className="space-y-3">
              <p className="text-sm break-all text-muted-foreground">
                {preview.url}
              </p>
              <Button asChild>
                <a href={preview.url} target="_blank" rel="noopener noreferrer">
                  Open in new tab
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaGallerySection;
