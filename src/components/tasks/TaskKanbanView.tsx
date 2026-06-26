import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axiosInstance from "@/api/axiosInstance";
import { toast } from "sonner";
import {
  KANBAN_COLUMNS,
  TaskItem,
  TaskStatus,
  associationLabel,
  priorityMeta,
  statusMeta,
} from "./taskConstants";

interface Props {
  tasks: TaskItem[];
  onSelect: (task: TaskItem) => void;
  onRefresh: () => void;
}

const TaskKanbanView = ({ tasks, onSelect, onRefresh }: Props) => {
  const [dragId, setDragId] = useState<number | null>(null);

  const byStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  const handleDrop = async (status: TaskStatus) => {
    if (dragId == null) return;
    const task = tasks.find((t) => t.id === dragId);
    if (!task || task.status === status) {
      setDragId(null);
      return;
    }
    try {
      await axiosInstance.post(`/tasks/${dragId}/status`, { status });
      // toast.success(`Moved to ${statusMeta(status).label}`);
      onRefresh();
    } catch {
      // toast.error("Failed to update status");
    }
    setDragId(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "#EF4444";
      case "high": return "#F97316";
      case "medium": return "#3B82F6";
      default: return "#94A3B8";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {KANBAN_COLUMNS.map((col) => (
        <div
          key={col}
          className="bg-muted/30 rounded-lg p-3 min-h-[320px]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(col)}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">{statusMeta(col).label}</h3>
            <Badge variant="secondary">{byStatus(col).length}</Badge>
          </div>
          <div className="space-y-2">
            {byStatus(col).map((task) => {
              const borderCol = getPriorityColor(task.priority);
              const priorityText = priorityMeta(task.priority).label;
              const bgTint = `${borderCol}06`; 
              const glow = `${borderCol}18`;

              return (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDragId(task.id)}
                  onClick={() => onSelect(task)}
                  className="cursor-grab active:cursor-grabbing rounded-xl overflow-hidden border bg-card text-card-foreground"
                  style={{
                    borderColor: "hsl(var(--border))",
                    background: `linear-gradient(to bottom, hsl(var(--card)), ${bgTint})`,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    transition: "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease, border-color 0.2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = `0 8px 20px ${glow}`;
                    e.currentTarget.style.borderColor = borderCol;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                    e.currentTarget.style.borderColor = "hsl(var(--border))";
                  }}
                >
                  <div style={{ height: 4, background: `linear-gradient(90deg, ${borderCol}, ${borderCol}99)` }} />
                  
                  <div className="p-3.5 space-y-3">
                    <div>
                      <h4 className="font-bold text-[13px] text-foreground leading-snug hover:text-theme transition-colors">
                        {task.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-1 font-medium truncate">
                        {associationLabel(task)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1 items-center justify-between pt-1">
                      <Badge className={priorityMeta(task.priority).className} style={{ fontSize: 9 }}>
                        {priorityText}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {task.due_date || "No due date"}
                      </span>
                    </div>

                    <div className="border-t border-border pt-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div style={{ background: "rgba(var(--theme-color-rgb), 0.1)", color: "var(--theme-color)" }} className="h-5 w-5 rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                          {task.assignee_names?.[0] ? task.assignee_names[0].charAt(0).toUpperCase() : "U"}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[120px]">
                          {(task.assignee_names || []).join(", ") || "Unassigned"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskKanbanView;
