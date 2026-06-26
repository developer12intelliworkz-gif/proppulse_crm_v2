import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPascalCaseDisplayName } from "@/utils/formatDisplayName";
import {
  User,
  Mail,
  Phone,
  DollarSign,
  Plus,
  Edit,
  Save,
  X,
  Check,
  ChevronsUpDown,
} from "lucide-react";
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
} from "@/components/ui/command";
import axiosInstance from "@/api/axiosInstance";
import { useAuth } from "@/contexts/AuthContext";
import ActivityHistory from "./ActivityHistory";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  type: string;
  leadSource: string;
  leadScore: number;
  budget: string;
  timeline: string;
  assignedAgent: string | null;
  lastContact: string;
  createdAt: string;
  requirements?: string;
  notes?: string;
  interested_project_id: number | null;
}

interface Task {
  id: number;
  title: string;
  description?: string;
  due_on?: string;
  assignees: string[];
  remark?: string;
  priority: "low" | "medium" | "high";
  document?: string;
  created_by: string;
  project_id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

interface User {
  id: string;
  name: string;
}

interface Project {
  id: number;
  name: string;
}

interface ActivityData {
  notes: string;
  documents: { name: string; type: string }[];
}

interface LeadDetailsOffCanvasProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: (updatedLead: Lead) => void;
}

