import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  List,
  RefreshCw,
  ArrowLeft,
  Home,
  ImageIcon,
  GripVertical,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import axiosInstance from "@/api/axiosInstance";
import { formatPascalCaseDisplayName } from "@/utils/formatDisplayName";

interface LeadType {
  id: string;
  name: string;
  logo_image?: string | null;
  logo_name?: string | null;
  logo_url?: string | null;
  is_assignable?: boolean;
  sort_order?: number;
  created_at?: string;
  deleted_at?: string | null;
}

const normalizeLogoUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.includes("/api/")) return url;
  return url.replace("public/lead_icons", "api/public/lead_icons");
};

const ImagePreview = ({
  src,
  alt,
  label,
}: {
  src: string | null;
  alt: string;
  label: string;
}) => (
  <div className="mt-4">
    <p className="text-sm text-muted-foreground mb-2">{label}</p>
    {src ? (
      <img
        src={src}
        alt={alt}
        className="w-24 h-24 object-cover rounded-md border"
        onError={(e) =>
          console.error("Image preview failed to load:", src, e)
        }
      />
    ) : (
      <div className="w-24 h-24 rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 flex flex-col items-center justify-center text-muted-foreground">
        <ImageIcon className="w-8 h-8 mb-1" />
        <span className="text-xs">No image</span>
      </div>
    )}
  </div>
);

