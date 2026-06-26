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
    <div className="border rounded-lg overflow-x-auto bg-card">
      <Table>
        <TableHeader style={{ background: "rgba(var(--theme-color-rgb), 0.06)" }}>
          <TableRow className="bg-background hover:bg-background border-b">
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Title</TableHead>
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Association</TableHead>
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Assignee</TableHead>
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Due</TableHead>
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Priority</TableHead>
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</TableHead>
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }} className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelect(task)}
            >
              <TableCell className="font-medium max-w-[200px] truncate">
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
                <Button variant="ghost" size="sm" onClick={() => onSelect(task)}>
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TaskListView;
