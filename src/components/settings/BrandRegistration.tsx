import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import axiosInstance from "@/api/axiosInstance";
import { buildCompanyLogoUrl } from "@/utils/companyLogoUrl";
import { useAuth } from "@/contexts/AuthContext";
import { resolveCompanyId } from "@/utils/tenant";
import BrandRegistrationForm, {
  type BrandRecord,
} from "./BrandRegistrationForm";

const BrandRegistration = ({
  companyId: companyIdProp,
}: {
  companyId?: string;
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const companyId = companyIdProp ?? resolveCompanyId(user);

  const [brands, setBrands] = useState<BrandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingBrand, setEditingBrand] = useState<BrandRecord | null>(null);
  const [formKey, setFormKey] = useState(0);

  const resolveLogoUrl = (path: string | null) =>
    buildCompanyLogoUrl(path) || "";

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/brands", {
        params: { company_id: companyId },
      });
      setBrands(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (error) {
      console.error("Failed to load brands:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load brands.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [companyId]);

  const openCreate = () => {
    setEditingBrand(null);
    setFormKey((k) => k + 1);
    setDialogOpen(true);
  };

  const openEdit = (brand: BrandRecord) => {
    setEditingBrand(brand);
    setFormKey((k) => k + 1);
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingBrand(null);
    }
  };

  const handleSaved = async () => {
    setDialogOpen(false);
    setEditingBrand(null);
    await fetchBrands();
  };

  const handleDeleteClick = (brandId: string) => {
    if (brands.length <= 1) {
      toast({
        variant: "destructive",
        title: "Cannot delete brand",
        description: "You need at least 1 brand. Cannot delete the last brand.",
      });
      return;
    }
    setDeleteId(brandId);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    if (brands.length <= 1) {
      toast({
        variant: "destructive",
        title: "Cannot delete brand",
        description: "You need at least 1 brand. Cannot delete the last brand.",
      });
      setDeleteId(null);
      return;
    }
    try {
      await axiosInstance.delete(`/brands/${deleteId}`);
      toast({ title: "Deleted", description: "Brand removed successfully." });
      setDeleteId(null);
      await fetchBrands();
    } catch (error: unknown) {
      console.error("Failed to delete brand:", error);
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to delete brand.";
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-y-auto">
      <div className="bg-card border-b shadow-sm">
        <div className="px-6 py-4 flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Brand Registration
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage multiple brands under your company
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <Home className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/settings")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Brand
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mx-auto max-w-6xl bg-white rounded-lg shadow-lg p-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading brands…</p>
          ) : brands.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No brands registered yet.</p>
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Add your first brand
              </Button>
            </div>
          ) : (
            <>
              {brands.length === 1 && (
                <p className="text-sm text-muted-foreground mb-4 rounded-md border bg-muted/40 px-3 py-2">
                  At least one brand is required. The last brand cannot be deleted.
                </p>
              )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  className="border rounded-lg p-4 flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 rounded-md border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {brand.brand_logo ? (
                        <img
                          src={resolveLogoUrl(brand.brand_logo)}
                          alt={brand.brand_display_name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No logo
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">
                        {brand.brand_display_name}
                      </h3>
                      {brand.website && (
                        <a
                          href={brand.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline truncate block"
                        >
                          {brand.website}
                        </a>
                      )}
                      {brand.contact_number && (
                        <p className="text-sm text-muted-foreground">
                          {brand.contact_number}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEdit(brand)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(brand.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBrand ? "Edit Brand" : "Add Brand"}
            </DialogTitle>
            <DialogDescription>
              Register a brand linked to your company profile.
            </DialogDescription>
          </DialogHeader>

          <BrandRegistrationForm
            key={formKey}
            companyId={companyId}
            editingBrand={editingBrand}
            onCancel={() => handleDialogOpenChange(false)}
            onSaved={handleSaved}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete brand?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the brand from your company. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BrandRegistration;