const LeadType = () => {
  const { hasPermission, user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [leadTypes, setLeadTypes] = useState<LeadType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLeadType, setSelectedLeadType] = useState<LeadType | null>(
    null
  );
  const [newLeadTypeName, setNewLeadTypeName] = useState("");
  const [newLogoName, setNewLogoName] = useState("");
  const [newLogoImage, setNewLogoImage] = useState<File | null>(null);
  const [newIsAssignable, setNewIsAssignable] = useState(true);
  const [editLeadTypeName, setEditLeadTypeName] = useState("");
  const [editLogoName, setEditLogoName] = useState("");
  const [editLogoImage, setEditLogoImage] = useState<File | null>(null);
  const [editIsAssignable, setEditIsAssignable] = useState(true);
  const [createImagePreview, setCreateImagePreview] = useState<string | null>(
    null
  );
  const [editImagePreview, setEditImagePreview] = useState<string | null>(
    null
  );
  const [reordering, setReordering] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;
    } else {
      setError("Authentication token is missing. Please log in again.");
      setLoading(false);
    }
  }, [token]);

  const fetchLeadTypes = async () => {
    if (!hasPermission("manage_lead_types")) {
      setError("You don't have permission to manage lead sources.");
      setLoading(false);
      return;
    }

    if (!token) {
      setError("Authentication token is missing. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get("/leadtype");
      setLeadTypes(response.data || []);
    } catch (err: any) {
      console.error("Failed to fetch lead sources:", err);
      const errorMessage =
        err.response?.status === 404
          ? "Lead sources endpoint not found. Please check the API configuration."
          : err.response?.status === 401
          ? "Unauthorized request. Please check your authentication token."
          : "Failed to load lead sources. Please try again later.";

      setError(errorMessage);
      // toast({
        // title: "Error",
        // description: errorMessage,
        // variant: "destructive",
      // });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeadType = async () => {
    if (!newLeadTypeName.trim()) {
      // toast({
        // title: "Error",
        // description: "Lead source name is required",
        // variant: "destructive",
      // });
      return;
    }

    const formData = new FormData();
    formData.append("name", newLeadTypeName);
    if (newLogoName) formData.append("logo_name", newLogoName);
    if (newLogoImage) formData.append("logo_image", newLogoImage);
    formData.append("is_assignable", String(newIsAssignable));

    try {
      await axiosInstance.post("/leadtype", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchLeadTypes();
      setIsCreateDialogOpen(false);
      setNewLeadTypeName("");
      setNewLogoName("");
      setNewLogoImage(null);
      setNewIsAssignable(true);
      setCreateImagePreview(null);
      // toast({
        // title: "Success",
        // description: `Lead source "${newLeadTypeName}" created successfully`,
      // });
    } catch (err: any) {
      // toast({
        // title: "Error",
        // description:
          // err.response?.data?.message ||
          // err.message ||
          // "Failed to create lead source",
        // variant: "destructive",
      // });
    }
  };

  const handleUpdateLeadType = async () => {
    if (!editLeadTypeName.trim()) {
      // toast({
        // title: "Error",
        // description: "Lead source name is required",
        // variant: "destructive",
      // });
      return;
    }

    if (!selectedLeadType) return;

    const formData = new FormData();
    formData.append("name", editLeadTypeName);
    if (editLogoName) formData.append("logo_name", editLogoName);
    if (editLogoImage) formData.append("logo_image", editLogoImage);
    formData.append("is_assignable", String(editIsAssignable));

    try {
      await axiosInstance.put(`/leadtype/${selectedLeadType.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchLeadTypes();
      setIsEditDialogOpen(false);
      setSelectedLeadType(null);
      setEditLeadTypeName("");
      setEditLogoName("");
      setEditLogoImage(null);
      setEditImagePreview(null);
      // toast({
        // title: "Success",
        // description: `Lead source "${editLeadTypeName}" updated successfully`,
      // });
    } catch (err: any) {
      // toast({
        // title: "Error",
        // description:
          // err.response?.data?.message ||
          // err.message ||
          // "Failed to update lead source",
        // variant: "destructive",
      // });
    }
  };

  const handleDeleteLeadType = async (leadTypeId: string) => {
    const leadTypeToDelete = leadTypes.find((lt) => lt.id === leadTypeId);
    if (!leadTypeToDelete) return;

    try {
      await axiosInstance.delete(`/leadtype/${leadTypeId}`);
      await fetchLeadTypes();
      setIsDeleteDialogOpen(false);
      setSelectedLeadType(null);
      // toast({
        // title: "Success",
        // description: `Lead source "${leadTypeToDelete.name}" deleted successfully`,
      // });
    } catch (err: any) {
      // toast({
        // title: "Error",
        // description:
          // err.response?.data?.message ||
          // err.message ||
          // "Failed to delete lead source",
        // variant: "destructive",
      // });
    }
  };

  const persistOrder = async (ordered: LeadType[]) => {
    if (ordered.length === 0) {
      // toast({
        // title: "Error",
        // description: "No lead sources available to reorder",
        // variant: "destructive",
      // });
      return;
    }

    setReordering(true);
    try {
      // Use existing PUT /leadtype/:id — works without the /reorder route
      await Promise.all(
        ordered.map((lt, index) => {
          const formData = new FormData();
          formData.append("name", lt.name);
          formData.append("sort_order", String(index));
          if (lt.is_assignable !== undefined) {
            formData.append("is_assignable", String(lt.is_assignable !== false));
          }
          return axiosInstance.put(`/leadtype/${lt.id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }),
      );

      setLeadTypes(ordered.map((lt, index) => ({ ...lt, sort_order: index })));
      // toast({
        // title: "Success",
        // description: "Lead source order updated",
      // });
    } catch (err: any) {
      // toast({
        // title: "Error",
        // description:
          // err.response?.data?.message ||
          // err.message ||
          // "Failed to update lead source order. Restart the API server if this persists.",
        // variant: "destructive",
      // });
      await fetchLeadTypes();
    } finally {
      setReordering(false);
    }
  };

  const reorderByDrag = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;

    const next = [...leadTypes];
    const fromIdx = next.findIndex((lt) => lt.id === sourceId);
    const toIdx = next.findIndex((lt) => lt.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;

    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    void persistOrder(next);
  };

  useEffect(() => {
    if (newLogoImage) {
      const objectUrl = URL.createObjectURL(newLogoImage);
      setCreateImagePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setCreateImagePreview(null);
  }, [newLogoImage]);

  useEffect(() => {
    if (editLogoImage) {
      const objectUrl = URL.createObjectURL(editLogoImage);
      setEditImagePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    if (isEditDialogOpen && selectedLeadType?.logo_url) {
      setEditImagePreview(normalizeLogoUrl(selectedLeadType.logo_url));
      return;
    }

    setEditImagePreview(null);
  }, [editLogoImage, isEditDialogOpen, selectedLeadType]);

  useEffect(() => {
    fetchLeadTypes();
  }, []);

  const filteredLeadTypes = useMemo(
    () =>
      leadTypes.filter((leadType) =>
        leadType.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [leadTypes, searchTerm]
  );

  if (!hasPermission("manage_lead_types")) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground">
          You don&apos;t have permission to manage lead sources.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading lead sources...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchLeadTypes} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-card border-b shadow-sm flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                All Lead Sources
              </h1>
              <p className="text-muted-foreground">
                Create, order, and manage lead sources for assignment.
              </p>
            </div>
            <div className="flex gap-3">
              {hasPermission("create_lead_types") && (
                <Dialog
                  open={isCreateDialogOpen}
                  onOpenChange={(open) => {
                    setIsCreateDialogOpen(open);
                    if (!open) {
                      setNewLogoImage(null);
                      setCreateImagePreview(null);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="w-full md:w-auto">
                      <Plus className="w-4 h-4 mr-2" /> Add Lead Source
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create Lead Source</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                      Create a new lead source with a name and logo.
                    </DialogDescription>
                    <div className="space-y-4 py-4">
                      <Input
                        placeholder="Enter lead source name"
                        value={newLeadTypeName}
                        onChange={(e) => setNewLeadTypeName(e.target.value)}
                        className="w-full"
                      />
                      <Input
                        placeholder="Enter logo name"
                        value={newLogoName}
                        onChange={(e) => setNewLogoName(e.target.value)}
                        className="w-full"
                      />
                      <Input
                        type="file"
                        accept="image/*"
                        name="logo_image"
                        onChange={(e) =>
                          setNewLogoImage(
                            e.target.files ? e.target.files[0] : null
                          )
                        }
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload in <strong>.png, .jpg, .jpeg</strong> format only.
                      </p>
                      <ImagePreview
                        src={createImagePreview}
                        alt="Logo preview"
                        label="Image Preview:"
                      />
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <Label htmlFor="create-assignable">
                            Assignable to leads
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Show this source when creating or editing leads
                          </p>
                        </div>
                        <Switch
                          id="create-assignable"
                          checked={newIsAssignable}
                          onCheckedChange={setNewIsAssignable}
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleCreateLeadType}>Create</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                <Home className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/settings")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="p-6 mx-auto w-full">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Display Order</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Drag cards horizontally to set the order shown in Lead Management.
                {searchTerm ? " Clear search to reorder." : ""}
              </p>
              <div className="flex gap-4 overflow-x-auto pb-2 min-h-[160px]">
                {filteredLeadTypes.map((leadType, index) => {
                  const canDrag =
                    user?.role === "admin" && searchTerm === "" && !reordering;
                  const isDragging = draggedId === leadType.id;
                  const isDragOver = dragOverId === leadType.id;

                  return (
                    <Card
                      key={leadType.id}
                      draggable={canDrag}
                      onDragStart={() => {
                        if (!canDrag) return;
                        setDraggedId(leadType.id);
                      }}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDragOverId(null);
                      }}
                      onDragOver={(e) => {
                        if (!canDrag || !draggedId) return;
                        e.preventDefault();
                        setDragOverId(leadType.id);
                      }}
                      onDragLeave={() => {
                        if (dragOverId === leadType.id) setDragOverId(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (!canDrag || !draggedId) return;
                        reorderByDrag(draggedId, leadType.id);
                        setDraggedId(null);
                        setDragOverId(null);
                      }}
                      className={`shrink-0 w-72 transition-all ${
                        canDrag ? "cursor-grab active:cursor-grabbing" : ""
                      } ${isDragging ? "opacity-50 scale-[0.98]" : ""} ${
                        isDragOver ? "ring-2 ring-primary shadow-lg" : "hover:shadow-lg"
                      }`}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            {canDrag && (
                              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                              {leadType.logo_url ? (
                                <img
                                  src={normalizeLogoUrl(leadType.logo_url) || ""}
                                  alt={leadType.logo_name || leadType.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <List className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs text-muted-foreground">
                                #{index + 1}
                              </div>
                              <div className="font-semibold truncate">
                                {formatPascalCaseDisplayName(leadType.name)}
                              </div>
                            </div>
                          </div>
                          {user?.role === "admin" && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Dialog
                                open={
                                  isEditDialogOpen &&
                                  selectedLeadType?.id === leadType.id
                                }
                                onOpenChange={(open) => {
                                  setIsEditDialogOpen(open);
                                  if (open) {
                                    setSelectedLeadType(leadType);
                                    setEditLeadTypeName(leadType.name);
                                    setEditLogoName(leadType.logo_name || "");
                                    setEditLogoImage(null);
                                    setEditIsAssignable(
                                      leadType.is_assignable !== false
                                    );
                                    setEditImagePreview(
                                      normalizeLogoUrl(leadType.logo_url)
                                    );
                                  } else {
                                    setSelectedLeadType(null);
                                    setEditLogoImage(null);
                                    setEditImagePreview(null);
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Edit Lead Source</DialogTitle>
                                  </DialogHeader>
                                  <DialogDescription>
                                    Update the lead source details.
                                  </DialogDescription>
                                  <div className="space-y-4 py-4">
                                    <Input
                                      placeholder="Enter lead source name"
                                      value={editLeadTypeName}
                                      onChange={(e) =>
                                        setEditLeadTypeName(e.target.value)
                                      }
                                      className="w-full"
                                    />
                                    <Input
                                      placeholder="Enter logo name"
                                      value={editLogoName}
                                      onChange={(e) =>
                                        setEditLogoName(e.target.value)
                                      }
                                      className="w-full"
                                    />
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      name="logo_image"
                                      onChange={(e) =>
                                        setEditLogoImage(
                                          e.target.files ? e.target.files[0] : null
                                        )
                                      }
                                      className="w-full"
                                    />
                                    <ImagePreview
                                      src={editImagePreview}
                                      alt="Logo preview"
                                      label="Current Image Preview:"
                                    />
                                    <div className="flex items-center justify-between rounded-md border p-3">
                                      <div>
                                        <Label htmlFor="edit-assignable">
                                          Assignable to leads
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                          Show this source when creating or editing
                                          leads
                                        </p>
                                      </div>
                                      <Switch
                                        id="edit-assignable"
                                        checked={editIsAssignable}
                                        onCheckedChange={setEditIsAssignable}
                                      />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                      <Button
                                        variant="outline"
                                        onClick={() => setIsEditDialogOpen(false)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button onClick={handleUpdateLeadType}>
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Dialog
                                open={
                                  isDeleteDialogOpen &&
                                  selectedLeadType?.id === leadType.id
                                }
                                onOpenChange={(open) => {
                                  setIsDeleteDialogOpen(open);
                                  if (!open) {
                                    setSelectedLeadType(null);
                                  } else {
                                    setSelectedLeadType(leadType);
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-muted-foreground hover:text-destructive"
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Confirm Delete</DialogTitle>
                                  </DialogHeader>
                                  <DialogDescription>
                                    Confirm deletion of the selected lead source.
                                  </DialogDescription>
                                  <div className="space-y-4 py-4">
                                    <p>
                                      Are you sure you want to delete the lead source{" "}
                                      <strong>
                                        {formatPascalCaseDisplayName(leadType.name)}
                                      </strong>
                                      ?
                                    </p>
                                    <div className="flex justify-end gap-3">
                                      <Button
                                        variant="outline"
                                        onClick={() => setIsDeleteDialogOpen(false)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() =>
                                          handleDeleteLeadType(leadType.id)
                                        }
                                      >
                                        Confirm Delete
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </div>

                        {leadType.logo_name && (
                          <div className="text-xs text-muted-foreground truncate">
                            Logo: {leadType.logo_name}
                          </div>
                        )}
                        {leadType.is_assignable === false && (
                          <div className="text-xs text-amber-600">Not assignable</div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search lead sources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </CardContent>
          </Card>

          {leadTypes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No lead sources found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadType;
