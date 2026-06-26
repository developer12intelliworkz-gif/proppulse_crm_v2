// import { useState, useEffect, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   User,
//   Mail,
//   Phone,
//   Wallet,
//   Edit,
//   Save,
//   X,
//   Check,
//   ChevronsUpDown,
//   ArrowLeft,
//   AlertCircle,
// } from "lucide-react";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
// } from "@/components/ui/command";
// import { toast } from "sonner";
// import axiosInstance from "@/api/axiosInstance";
// import { useAuth } from "@/contexts/AuthContext";
// import ActivityHistory from "../crm/ActivityHistory";

// // Helper: Safe date formatting
// const formatDate = (dateStr: string | null | undefined): string => {
//   if (!dateStr) return "Unknown";
//   try {
//     const date = new Date(dateStr);
//     return isNaN(date.getTime())
//       ? "Invalid Date"
//       : date.toISOString().split("T")[0];
//   } catch {
//     return "Unknown";
//   }
// };

// // Interfaces
// interface LocalLead {
//   id: number;
//   name: string | null;
//   email: string | null;
//   phone: string | null;
//   lead_type: string;
//   address: string | null;
//   property_type: string | null;
//   budget: string | null;
//   message: string | null;
//   status: string;
//   interested_project_id: number | null;
//   project_name: string | null;
//   created_at: string | null;
//   assigned_to?: string | null;
//   assigned_to_name?: string | null;
// }

// interface Lead {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
//   status: string;
//   type: string;
//   leadSource: string;
//   leadScore: number;
//   budget: string;
//   timeline: string;
//   assignedAgent: string | null;
//   lastContact: string;
//   createdAt: string;
//   requirements?: string;
//   notes?: string;
//   interested_project_id: number | null;
//   address?: string | null;
//   property_type?: string | null;
//   message?: string | null;
//   project_name?: string | null;
// }

// interface Task {
//   id: number;
//   title: string;
//   description?: string;
//   due_on?: string;
//   assignees: string[];
//   remark?: string;
//   priority: "low" | "medium" | "high";
//   document?: string;
//   created_by: string;
//   project_id: number;
//   created_at: string;
//   updated_at: string;
//   deleted_at?: string;
// }

// interface User {
//   id: string;
//   name: string;
// }

// interface Project {
//   id: number;
//   name: string;
// }

// interface ActivityData {
//   notes: string;
//   documents: { name: string; type: string }[];
// }

// // Select Components (unchanged)
// const SingleSelectProject = ({
//   projects,
//   selected,
//   onChange,
//   disabled,
// }: {
//   projects: Project[];
//   selected: string;
//   onChange: (val: string) => void;
//   disabled: boolean;
// }) => (
//   <Popover>
//     <PopoverTrigger asChild disabled={disabled}>
//       <Button
//         variant="outline"
//         role="combobox"
//         className="w-full justify-between mt-1"
//       >
//         {selected
//           ? projects.find((p) => p.id.toString() === selected)?.name ||
//             "Select project"
//           : "Select project"}
//         <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//       </Button>
//     </PopoverTrigger>
//     <PopoverContent className="w-full p-0">
//       <Command>
//         <CommandInput placeholder="Search project..." />
//         <CommandEmpty>No project found.</CommandEmpty>
//         <CommandGroup>
//           {projects.map((project) => (
//             <CommandItem
//               key={project.id}
//               value={project.name}
//               onSelect={() => onChange(project.id.toString())}
//             >
//               <Check
//                 className={`mr-2 h-4 w-4 ${
//                   selected === project.id.toString()
//                     ? "opacity-100"
//                     : "opacity-0"
//                 }`}
//               />
//               {project.name}
//             </CommandItem>
//           ))}
//         </CommandGroup>
//       </Command>
//     </PopoverContent>
//   </Popover>
// );

// const MultiSelectAssignees = ({
//   users,
//   selected,
//   onChange,
//   disabled,
// }: {
//   users: User[];
//   selected: string[];
//   onChange: (vals: string[]) => void;
//   disabled: boolean;
// }) => (
//   <Popover>
//     <PopoverTrigger asChild disabled={disabled}>
//       <Button
//         variant="outline"
//         role="combobox"
//         className="w-full justify-between mt-1"
//       >
//         {selected.length > 0
//           ? selected
//               .map((id) => users.find((u) => u.id === id)?.name || "Unknown")
//               .join(", ")
//           : "Select assignees"}
//         <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//       </Button>
//     </PopoverTrigger>
//     <PopoverContent className="w-full p-0">
//       <Command>
//         <CommandInput placeholder="Search assignee..." />
//         <CommandEmpty>No assignee found.</CommandEmpty>
//         <CommandGroup>
//           {users.map((user) => (
//             <CommandItem
//               key={user.id}
//               value={user.name}
//               onSelect={() => {
//                 const newSelected = selected.includes(user.id)
//                   ? selected.filter((id) => id !== user.id)
//                   : [...selected, user.id];
//                 onChange(newSelected);
//               }}
//             >
//               <Check
//                 className={`mr-2 h-4 w-4 ${
//                   selected.includes(user.id) ? "opacity-100" : "opacity-0"
//                 }`}
//               />
//               {user.name}
//             </CommandItem>
//           ))}
//         </CommandGroup>
//       </Command>
//     </PopoverContent>
//   </Popover>
// );

// const LeadDetailsPage = () => {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const { user, isAuthenticated, token, logout } = useAuth();

