import { useContext, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FormContext } from "../../../contexts/FormContext";
import BrochuresDocumentsSection from "../shared/BrochuresDocumentsSection";

const Step5Form = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const { formData, updateFormData, saveStepData } = useContext(FormContext);
  const isEditMode = !!projectId;

  const [marketingFiles, setMarketingFiles] = useState<File[]>(
    formData.marketing_brochure_uploads || [],
  );
  const [reraFiles, setReraFiles] = useState<File[]>(
    formData.rera_document_uploads || [],
  );
  const [marketingRemoved, setMarketingRemoved] = useState<string[]>(
    formData.marketing_brochures_removed || [],
  );
  const [reraRemoved, setReraRemoved] = useState<string[]>(
    formData.rera_documents_removed || [],
  );
  const [loading, setLoading] = useState(false);

  const basePath = isEditMode
    ? `/projects/edit/${projectId}`
    : "/projects/create";

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
      navigate(`${basePath}/step6`);
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
          onClick={() => navigate(`${basePath}/step4`)}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={saveAndContinue}
          disabled={loading}
          className="flex-1"
        >
          Skip
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : "Next"}
        </Button>
      </div>
    </form>
  );
};

export default Step5Form;
