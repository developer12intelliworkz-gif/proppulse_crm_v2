import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEditForm } from "./EditFormContext";
import { Globe } from "lucide-react";

const PORTAL_OPTIONS = [
  "Magicbricks",
  "99acres",
  "Housing.com",
  "CommonFloor",
];

const SYNC_STATUS_OPTIONS = ["Draft / Pending Discussion", "Active"];

const EditStep6Form = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const { formData, updateFormData, saveStepData } = useEditForm();
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    portal_selection: formData.portal_selection || "",
    portal_reference_key: formData.portal_reference_key || "",
    portal_sync_status: formData.portal_sync_status || "",
  });

  useEffect(() => {
    setFormValues({
      portal_selection: formData.portal_selection || "",
      portal_reference_key: formData.portal_reference_key || "",
      portal_sync_status: formData.portal_sync_status || "",
    });
  }, [formData]);

  const saveAndFinish = async () => {
    setLoading(true);
    try {
      await saveStepData(6, { ...formValues, status: formData.status || "draft" });
      updateFormData(formValues);
      navigate(projectId ? `/project-setup?projectId=${projectId}` : "/project-setup");
    } catch (error) {
      console.error("Error saving step 6:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        saveAndFinish();
      }}
      className="space-y-6 max-w-2xl p-6 bg-white rounded-lg shadow"
    >
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Portal Integrations</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Optional portal configuration — skip if not needed.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Portal Configuration</CardTitle>
              <CardDescription>Static fields for future integration</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Portal Selection</Label>
            <p className="text-xs text-muted-foreground">
              Select third-party real estate portal for syndicating listings
            </p>
            <Select
              value={formValues.portal_selection}
              onValueChange={(v) =>
                setFormValues((prev) => ({ ...prev, portal_selection: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select portal" />
              </SelectTrigger>
              <SelectContent>
                {PORTAL_OPTIONS.map((portal) => (
                  <SelectItem key={portal} value={portal}>
                    {portal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="portal_reference_key">Portal Reference Key</Label>
            <p className="text-xs text-muted-foreground">
              API integration authentication token or reference code for the selected portal
            </p>
            <Input
              id="portal_reference_key"
              value={formValues.portal_reference_key}
              onChange={(e) =>
                setFormValues((prev) => ({
                  ...prev,
                  portal_reference_key: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Sync Status (RERA / Portal)</Label>
            <p className="text-xs text-muted-foreground">
              Integration sync status — to be finalized with Mayur sir and Arvind sir
            </p>
            <Select
              value={formValues.portal_sync_status}
              onValueChange={(v) =>
                setFormValues((prev) => ({ ...prev, portal_sync_status: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {SYNC_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/projects/edit/${projectId}/step5`)}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={saveAndFinish}
          disabled={loading}
          className="flex-1"
        >
          Skip
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : "Save & Finish"}
        </Button>
      </div>
    </form>
  );
};

export default EditStep6Form;
