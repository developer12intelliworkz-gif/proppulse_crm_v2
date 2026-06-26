// src/components/projects/setup/HierarchyNodeList.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Trash2, Edit3, Plus, Layers } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import axiosInstance from "@/api/axiosInstance";
import HierarchyNodeForm from "./HierarchyNodeForm"; // Naya form banao (niche hai)

interface HierarchyNode {
  id: string;
  name: string;
  type_code: string;
  parent_id: string | null;
  children?: HierarchyNode[];
  description?: string;
}

interface HierarchyNodeListProps {
  projectId: string;
  onNodeSelect: (nodeId: string) => void;
}

const HierarchyNodeList = ({
  projectId,
  onNodeSelect,
}: HierarchyNodeListProps) => {
  const { toast } = useToast();
  const [nodes, setNodes] = useState<HierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNode, setEditingNode] = useState<HierarchyNode | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchNodes();
  }, [projectId]);

  const fetchNodes = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `/projects/${projectId}/hierarchy-nodes`,
      );
      setNodes(res.data.data || []);
    } catch (err) {
      // toast({
        // title: "Unable to load hierarchy",
        // description: "Hierarchy nodes could not be loaded. Please try again.",
        // variant: "destructive",
      // });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (nodeId: string) => {
    try {
      await axiosInstance.delete(
        `/projects/${projectId}/hierarchy-nodes/${nodeId}`,
      );
      setNodes((prev) => {
        const removeNode = (list: HierarchyNode[]): HierarchyNode[] =>
          list
            .filter((n) => n.id !== nodeId)
            .map((n) => ({ ...n, children: removeNode(n.children || []) }));
        return removeNode(prev);
      });
      // toast({
        // title: "Hierarchy node removed",
        // description: "The node has been deleted successfully.",
      // });
    } catch (err) {
      // toast({
        // title: "Unable to delete hierarchy node",
        // description:
          // "This node may have units attached. Remove dependent units and try again.",
        // variant: "destructive",
      // });
    }
    setDeletingId(null);
  };

  const handleEdit = (node: HierarchyNode) => {
    setEditingNode(node);
    setShowForm(true);
  };

  const renderNode = (node: HierarchyNode, level = 0) => (
    <div key={node.id} className={`ml-${level * 6} mt-2`}>
      <Card className="hover:shadow-md transition-all">
        <CardHeader className="py-3">
          <CardTitle className="flex justify-between items-center text-lg">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <span>{node.name}</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {node.type_code}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                
                size="sm"
                onClick={() => onNodeSelect(node.id)}
              >
                View Units
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(node)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Dialog
                open={deletingId === node.id}
                onOpenChange={() => setDeletingId(null)}
              >
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Node?</DialogTitle>
                  </DialogHeader>
                  <p>Units attached honge to delete nahi hoga.</p>
                  <div className="flex gap-2 pt-4">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(node.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        {node.children && node.children.length > 0 && (
          <CardContent className="pt-0 pb-3">
            <div className="border-l-2 border-muted pl-4">
              {node.children.map((child) => renderNode(child, level + 1))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );

  if (loading) return <p className="text-center py-8">Loading hierarchy...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Hierarchy Nodes</h2>
        <Button
          onClick={() => {
            setEditingNode(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Node
        </Button>
      </div>

      {nodes.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          No hierarchy nodes yet. Add your first Tower/Sector/Floor.
        </div>
      ) : (
        <div className="space-y-3">{nodes.map((node) => renderNode(node))}</div>
      )}

      <HierarchyNodeForm
        projectId={projectId}
        node={editingNode}
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingNode(null);
        }}
        onSuccess={fetchNodes}
      />
    </div>
  );
};

export default HierarchyNodeList;
