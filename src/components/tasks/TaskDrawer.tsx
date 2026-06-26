import { useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  PRIORITIES,
  STATUSES,
  TaskItem,
  associationLabel,
  priorityMeta,
  statusMeta,
} from "./taskConstants";
import { normalizeRole } from "@/utils/rolePermissions";
import TaskCreateSheet from "./TaskCreateSheet";

interface Props {
  taskId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

const TaskDrawer = ({ taskId, open, onOpenChange, onUpdated }: Props) => {
  const { user } = useAuth();
  const isManager = ["admin", "manager"].includes(normalizeRole(user?.role));

  const [task, setTask] = useState<TaskItem | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [createFollowUpOpen, setCreateFollowUpOpen] = useState(false);

  const load = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/tasks/${taskId}`);
      setTask(res.data);
    } catch {
      // toast.error("Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && taskId) load();
  }, [open, taskId]);

  const saveField = async (patch: Record<string, string>) => {
    if (!taskId) return;
    try {
      const res = await axiosInstance.put(`/tasks/${taskId}`, patch);
      if (res.data?.promptFollowUp) setFollowUpOpen(true);
      // toast.success("Task updated");
      await load();
      onUpdated();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      // toast.error(e.response?.data?.error || "Update failed");
    }
  };

  const addComment = async () => {
    if (!taskId || !comment.trim()) return;
    try {
      await axiosInstance.post(`/tasks/${taskId}/comments`, { body: comment });
      setComment("");
      await load();
    } catch {
      // toast.error("Failed to add comment");
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{task?.title || "Task"}</SheetTitle>
            <SheetDescription>
              {task ? associationLabel(task) : "Loading…"}
            </SheetDescription>
          </SheetHeader>

          {loading || !task ? (
            <p className="mt-8 text-muted-foreground">Loading…</p>
          ) : (
            <div className="space-y-6 mt-6">
              <div className="flex flex-wrap gap-2">
                <Badge className={priorityMeta(task.priority).className}>
                  {priorityMeta(task.priority).label}
                </Badge>
                <Badge className={statusMeta(task.status).className}>
                  {statusMeta(task.status).label}
                </Badge>
              </div>

              {isManager && (
                <>
                  <div>
                    <Label>Title</Label>
                    <Input
                      defaultValue={task.title}
                      onBlur={(e) => {
                        if (e.target.value !== task.title)
                          saveField({ title: e.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      defaultValue={task.description || ""}
                      rows={3}
                      onBlur={(e) => saveField({ description: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={task.status}
                    onValueChange={(v) => saveField({ status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {isManager && (
                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={task.priority}
                      onValueChange={(v) => saveField({ priority: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Due: {task.due_date || "—"}
                {task.due_time ? ` at ${task.due_time}` : ""}
              </p>
              <p className="text-sm">
                Assignees: {(task.assignee_names || task.assignees).join(", ")}
              </p>
              {task.remark && (
                <p className="text-sm">
                  <span className="font-medium">Remarks:</span> {task.remark}
                </p>
              )}

              <Separator />

              <div>
                <h4 className="font-semibold text-sm mb-2">Activity</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto text-sm">
                  {(task.activity || []).map((a) => (
                    <div key={a.id} className="border-l-2 pl-2 border-muted">
                      <span className="font-medium">{a.user_name}</span>{" "}
                      {a.action}
                      {a.field_name ? `: ${a.old_value} → ${a.new_value}` : ""}
                      <div className="text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Comments</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto mb-2">
                  {(task.comments || []).map((c) => (
                    <div key={c.id} className="bg-muted/40 rounded p-2 text-sm">
                      <span className="font-medium">{c.user_name}</span>
                      <p>{c.body}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a comment…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <Button onClick={addComment}>Post</Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create a follow-up task?</AlertDialogTitle>
            <AlertDialogDescription>
              This task is complete. Would you like to schedule a follow-up?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <AlertDialogAction onClick={() => setCreateFollowUpOpen(true)}>
              Create follow-up
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TaskCreateSheet
        open={createFollowUpOpen}
        onOpenChange={setCreateFollowUpOpen}
        onSaved={onUpdated}
        defaultLeadId={task?.lead_id ? String(task.lead_id) : undefined}
        defaultProjectId={task?.project_id ? String(task.project_id) : undefined}
      />
    </>
  );
};

export default TaskDrawer;
