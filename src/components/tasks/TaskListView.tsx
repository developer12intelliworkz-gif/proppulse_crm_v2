import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskItem, associationLabel, priorityMeta, statusMeta } from "./taskConstants";
import { formatDisplayDate } from "@/utils/dateFormat";

interface Props {
  tasks: TaskItem[];
  onSelect: (task: TaskItem) => void;
}

const TaskListView = ({ tasks, onSelect }: Props) => {
  if (!tasks.length) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        No tasks match the current filters.
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid hsl(var(--border))", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }} className="bg-card">
      <Table>
        <TableHeader style={{ background: "rgba(var(--theme-color-rgb), 0.05)" }}>
          <TableRow className="border-b">
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Title</TableHead>
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Association</TableHead>
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Assignee</TableHead>
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Due</TableHead>
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Priority</TableHead>
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</TableHead>
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }} className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors border-b"
              onClick={() => onSelect(task)}
            >
              <TableCell className="font-semibold text-foreground max-w-[200px] truncate">
                {task.title}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                {associationLabel(task)}
              </TableCell>
              <TableCell className="text-sm">
                {(task.assignee_names || task.assignees).join(", ") || "—"}
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {task.due_date
                  ? `${formatDisplayDate(task.due_date)}${task.due_time ? ` ${task.due_time}` : ""}`
                  : "—"}
              </TableCell>
              <TableCell>
                <Badge className={priorityMeta(task.priority).className}>
                  {priorityMeta(task.priority).label}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={statusMeta(task.status).className}>
                  {statusMeta(task.status).label}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(task); }}
                  style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "var(--theme-color)", background: "rgba(var(--theme-color-rgb), 0.08)", border: "none", borderRadius: 6, cursor: "pointer" }}
                >
                  View
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TaskListView;
