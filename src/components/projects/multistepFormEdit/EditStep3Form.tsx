import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEditForm } from "./EditFormContext";
import MediaGallerySection from "../shared/MediaGallerySection";
import { coerceGalleryVideoGroups } from "@/utils/galleryVideoGroups";
import type {
  GalleryImageCategory,
  GalleryImageItem,
  GalleryVideoGroup,
} from "@/store/types/projectForm";

const EditStep3Form = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const { formData, saveStepData } = useEditForm();

  const [galleryImages, setGalleryImages] = useState<GalleryImageItem[]>(
    formData.gallery_images || [],
  );
  const [galleryVideoGroups, setGalleryVideoGroups] = useState<
    GalleryVideoGroup[]
  >(() =>
    coerceGalleryVideoGroups(
      formData.gallery_video_groups,
      formData.gallery_videos,
    ),
  );
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImageCategories, setNewImageCategories] = useState<
    GalleryImageCategory[]
  >([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setGalleryImages(formData.gallery_images || []);
    setGalleryVideoGroups(
      coerceGalleryVideoGroups(
        formData.gallery_video_groups,
        formData.gallery_videos,
      ),
    );
  }, [
    formData.gallery_images,
    formData.gallery_videos,
    formData.gallery_video_groups,
  ]);

  const clearStagingState = () => {
    setNewImageFiles([]);
    setNewImageCategories([]);
    setRemovedImageIds([]);
    setNewVideoUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const stepData = {
        gallery_images: galleryImages,
        gallery_video_groups: galleryVideoGroups,
        gallery_image_uploads: newImageFiles,
        gallery_image_categories: newImageCategories,
        gallery_images_removed: removedImageIds,
        enable_vr: false,
      };
      await saveStepData(3, stepData);
      clearStagingState();
      navigate(`/projects/edit/${projectId}/step4`);
    } catch (error) {
      console.error("Error saving step 3:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 bg-white rounded-lg shadow"
    >
      <MediaGallerySection
        galleryImages={galleryImages}
        galleryVideoGroups={galleryVideoGroups}
        newImageFiles={newImageFiles}
        newImageCategories={newImageCategories}
        newVideoUrl={newVideoUrl}
        onNewImageFiles={(files, categories) => {
          setNewImageFiles(files);
          setNewImageCategories(categories);
        }}
        onRemoveImage={(id) => {
          setGalleryImages((prev) => prev.filter((img) => img.id !== id));
          setRemovedImageIds((prev) => [...prev, id]);
        }}
        onVideoGroupsChange={setGalleryVideoGroups}
        onVideoUrlChange={setNewVideoUrl}
      />

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/projects/edit/${projectId}/step2`)}
          className="flex-1"
        >
          Back
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : "Next"}
        </Button>
      </div>
    </form>
  );
};

export default EditStep3Form;