//   const [lead, setLead] = useState<Lead | null>(null);
//   const [isEditing, setIsEditing] = useState<boolean>(false);
//   const [editedLead, setEditedLead] = useState<Lead | null>(null);
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
//   const [taskFilter, setTaskFilter] = useState<string>("all");
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [users, setUsers] = useState<User[]>([]);
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [activityData, setActivityData] = useState<ActivityData>({
//     notes: "",
//     documents: [],
//   });

//   const [taskForm, setTaskForm] = useState({
//     title: "",
//     description: "",
//     due_on: "",
//     assignees: [] as string[],
//     remark: "",
//     priority: "medium" as "low" | "medium" | "high",
//     document: null as File | null,
//     created_by: user?.id || "",
//     project_id: "",
//   });

//   const [formErrors, setFormErrors] = useState<string[]>([]);
//   const titleInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     if (user) {
//       setTaskForm((prev) => ({ ...prev, created_by: user.id }));
//     }
//   }, [user]);

//   // Fetch Lead by ID (using proper endpoint)
//   const fetchLead = async () => {
//     if (!id || !isAuthenticated || !token) {
//       setError("Invalid lead ID or authentication.");
//       toast.error("Invalid lead ID or authentication.");
//       navigate("/leads");
//       return;
//     }

//     setIsLoading(true);
//     setError(null);

//     try {
//       const response = await axiosInstance.get(`/leads/${id}`);
//       const foundLead: LocalLead = response.data.data;

//       const mappedLead: Lead = {
//         id: foundLead.id.toString(),
//         name: foundLead.name || "Unknown",
//         email: foundLead.email || "",
//         phone: foundLead.phone || "",
//         status: foundLead.status || "new",
//         type: foundLead.lead_type || "unknown",
//         leadSource: foundLead.lead_type || "unknown",
//         leadScore: 60,
//         budget: foundLead.budget || "N/A",
//         timeline: "3-6 months",
//         assignedAgent: foundLead.assigned_to_name || null,
//         // lastContact: formatDate(foundLead.created_at),
//         lastContact: foundLead.created_at?.split("T")[0] ?? "Unknown",
//         createdAt: foundLead.created_at ?? "Unknown",
//         requirements: foundLead.message || "",
//         notes: "",
//         interested_project_id: foundLead.interested_project_id,
//         address: foundLead.address,
//         property_type: foundLead.property_type,
//         message: foundLead.message,
//         project_name: foundLead.project_name,
//       };

//       setLead(mappedLead);
//       setEditedLead(mappedLead);
//       setTaskForm((prev) => ({
//         ...prev,
//         project_id: foundLead.interested_project_id?.toString() || "",
//       }));
//     } catch (error: any) {
//       console.error("Error fetching lead:", error);
//       const msg = error.response?.data?.error || error.message;
//       setError(`Error fetching lead: ${msg}`);
//       toast.error(msg);

//       if (error.response?.status === 404 || error.response?.status === 403) {
//         navigate("/leads");
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchUsers = async () => {
//     try {
//       const response = await axiosInstance.get("/users");
//       setUsers(
//         Array.isArray(response.data.data) ? response.data.data : response.data,
//       );
//     } catch (err: any) {
//       toast.error("Failed to load users");
//     }
//   };

//   const fetchProjects = async () => {
//     try {
//       const response = await axiosInstance.get("/projects");
//       setProjects(
//         Array.isArray(response.data.data) ? response.data.data : response.data,
//       );
//     } catch (err: any) {
//       toast.error("Failed to load projects");
//     }
//   };

//   const fetchTasks = async () => {
//     if (!lead?.interested_project_id) {
//       setTasks([]);
//       setFilteredTasks([]);
//       return;
//     }
//     try {
//       const response = await axiosInstance.get(
//         `/tasks?project_id=${lead.interested_project_id}`,
//       );
//       const data = Array.isArray(response.data.data) ? response.data.data : [];
//       setTasks(data);
//       setFilteredTasks(data);
//     } catch (err: any) {
//       toast.error("Failed to load tasks");
//     }
//   };

//   useEffect(() => {
//     Promise.all([fetchLead(), fetchUsers(), fetchProjects()]);
//   }, [id, isAuthenticated, token]);

//   useEffect(() => {
//     if (lead?.interested_project_id) fetchTasks();
//   }, [lead?.interested_project_id]);

//   const handleTaskFilterChange = (value: string) => {
//     setTaskFilter(value);
//     const filtered =
//       value === "all"
//         ? tasks
//         : value === "open"
//           ? tasks.filter((t) => !t.deleted_at)
//           : tasks.filter((t) => !!t.deleted_at);
//     setFilteredTasks(filtered);
//   };

//   const handleTaskFormChange = (field: keyof typeof taskForm, value: any) => {
//     setTaskForm((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleAddTask = async () => {
//     const errors: string[] = [];
//     if (!taskForm.title) errors.push("Title is required");
//     if (!taskForm.project_id) errors.push("Project is required");
//     if (taskForm.assignees.length === 0)
//       errors.push("At least one assignee required");

//     if (errors.length > 0) {
//       setFormErrors(errors);
//       return;
//     }

//     const formData = new FormData();
//     Object.keys(taskForm).forEach((key) => {
//       const value = (taskForm as any)[key];
//       if (value !== null && value !== undefined) {
//         if (key === "assignees") {
//           value.forEach((id: string) => formData.append("assignees[]", id));
//         } else if (value instanceof File) {
//           formData.append("document", value);
//         } else if (key === "due_on" && value) {
//           formData.append("due_on", value + ":00");
//         } else {
//           formData.append(key, value);
//         }
//       }
//     });

//     try {
//       setIsLoading(true);
//       await axiosInstance.post("/tasks", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       toast.success("Task created!");
//       fetchTasks();
//       handleClearForm();
//     } catch (err: any) {
//       toast.error(err.response?.data?.error || "Failed to create task");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleClearForm = () => {
//     setTaskForm({
//       title: "",
//       description: "",
//       due_on: "",
//       assignees: [],
//       remark: "",
//       priority: "medium",
//       document: null,
//       created_by: user?.id || "",
//       project_id: lead?.interested_project_id?.toString() || "",
//     });
//     setFormErrors([]);
//   };

//   const handleSave = async () => {
//     if (!editedLead || !id) return;

//     const payload = {
//       name: editedLead.name,
//       email: editedLead.email,
//       phone: editedLead.phone,
//       status: editedLead.status,
//       budget: editedLead.budget,
//       timeline: editedLead.timeline,
//       requirements: editedLead.requirements,
//     };

//     try {
//       setIsLoading(true);
//       await axiosInstance.put(`/leads/${id}`, payload);
//       toast.success("Lead updated successfully!");
//       await fetchLead();
//       setIsEditing(false);
//     } catch (err: any) {
//       toast.error(err.response?.data?.error || "Failed to update lead");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleActivityUpdate = (newData: ActivityData) => {
//     setActivityData(newData);
//     if (editedLead) {
//       setEditedLead({ ...editedLead, notes: newData.notes });
//     }
//   };

//   const getStatusColor = (status: string) => {
//     const map: Record<string, string> = {
//       new: "bg-gray-100 text-gray-800",
//       qualified: "bg-blue-100 text-blue-800",
//       contacted: "bg-green-100 text-green-800",
//       pending: "bg-yellow-100 text-yellow-800",
//       working: "bg-purple-100 text-purple-800",
//       "proposal sent": "bg-orange-100 text-orange-800",
//       lost: "bg-red-100 text-red-800",
//     };
//     return map[status.toLowerCase()] || "bg-gray-100 text-gray-800";
//   };

//   const getPriorityColor = (priority: string) => {
//     const map: Record<string, string> = {
//       high: "bg-red-100 text-red-800",
//       medium: "bg-yellow-100 text-yellow-800",
//       low: "bg-green-100 text-green-800",
//     };
//     return map[priority] || "bg-gray-100 text-gray-800";
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-100">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gray-100 py-6">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <Card className="p-6 text-center">
//             <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
//             <h2 className="text-xl font-semibold text-gray-900 mb-2">
//               {error}
//             </h2>
//             <div className="flex justify-center gap-4">
//               <Button onClick={fetchLead} variant="outline">
//                 Retry
//               </Button>
//               <Button onClick={() => navigate("/leads")}>Back to Leads</Button>
//             </div>
//           </Card>
//         </div>
//       </div>
//     );
//   }

//   if (!lead || !editedLead) return null;

//   return (
//     <div className="min-h-screen bg-gray-100 py-6">
//       <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header */}
//         <div className="mb-8 rounded-lg p-6 shadow-lg bg-white">
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//             <div className="flex items-center gap-4">
//               <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
//                 <User className="h-6 w-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-3xl font-bold text-gray-900">
//                   {lead.name}
//                 </h1>
//                 <p className="text-sm text-gray-500">
//                   Lead ID: {lead.id} • Created: {formatDate(lead.createdAt)}
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-center gap-4">
//               <Badge
//                 className={getStatusColor(lead.status)}
//                 variant="secondary"
//               >
//                 {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
//               </Badge>
//               <Button variant="outline" onClick={() => navigate("/leads")}>
//                 <ArrowLeft className="h-4 w-4 mr-2" /> Back
//               </Button>
//             </div>
//           </div>
//         </div>

//         <Tabs defaultValue="details" className="space-y-6">
//           <TabsList className="grid w-full grid-cols-3">
//             <TabsTrigger value="details">Details</TabsTrigger>
//             <TabsTrigger value="activity">Activity</TabsTrigger>
//             <TabsTrigger value="task">Tasks</TabsTrigger>
//           </TabsList>

//           {/* Details Tab */}
//           <TabsContent value="details" className="space-y-6">
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Contact Info */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2">
//                     <Mail className="h-4 w-4" /> Contact
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div className="flex items-center gap-3">
//                     <Mail className="h-4 w-4 text-gray-500" />
//                     {isEditing ? (
//                       <Input
//                         value={editedLead.email}
//                         onChange={(e) =>
//                           setEditedLead({
//                             ...editedLead,
//                             email: e.target.value,
//                           })
//                         }
//                       />
//                     ) : (
//                       <span className="font-medium">{lead.email || "—"}</span>
//                     )}
//                   </div>
//                   <div className="flex items-center gap-3">
//                     <Phone className="h-4 w-4 text-gray-500" />
//                     {isEditing ? (
//                       <Input
//                         value={editedLead.phone}
//                         onChange={(e) =>
//                           setEditedLead({
//                             ...editedLead,
//                             phone: e.target.value,
//                           })
//                         }
//                       />
//                     ) : (
//                       <span className="font-medium">{lead.phone || "—"}</span>
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Lead Info */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Lead Info</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div>
//                     <strong>Type:</strong> {lead.type}
//                   </div>
//                   <div>
//                     <strong>Last Contact:</strong> {lead.lastContact}
//                   </div>
//                   {isEditing && (
//                     <div>
//                       <label className="text-sm font-medium">Status</label>
//                       <Select
//                         value={editedLead.status}
//                         onValueChange={(v) =>
//                           setEditedLead({ ...editedLead, status: v })
//                         }
//                       >
//                         <SelectTrigger>
//                           <SelectValue />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="new">New</SelectItem>
//                           <SelectItem value="contacted">Contacted</SelectItem>
//                           <SelectItem value="qualified">Qualified</SelectItem>
//                           <SelectItem value="working">Working</SelectItem>
//                           <SelectItem value="proposal sent">
//                             Proposal Sent
//                           </SelectItem>
//                           <SelectItem value="lost">Lost</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Requirements */}
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Wallet className="h-5 w-5" /> Requirements
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="grid md:grid-cols-3 gap-4">
//                   <div>
//                     <strong>Budget:</strong>
//                     {isEditing ? (
//                       <Input
//                         value={editedLead.budget}
//                         onChange={(e) =>
//                           setEditedLead({
//                             ...editedLead,
//                             budget: e.target.value,
//                           })
//                         }
//                       />
//                     ) : (
//                       <span> {lead.budget}</span>
//                     )}
//                   </div>
//                   <div>
//                     <strong>Timeline:</strong>
//                     {isEditing ? (
//                       <Input
//                         value={editedLead.timeline}
//                         onChange={(e) =>
//                           setEditedLead({
//                             ...editedLead,
//                             timeline: e.target.value,
//                           })
//                         }
//                       />
//                     ) : (
//                       <span> {lead.timeline}</span>
//                     )}
//                   </div>
//                   <div className="md:col-span-3">
//                     <strong>Requirements:</strong>
//                     {isEditing ? (
//                       <Textarea
//                         rows={3}
//                         value={editedLead.requirements}
//                         onChange={(e) =>
//                           setEditedLead({
//                             ...editedLead,
//                             requirements: e.target.value,
//                           })
//                         }
//                       />
//                     ) : (
//                       <p className="whitespace-pre-wrap">
//                         {lead.requirements || "None specified"}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//                 {lead.project_name && (
//                   <div className="mt-4">
//                     <strong>Project:</strong> {lead.project_name}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>

//             <div className="flex justify-end gap-2">
//               {isEditing ? (
//                 <>
//                   <Button onClick={handleSave}>
//                     <Save className="h-4 w-4 mr-2" /> Save
//                   </Button>
//                   <Button
//                     variant="outline"
//                     onClick={() => {
//                       setIsEditing(false);
//                       setEditedLead(lead);
//                     }}
//                   >
//                     <X className="h-4 w-4 mr-2" /> Cancel
//                   </Button>
//                 </>
//               ) : (
//                 <Button variant="outline" onClick={() => setIsEditing(true)}>
//                   <Edit className="h-4 w-4 mr-2" /> Edit
//                 </Button>
//               )}
//             </div>
//           </TabsContent>

//           <TabsContent value="activity">
//             <ActivityHistory
//               leadId={parseInt(lead.id)}
//               users={users}
//               projects={projects}
//               isEditing={isEditing}
//               setIsEditing={setIsEditing}
//               onSave={handleSave}
//               onActivityUpdate={handleActivityUpdate}
//             />
//           </TabsContent>

//           <TabsContent value="task" className="space-y-4">
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Left: Task List */}
//               <Card>
//                 <CardHeader className="border-b">
//                   <div className="flex justify-between items-center">
//                     <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
//                     <Select
//                       value={taskFilter}
//                       onValueChange={handleTaskFilterChange}
//                       disabled={isLoading}
//                     >
//                       <SelectTrigger className="w-24">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="all">All</SelectItem>
//                         <SelectItem value="open">Open</SelectItem>
//                         <SelectItem value="closed">Closed</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="pt-6">
//                   {formErrors.length > 0 && (
//                     <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
//                       {formErrors.map((error, index) => (
//                         <p key={index} className="text-red-600 text-sm">
//                           {error}
//                         </p>
//                       ))}
//                     </div>
//                   )}
//                   {!lead.interested_project_id ? (
//                     <p className="text-sm text-gray-500">
//                       No project associated with this lead. Assign a project to
//                       manage tasks.
//                     </p>
//                   ) : isLoading ? (
//                     <p className="text-sm text-gray-500">Loading tasks...</p>
//                   ) : filteredTasks.length === 0 ? (
//                     <p className="text-sm text-gray-500">
//                       No tasks found. Create one on the right!
//                     </p>
//                   ) : (
//                     <div className="space-y-4">
//                       {filteredTasks.map((task) => (
//                         <Card key={task.id} className="p-4">
//                           <div className="flex justify-between items-start">
//                             <div className="flex-1">
//                               <h4 className="font-medium text-lg">
//                                 {task.title}
//                               </h4>
//                               {task.description && (
//                                 <p className="text-sm text-gray-600 mt-1">
//                                   {task.description}
//                                 </p>
//                               )}
//                               <div className="flex items-center gap-2 mt-2">
//                                 <Badge
//                                   className={getPriorityColor(task.priority)}
//                                 >
//                                   {task.priority.toUpperCase()}
//                                 </Badge>
//                                 {task.due_on && (
//                                   <span className="text-sm text-gray-500">
//                                     Due:{" "}
//                                     {new Date(task.due_on).toLocaleDateString()}
//                                   </span>
//                                 )}
//                               </div>
//                               {task.remark && (
//                                 <p className="text-sm text-gray-500 mt-1 italic">
//                                   Remark: {task.remark}
//                                 </p>
//                               )}
//                               {task.document && (
//                                 <p className="text-sm text-blue-600 mt-1">
//                                   📎 Document: {task.document.split("/").pop()}
//                                 </p>
//                               )}
//                               <p className="text-sm text-gray-500 mt-1">
//                                 Assignees:{" "}
//                                 {task.assignees
//                                   .map(
//                                     (assigneeId) =>
//                                       users.find((u) => u.id === assigneeId)
//                                         ?.name,
//                                   )
//                                   .filter(Boolean)
//                                   .join(", ") || "None"}
//                               </p>
//                               <p className="text-sm text-gray-500">
//                                 Created by:{" "}
//                                 {users.find((u) => u.id === task.created_by)
//                                   ?.name || "Unknown"}
//                               </p>
//                             </div>
//                             <div className="text-right text-sm text-gray-500 ml-4">
//                               <div>
//                                 Created:{" "}
//                                 {new Date(task.created_at).toLocaleDateString()}
//                               </div>
//                               {task.deleted_at && (
//                                 <div className="text-green-600">
//                                   Closed:{" "}
//                                   {new Date(
//                                     task.deleted_at,
//                                   ).toLocaleDateString()}
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         </Card>
//                       ))}
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>

//               {/* Right: Task Form */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Add New Task</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4 p-6">
//                   {!lead.interested_project_id ? (
//                     <p className="text-sm text-gray-500">
//                       No project associated with this lead. Assign a project to
//                       create tasks.
//                     </p>
//                   ) : (
//                     <>
//                       <div>
//                         <label className="text-sm font-medium">Title *</label>
//                         <Input
//                           ref={titleInputRef}
//                           value={taskForm.title}
//                           onChange={(e) =>
//                             handleTaskFormChange("title", e.target.value)
//                           }
//                           placeholder="Enter task title"
//                           className="mt-1"
//                           disabled={isLoading}
//                         />
//                       </div>
//                       <div>
//                         <label className="text-sm font-medium">
//                           Description
//                         </label>
//                         <Textarea
//                           value={taskForm.description}
//                           onChange={(e) =>
//                             handleTaskFormChange("description", e.target.value)
//                           }
//                           placeholder="Enter task description"
//                           className="mt-1"
//                           rows={3}
//                           disabled={isLoading}
//                         />
//                       </div>
//                       <div className="grid grid-cols-2 gap-4">
//                         <div>
//                           <label className="text-sm font-medium">
//                             Due Date
//                           </label>
//                           <Input
//                             type="datetime-local"
//                             value={taskForm.due_on}
//                             onChange={(e) =>
//                               handleTaskFormChange("due_on", e.target.value)
//                             }
//                             className="mt-1"
//                             disabled={isLoading}
//                           />
//                         </div>
//                         <div>
//                           <label className="text-sm font-medium">
//                             Priority
//                           </label>
//                           <Select
//                             value={taskForm.priority}
//                             onValueChange={(value) =>
//                               handleTaskFormChange(
//                                 "priority",
//                                 value as "low" | "medium" | "high",
//                               )
//                             }
//                             disabled={isLoading}
//                           >
//                             <SelectTrigger className="mt-1">
//                               <SelectValue />
//                             </SelectTrigger>
//                             <SelectContent>
//                               <SelectItem value="low">Low</SelectItem>
//                               <SelectItem value="medium">Medium</SelectItem>
//                               <SelectItem value="high">High</SelectItem>
//                             </SelectContent>
//                           </Select>
//                         </div>
//                       </div>
//                       <div>
//                         <label className="text-sm font-medium">
//                           Assignees *
//                         </label>
//                         <MultiSelectAssignees
//                           users={users}
//                           selected={taskForm.assignees}
//                           onChange={(vals) =>
//                             handleTaskFormChange("assignees", vals)
//                           }
//                           disabled={isLoading}
//                         />
//                       </div>
//                       <div>
//                         <label className="text-sm font-medium">Project</label>
//                         <SingleSelectProject
//                           projects={projects}
//                           selected={taskForm.project_id}
//                           onChange={(val) =>
//                             handleTaskFormChange("project_id", val)
//                           }
//                           disabled={isLoading}
//                         />
//                       </div>
//                       <div className="grid grid-cols-2 gap-4">
//                         <div>
//                           <label className="text-sm font-medium">Remark</label>
//                           <Textarea
//                             value={taskForm.remark}
//                             onChange={(e) =>
//                               handleTaskFormChange("remark", e.target.value)
//                             }
//                             placeholder="Enter any remarks"
//                             className="mt-1"
//                             rows={2}
//                             disabled={isLoading}
//                           />
//                         </div>
//                         <div>
//                           <label className="text-sm font-medium">
//                             Document
//                           </label>
//                           <Input
//                             type="file"
//                             accept=".pdf,.jpg,.png"
//                             onChange={(e) =>
//                               handleTaskFormChange(
//                                 "document",
//                                 e.target.files?.[0] || null,
//                               )
//                             }
//                             className="mt-1"
//                             disabled={isLoading}
//                           />
//                         </div>
//                       </div>
//                       <div className="flex gap-2 pt-4">
//                         <Button onClick={handleAddTask} disabled={isLoading}>
//                           {isLoading ? "Saving..." : "Create Task"}
//                         </Button>
//                         <Button
//                           variant="outline"
//                           onClick={handleClearForm}
//                           disabled={isLoading}
//                         >
//                           Clear Form
//                         </Button>
//                       </div>
//                     </>
//                   )}
//                 </CardContent>
//               </Card>
//             </div>
//           </TabsContent>
//         </Tabs>
//       </div>
//     </div>
//   );
// };

// export default LeadDetailsPage;

// import { useState, useEffect, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   User,
//   Mail,
//   Phone,
//   Wallet,
//   Edit,
//   Save,
//   X,
//   Check,
//   ChevronsUpDown,
//   ArrowLeft,
//   AlertCircle,
//   Building2,
//   Home,
//   Plus,
// } from "lucide-react";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
// } from "@/components/ui/command";
// import { toast } from "sonner";
// import axiosInstance from "@/api/axiosInstance";
// import { useAuth } from "@/contexts/AuthContext";
// import ActivityHistory from "../crm/ActivityHistory";

// // Helper: Safe date formatting
// const formatDate = (dateStr: string | null | undefined): string => {
//   if (!dateStr) return "Unknown";
//   try {
//     const date = new Date(dateStr);
//     return isNaN(date.getTime())
//       ? "Invalid Date"
//       : date.toISOString().split("T")[0];
//   } catch {
//     return "Unknown";
//   }
// };

// // ── Interfaces ────────────────────────────────────────────────────────────────
// interface LocalLead {
//   id: number;
//   name: string | null;
//   email: string | null;
//   phone: string | null;
//   lead_type: string;
//   address: string | null;
//   property_type: string | null;
//   budget: string | null;
//   message: string | null;
//   status: string;
//   interested_project_id: number | null;
//   project_name: string | null;
//   created_at: string | null;
//   assigned_to?: string | null;
//   assigned_to_name?: string | null;
// }

// interface Lead {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
//   status: string;
//   type: string;
//   leadSource: string;
//   leadScore: number;
//   budget: string;
//   timeline: string;
//   assignedAgent: string | null;
//   lastContact: string;
//   createdAt: string;
//   requirements?: string;
//   notes?: string;
//   interested_project_id: number | null;
//   address?: string | null;
//   property_type?: string | null;
//   message?: string | null;
//   project_name?: string | null;
// }

// interface Task {
//   id: number;
//   title: string;
//   description?: string;
//   due_on?: string;
//   assignees: string[];
//   remark?: string;
//   priority: "low" | "medium" | "high";
//   document?: string;
//   created_by: string;
//   project_id: number;
//   created_at: string;
//   updated_at: string;
//   deleted_at?: string;
// }

// interface User {
//   id: string;
//   name: string;
// }

// interface Project {
//   id: number;
//   name: string;
// }

// interface ActivityData {
//   notes: string;
//   documents: { name: string; type: string }[];
// }

// // ── New Interfaces for Units Tab ─────────────────────────────────────────────
// interface HierarchyNode {
//   id: string;
//   name: string;
//   type_code?: string; // e.g. "TOWER", "BLOCK", "SECTOR"
//   parent_id: string | null;
// }

// interface Unit {
//   id: string;
//   unit_number: string;
//   status: "available" | "booked" | "sold" | "blocked" | "reserved";
//   carpet_area_sqft?: number;
//   super_area_sqft?: number;
//   facing?: string;
//   price?: number;
//   lead_id?: string | null;
// }

// // ── Select Components (unchanged) ────────────────────────────────────────────
// const SingleSelectProject = ({
//   projects,
//   selected,
//   onChange,
//   disabled,
// }: {
//   projects: Project[];
//   selected: string;
//   onChange: (val: string) => void;
//   disabled: boolean;
// }) => (
//   <Popover>
//     <PopoverTrigger asChild disabled={disabled}>
//       <Button
//         variant="outline"
//         role="combobox"
//         className="w-full justify-between mt-1"
//       >
//         {selected
//           ? projects.find((p) => p.id.toString() === selected)?.name ||
//             "Select project"
//           : "Select project"}
//         <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//       </Button>
//     </PopoverTrigger>
//     <PopoverContent className="w-full p-0">
//       <Command>
//         <CommandInput placeholder="Search project..." />
//         <CommandEmpty>No project found.</CommandEmpty>
//         <CommandGroup>
//           {projects.map((project) => (
//             <CommandItem
//               key={project.id}
//               value={project.name}
//               onSelect={() => onChange(project.id.toString())}
//             >
//               <Check
//                 className={`mr-2 h-4 w-4 ${
//                   selected === project.id.toString()
//                     ? "opacity-100"
//                     : "opacity-0"
//                 }`}
//               />
//               {project.name}
//             </CommandItem>
//           ))}
//         </CommandGroup>
//       </Command>
//     </PopoverContent>
//   </Popover>
// );

// const MultiSelectAssignees = ({
//   users,
//   selected,
//   onChange,
//   disabled,
// }: {
//   users: User[];
//   selected: string[];
//   onChange: (vals: string[]) => void;
//   disabled: boolean;
// }) => (
//   <Popover>
//     <PopoverTrigger asChild disabled={disabled}>
//       <Button
//         variant="outline"
//         role="combobox"
//         className="w-full justify-between mt-1"
//       >
//         {selected.length > 0
//           ? selected
//               .map((id) => users.find((u) => u.id === id)?.name || "Unknown")
//               .join(", ")
//           : "Select assignees"}
//         <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//       </Button>
//     </PopoverTrigger>
//     <PopoverContent className="w-full p-0">
//       <Command>
//         <CommandInput placeholder="Search assignee..." />
//         <CommandEmpty>No assignee found.</CommandEmpty>
//         <CommandGroup>
//           {users.map((user) => (
//             <CommandItem
//               key={user.id}
//               value={user.name}
//               onSelect={() => {
//                 const newSelected = selected.includes(user.id)
//                   ? selected.filter((id) => id !== user.id)
//                   : [...selected, user.id];
//                 onChange(newSelected);
//               }}
//             >
//               <Check
//                 className={`mr-2 h-4 w-4 ${
//                   selected.includes(user.id) ? "opacity-100" : "opacity-0"
//                 }`}
//               />
//               {user.name}
//             </CommandItem>
//           ))}
//         </CommandGroup>
//       </Command>
//     </PopoverContent>
//   </Popover>
// );

// // ── Main Component ────────────────────────────────────────────────────────────
// const LeadDetailsPage = () => {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const { user, isAuthenticated, token } = useAuth();

//   const [lead, setLead] = useState<Lead | null>(null);
//   const [isEditing, setIsEditing] = useState<boolean>(false);
//   const [editedLead, setEditedLead] = useState<Lead | null>(null);
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
//   const [taskFilter, setTaskFilter] = useState<string>("all");
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [users, setUsers] = useState<User[]>([]);
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [activityData, setActivityData] = useState<ActivityData>({
//     notes: "",
//     documents: [],
//   });

//   // Task form state (unchanged)
//   const [taskForm, setTaskForm] = useState({
//     title: "",
//     description: "",
//     due_on: "",
//     assignees: [] as string[],
//     remark: "",
//     priority: "medium" as "low" | "medium" | "high",
//     document: null as File | null,
//     created_by: user?.id || "",
//     project_id: "",
//   });

//   const [formErrors, setFormErrors] = useState<string[]>([]);
//   const titleInputRef = useRef<HTMLInputElement>(null);

//   // ── New state for Units tab ───────────────────────────────────────────────
//   const [hierarchyNodes, setHierarchyNodes] = useState<HierarchyNode[]>([]);
//   const [units, setUnits] = useState<Unit[]>([]);
//   const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
//   const [loadingUnits, setLoadingUnits] = useState(false);

//   useEffect(() => {
//     if (user) {
//       setTaskForm((prev) => ({ ...prev, created_by: user.id }));
//     }
//   }, [user]);

//   // ── Fetch Lead ───────────────────────────────────────────────────────────────
//   const fetchLead = async () => {
//     if (!id || !isAuthenticated || !token) {
//       setError("Invalid lead ID or authentication.");
//       toast.error("Invalid lead ID or authentication.");
//       navigate("/leads");
//       return;
//     }

//     setIsLoading(true);
//     setError(null);

//     try {
//       const response = await axiosInstance.get(`/leads/${id}`);
//       const foundLead: LocalLead = response.data.data;

//       const mappedLead: Lead = {
//         id: foundLead.id.toString(),
//         name: foundLead.name || "Unknown",
//         email: foundLead.email || "",
//         phone: foundLead.phone || "",
//         status: foundLead.status || "new",
//         type: foundLead.lead_type || "unknown",
//         leadSource: foundLead.lead_type || "unknown",
//         leadScore: 60,
//         budget: foundLead.budget || "N/A",
//         timeline: "3-6 months",
//         assignedAgent: foundLead.assigned_to_name || null,
//         lastContact: foundLead.created_at?.split("T")[0] ?? "Unknown",
//         createdAt: foundLead.created_at ?? "Unknown",
//         requirements: foundLead.message || "",
//         notes: "",
//         interested_project_id: foundLead.interested_project_id,
//         address: foundLead.address,
//         property_type: foundLead.property_type,
//         message: foundLead.message,
//         project_name: foundLead.project_name,
//       };

//       setLead(mappedLead);
//       setEditedLead(mappedLead);
//       setTaskForm((prev) => ({
//         ...prev,
//         project_id: foundLead.interested_project_id?.toString() || "",
//       }));
//     } catch (error: any) {
//       console.error("Error fetching lead:", error);
//       const msg = error.response?.data?.error || error.message;
//       setError(`Error fetching lead: ${msg}`);
//       toast.error(msg);
//       if (error.response?.status === 404 || error.response?.status === 403) {
//         navigate("/leads");
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchUsers = async () => {
//     try {
//       const response = await axiosInstance.get("/users");
//       setUsers(
//         Array.isArray(response.data.data) ? response.data.data : response.data,
//       );
//     } catch (err: any) {
//       toast.error("Failed to load users");
//     }
//   };

//   const fetchProjects = async () => {
//     try {
//       const response = await axiosInstance.get("/projects");
//       setProjects(
//         Array.isArray(response.data.data) ? response.data.data : response.data,
//       );
//     } catch (err: any) {
//       toast.error("Failed to load projects");
//     }
//   };

//   const fetchTasks = async () => {
//     if (!lead?.interested_project_id) {
//       setTasks([]);
//       setFilteredTasks([]);
//       return;
//     }
//     try {
//       const response = await axiosInstance.get(
//         `/tasks?project_id=${lead.interested_project_id}`,
//       );
//       const data = Array.isArray(response.data.data) ? response.data.data : [];
//       setTasks(data);
//       setFilteredTasks(data);
//     } catch (err: any) {
//       toast.error("Failed to load tasks");
//     }
//   };

//   // ── New: Fetch hierarchy nodes (towers/blocks) ─────────────────────────────
//   const fetchHierarchyNodes = async () => {
//     if (!lead?.interested_project_id) return;

//     try {
//       const res = await axiosInstance.get(
//         `/projects/${lead.interested_project_id}/hierarchy-nodes`,
//       );
//       setHierarchyNodes(res.data.data || []);
//     } catch (err) {
//       console.error("Failed to load hierarchy nodes", err);
//       toast.error("Could not load towers / blocks");
//     }
//   };

//   // ── New: Fetch units for selected node ─────────────────────────────────────
//   const fetchUnitsForNode = async (nodeId: string) => {
//     if (!lead?.interested_project_id) return;

//     setLoadingUnits(true);
//     try {
//       const res = await axiosInstance.get("/units", {
//         params: {
//           project_id: lead.interested_project_id,
//           node_id: nodeId,
//         },
//       });
//       setUnits(res.data.data || []);
//     } catch (err) {
//       console.error("Failed to load units", err);
//       toast.error("Units could not be loaded");
//     } finally {
//       setLoadingUnits(false);
//     }
//   };

//   // ── Effects ─────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     Promise.all([fetchLead(), fetchUsers(), fetchProjects()]);
//   }, [id, isAuthenticated, token]);

//   useEffect(() => {
//     if (lead?.interested_project_id) fetchTasks();
//   }, [lead?.interested_project_id]);

//   useEffect(() => {
//     if (lead?.interested_project_id) {
//       fetchHierarchyNodes();
//     }
//   }, [lead?.interested_project_id]);

//   useEffect(() => {
//     if (selectedNodeId) {
//       fetchUnitsForNode(selectedNodeId);
//     } else {
//       setUnits([]);
//     }
//   }, [selectedNodeId]);

//   // ── Existing handlers (unchanged) ──────────────────────────────────────────
//   const handleTaskFilterChange = (value: string) => {
//     setTaskFilter(value);
//     const filtered =
//       value === "all"
//         ? tasks
//         : value === "open"
//           ? tasks.filter((t) => !t.deleted_at)
//           : tasks.filter((t) => !!t.deleted_at);
//     setFilteredTasks(filtered);
//   };

//   const handleTaskFormChange = (field: keyof typeof taskForm, value: any) => {
//     setTaskForm((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleAddTask = async () => {
//     const errors: string[] = [];
//     if (!taskForm.title) errors.push("Title is required");
//     if (!taskForm.project_id) errors.push("Project is required");
//     if (taskForm.assignees.length === 0)
//       errors.push("At least one assignee required");
//     if (errors.length > 0) {
//       setFormErrors(errors);
//       return;
//     }

//     const formData = new FormData();
//     Object.keys(taskForm).forEach((key) => {
//       const value = (taskForm as any)[key];
//       if (value !== null && value !== undefined) {
//         if (key === "assignees") {
//           value.forEach((id: string) => formData.append("assignees[]", id));
//         } else if (value instanceof File) {
//           formData.append("document", value);
//         } else if (key === "due_on" && value) {
//           formData.append("due_on", value + ":00");
//         } else {
//           formData.append(key, value);
//         }
//       }
//     });

//     try {
//       setIsLoading(true);
//       await axiosInstance.post("/tasks", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       toast.success("Task created!");
//       fetchTasks();
//       handleClearForm();
//     } catch (err: any) {
//       toast.error(err.response?.data?.error || "Failed to create task");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleClearForm = () => {
//     setTaskForm({
//       title: "",
//       description: "",
//       due_on: "",
//       assignees: [],
//       remark: "",
//       priority: "medium",
//       document: null,
//       created_by: user?.id || "",
//       project_id: lead?.interested_project_id?.toString() || "",
//     });
//     setFormErrors([]);
//   };

//   const handleSave = async () => {
//     if (!editedLead || !id) return;

//     const payload = {
//       name: editedLead.name,
//       email: editedLead.email,
//       phone: editedLead.phone,
//       status: editedLead.status,
//       budget: editedLead.budget,
//       timeline: editedLead.timeline,
//       requirements: editedLead.requirements,
//     };

//     try {
//       setIsLoading(true);
//       await axiosInstance.put(`/leads/${id}`, payload);
//       toast.success("Lead updated successfully!");
//       await fetchLead();
//       setIsEditing(false);
//     } catch (err: any) {
//       toast.error(err.response?.data?.error || "Failed to update lead");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleActivityUpdate = (newData: ActivityData) => {
//     setActivityData(newData);
//     if (editedLead) {
//       setEditedLead({ ...editedLead, notes: newData.notes });
//     }
//   };

//   const getStatusColor = (status: string) => {
//     const map: Record<string, string> = {
//       new: "bg-gray-100 text-gray-800",
//       qualified: "bg-blue-100 text-blue-800",
//       contacted: "bg-green-100 text-green-800",
//       pending: "bg-yellow-100 text-yellow-800",
//       working: "bg-purple-100 text-purple-800",
//       "proposal sent": "bg-orange-100 text-orange-800",
//       lost: "bg-red-100 text-red-800",
//     };
//     return map[status.toLowerCase()] || "bg-gray-100 text-gray-800";
//   };

//   const getPriorityColor = (priority: string) => {
//     const map: Record<string, string> = {
//       high: "bg-red-100 text-red-800",
//       medium: "bg-yellow-100 text-yellow-800",
//       low: "bg-green-100 text-green-800",
//     };
//     return map[priority] || "bg-gray-100 text-gray-800";
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-100">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gray-100 py-6">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <Card className="p-6 text-center">
//             <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
//             <h2 className="text-xl font-semibold text-gray-900 mb-2">
//               {error}
//             </h2>
//             <div className="flex justify-center gap-4">
//               <Button onClick={fetchLead} variant="outline">
//                 Retry
//               </Button>
//               <Button onClick={() => navigate("/leads")}>Back to Leads</Button>
//             </div>
//           </Card>
//         </div>
//       </div>
//     );
//   }

//   if (!lead || !editedLead) return null;

//   return (
//     <div className="min-h-screen bg-gray-100 py-6">
//       <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header */}
//         <div className="mb-8 rounded-lg p-6 shadow-lg bg-white">
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//             <div className="flex items-center gap-4">
//               <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
//                 <User className="h-6 w-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-3xl font-bold text-gray-900">
//                   {lead.name}
//                 </h1>
//                 <p className="text-sm text-gray-500">
//                   Lead ID: {lead.id} • Created: {formatDate(lead.createdAt)}
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-center gap-4">
//               <Badge
//                 className={getStatusColor(lead.status)}
//                 variant="secondary"
//               >
//                 {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
//               </Badge>
//               <Button variant="outline" onClick={() => navigate("/leads")}>
//                 <ArrowLeft className="h-4 w-4 mr-2" /> Back
//               </Button>
//             </div>
//           </div>
//         </div>

//         <Tabs defaultValue="details" className="space-y-6">
//           <TabsList className="grid w-full grid-cols-4">
//             <TabsTrigger value="details">Details</TabsTrigger>
//             <TabsTrigger value="activity">Activity</TabsTrigger>
//             <TabsTrigger value="task">Tasks</TabsTrigger>
//             <TabsTrigger value="units">Units</TabsTrigger>
//           </TabsList>

//           {/* Details Tab */}
//           <TabsContent value="details" className="space-y-6">
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Contact Info */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2">
//                     <Mail className="h-4 w-4" /> Contact
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div className="flex items-center gap-3">
//                     <Mail className="h-4 w-4 text-gray-500" />
//                     {isEditing ? (
//                       <Input
//                         value={editedLead.email}
//                         onChange={(e) =>
//                           setEditedLead({
//                             ...editedLead,
//                             email: e.target.value,
//                           })
//                         }
//                       />
//                     ) : (
//                       <span className="font-medium">{lead.email || "—"}</span>
//                     )}
//                   </div>
//                   <div className="flex items-center gap-3">
//                     <Phone className="h-4 w-4 text-gray-500" />
//                     {isEditing ? (
//                       <Input
//                         value={editedLead.phone}
//                         onChange={(e) =>
//                           setEditedLead({
//                             ...editedLead,
//                             phone: e.target.value,
//                           })
//                         }
//                       />
//                     ) : (
//                       <span className="font-medium">{lead.phone || "—"}</span>
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Lead Info */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Lead Info</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div>
//                     <strong>Type:</strong> {lead.type}
//                   </div>
//                   <div>
//                     <strong>Last Contact:</strong> {lead.lastContact}
//                   </div>
//                   {isEditing && (
//                     <div>
//                       <label className="text-sm font-medium">Status</label>
//                       <Select
//                         value={editedLead.status}
//                         onValueChange={(v) =>
//                           setEditedLead({ ...editedLead, status: v })
//                         }
//                       >
//                         <SelectTrigger>
//                           <SelectValue />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="new">New</SelectItem>
//                           <SelectItem value="contacted">Contacted</SelectItem>
//                           <SelectItem value="qualified">Qualified</SelectItem>
//                           <SelectItem value="working">Working</SelectItem>
//                           <SelectItem value="proposal sent">
//                             Proposal Sent
//                           </SelectItem>
//                           <SelectItem value="lost">Lost</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Requirements */}
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Wallet className="h-5 w-5" /> Requirements
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="grid md:grid-cols-3 gap-4">
//                   <div>
//                     <strong>Budget:</strong>
//                     {isEditing ? (
//                       <Input
//                         value={editedLead.budget}
//                         onChange={(e) =>
//                           setEditedLead({
//                             ...editedLead,
//                             budget: e.target.value,
//                           })
//                         }
//                       />
//                     ) : (
//                       <span> {lead.budget}</span>
//                     )}
//                   </div>
//                   <div>
//                     <strong>Timeline:</strong>
//                     {isEditing ? (
//                       <Input
//                         value={editedLead.timeline}
//                         onChange={(e) =>
//                           setEditedLead({
//                             ...editedLead,
//                             timeline: e.target.value,
//                           })
//                         }
//                       />
//                     ) : (
//                       <span> {lead.timeline}</span>
//                     )}
//                   </div>
//                   <div className="md:col-span-3">
//                     <strong>Requirements:</strong>
//                     {isEditing ? (
//                       <Textarea
//                         rows={3}
//                         value={editedLead.requirements}
//                         onChange={(e) =>
//                           setEditedLead({
//                             ...editedLead,
//                             requirements: e.target.value,
//                           })
//                         }
//                       />
//                     ) : (
//                       <p className="whitespace-pre-wrap">
//                         {lead.requirements || "None specified"}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//                 {lead.project_name && (
//                   <div className="mt-4">
//                     <strong>Project:</strong> {lead.project_name}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>

//             <div className="flex justify-end gap-2">
//               {isEditing ? (
//                 <>
//                   <Button onClick={handleSave}>
//                     <Save className="h-4 w-4 mr-2" /> Save
//                   </Button>
//                   <Button
//                     variant="outline"
//                     onClick={() => {
//                       setIsEditing(false);
//                       setEditedLead(lead);
//                     }}
//                   >
//                     <X className="h-4 w-4 mr-2" /> Cancel
//                   </Button>
//                 </>
//               ) : (
//                 <Button variant="outline" onClick={() => setIsEditing(true)}>
//                   <Edit className="h-4 w-4 mr-2" /> Edit
//                 </Button>
//               )}
//             </div>
//           </TabsContent>

//           {/* Activity Tab */}
//           <TabsContent value="activity">
//             <ActivityHistory
//               leadId={parseInt(lead.id)}
//               users={users}
//               projects={projects}
//               isEditing={isEditing}
//               setIsEditing={setIsEditing}
//               onSave={handleSave}
//               onActivityUpdate={handleActivityUpdate}
//             />
//           </TabsContent>

//           {/* Tasks Tab */}
//           <TabsContent value="task" className="space-y-4">
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Left: Task List */}
//               <Card>
//                 <CardHeader className="border-b">
//                   <div className="flex justify-between items-center">
//                     <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
//                     <Select
//                       value={taskFilter}
//                       onValueChange={handleTaskFilterChange}
//                       disabled={isLoading}
//                     >
//                       <SelectTrigger className="w-24">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="all">All</SelectItem>
//                         <SelectItem value="open">Open</SelectItem>
//                         <SelectItem value="closed">Closed</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="pt-6">
//                   {formErrors.length > 0 && (
//                     <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
//                       {formErrors.map((error, index) => (
//                         <p key={index} className="text-red-600 text-sm">
//                           {error}
//                         </p>
//                       ))}
//                     </div>
//                   )}

//                   {!lead.interested_project_id ? (
//                     <p className="text-sm text-gray-500">
//                       No project associated with this lead. Assign a project to
//                       manage tasks.
//                     </p>
//                   ) : isLoading ? (
//                     <p className="text-sm text-gray-500">Loading tasks...</p>
//                   ) : filteredTasks.length === 0 ? (
//                     <p className="text-sm text-gray-500">
//                       No tasks found. Create one on the right!
//                     </p>
//                   ) : (
//                     <div className="space-y-4">
//                       {filteredTasks.map((task) => (
//                         <Card key={task.id} className="p-4">
//                           <div className="flex justify-between items-start">
//                             <div className="flex-1">
//                               <h4 className="font-medium text-lg">
//                                 {task.title}
//                               </h4>
//                               {task.description && (
//                                 <p className="text-sm text-gray-600 mt-1">
//                                   {task.description}
//                                 </p>
//                               )}
//                               <div className="flex items-center gap-2 mt-2">
//                                 <Badge
//                                   className={getPriorityColor(task.priority)}
//                                 >
//                                   {task.priority.toUpperCase()}
//                                 </Badge>
//                                 {task.due_on && (
//                                   <span className="text-sm text-gray-500">
//                                     Due:{" "}
//                                     {new Date(task.due_on).toLocaleDateString()}
//                                   </span>
//                                 )}
//                               </div>
//                               {task.remark && (
//                                 <p className="text-sm text-gray-500 mt-1 italic">
//                                   Remark: {task.remark}
//                                 </p>
//                               )}
//                               {task.document && (
//                                 <p className="text-sm text-blue-600 mt-1">
//                                   📎 Document: {task.document.split("/").pop()}
//                                 </p>
//                               )}
//                               <p className="text-sm text-gray-500 mt-1">
//                                 Assignees:{" "}
//                                 {task.assignees
//                                   .map(
//                                     (assigneeId) =>
//                                       users.find((u) => u.id === assigneeId)
//                                         ?.name,
//                                   )
//                                   .filter(Boolean)
//                                   .join(", ") || "None"}
//                               </p>
//                               <p className="text-sm text-gray-500">
//                                 Created by:{" "}
//                                 {users.find((u) => u.id === task.created_by)
//                                   ?.name || "Unknown"}
//                               </p>
//                             </div>
//                             <div className="text-right text-sm text-gray-500 ml-4">
//                               <div>
//                                 Created:{" "}
//                                 {new Date(task.created_at).toLocaleDateString()}
//                               </div>
//                               {task.deleted_at && (
//                                 <div className="text-green-600">
//                                   Closed:{" "}
//                                   {new Date(
//                                     task.deleted_at,
//                                   ).toLocaleDateString()}
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         </Card>
//                       ))}
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>

//               {/* Right: Task Form */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Add New Task</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4 p-6">
//                   {!lead.interested_project_id ? (
//                     <p className="text-sm text-gray-500">
//                       No project associated with this lead. Assign a project to
//                       create tasks.
//                     </p>
//                   ) : (
//                     <>
//                       <div>
//                         <label className="text-sm font-medium">Title *</label>
//                         <Input
//                           ref={titleInputRef}
//                           value={taskForm.title}
//                           onChange={(e) =>
//                             handleTaskFormChange("title", e.target.value)
//                           }
//                           placeholder="Enter task title"
//                           className="mt-1"
//                           disabled={isLoading}
//                         />
//                       </div>

//                       <div>
//                         <label className="text-sm font-medium">
//                           Description
//                         </label>
//                         <Textarea
//                           value={taskForm.description}
//                           onChange={(e) =>
//                             handleTaskFormChange("description", e.target.value)
//                           }
//                           placeholder="Enter task description"
//                           className="mt-1"
//                           rows={3}
//                           disabled={isLoading}
//                         />
//                       </div>

//                       <div className="grid grid-cols-2 gap-4">
//                         <div>
//                           <label className="text-sm font-medium">
//                             Due Date
//                           </label>
//                           <Input
//                             type="datetime-local"
//                             value={taskForm.due_on}
//                             onChange={(e) =>
//                               handleTaskFormChange("due_on", e.target.value)
//                             }
//                             className="mt-1"
//                             disabled={isLoading}
//                           />
//                         </div>
//                         <div>
//                           <label className="text-sm font-medium">
//                             Priority
//                           </label>
//                           <Select
//                             value={taskForm.priority}
//                             onValueChange={(value) =>
//                               handleTaskFormChange(
//                                 "priority",
//                                 value as "low" | "medium" | "high",
//                               )
//                             }
//                             disabled={isLoading}
//                           >
//                             <SelectTrigger className="mt-1">
//                               <SelectValue />
//                             </SelectTrigger>
//                             <SelectContent>
//                               <SelectItem value="low">Low</SelectItem>
//                               <SelectItem value="medium">Medium</SelectItem>
//                               <SelectItem value="high">High</SelectItem>
//                             </SelectContent>
//                           </Select>
//                         </div>
//                       </div>

//                       <div>
//                         <label className="text-sm font-medium">
//                           Assignees *
//                         </label>
//                         <MultiSelectAssignees
//                           users={users}
//                           selected={taskForm.assignees}
//                           onChange={(vals) =>
//                             handleTaskFormChange("assignees", vals)
//                           }
//                           disabled={isLoading}
//                         />
//                       </div>

//                       <div>
//                         <label className="text-sm font-medium">Project</label>
//                         <SingleSelectProject
//                           projects={projects}
//                           selected={taskForm.project_id}
//                           onChange={(val) =>
//                             handleTaskFormChange("project_id", val)
//                           }
//                           disabled={isLoading}
//                         />
//                       </div>

//                       <div className="grid grid-cols-2 gap-4">
//                         <div>
//                           <label className="text-sm font-medium">Remark</label>
//                           <Textarea
//                             value={taskForm.remark}
//                             onChange={(e) =>
//                               handleTaskFormChange("remark", e.target.value)
//                             }
//                             placeholder="Enter any remarks"
//                             className="mt-1"
//                             rows={2}
//                             disabled={isLoading}
//                           />
//                         </div>
//                         <div>
//                           <label className="text-sm font-medium">
//                             Document
//                           </label>
//                           <Input
//                             type="file"
//                             accept=".pdf,.jpg,.png"
//                             onChange={(e) =>
//                               handleTaskFormChange(
//                                 "document",
//                                 e.target.files?.[0] || null,
//                               )
//                             }
//                             className="mt-1"
//                             disabled={isLoading}
//                           />
//                         </div>
//                       </div>

//                       <div className="flex gap-2 pt-4">
//                         <Button onClick={handleAddTask} disabled={isLoading}>
//                           {isLoading ? "Saving..." : "Create Task"}
//                         </Button>
//                         <Button
//                           variant="outline"
//                           onClick={handleClearForm}
//                           disabled={isLoading}
//                         >
//                           Clear Form
//                         </Button>
//                       </div>
//                     </>
//                   )}
//                 </CardContent>
//               </Card>
//             </div>
//           </TabsContent>

//           {/* ── NEW UNITS TAB ───────────────────────────────────────────────────── */}
//           <TabsContent value="units" className="space-y-6">
//             {!lead?.interested_project_id ? (
//               <Card className="p-10 text-center border-dashed">
//                 <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
//                 <h3 className="text-xl font-medium mb-3">
//                   No Project Assigned to this Lead
//                 </h3>
//                 <p className="text-muted-foreground mb-6 max-w-md mx-auto">
//                   To view towers, blocks and available units, please assign a
//                   project to this lead.
//                 </p>
//                 {isEditing && (
//                   <Button
//                     onClick={() => {
//                       toast.info(
//                         "Project selection will be available in edit mode (to be implemented)",
//                       );
//                     }}
//                   >
//                     Assign Project Now
//                   </Button>
//                 )}
//               </Card>
//             ) : (
//               <div className="grid lg:grid-cols-12 gap-6">
//                 {/* Left - Hierarchy Nodes (Towers / Blocks / Sectors) */}
//                 <div className="lg:col-span-4">
//                   <Card className="h-full">
//                     <CardHeader className="border-b">
//                       <CardTitle className="flex items-center gap-2">
//                         <Building2 className="h-5 w-5" />
//                         Towers / Blocks
//                       </CardTitle>
//                     </CardHeader>
//                     <CardContent className="pt-5 max-h-[65vh] overflow-y-auto">
//                       {hierarchyNodes.length === 0 ? (
//                         <div className="text-center py-12 text-muted-foreground">
//                           <Building2 className="mx-auto h-10 w-10 mb-3 opacity-60" />
//                           <p className="font-medium">No hierarchy found</p>
//                           <p className="text-sm mt-2">
//                             Create towers/blocks in Project Setup
//                           </p>
//                         </div>
//                       ) : (
//                         <div className="space-y-2">
//                           {hierarchyNodes.map((node) => (
//                             <button
//                               key={node.id}
//                               onClick={() => setSelectedNodeId(node.id)}
//                               className={`w-full text-left p-4 rounded-lg border transition-all ${
//                                 selectedNodeId === node.id
//                                   ? "border-primary bg-primary/5 shadow-sm font-medium"
//                                   : "border-border hover:bg-muted/60"
//                               }`}
//                             >
//                               <div className="flex items-center justify-between">
//                                 <div>
//                                   <div className="font-medium">{node.name}</div>
//                                   {node.type_code && (
//                                     <Badge
//                                       variant="outline"
//                                       className="mt-1.5 text-xs"
//                                     >
//                                       {node.type_code}
//                                     </Badge>
//                                   )}
//                                 </div>
//                                 <span className="text-primary text-sm">→</span>
//                               </div>
//                             </button>
//                           ))}
//                         </div>
//                       )}
//                     </CardContent>
//                   </Card>
//                 </div>

//                 {/* Right - Units List */}
//                 <div className="lg:col-span-8">
//                   <Card className="h-full">
//                     <CardHeader className="border-b">
//                       <CardTitle className="flex items-center justify-between gap-4">
//                         <div className="flex items-center gap-2">
//                           <Home className="h-5 w-5" />
//                           {selectedNodeId
//                             ? `Units in ${
//                                 hierarchyNodes.find(
//                                   (n) => n.id === selectedNodeId,
//                                 )?.name || "Selected Section"
//                               }`
//                             : "Select a tower/block to view units"}
//                         </div>

//                         {selectedNodeId && (
//                           <Button variant="outline" size="sm">
//                             <Plus className="h-4 w-4 mr-2" />
//                             Add Unit
//                           </Button>
//                         )}
//                       </CardTitle>
//                     </CardHeader>

//                     <CardContent className="pt-6">
//                       {!selectedNodeId ? (
//                         <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
//                           <Home className="h-16 w-16 mb-4 opacity-40" />
//                           <p className="text-lg font-medium">
//                             Select a section from the left
//                           </p>
//                           <p className="text-sm mt-2">
//                             to see available units / flats / shops
//                           </p>
//                         </div>
//                       ) : loadingUnits ? (
//                         <div className="flex justify-center items-center py-20">
//                           <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
//                         </div>
//                       ) : units.length === 0 ? (
//                         <div className="text-center py-16 text-muted-foreground">
//                           <Home className="mx-auto h-12 w-12 mb-4 opacity-50" />
//                           <p className="text-lg font-medium">
//                             No units found in this section
//                           </p>
//                           <p className="text-sm mt-2">
//                             Click "Add Unit" to create new inventory
//                           </p>
//                         </div>
//                       ) : (
//                         <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
//                           {units.map((unit) => (
//                             <Card
//                               key={unit.id}
//                               className="hover:shadow-md transition-all duration-200 hover:border-primary/40 group"
//                             >
//                               <CardContent className="p-5">
//                                 <div className="flex justify-between items-start mb-3">
//                                   <h4 className="font-semibold text-xl tracking-tight">
//                                     {unit.unit_number}
//                                   </h4>
//                                   <Badge
//                                     variant={
//                                       unit.status === "available"
//                                         ? "default"
//                                         : unit.status === "booked"
//                                           ? "secondary"
//                                           : unit.status === "sold"
//                                             ? "destructive"
//                                             : "outline"
//                                     }
//                                     className="capitalize"
//                                   >
//                                     {unit.status}
//                                   </Badge>
//                                 </div>

//                                 <div className="space-y-2 text-sm">
//                                   {unit.carpet_area_sqft && (
//                                     <p>
//                                       Carpet:{" "}
//                                       <span className="font-medium">
//                                         {unit.carpet_area_sqft} sq.ft
//                                       </span>
//                                     </p>
//                                   )}
//                                   {unit.super_area_sqft && (
//                                     <p>
//                                       Super Built-up:{" "}
//                                       <span className="font-medium">
//                                         {unit.super_area_sqft} sq.ft
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  getLeadsReturnTo,
  rememberLeadsReturnTo,
  LEADS_LIST_PATH,
} from "@/utils/leadsPagination";
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
import {
  User,
  Mail,
  Phone,
  Wallet,
  Edit,
  Save,
  X,
  Check,
  ChevronsUpDown,
  ArrowLeft,
  AlertCircle,
  Building2,
  Home,
  Plus,
  Calendar,
  MapPin,
  Tag,
  CircleUser,
  Clock,
  Briefcase,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import { useAuth } from "@/contexts/AuthContext";
import ActivityHistory from "../crm/ActivityHistory";
import LeadTasksPanel from "../tasks/LeadTasksPanel";
import { formatPascalCaseDisplayName } from "@/utils/formatDisplayName";
import { cn } from "@/lib/utils";

// Helper: Safe date formatting
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "Unknown";
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? "Invalid Date"
      : date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  } catch {
    return "Unknown";
  }
};

// ── Interfaces ────────────────────────────────────────────────────────────────
interface LocalLead {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  lead_type: string;
  address: string | null;
  property_type: string | null;
  budget: string | null;
  message: string | null;
  status: string;
  interested_project_id: number | null;
  project_name: string | null;
  created_at: string | null;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  interest_level?: string | null;
}

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
  address?: string | null;
  property_type?: string | null;
  message?: string | null;
  project_name?: string | null;
  assigned_to?: string | null;
  interest_level?: string | null;
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

// ── Units tab interfaces ─────────────────────────────────────────────────────
interface HierarchyNode {
  id: string;
  name: string;
  type_code?: string;
  parent_id: string | null;
}

interface Unit {
  id: string;
  unit_number: string;
  status: "available" | "booked" | "sold" | "blocked" | "reserved";
  carpet_area_sqft?: number;
  super_area_sqft?: number;
  facing?: string;
  price?: number;
  lead_id?: string | null;
  nodeId?: string;
}

// ── Main Lead Details Page ───────────────────────────────────────────────────
const LeadDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const goBackToLeads = useCallback(() => {
    navigate(getLeadsReturnTo(LEADS_LIST_PATH));
  }, [navigate]);

  useEffect(() => {
    const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;
    if (returnTo) rememberLeadsReturnTo(returnTo);
  }, [location.state]);
  
  const { user, isAuthenticated, token } = useAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedLead, setEditedLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [leadTypes, setLeadTypes] = useState<any[]>([]);

  const fetchLeadTypes = async () => {
    try {
      const response = await axiosInstance.get("/leadtype");
      setLeadTypes(
        Array.isArray(response.data.data) ? response.data.data : (response.data || [])
      );
    } catch (err: any) {
      console.error("Failed to load lead types", err);
    }
  };
  const [activityData, setActivityData] = useState<ActivityData>({
    notes: "",
    documents: [],
  });

  // ── Units tab local state ──────────────────────────────────────────────────
  const [hierarchyNodes, setHierarchyNodes] = useState<HierarchyNode[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // ── Fetch Lead ─────────────────────────────────────────────────────────────
  const fetchLead = async () => {
    if (!id || !isAuthenticated || !token) {
      setError("Invalid lead ID or authentication.");
      goBackToLeads();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get(`/leads/${id}`);
      const foundLead: LocalLead = response.data.data;

      const mappedLead: Lead = {
        id: foundLead.id.toString(),
        name: foundLead.name || "Unknown",
        email: foundLead.email || "",
        phone: foundLead.phone || "",
        status: foundLead.status || "new",
        type: foundLead.lead_type || "unknown",
        leadSource: foundLead.lead_type || "unknown",
        leadScore: 60,
        budget: foundLead.budget || "",
        timeline: "3-6 months",
        assignedAgent: foundLead.assigned_to_name || null,
        lastContact: foundLead.created_at?.split("T")[0] ?? "Unknown",
        createdAt: foundLead.created_at ?? "Unknown",
        requirements: foundLead.message || "",
        notes: "",
        interested_project_id: foundLead.interested_project_id,
        address: foundLead.address,
        property_type: foundLead.property_type,
        message: foundLead.message,
        project_name: foundLead.project_name,
        assigned_to: foundLead.assigned_to?.toString() || null,
        interest_level: (() => {
          let level = (foundLead.interest_level || "").toLowerCase().trim();
          if (level === "medium") return "warm";
          if (level === "high") return "hot";
          if (level === "low") return "cold";
          return level || null;
        })(),
      };

      setLead(mappedLead);
      setEditedLead(mappedLead);
    } catch (error: any) {
      console.error("Error fetching lead:", error);
      const msg = error.response?.data?.error || error.message;
      setError(`Error fetching lead: ${msg}`);
      if (error.response?.status === 404 || error.response?.status === 403) {
        goBackToLeads();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/users");
      setUsers(
        Array.isArray(response.data.data) ? response.data.data : response.data,
      );
    } catch (err: any) {
      console.error("Failed to load users", err);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axiosInstance.get("/projects");
      setProjects(
        Array.isArray(response.data.data) ? response.data.data : response.data,
      );
    } catch (err: any) {
      console.error("Failed to load projects", err);
    }
  };

  // ── LocalStorage loading for hierarchy ─────────────────────────────────────
  const loadHierarchyNodes = () => {
    if (!lead?.interested_project_id) {
      setHierarchyNodes([]);
      return;
    }

    const projectIdStr = lead.interested_project_id.toString();
    const STORAGE_KEY = `hierarchy_${projectIdStr}`;
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHierarchyNodes(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        console.error("Invalid hierarchy data in localStorage", err);
        setHierarchyNodes([]);
      }
    } else {
      setHierarchyNodes([]);
    }
  };

  // ── LocalStorage loading for units ─────────────────────────────────────────
  const loadUnitsForNode = (nodeId: string) => {
    if (!lead?.interested_project_id) return;

    const projectIdStr = lead.interested_project_id.toString();
    const STORAGE_KEY = `units_${projectIdStr}_${nodeId}`;
    const saved = localStorage.getItem(STORAGE_KEY);

    setLoadingUnits(true);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUnits(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        console.error("Invalid units data in localStorage", err);
        setUnits([]);
      }
    } else {
      setUnits([]);
    }

    setLoadingUnits(false);
  };

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([fetchLead(), fetchUsers(), fetchProjects(), fetchLeadTypes()]);
  }, [id, isAuthenticated, token]);

  useEffect(() => {
    if (lead?.interested_project_id) {
      loadHierarchyNodes();
    } else {
      setHierarchyNodes([]);
    }
  }, [lead?.interested_project_id]);

  useEffect(() => {
    if (selectedNodeId) {
      loadUnitsForNode(selectedNodeId);
    } else {
      setUnits([]);
    }
  }, [selectedNodeId]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!id || !lead) return;
    try {
      setIsLoading(true);
      await axiosInstance.put(`/leads/${id}`, { status: newStatus });
      toast.success(`Status updated to ${formatPascalCaseDisplayName(newStatus)}`);
      await fetchLead();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedLead || !id) return;

    const payload = {
      name: editedLead.name,
      email: editedLead.email,
      phone: editedLead.phone,
      status: editedLead.status,
      budget: editedLead.budget,
      timeline: editedLead.timeline,
      requirements: editedLead.requirements,
      message: editedLead.message || editedLead.requirements,
      address: editedLead.address,
      property_type: editedLead.property_type,
      interest_level: editedLead.interest_level === "none" ? null : editedLead.interest_level,
      interested_project_id: editedLead.interested_project_id === 0 ? null : editedLead.interested_project_id,
      assigned_to: editedLead.assigned_to === "none" ? null : editedLead.assigned_to,
      lead_type: editedLead.type,
    };

    try {
      setIsLoading(true);
      await axiosInstance.put(`/leads/${id}`, payload);
      toast.success("Lead details updated successfully");
      await fetchLead();
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update lead");
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivityUpdate = (newData: ActivityData) => {
    setActivityData(newData);
    if (editedLead) {
      setEditedLead({ ...editedLead, notes: newData.notes });
    }
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      new: "bg-blue-50 text-blue-700 border-blue-200/80",
      qualified: "bg-teal-50 text-teal-700 border-teal-200/80",
      contacted: "bg-emerald-50 text-emerald-700 border-emerald-250/80",
      pending: "bg-amber-50 text-amber-700 border-amber-250/80",
      working: "bg-violet-50 text-violet-750 border-violet-200/80",
      "proposal sent": "bg-orange-50 text-orange-750 border-orange-250/80",
      lost: "bg-rose-50 text-rose-700 border-rose-250/80",
    };
    return map[status.toLowerCase()] || "bg-slate-50 text-slate-700 border-slate-300";
  };

  const getInterestColor = (level: string | null | undefined) => {
    const map: Record<string, string> = {
      hot: "bg-rose-50 text-rose-700 border-rose-200",
      warm: "bg-orange-50 text-orange-750 border-orange-200",
      cold: "bg-sky-50 text-sky-700 border-sky-200",
    };
    return map[(level || "").toLowerCase()] || "bg-slate-50 text-slate-500 border-slate-200";
  };

  const getInitials = (name: string) => {
    if (!name) return "LD";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
    }
    return name.trim().slice(0, 2).toUpperCase();
  };

  if (isLoading && !lead) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-[var(--theme-color)] border-r-2 border-r-transparent"></div>
          <span className="text-xs font-semibold text-slate-500">Loading Lead Details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-12 px-4">
        <Card className="border border-red-100 shadow-md">
          <CardHeader className="text-center pb-2">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <CardTitle className="text-xl text-slate-900">Lead Load Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4 pt-2">
            <p className="text-sm text-slate-500">{error}</p>
            <div className="flex justify-center gap-3 pt-2">
              <Button onClick={fetchLead} variant="outline" className="border-slate-200 text-slate-700">
                Retry
              </Button>
              <Button onClick={goBackToLeads} className="bg-[var(--theme-color)] hover:bg-[var(--theme-color-hover)]">
                Back to Leads
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!lead || !editedLead) return null;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <button
          onClick={goBackToLeads}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Leads
        </button>
        <span className="text-xs text-slate-400 font-medium select-none">
          Lead ID: <span className="text-slate-700 font-bold">{lead.id}</span>
        </span>
      </div>

      {/* Status Pipeline Tracker */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-[13px] font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-widest">Lead Status Pipeline</h3>
            <p className="text-[11px] text-slate-400">Track and update the lead stage in the sales lifecycle.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Active:</span>
            <Badge className={cn("text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-none", getStatusColor(lead.status))}>
              {formatPascalCaseDisplayName(lead.status)}
            </Badge>
          </div>
        </div>

        {/* Pipeline Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(() => {
            const stages = [
              { key: "new", label: "New", color: "from-blue-500 to-blue-400", activeBg: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200" },
              { key: "contacted", label: "Contacted", color: "from-emerald-500 to-emerald-400", activeBg: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-255" },
              { key: "qualified", label: "Qualified", color: "from-teal-500 to-teal-400", activeBg: "bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border-teal-200" },
              { key: "working", label: "Working", color: "from-violet-500 to-violet-400", activeBg: "bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 border-violet-200" },
              { key: "proposal sent", label: "Proposal Sent", color: "from-orange-500 to-orange-400", activeBg: "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-255" },
              { key: "lost", label: "Lost", color: "from-rose-500 to-rose-400", activeBg: "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-250" },
            ];

            const currentIdx = stages.findIndex(s => s.key === lead.status.toLowerCase());

            return stages.map((stage, idx) => {
              const isCurrent = stage.key === lead.status.toLowerCase();
              const isCompleted = idx < currentIdx;

              return (
                <button
                  key={stage.key}
                  onClick={() => handleStatusUpdate(stage.key)}
                  disabled={isLoading || isCurrent}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-300 group select-none h-18",
                    isCurrent 
                      ? cn("border-2 shadow-sm font-extrabold scale-[1.01]", stage.activeBg)
                      : isCompleted
                      ? "bg-slate-50/50 dark:bg-slate-800/35 border-slate-200 dark:border-slate-800 text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer font-bold"
                      : "bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800/60 text-slate-400 hover:border-slate-250 cursor-pointer hover:bg-slate-50/20"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] mb-1 font-black transition-all",
                    isCurrent 
                      ? "bg-gradient-to-tr " + stage.color + " text-white scale-110 shadow-sm"
                      : isCompleted
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  )}>
                    {isCompleted ? <Check className="w-3 h-3" /> : (idx + 1)}
                  </div>

                  <span className="text-[11px] font-semibold tracking-wide truncate max-w-full">
                    {stage.label}
                  </span>
                  
                  <div className={cn(
                    "absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl transition-all duration-350 scale-x-0 group-hover:scale-x-100",
                    !isCurrent && (isCompleted ? "bg-emerald-400" : "bg-slate-300")
                  )} />
                </button>
              );
            });
          })()}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Summary Panel (Col Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border border-slate-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden rounded-2xl">
            {/* Gradient Highlight Accent */}
            <div className="h-1.5 bg-gradient-to-r from-[var(--theme-color)] via-[#ff6a4a] to-amber-400 w-full" />
            
            <CardContent className="pt-8 px-6 pb-6 flex flex-col items-center">
              {/* Profile Avatar */}
              <div className="relative group select-none">
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-md border-4 border-white transition-transform duration-300 group-hover:scale-105",
                  lead.interest_level === "hot" 
                    ? "bg-gradient-to-tr from-rose-500 to-red-400 shadow-rose-200 animate-[pulse_3s_infinite]" 
                    : lead.interest_level === "warm"
                    ? "bg-gradient-to-tr from-orange-500 to-amber-400 shadow-orange-100"
                    : "bg-gradient-to-tr from-sky-500 to-blue-400 shadow-sky-100"
                )}>
                  {getInitials(lead.name)}
                </div>
              </div>

              <h2 className="text-xl font-extrabold text-slate-900 mt-4 text-center tracking-tight truncate max-w-full" title={lead.name}>
                {lead.name}
              </h2>
              
              {/* Badges row */}
              <div className="flex flex-wrap gap-1.5 justify-center mt-2.5">
                <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-none", getStatusColor(lead.status))}>
                  {formatPascalCaseDisplayName(lead.status)}
                </Badge>
                {lead.interest_level && (
                  <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-none", getInterestColor(lead.interest_level))}>
                    {lead.interest_level} Interest
                  </Badge>
                )}
              </div>

              {/* Call/Email Quick Actions */}
              <div className="flex gap-2 w-full mt-6">
                <Button asChild variant="outline" className="flex-1 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg h-9">
                  <a href={`tel:${lead.phone}`}>
                    <Phone className="h-3.5 w-3.5 mr-2 text-[var(--theme-color)]" /> Call Lead
                  </a>
                </Button>
                <Button asChild variant="outline" className="flex-1 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg h-9">
                  <a href={`mailto:${lead.email}`}>
                    <Mail className="h-3.5 w-3.5 mr-2 text-[var(--theme-color)]" /> Email Lead
                  </a>
                </Button>
              </div>

              {/* Quick Details List */}
              <div className="w-full border-t border-slate-100 mt-6 pt-5 space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Email Address</span>
                    <span className="block text-xs font-semibold text-slate-700 truncate" title={lead.email || "N/A"}>
                      {lead.email || "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Phone Number</span>
                    <span className="block text-xs font-semibold text-slate-700">
                      {lead.phone || "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Tag className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Lead Source</span>
                    <span className="block text-xs font-semibold text-slate-700 capitalize">
                      {formatPascalCaseDisplayName(lead.type || "unknown")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Assigned Agent</span>
                    <span className="block text-xs font-semibold text-slate-700">
                      {lead.assignedAgent || "Unassigned"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Calendar className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Inquiry Date</span>
                    <span className="block text-xs font-semibold text-slate-700">
                      {formatDate(lead.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Tabular Content (Col Span 8) */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="details" className="w-full space-y-6" onValueChange={() => setIsEditing(false)}>
            <TabsList className="grid grid-cols-4 bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 rounded-xl h-11 shadow-sm">
              <TabsTrigger value="details" className="text-xs font-bold rounded-lg transition-all py-2 data-[state=active]:bg-[var(--theme-color)] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800">Details & Specs</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs font-bold rounded-lg transition-all py-2 data-[state=active]:bg-[var(--theme-color)] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800">Activity History</TabsTrigger>
              <TabsTrigger value="task" className="text-xs font-bold rounded-lg transition-all py-2 data-[state=active]:bg-[var(--theme-color)] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800">Tasks List</TabsTrigger>
              <TabsTrigger value="units" className="text-xs font-bold rounded-lg transition-all py-2 data-[state=active]:bg-[var(--theme-color)] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800">Inventory Match</TabsTrigger>
            </TabsList>

            {/* DETAILS TAB */}
            <TabsContent value="details" className="focus:outline-none">
              <Card className="border border-slate-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)] rounded-2xl overflow-hidden p-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Lead Specifications</h3>
                    <p className="text-xs text-slate-500">Edit or review lead details, requirements, and assignments.</p>
                  </div>
                  {!isEditing && (
                    <Button
                      onClick={() => {
                        setEditedLead({ ...lead });
                        setIsEditing(true);
                      }}
                      className="bg-[var(--theme-color)] hover:bg-[var(--theme-color-hover)] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow h-9 px-4 flex items-center gap-2"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit Specifications
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  /* EDIT MODE FORM */
                  <div className="space-y-6">
                    {/* Section 1: Contact Details */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Contact Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-650">Lead Name *</label>
                          <Input
                            value={editedLead.name}
                            onChange={(e) => setEditedLead({ ...editedLead, name: e.target.value })}
                            className="h-9.5 text-sm rounded-lg border-slate-200 focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]/50"
                            placeholder="Enter full name"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-650">Phone Number *</label>
                          <Input
                            value={editedLead.phone}
                            onChange={(e) => setEditedLead({ ...editedLead, phone: e.target.value })}
                            className="h-9.5 text-sm rounded-lg border-slate-200 focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]/50"
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-650">Email Address *</label>
                          <Input
                            value={editedLead.email}
                            onChange={(e) => setEditedLead({ ...editedLead, email: e.target.value })}
                            className="h-9.5 text-sm rounded-lg border-slate-200 focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]/50"
                            placeholder="Enter email address"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-650">Address / City</label>
                          <Input
                            value={editedLead.address || ""}
                            onChange={(e) => setEditedLead({ ...editedLead, address: e.target.value })}
                            className="h-9.5 text-sm rounded-lg border-slate-200 focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]/50"
                            placeholder="Enter city or address"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Sales Spec Parameters */}
                    <div className="border-t border-slate-100 pt-5">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Pipeline Parameters</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-650">Pipeline Status</label>
                          <Select
                            value={editedLead.status}
                            onValueChange={(val) => setEditedLead({ ...editedLead, status: val })}
                          >
                            <SelectTrigger className="h-9.5 text-sm rounded-lg border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="qualified">Qualified</SelectItem>
                              <SelectItem value="working">Working</SelectItem>
                              <SelectItem value="proposal sent">Proposal Sent</SelectItem>
                              <SelectItem value="lost">Lost</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-650">Interest Level</label>
                          <Select
                            value={editedLead.interest_level || "none"}
                            onValueChange={(val) => setEditedLead({ ...editedLead, interest_level: val === "none" ? null : val })}
                          >
                            <SelectTrigger className="h-9.5 text-sm rounded-lg border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="hot">Hot</SelectItem>
                              <SelectItem value="warm">Warm</SelectItem>
                              <SelectItem value="cold">Cold</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-650">Lead Source / Type</label>
                          <Select
                            value={editedLead.type || "unknown"}
                            onValueChange={(val) => setEditedLead({ ...editedLead, type: val })}
                          >
                            <SelectTrigger className="h-9.5 text-sm rounded-lg border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {leadTypes.map((lt: any) => (
                                <SelectItem key={lt.id} value={lt.name}>
                                  {formatPascalCaseDisplayName(lt.name)}
                                </SelectItem>
                              ))}
                              <SelectItem value="unknown">Unknown</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-650">Assigned Agent</label>
                          <Select
                            value={editedLead.assigned_to || "none"}
                            onValueChange={(val) => setEditedLead({ ...editedLead, assigned_to: val })}
                          >
                            <SelectTrigger className="h-9.5 text-sm rounded-lg border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Unassigned</SelectItem>
                              {users.map((u) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Requirements */}
                    <div className="border-t border-slate-100 pt-5">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Requirements & Budget</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-650">Target Budget</label>
                          <Input
                            value={editedLead.budget || ""}
                            onChange={(e) => setEditedLead({ ...editedLead, budget: e.target.value })}
                            className="h-9.5 text-sm rounded-lg border-slate-200 focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]/50"
                            placeholder="Enter budget (e.g. 50 Lacs)"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-650">Property Type</label>
                          <Input
                            value={editedLead.property_type || ""}
                            onChange={(e) => setEditedLead({ ...editedLead, property_type: e.target.value })}
                            className="h-9.5 text-sm rounded-lg border-slate-200 focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]/50"
                            placeholder="Enter property type (e.g. 3 BHK Apartment)"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-650">Interested Project</label>
                          <Select
                            value={editedLead.interested_project_id?.toString() || "none"}
                            onValueChange={(val) => setEditedLead({ ...editedLead, interested_project_id: val === "none" ? null : parseInt(val) })}
                          >
                            <SelectTrigger className="h-9.5 text-sm rounded-lg border-slate-200">
                              <SelectValue placeholder="Select associated project" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None / Unassigned</SelectItem>
                              {projects.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-650">Timeline</label>
                          <Input
                            value={editedLead.timeline || ""}
                            onChange={(e) => setEditedLead({ ...editedLead, timeline: e.target.value })}
                            className="h-9.5 text-sm rounded-lg border-slate-200 focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]/50"
                            placeholder="e.g. 3 months"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label className="text-xs font-bold text-slate-650">Requirements / Message Note</label>
                          <Textarea
                            value={editedLead.requirements || ""}
                            onChange={(e) => setEditedLead({ ...editedLead, requirements: e.target.value })}
                            className="text-sm rounded-lg border-slate-200 focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]/50"
                            rows={3}
                            placeholder="Describe lead specifications or notes..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Form Action Controls */}
                    <div className="flex gap-2 justify-end border-t border-slate-100 pt-5 mt-6">
                      <Button
                        onClick={handleSave}
                        className="bg-[var(--theme-color)] hover:bg-[var(--theme-color-hover)] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow h-9 px-4 flex items-center gap-1.5"
                      >
                        <Save className="h-3.5 w-3.5" /> Save Specifications
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditedLead({ ...lead });
                        }}
                        className="border-slate-200 text-slate-700 text-xs font-bold rounded-lg h-9 px-4"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* READ-ONLY SPEC VIEW */
                  <div className="space-y-6">
                    {/* Grid Info Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      
                      {/* Left Block: Basic & Contact */}
                      <div className="bg-slate-50/30 border border-slate-100 rounded-xl p-5 space-y-4">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Contact Specs</h4>
                        
                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-xs text-slate-400 font-bold col-span-1">Name:</span>
                          <span className="text-xs font-bold text-slate-800 col-span-2">{lead.name}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-xs text-slate-400 font-bold col-span-1">Phone:</span>
                          <span className="text-xs font-slate-700 font-semibold col-span-2">{lead.phone || "—"}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-xs text-slate-400 font-bold col-span-1">Email:</span>
                          <span className="text-xs font-slate-700 font-semibold col-span-2 break-all">{lead.email || "—"}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-xs text-slate-400 font-bold col-span-1">Address:</span>
                          <span className="text-xs font-slate-700 font-semibold col-span-2">{lead.address || "—"}</span>
                        </div>
                      </div>

                      {/* Right Block: Project & Lead Parameters */}
                      <div className="bg-slate-50/30 border border-slate-100 rounded-xl p-5 space-y-4">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Sales Specs</h4>

                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-xs text-slate-400 font-bold col-span-1">Status:</span>
                          <span className="col-span-2">
                            <Badge variant="outline" className={cn("text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow-none", getStatusColor(lead.status))}>
                              {formatPascalCaseDisplayName(lead.status)}
                            </Badge>
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-xs text-slate-400 font-bold col-span-1">Interest Level:</span>
                          <span className="col-span-2">
                            <Badge variant="outline" className={cn("text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow-none", getInterestColor(lead.interest_level))}>
                              {lead.interest_level || "—"}
                            </Badge>
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-xs text-slate-400 font-bold col-span-1">Source:</span>
                          <span className="text-xs font-semibold text-slate-700 col-span-2 capitalize">{formatPascalCaseDisplayName(lead.type || "unknown")}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-xs text-slate-400 font-bold col-span-1">Assigned Agent:</span>
                          <span className="text-xs font-bold text-slate-700 col-span-2">{lead.assignedAgent || "Unassigned"}</span>
                        </div>
                      </div>

                      {/* Span Column: Requirements & Property */}
                      <div className="md:col-span-2 bg-slate-50/30 border border-slate-100 rounded-xl p-5 space-y-4">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Lead Requirements</h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Budget Target</span>
                            <span className="block text-sm font-black text-slate-800">{lead.budget && lead.budget !== "N/A" ? lead.budget : "—"}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Property Interest</span>
                            <span className="block text-sm font-bold text-slate-750">{lead.property_type || "—"}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Timeline Target</span>
                            <span className="block text-sm font-semibold text-slate-700">{lead.timeline || "—"}</span>
                          </div>
                        </div>

                        {lead.project_name && (
                          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-bold">Associated Project:</span>
                            <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-750 border border-violet-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                              <Building2 className="h-3 w-3" /> {lead.project_name}
                            </span>
                          </div>
                        )}

                        <div className="pt-3 border-t border-slate-100 space-y-1">
                          <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Requirements Description</span>
                          <p className="text-xs text-slate-650 leading-relaxed bg-white/60 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                            {lead.requirements || "No specifications detailed."}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* ACTIVITY HISTOY TAB */}
            <TabsContent value="activity">
              <ActivityHistory
                leadId={parseInt(lead.id)}
                users={users}
                projects={projects}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                onSave={handleSave}
                onActivityUpdate={handleActivityUpdate}
              />
            </TabsContent>

            {/* TASKS TAB */}
            <TabsContent value="task">
              <LeadTasksPanel
                leadId={lead.id}
                projectId={lead.interested_project_id?.toString()}
              />
            </TabsContent>

            {/* UNITS INVENTORY MATCH */}
            <TabsContent value="units" className="focus:outline-none">
              {!lead?.interested_project_id ? (
                <Card className="p-10 text-center border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    No Project Assigned to this Lead
                  </h3>
                  <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
                    To view matched towers, blocks and available inventory units, please assign a project to this lead.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Tower Nodes */}
                  <div className="lg:col-span-4">
                    <Card className="border border-slate-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)] rounded-2xl overflow-hidden h-full">
                      <CardHeader className="border-b border-slate-100 bg-slate-50/30 py-4">
                        <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800">
                          <Building2 className="h-4.5 w-4.5 text-slate-400" />
                          Towers & Blocks
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 max-h-[60vh] overflow-y-auto no-scrollbar">
                        {hierarchyNodes.length === 0 ? (
                          <div className="text-center py-12 text-slate-400">
                            <Building2 className="mx-auto h-9 w-9 mb-2 opacity-40" />
                            <p className="text-xs font-semibold">No Towers/Blocks Created</p>
                            <p className="text-[10px] text-slate-500 mt-1">Configure project hierarchy in Project Setup.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {hierarchyNodes.map((node) => (
                              <button
                                key={node.id}
                                onClick={() => setSelectedNodeId(node.id)}
                                className={cn(
                                  "w-full text-left p-3.5 rounded-xl border transition-all text-xs font-semibold flex items-center justify-between",
                                  selectedNodeId === node.id
                                    ? "border-[var(--theme-color)] bg-[var(--theme-color)]/5 text-[var(--theme-color)] shadow-[0_1px_3px_rgba(234,76,42,0.05)]"
                                    : "border-slate-150 hover:bg-slate-50 text-slate-700"
                                )}
                              >
                                <div className="space-y-1">
                                  <div className="font-bold">{node.name}</div>
                                  {node.type_code && (
                                    <Badge variant="outline" className="text-[9px] font-bold border-slate-200 tracking-wider">
                                      {node.type_code}
                                    </Badge>
                                  )}
                                </div>
                                <span className={cn("text-lg", selectedNodeId === node.id ? "text-[var(--theme-color)]" : "text-slate-300")}>→</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column: Units matched */}
                  <div className="lg:col-span-8">
                    <Card className="border border-slate-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)] rounded-2xl overflow-hidden h-full">
                      <CardHeader className="border-b border-slate-100 bg-slate-50/30 py-4">
                        <CardTitle className="flex items-center justify-between gap-4 text-sm font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <Home className="h-4.5 w-4.5 text-slate-400" />
                            {selectedNodeId
                              ? `Units in ${hierarchyNodes.find((n) => n.id === selectedNodeId)?.name || "Selected Section"}`
                              : "Inventory Units"}
                          </div>
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="pt-6">
                        {!selectedNodeId ? (
                          <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                            <Home className="h-12 w-12 mb-3 opacity-30" />
                            <p className="text-xs font-semibold">Select a Section From the Left</p>
                            <p className="text-[10px] text-slate-500 mt-1">to inspect matched flat/unit inventories</p>
                          </div>
                        ) : loadingUnits ? (
                          <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[var(--theme-color)] border-r-2 border-r-transparent"></div>
                          </div>
                        ) : units.length === 0 ? (
                          <div className="text-center py-16 text-slate-400">
                            <Home className="mx-auto h-10 w-10 mb-3 opacity-40" />
                            <p className="text-xs font-semibold">No units found in this section</p>
                            <p className="text-[10px] text-slate-500 mt-1">Create units in Project Setup → Units Tab</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
                            {units.map((unit) => (
                              <Card
                                key={unit.id}
                                className={cn(
                                  "hover:shadow-md transition-all duration-200 border-slate-150 rounded-xl overflow-hidden hover:border-[var(--theme-color)]/30 group",
                                  unit.lead_id && unit.lead_id === lead.id && "border-emerald-500 bg-emerald-50/10 shadow-sm shadow-emerald-50"
                                )}
                              >
                                <CardContent className="p-4.5 space-y-3">
                                  <div className="flex justify-between items-start">
                                    <h5 className="font-extrabold text-lg text-slate-800 tracking-tight">
                                      {unit.unit_number}
                                    </h5>
                                    <Badge
                                      variant={
                                        unit.status === "available"
                                          ? "default"
                                          : unit.status === "booked"
                                          ? "secondary"
                                          : unit.status === "sold"
                                          ? "destructive"
                                          : "outline"
                                      }
                                      className="capitalize"
                                    >
                                      {unit.status}
                                    </Badge>
                                  </div>

                                  <div className="space-y-1.5 text-xs text-slate-500">
                                    {unit.carpet_area_sqft && (
                                      <p>
                                        Carpet:{" "}
                                        <span className="font-medium text-slate-700">
                                          {unit.carpet_area_sqft} sq.ft
                                        </span>
                                      </p>
                                    )}
                                    {unit.super_area_sqft && (
                                      <p>
                                        Super:{" "}
                                        <span className="font-medium text-slate-700">
                                          {unit.super_area_sqft} sq.ft
                                        </span>
                                      </p>
                                    )}
                                    {unit.facing && (
                                      <p>
                                        Facing: <span className="font-medium text-slate-700">{unit.facing}</span>
                                      </p>
                                    )}
                                    {unit.price && (
                                      <p className="pt-1 text-sm font-bold text-emerald-600">
                                        ₹ {unit.price.toLocaleString("en-IN")}
                                      </p>
                                    )}
                                  </div>

                                  {unit.lead_id && unit.lead_id === lead.id && (
                                    <div className="pt-1 border-t border-slate-100 mt-2">
                                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-[10px] py-0.5 px-2 rounded-md border-0 select-none">
                                        Assigned to Lead
                                      </Badge>
                                    </div>
                                  )}
                                </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </div>
  );
};

export default LeadDetailsPage;
