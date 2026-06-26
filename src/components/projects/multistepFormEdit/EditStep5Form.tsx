import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEditForm } from "./EditFormContext";
import BrochuresDocumentsSection from "../shared/BrochuresDocumentsSection";

const EditStep5Form = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { formData, updateFormData, saveStepData } = useEditForm();

  const [marketingFiles, setMarketingFiles] = useState<File[]>([]);
  const [reraFiles, setReraFiles] = useState<File[]>([]);
  const [marketingRemoved, setMarketingRemoved] = useState<string[]>([]);
  const [reraRemoved, setReraRemoved] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const marketingUrls =
    formData.marketing_brochure_urls?.length > 0
      ? formData.marketing_brochure_urls
      : formData.brochure_upload_urls || [];

  const saveAndContinue = async () => {
    setLoading(true);
    try {
      const stepData = {
        marketing_brochure_uploads: marketingFiles,
        rera_document_uploads: reraFiles,
        marketing_brochures_removed: marketingRemoved,
        rera_documents_removed: reraRemoved,
        brochures: [],
      };
      await saveStepData(5, stepData);
      updateFormData(stepData);
      navigate(`/projects/edit/${projectId}/step6`);
    } catch (err) {
      console.error("Step 5 save failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        saveAndContinue();
      }}
      className="space-y-8 p-6 bg-white rounded-lg shadow-lg"
    >
      <BrochuresDocumentsSection
        marketingUrls={marketingUrls}
        marketingFiles={marketingFiles}
        marketingRemoved={marketingRemoved}
        reraUrls={formData.rera_document_urls || []}
        reraFiles={reraFiles}
        reraRemoved={reraRemoved}
        onMarketingFiles={setMarketingFiles}
        onMarketingRemoveExisting={(filename) =>
          setMarketingRemoved((prev) => [...prev, filename])
        }
        onMarketingRemoveNew={(idx) =>
          setMarketingFiles((prev) => prev.filter((_, i) => i !== idx))
        }
        onReraFiles={setReraFiles}
        onReraRemoveExisting={(filename) =>
          setReraRemoved((prev) => [...prev, filename])
        }
        onReraRemoveNew={(idx) =>
          setReraFiles((prev) => prev.filter((_, i) => i !== idx))
        }
      />

      <div className="flex gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/projects/edit/${projectId}/step4`)}
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

export default EditStep5Form;