const SingleSelectProject = ({
  projects,
  selected,
  onChange,
  disabled,
}: {
  projects: Project[];
  selected: string;
  onChange: (val: string) => void;
  disabled: boolean;
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between mt-1"
        >
          {selected
            ? projects.find((project) => project.id.toString() === selected)
                ?.name || "Select project"
            : "Select project"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search project..." />
          <CommandEmpty>No project found.</CommandEmpty>
          <CommandGroup>
            {projects.map((project) => (
              <CommandItem
                key={project.id}
                value={project.name}
                onSelect={() => {
                  onChange(project.id.toString());
                }}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    selected === project.id.toString()
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                />
                {project.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const MultiSelectAssignees = ({
  users,
  selected,
  onChange,
  disabled,
}: {
  users: User[];
  selected: string[];
  onChange: (vals: string[]) => void;
  disabled: boolean;
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between mt-1"
        >
          {selected.length > 0
            ? selected
                .map(
                  (id) =>
                    users.find((user) => user.id === id)?.name || "Unknown User"
                )
                .join(", ")
            : "Select assignees"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search assignee..." />
          <CommandEmpty>No assignee found.</CommandEmpty>
          <CommandGroup>
            {users.map((user) => (
              <CommandItem
                key={user.id}
                value={user.name}
                onSelect={() => {
                  const newSelected = selected.includes(user.id)
                    ? selected.filter((id) => id !== user.id)
                    : [...selected, user.id];
                  onChange(newSelected);
                }}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    selected.includes(user.id) ? "opacity-100" : "opacity-0"
                  }`}
                />
                {user.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const LeadDetailsOffCanvas: React.FC<LeadDetailsOffCanvasProps> = ({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedLead, setEditedLead] = useState<Lead>(lead);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showTaskForm, setShowTaskForm] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activityData, setActivityData] = useState<ActivityData>({
    notes: lead.notes || "",
    documents: [],
  });
  const [taskForm, setTaskForm] = useState<{
    title: string;
    description: string;
    due_on: string;
    assignees: string[];
    remark: string;
    priority: "low" | "medium" | "high";
    document: File | null;
    created_by: string;
    project_id: string;
  }>({
    title: "",
    description: "",
    due_on: "",
    assignees: [],
    remark: "",
    priority: "medium",
    document: null,
    created_by: user?.id || "",
    project_id: lead.interested_project_id?.toString() || "",
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setTaskForm((prev) => ({ ...prev, created_by: user.id }));
    }
  }, [user]);

  useEffect(() => {
    if (showTaskForm && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [showTaskForm]);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/users");
      const userData = response.data.data || response.data;
      if (Array.isArray(userData)) {
        setUsers(userData);
      } else {
        console.error("Unexpected users response format:", userData);
        setFormErrors((prev) => [...prev, "Unexpected users response format"]);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setFormErrors((prev) => [
        ...prev,
        `Error fetching users: ${error.response?.data?.error || error.message}`,
      ]);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axiosInstance.get("/projects");
      const projectData = response.data.data || response.data;
      if (Array.isArray(projectData)) {
        setProjects(projectData);
      } else {
        console.error("Unexpected projects response format:", projectData);
        setFormErrors((prev) => [
          ...prev,
          "Unexpected projects response format",
        ]);
      }
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      setFormErrors((prev) => [
        ...prev,
        `Error fetching projects: ${
          error.response?.data?.error || error.message
        }`,
      ]);
    }
  };

  const fetchTasks = async () => {
    if (!lead.interested_project_id) {
      setTasks([]);
      setFilteredTasks([]);
      setFormErrors((prev) => [
        ...prev,
        "No project ID associated with this lead",
      ]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/tasks");
      const taskData = response.data.data || response.data;
      if (Array.isArray(taskData)) {
        setTasks(taskData);
        setFilteredTasks(taskData);
      } else {
        console.error("Unexpected tasks response format:", taskData);
        setFormErrors((prev) => [...prev, "Unexpected tasks response format"]);
      }
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      setFormErrors((prev) => [
        ...prev,
        `Error fetching tasks: ${error.response?.data?.error || error.message}`,
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setFormErrors([]);
      Promise.all([fetchUsers(), fetchProjects(), fetchTasks()]).finally(() =>
        setIsLoading(false)
      );
    }
  }, [isOpen, lead.interested_project_id]);

  const handleTaskFilterChange = (value: string) => {
    setTaskFilter(value);
    let filtered = tasks;
    if (value !== "all") {
      filtered = tasks.filter((task) => {
        if (value === "open") return !task.deleted_at;
        if (value === "closed") return !!task.deleted_at;
        return true;
      });
    }
    setFilteredTasks(filtered);
  };

  const handleTaskFormChange = (
    field: keyof typeof taskForm,
    value: string | string[] | File | null
  ) => {
    setTaskForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTask = async () => {
    setFormErrors([]);
    const errors: string[] = [];
    if (!taskForm.title) errors.push("Title is required");
    if (!taskForm.project_id || isNaN(parseInt(taskForm.project_id)))
      errors.push("Project ID is required and must be a number");
    if (taskForm.assignees.length === 0)
      errors.push("At least one assignee is required");
    if (!taskForm.created_by) errors.push("Creator is required");
    if (taskForm.due_on && isNaN(Date.parse(taskForm.due_on)))
      errors.push("Due date must be a valid ISO timestamp");

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    const formData = new FormData();
    formData.append("title", taskForm.title);
    if (taskForm.description)
      formData.append("description", taskForm.description);
    if (taskForm.due_on) formData.append("due_on", taskForm.due_on + ":00");
    taskForm.assignees.forEach((id) => formData.append("assignees[]", id));
    if (taskForm.remark) formData.append("remark", taskForm.remark);
    formData.append("priority", taskForm.priority);
    if (taskForm.document) formData.append("document", taskForm.document);
    formData.append("created_by", taskForm.created_by);
    formData.append("project_id", taskForm.project_id);

    setIsLoading(true);
    try {
      const payload = {};
      formData.forEach((value, key) => {
        if (payload[key]) {
          if (!Array.isArray(payload[key])) payload[key] = [payload[key]];
          payload[key].push(value);
        } else {
          payload[key] = value;
        }
      });
      const response = await axiosInstance.post("/tasks", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchTasks();
      setTaskForm({
        title: "",
        description: "",
        due_on: "",
        assignees: [],
        remark: "",
        priority: "medium",
        document: null,
        created_by: user?.id || "",
        project_id: lead.interested_project_id?.toString() || "",
      });
      setShowTaskForm(false);
    } catch (error: any) {
      console.error("Error creating task:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message;
      setFormErrors([`Error creating task: ${errorMessage}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    const payload = {
      lead: editedLead,
      activity: activityData,
      tasks: filteredTasks,
      taskForm,
    };
    onLeadUpdated(editedLead);
    setIsEditing(false);
  };

  const handleActivityUpdate = (newActivityData: ActivityData) => {
    setActivityData(newActivityData);
  };

  const getStatusColor = (status: string): string =>
    ({
      active: "bg-green-100 text-green-800",
      qualified: "bg-blue-100 text-blue-800",
      nurturing: "bg-yellow-100 text-yellow-800",
      cold: "bg-gray-100 text-gray-800",
      converted: "bg-purple-100 text-purple-800",
    }[status] || "bg-gray-100 text-gray-800");

  const getPriorityColor = (priority: string): string =>
    ({
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    }[priority] || "bg-gray-100 text-gray-800");

  return (
    <div
      className={`fixed inset-y-0 right-0 w-full max-w-4xl bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      } overflow-y-auto z-50`}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-6 bg-white sticky top-0 z-10">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold">
              <User className="h-5 w-5" />
              {lead.name}
            </h2>
            <p className="text-sm text-gray-500">
              Lead details and activity history
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 rounded-xl h-11 shadow-sm">
            <TabsTrigger value="details" className="text-xs font-bold rounded-lg transition-all py-2 data-[state=active]:bg-[var(--theme-color)] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800">Lead Details</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs font-bold rounded-lg transition-all py-2 data-[state=active]:bg-[var(--theme-color)] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800">Activity History</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs font-bold rounded-lg transition-all py-2 data-[state=active]:bg-[var(--theme-color)] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800">Notes & Files</TabsTrigger>
            <TabsTrigger value="task" className="text-xs font-bold rounded-lg transition-all py-2 data-[state=active]:bg-[var(--theme-color)] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    {isEditing ? (
                      <Input
                        value={editedLead.email}
                        onChange={(e) =>
                          setEditedLead({
                            ...editedLead,
                            email: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <span>{lead.email}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    {isEditing ? (
                      <Input
                        value={editedLead.phone}
                        onChange={(e) =>
                          setEditedLead({
                            ...editedLead,
                            phone: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <span>{lead.phone}</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lead Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium w-20">Status:</span>
                    {isEditing ? (
                      <Select
                        value={editedLead.status}
                        onValueChange={(value) =>
                          setEditedLead({ ...editedLead, status: value })
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="nurturing">Nurturing</SelectItem>
                          <SelectItem value="cold">Cold</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium w-20">Lead Source:</span>
                    <span>
                      {formatPascalCaseDisplayName(
                        lead.leadSource || lead.type || "unknown"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium w-20">Score:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${lead.leadScore}%` }}
                        />
                      </div>
                      <span className="text-sm">{lead.leadScore}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Requirements & Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 items-center gap-3">
                  <div>
                    <label className="text-sm font-medium">Budget Range:</label>
                    {isEditing ? (
                      <Input
                        value={editedLead.budget}
                        onChange={(e) =>
                          setEditedLead({
                            ...editedLead,
                            budget: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1">{lead.budget}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Timeline:</label>
                    {isEditing ? (
                      <Input
                        value={editedLead.timeline}
                        onChange={(e) =>
                          setEditedLead({
                            ...editedLead,
                            timeline: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <p className="mt-1">{lead.timeline}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Requirements:</label>
                    {isEditing ? (
                      <Textarea
                        value={editedLead.requirements || ""}
                        onChange={(e) =>
                          setEditedLead({
                            ...editedLead,
                            requirements: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <p className="mt-1">{lead.requirements || "None"}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <div>
              {!isEditing ? (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* <TabsContent value="activity" className="space-y-4">
            <ActivityHistory
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              onSave={handleSave}
              onActivityUpdate={handleActivityUpdate}
            />
          </TabsContent> */}

          <TabsContent value="activity" className="space-y-4">
            <ActivityHistory
              leadId={parseInt(lead.id)}
              users={users || []}
              projects={projects || []}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              onSave={handleSave}
              onActivityUpdate={handleActivityUpdate}
            />
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notes & Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add notes about this lead..."
                  className="min-h-32"
                  value={activityData.notes}
                  onChange={(e) =>
                    setActivityData({ ...activityData, notes: e.target.value })
                  }
                />
                <div className="mt-4">
                  <Button variant="outline">Upload Document</Button>
                </div>
              </CardContent>
            </Card>
            <div>
              {!isEditing ? (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="task" className="space-y-4">
            <Card>
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <CardTitle>Tasks</CardTitle>
                  <div className="flex gap-2 items-center">
                    <Button
                      size="sm"
                      onClick={() => setShowTaskForm(!showTaskForm)}
                      disabled={isLoading}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {showTaskForm ? "Cancel" : "Add Task"}
                    </Button>
                    <Select
                      value={taskFilter}
                      onValueChange={handleTaskFilterChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {formErrors.length > 0 && (
                  <div className="mb-4">
                    {formErrors.map((error, index) => (
                      <p key={index} className="text-red-500 text-sm">
                        {error}
                      </p>
                    ))}
                  </div>
                )}
                {!lead.interested_project_id ? (
                  <p className="text-sm text-gray-500">
                    No project associated with this lead. Please assign a
                    project to view tasks.
                  </p>
                ) : isLoading ? (
                  <p className="text-sm text-gray-500">Loading tasks...</p>
                ) : filteredTasks.length === 0 ? (
                  <p className="text-sm text-gray-500">No tasks found.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className="border-l-2 border-blue-200 pl-4 my-5"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-gray-600">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                className={getPriorityColor(task.priority)}
                              >
                                {task.priority}
                              </Badge>
                              {task.due_on && (
                                <span className="text-sm text-gray-500">
                                  Due: {task.due_on.split("T")[0]}
                                </span>
                              )}
                            </div>
                            {task.remark && (
                              <p className="text-sm text-gray-500 mt-1">
                                Remark: {task.remark}
                              </p>
                            )}
                            {task.document && (
                              <p className="text-sm text-blue-600 mt-1">
                                Document: {task.document}
                              </p>
                            )}
                            <p className="text-sm text-gray-500 mt-1">
                              Assignees:{" "}
                              {task.assignees
                                .map(
                                  (id) =>
                                    users.find((user) => user.id === id)
                                      ?.name || "Unknown User"
                                )
                                .join(", ")}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Created By:{" "}
                              {users.find((user) => user.id === task.created_by)
                                ?.name || "Unknown User"}
                            </p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div>Created: {task.created_at.split("T")[0]}</div>
                            {task.deleted_at && (
                              <div>Closed: {task.deleted_at.split("T")[0]}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {showTaskForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Task</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formErrors.length > 0 && (
                    <div className="mb-4">
                      {formErrors.map((error, index) => (
                        <p key={index} className="text-red-500 text-sm">
                          {error}
                        </p>
                      ))}
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium">Title *</label>
                    <Input
                      ref={titleInputRef}
                      value={taskForm.title}
                      onChange={(e) =>
                        handleTaskFormChange("title", e.target.value)
                      }
                      placeholder="Enter task title"
                      className="mt-1"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={taskForm.description}
                      onChange={(e) =>
                        handleTaskFormChange("description", e.target.value)
                      }
                      placeholder="Enter task description"
                      className="mt-1"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Due Date</label>
                    <Input
                      type="datetime-local"
                      value={taskForm.due_on}
                      onChange={(e) =>
                        handleTaskFormChange("due_on", e.target.value)
                      }
                      className="mt-1"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Assignees *</label>
                    <MultiSelectAssignees
                      users={users}
                      selected={taskForm.assignees}
                      onChange={(vals) =>
                        handleTaskFormChange("assignees", vals)
                      }
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Project *</label>
                    <SingleSelectProject
                      projects={projects}
                      selected={taskForm.project_id}
                      onChange={(val) =>
                        handleTaskFormChange("project_id", val)
                      }
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Remark</label>
                    <Textarea
                      value={taskForm.remark}
                      onChange={(e) =>
                        handleTaskFormChange("remark", e.target.value)
                      }
                      placeholder="Enter any remarks"
                      className="mt-1"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select
                      value={taskForm.priority}
                      onValueChange={(value) =>
                        handleTaskFormChange(
                          "priority",
                          value as "low" | "medium" | "high"
                        )
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Document</label>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.png"
                      onChange={(e) =>
                        handleTaskFormChange(
                          "document",
                          e.target.files?.[0] || null
                        )
                      }
                      className="mt-1"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Created By *</label>
                    <Input
                      value={user?.name || "Loading..."}
                      disabled
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddTask} disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Task"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowTaskForm(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LeadDetailsOffCanvas;
