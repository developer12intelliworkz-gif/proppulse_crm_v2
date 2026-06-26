import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TeamRow {
  id: string;
  name: string;
  open: number;
  overdue: number;
  completed: number;
  total: number;
  completionRate: number;
}

interface Props {
  rows: TeamRow[];
  loading?: boolean;
}

const TaskTeamView = ({ rows, loading }: Props) => {
  if (loading) {
    return <p className="text-center py-8 text-muted-foreground">Loading team stats…</p>;
  }
  if (!rows.length) {
    return (
      <p className="text-center py-8 text-muted-foreground">
        No team task data yet.
      </p>
    );
  }

  return (
    <div className="border rounded-lg bg-card overflow-x-auto">
      <Table>
        <TableHeader style={{ background: "rgba(var(--theme-color-rgb), 0.06)" }}>
          <TableRow className="bg-background hover:bg-background border-b">
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Team Member</TableHead>
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Open</TableHead>
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Overdue</TableHead>
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Completed</TableHead>
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</TableHead>
            <TableHead style={{ color: "var(--theme-color)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Completion Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>{r.open}</TableCell>
              <TableCell className={r.overdue > 0 ? "text-red-600 font-medium" : ""}>
                {r.overdue}
              </TableCell>
              <TableCell>{r.completed}</TableCell>
              <TableCell>{r.total}</TableCell>
              <TableCell>{r.completionRate}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TaskTeamView;
