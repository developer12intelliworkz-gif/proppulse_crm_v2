import { useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import { useAuth } from "@/contexts/AuthContext";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import {
  AssociationType,
  PRIORITIES,
  STATUSES,
} from "./taskConstants";
import { normalizeRole } from "@/utils/rolePermissions";

interface LeadOption {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface ProjectOption {
  id: number;
  name: string;
}

const SearchableLeadSelect = ({
  leads,
  value,
  onChange,
}: {
  leads: LeadOption[];
  value: string;
  onChange: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const selected = leads.find((l) => String(l.id) === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="truncate text-left">
              {selected.name}
              {(selected.email || selected.phone) && (
                <span className="text-muted-foreground text-xs ml-1">
                  {[selected.email, selected.phone].filter(Boolean).join(" · ")}
                </span>
              )}
            </span>
          ) : (
            "Search by name, email, or phone…"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search name, email, or phone…" />
          <CommandList>
            <CommandEmpty>No lead found.</CommandEmpty>
            <CommandGroup>
              {leads.map((lead) => (
                <CommandItem
                  key={lead.id}
                  value={`${lead.name} ${lead.email || ""} ${lead.phone || ""}`}
                  onSelect={() => {
                    onChange(String(lead.id));
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 shrink-0 ${
                      value === String(lead.id) ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">{lead.name}</span>
                    {(lead.email || lead.phone) && (
                      <span className="text-xs text-muted-foreground truncate">
                        {[lead.email, lead.phone].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const SearchableProjectSelect = ({
  projects,
  value,
  onChange,
}: {
  projects: ProjectOption[];
  value: string;
  onChange: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const selected = projects.find((p) => String(p.id) === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? selected.name : "Search project…"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search project name…" />
          <CommandList>
            <CommandEmpty>No project found.</CommandEmpty>
            <CommandGroup>
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.name}
                  onSelect={() => {
                    onChange(String(project.id));
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 shrink-0 ${
                      value === String(project.id) ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {project.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  defaultLeadId?: string;
  defaultProjectId?: string;
}

const TaskCreateSheet = ({
  open,
  onOpenChange,
  onSaved,
  defaultLeadId,
  defaultProjectId,
}: Props) => {
  const { user } = useAuth();
  const isManager = ["admin", "manager"].includes(normalizeRole(user?.role));

  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    due_time: "09:00",
    priority: "medium",
    status: "open",
    association_type: "standalone" as AssociationType,
    lead_id: "",
    project_id: "",
    assignees: [] as string[],
    remark: "",
    reminder_at: "",
    document: null as File | null,
  });

  useEffect(() => {
    if (!open) return;
    let assoc: AssociationType = "standalone";
    if (defaultLeadId && defaultProjectId) assoc = "both";
    else if (defaultLeadId) assoc = "lead";
    else if (defaultProjectId) assoc = "project";

    setForm((f) => ({
      ...f,
      lead_id: defaultLeadId || "",
      project_id: defaultProjectId || "",
      association_type: assoc,
      assignees: user?.id ? [user.id] : [],
    }));

    Promise.all([
      axiosInstance.get("/users"),
      axiosInstance.get("/leads", { params: { limit: 500, page: 1 } }),
      axiosInstance.get("/projects"),
    ]).then(([u, l, p]) => {
      setUsers(u.data?.data || u.data || []);
      const leadRows = l.data?.data || l.data?.leads || l.data || [];
      setLeads(
        Array.isArray(leadRows)
          ? leadRows.map((row: LeadOption) => ({
              id: row.id,
              name: row.name || "Unnamed",
              email: row.email ?? null,
              phone: row.phone ?? null,
            }))
          : [],
      );
      const projectRows = p.data?.data || p.data || [];
      setProjects(
        Array.isArray(projectRows)
          ? projectRows.map((row: ProjectOption) => ({
              id: row.id,
              name: row.name || "Unnamed project",
            }))
          : [],
      );
    });
  }, [open, defaultLeadId, defaultProjectId, user?.id]);

  const toggleAssignee = (id: string) => {
    setForm((f) => ({
      ...f,
      assignees: f.assignees.includes(id)
        ? f.assignees.filter((x) => x !== id)
        : [...f.assignees, id],
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Subject is required");
      return;
    }
    if (!form.due_date) {
      toast.error("Due date is required");
      return;
    }
    if (form.assignees.length === 0) {
      toast.error("Select at least one assignee");
      return;
    }

    const fd = new FormData();
    fd.append("title", form.title);
    if (form.description) fd.append("description", form.description);
    if (form.due_date) fd.append("due_date", form.due_date);
    fd.append("due_time", form.due_time);
    fd.append("priority", form.priority);
    fd.append("status", form.status);
    fd.append("association_type", form.association_type);
    if (form.lead_id) fd.append("lead_id", form.lead_id);
    if (form.project_id) fd.append("project_id", form.project_id);
    form.assignees.forEach((id) => fd.append("assignees[]", id));
    if (form.remark) fd.append("remark", form.remark);
    if (form.reminder_at) fd.append("reminder_at", form.reminder_at);
    if (form.document) fd.append("document", form.document);

    setSaving(true);
    try {
      await axiosInstance.post("/tasks", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // toast.success("Task created");
      onOpenChange(false);
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      // toast.error(e.response?.data?.error || "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Task</SheetTitle>
          <SheetDescription>
            Link to a lead, project, both, or keep standalone.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div>
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Due Time</Label>
              <Input
                type="time"
                value={form.due_time}
                onChange={(e) => setForm({ ...form, due_time: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v })}
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
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
                disabled={!isManager}
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
          </div>
          <div>
            <Label>Association</Label>
            <Select
              value={form.association_type}
              onValueChange={(v: AssociationType) =>
                setForm({ ...form, association_type: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standalone">Standalone</SelectItem>
                <SelectItem value="lead">Lead only</SelectItem>
                <SelectItem value="project">Project only</SelectItem>
                <SelectItem value="both">Lead + Project</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(form.association_type === "lead" ||
            form.association_type === "both") && (
            <div>
              <Label>Lead</Label>
              <SearchableLeadSelect
                leads={leads}
                value={form.lead_id}
                onChange={(v) => setForm({ ...form, lead_id: v })}
              />
            </div>
          )}
          {(form.association_type === "project" ||
            form.association_type === "both") && (
            <div>
              <Label>Project</Label>
              <SearchableProjectSelect
                projects={projects}
                value={form.project_id}
                onChange={(v) => setForm({ ...form, project_id: v })}
              />
            </div>
          )}
          <div>
            <Label>Assignees *</Label>
            <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto border rounded-md p-2">
              {users.map((u) => (
                <Button
                  key={u.id}
                  type="button"
                  size="sm"
                  variant={form.assignees.includes(u.id) ? "default" : "outline"}
                  onClick={() => toggleAssignee(u.id)}
                >
                  {u.name}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label>Remarks</Label>
            <Textarea
              rows={2}
              value={form.remark}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
            />
          </div>
          <div>
            <Label>Reminder</Label>
            <Input
              type="datetime-local"
              value={form.reminder_at}
              onChange={(e) => setForm({ ...form, reminder_at: e.target.value })}
            />
          </div>
          <div>
            <Label>Attachment</Label>
            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.docx"
              onChange={(e) =>
                setForm({ ...form, document: e.target.files?.[0] || null })
              }
            />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : "Create Task"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskCreateSheet;
