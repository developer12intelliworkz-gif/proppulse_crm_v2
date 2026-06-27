import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axiosInstance from "@/api/axiosInstance";
import { DEFAULT_AMENITY_SUGGESTIONS } from "@/constants/defaultAmenitySuggestions";
import { Check, Loader2, Pencil, Plus, Search, X } from "lucide-react";

export interface ProjectAmenity {
  id: number;
  project_id: number | string;
  name: string;
  is_selected: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AmenitiesSectionProps {
  projectId: string | null;
  onAmenitiesChange?: (amenities: Record<string, boolean>) => void;
}

const AmenitiesSection = ({ projectId, onAmenitiesChange }: AmenitiesSectionProps) => {
  const [amenities, setAmenities] = useState<ProjectAmenity[]>([]);
  const [newName, setNewName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");
  const [addError, setAddError] = useState("");

  const loadAmenities = useCallback(async () => {
    if (!projectId) {
      setAmenities([]);
      return;
    }
    const res = await axiosInstance.get(`/projects/${projectId}/amenities`);
    const rows: ProjectAmenity[] = res.data?.data ?? [];
    setAmenities(Array.isArray(rows) ? rows : []);
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setAmenities([]);
      return;
    }
    setLoading(true);
    setError("");
    loadAmenities()
      .catch((err) => {
        console.error("[amenities] load failed:", err);
        setError("Could not load amenities. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [projectId, loadAmenities]);

  const prevAmenitiesRef = useRef<string>("");

  useEffect(() => {
    if (onAmenitiesChange) {
      const selectionMap: Record<string, boolean> = {};
      amenities.forEach((a) => {
        selectionMap[a.name] = a.is_selected;
      });
      const currentStr = JSON.stringify(selectionMap);
      if (prevAmenitiesRef.current !== currentStr) {
        prevAmenitiesRef.current = currentStr;
        onAmenitiesChange(selectionMap);
      }
    }
  }, [amenities, onAmenitiesChange]);

  const existingNamesLower = useMemo(
    () => new Set(amenities.map((a) => a.name.trim().toLowerCase())),
    [amenities],
  );

  const filteredAmenities = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return amenities;
    return amenities.filter((a) => a.name.toLowerCase().includes(q));
  }, [amenities, searchTerm]);

  const allVisibleSelected =
    filteredAmenities.length > 0 &&
    filteredAmenities.every((a) => a.is_selected);

  const handleAdd = async () => {
    if (!projectId) return;
    const name = newName.trim();
    if (!name) return;

    if (existingNamesLower.has(name.toLowerCase())) {
      setAddError("This amenity already exists");
      return;
    }

    setSaving(true);
    setAddError("");
    setError("");
    try {
      const res = await axiosInstance.post(`/projects/${projectId}/amenities`, {
        name,
        is_selected: true,
      });
      const created = res.data?.data as ProjectAmenity;
      if (created?.id) {
        setAmenities((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
        setNewName("");
      } else {
        await loadAmenities();
      }
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Could not add amenity";
      setAddError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSuggestion = async (name: string) => {
    if (!projectId || existingNamesLower.has(name.toLowerCase())) return;
    setNewName(name);
    setSaving(true);
    setAddError("");
    try {
      const res = await axiosInstance.post(`/projects/${projectId}/amenities`, {
        name,
        is_selected: true,
      });
      const created = res.data?.data as ProjectAmenity;
      if (created?.id) {
        setAmenities((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
      }
      setNewName("");
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Could not add amenity";
      setAddError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (amenity: ProjectAmenity) => {
    if (!projectId) return;
    setDeletingId(amenity.id);
    setError("");
    try {
      await axiosInstance.delete(
        `/projects/${projectId}/amenities/${amenity.id}`,
      );
      setAmenities((prev) => prev.filter((a) => a.id !== amenity.id));
      if (editingId === amenity.id) {
        setEditingId(null);
        setEditingName("");
      }
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Could not delete amenity";
      console.error("[amenities] delete failed:", err);
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (amenity: ProjectAmenity) => {
    setEditingId(amenity.id);
    setEditingName(amenity.name);
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async () => {
    if (!projectId || editingId === null) return;
    const name = editingName.trim();
    if (!name) {
      setError("Amenity name cannot be empty");
      return;
    }

    const duplicate = amenities.some(
      (a) =>
        a.id !== editingId && a.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      setError("This amenity already exists");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await axiosInstance.put(
        `/projects/${projectId}/amenities/${editingId}`,
        { name },
      );
      const updated = res.data?.data as ProjectAmenity;
      setAmenities((prev) =>
        prev
          .map((a) => (a.id === editingId ? (updated ?? { ...a, name }) : a))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      cancelEdit();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Could not update amenity";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleSelected = async (amenity: ProjectAmenity, checked: boolean) => {
    if (!projectId) return;
    setSaving(true);
    setError("");
    try {
      if (checked) {
        await axiosInstance.post(`/projects/${projectId}/amenities`, {
          amenity_id: amenity.id,
        });
      } else {
        await axiosInstance.delete(`/projects/${projectId}/amenities/${amenity.id}`);
      }
      setAmenities((prev) =>
        prev.map((a) =>
          a.id === amenity.id
            ? { ...a, is_selected: checked }
            : a,
        ),
      );
    } catch (err) {
      console.error("[amenities] toggle failed:", err);
      setError("Could not update selection");
      await loadAmenities();
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAllVisible = async () => {
    if (!projectId || filteredAmenities.length === 0) return;
    const target = !allVisibleSelected;
    setSaving(true);
    setError("");
    try {
      const toChange = filteredAmenities.filter((a) => a.is_selected !== target);
      await Promise.all(
        toChange.map((a) => {
          if (target) {
            return axiosInstance.post(`/projects/${projectId}/amenities`, {
              amenity_id: a.id,
            });
          } else {
            return axiosInstance.delete(`/projects/${projectId}/amenities/${a.id}`);
          }
        }),
      );
      const visibleIds = new Set(toChange.map((a) => a.id));
      setAmenities((prev) =>
        prev.map((a) =>
          visibleIds.has(a.id) ? { ...a, is_selected: target } : a,
        ),
      );
    } catch (err) {
      console.error("[amenities] bulk select failed:", err);
      setError("Could not update selection");
      await loadAmenities();
    } finally {
      setSaving(false);
    }
  };

  const availableSuggestions = DEFAULT_AMENITY_SUGGESTIONS.filter(
    (s) => !existingNamesLower.has(s.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Amenities</Label>

      {!projectId && (
        <p className="text-sm text-muted-foreground">
          Save Step 1 first to manage amenities for this project.
        </p>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Type a custom amenity name"
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            if (addError) setAddError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          disabled={!projectId || saving}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={!projectId || saving || !newName.trim()}
          className="shrink-0"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </>
          )}
        </Button>
      </div>

      {addError && (
        <p className="text-sm text-destructive">{addError}</p>
      )}

      {projectId && availableSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableSuggestions.slice(0, 8).map((name) => (
            <Button
              key={name}
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => void handleAddSuggestion(name)}
            >
              + {name}
            </Button>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search amenities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            disabled={!projectId || loading}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!projectId || saving || filteredAmenities.length === 0}
          onClick={() => void handleSelectAllVisible()}
          className="shrink-0"
        >
          {allVisibleSelected ? "Deselect All" : "Select All"}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading amenities...
        </div>
      ) : (
        <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
          {filteredAmenities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 px-4">
              {!projectId
                ? "Save Step 1 to add amenities."
                : amenities.length === 0
                  ? "No amenities yet. Add one above or pick a suggestion."
                  : "No amenities match your search."}
            </p>
          ) : (
            filteredAmenities.map((amenity) => (
              <div
                key={amenity.id}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30"
              >
                {editingId === amenity.id ? (
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="flex-1 h-8"
                      disabled={saving}
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      disabled={saving || !editingName.trim()}
                      onClick={() => void saveEdit()}
                      title="Save"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={cancelEdit}
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <label className="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
                      <Checkbox
                        checked={amenity.is_selected}
                        disabled={!projectId || saving || deletingId === amenity.id}
                        onCheckedChange={(v) =>
                          void toggleSelected(amenity, v === true)
                        }
                      />
                      <button
                        type="button"
                        className="text-sm truncate text-left hover:underline"
                        onClick={() => startEdit(amenity)}
                        title="Click to edit"
                      >
                        {amenity.name}
                      </button>
                    </label>
                    <div className="flex shrink-0 gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={saving || deletingId === amenity.id}
                        onClick={() => startEdit(amenity)}
                        title="Edit amenity"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={!projectId || saving || deletingId === amenity.id}
                        onClick={() => void handleDelete(amenity)}
                        title="Delete amenity"
                      >
                        {deletingId === amenity.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AmenitiesSection;
