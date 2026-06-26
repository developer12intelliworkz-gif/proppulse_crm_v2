import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Layers, Trash2, Edit3, Loader2 } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";

import { getHierarchyConfig, parseProjectType } from "./projectHierarchyConfig";

interface HierarchyNode {
  id: string;
  name: string;
  type_code: string;
  parent_id: string | null;
  children?: HierarchyNode[];
}

interface DynamicHierarchyBuilderProps {
  projectId: string;
  projectType: string;
  projectStructure: string;
  setupTitle?: string;
  level3Label?: string;
  onNodeSelect: (nodeId: string, typeCode?: string) => void;
  onHierarchyChange?: () => void;
}

const DynamicHierarchyBuilder = ({
  projectId,
  projectType,
  projectStructure,
  setupTitle,
  level3Label,
  onNodeSelect,
  onHierarchyChange,
}: DynamicHierarchyBuilderProps) => {
  const parsedType = parseProjectType(projectType);
  const config =
    parsedType !== null
      ? getHierarchyConfig(parsedType, projectStructure)
      : null;
  const label = level3Label ?? config?.level3.default_label ?? "Hierarchy";

  const [nodes, setNodes] = useState<HierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingNode, setEditingNode] = useState<HierarchyNode | null>(null);
  const [newNodeName, setNewNodeName] = useState("");

  const loadNodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/projects/${projectId}/hierarchy-nodes`,
      );
      setNodes(res.data?.data ?? []);
    } catch {
      const saved = localStorage.getItem(`hierarchy_${projectId}`);
      setNodes(saved ? JSON.parse(saved) : []);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadNodes();
  }, [loadNodes]);

  const persistLocalFallback = (updatedNodes: HierarchyNode[]) => {
    localStorage.setItem(
      `hierarchy_${projectId}`,
      JSON.stringify(updatedNodes),
    );
  };

  const addOrUpdateNode = async () => {
    if (!newNodeName.trim() || !config) return;

    setSaving(true);
    setSaveError(null);
    try {
      if (editingNode) {
        await axiosInstance.put(
          `/projects/${projectId}/hierarchy-nodes/${editingNode.id}`,
          { name: newNodeName.trim() },
        );
      } else {
        await axiosInstance.post(`/projects/${projectId}/hierarchy-nodes`, {
          name: newNodeName.trim(),
        });
      }
      await loadNodes();
      onHierarchyChange?.();
      setNewNodeName("");
      setEditingNode(null);
      setShowForm(false);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: string; details?: string } };
      };
      const apiError = error.response?.data?.error;
      const apiDetails = error.response?.data?.details;
      setSaveError(
        [apiError, apiDetails].filter(Boolean).join(" — ") ||
          `Could not save ${label.toLowerCase()}. Complete Level 1 and Level 2 first.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteNode = async (id: string) => {
    try {
      await axiosInstance.delete(
        `/projects/${projectId}/hierarchy-nodes/${id}`,
      );
      const filtered = nodes.filter((n) => n.id !== id);
      setNodes(filtered);
      persistLocalFallback(filtered);
      onHierarchyChange?.();
    } catch {
      // silent — list unchanged
    }
  };

  const renderTree = (nodeList: HierarchyNode[], level = 0) =>
    nodeList.map((node) => (
      <div key={node.id} className={`${level > 0 ? "ml-6" : ""} mt-3`}>
        <Card className="hover:shadow-md">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Layers className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-lg truncate">{node.name}</CardTitle>
                <Badge variant="outline">{node.type_code}</Badge>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNodeSelect(node.id, node.type_code)}
              >
                Manage Units
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingNode(node);
                  setNewNodeName(node.name);
                  setSaveError(null);
                  setShowForm(true);
                }}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600"
                onClick={() => deleteNode(node.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>
        {node.children && node.children.length > 0 && renderTree(node.children, level + 1)}
      </div>
    ));

  if (!config) {
    return (
      <p className="text-muted-foreground">
        Hierarchy configuration was not found. Please complete initial setup with
        a valid project type and structure.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {setupTitle ?? `${label} Setup`}
          </h2>
          <p className="text-muted-foreground mt-1">
            Add {label.toLowerCase()}s for this project. Structure:{" "}
            <span className="font-medium">{projectStructure.replace(/_/g, " ")}</span>
          </p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingNode(null);
                setNewNodeName("");
                setSaveError(null);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add {label}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingNode ? "Edit" : "Add"} {label}
              </DialogTitle>
              <DialogDescription>
                {editingNode
                  ? `Update the name for this ${label.toLowerCase()}.`
                  : `Create a new ${label.toLowerCase()} for this project.`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder={config.level3.examples?.[0] || `${label} A`}
                  disabled={saving}
                />
              </div>
              {saveError && (
                <p className="text-sm text-destructive">{saveError}</p>
              )}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={addOrUpdateNode} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingNode ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" />
          Loading {label.toLowerCase()}s...
        </Card>
      ) : nodes.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          No {label.toLowerCase()}s yet. Click &quot;Add {label}&quot; to start.
        </Card>
      ) : (
        <div className="space-y-4">{renderTree(nodes)}</div>
      )}
    </div>
  );
};

export default DynamicHierarchyBuilder;
