import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { TaskItem, associationLabel, priorityMeta, statusMeta } from "./taskConstants";
import TaskCreateSheet from "./TaskCreateSheet";
import TaskDrawer from "./TaskDrawer";

interface Props {
  projectId: string;
}

const ProjectTasksPanel = ({ projectId }: Props) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/tasks", {
        params: { project_id: projectId },
      });
      setTasks(res.data?.data || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tasks ({tasks.length})</h3>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tasks linked to this project yet.
        </p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className="p-3 cursor-pointer hover:bg-muted/40"
              onClick={() => {
                setSelectedId(task.id);
                setDrawerOpen(true);
              }}
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {associationLabel(task)}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Badge className={priorityMeta(task.priority).className}>
                    {priorityMeta(task.priority).label}
                  </Badge>
                  <Badge className={statusMeta(task.status).className}>
                    {statusMeta(task.status).label}
                  </Badge>
                </div>
              </div>
              {task.due_date && (
                <p className="text-xs mt-2 text-muted-foreground">
                  Due {task.due_date}
                  {task.due_time ? ` ${task.due_time}` : ""}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      <TaskCreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={fetchTasks}
        defaultProjectId={projectId}
      />

      <TaskDrawer
        taskId={selectedId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdated={fetchTasks}
      />
    </div>
  );
};

export default ProjectTasksPanel;
