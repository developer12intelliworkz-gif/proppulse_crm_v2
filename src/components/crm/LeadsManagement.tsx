// import { useState, useEffect, useCallback } from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Plus, Search, Filter, Users } from "lucide-react";
// import CreateLeadForm from "../leads/CreateLeadForm";
// import LeadDetailsOffCanvas from "./LeadDetailsOffCanvas";
// import { useToast } from "@/hooks/use-toast";
// import LeadTable from "../leads/LeadTable";
// import { useAuth } from "@/contexts/AuthContext";
// import { useLeads } from "@/contexts/LeadsContext";
// import axiosInstance from "@/api/axiosInstance";
// import { useNavigate } from "react-router-dom";
// import PaginationControls from "../leads/PaginationControls";
// import AssignLeadModal from "../leads/AssignLeadModal"; // Import AssignLeadModal

// export interface LocalLead {
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
//   created_at: string;
//   assigned_to: string | null;
//   assigned_to_name: string | null;
//   interest_level: string | null; // ← ADDED
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
//   interested_project_id: number;
//   interest_level?: string | null;
// }

// interface Project {
//   id: number;
//   name: string;
// }

// const formatBudget = (budget: string | null): string => {
//   if (!budget) return "N/A";

//   const rangeMatch = budget.match(
//     /\$?(\d+\.?\d*[KMB]?)\s*-\s*\$?(\d+\.?\d*[KMB]?)/i
//   );
//   if (rangeMatch) {
//     budget = rangeMatch[1];
//   }

//   let numericValue = budget.replace(/[^\d.KMB]/g, "");
//   let multiplier = 1;
//   if (numericValue.toUpperCase().endsWith("K")) {
//     multiplier = 1000;
//     numericValue = numericValue.replace(/[Kk]/, "");
//   } else if (numericValue.toUpperCase().endsWith("M")) {
//     multiplier = 1000000;
//     numericValue = numericValue.replace(/[Mm]/, "");
//   } else if (numericValue.toUpperCase().endsWith("B")) {
//     multiplier = 1000000000;
//     numericValue = numericValue.replace(/[Bb]/, "");
//   }

//   const parsedValue = parseFloat(numericValue);
//   if (isNaN(parsedValue)) return "-";

//   const finalValue = parsedValue * multiplier;
//   return finalValue.toLocaleString("en-IN", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// };

// const mapLocalLeadToLead = (localLead: LocalLead): Lead => ({
//   id: localLead.id.toString(),
//   name: localLead.name || "Unknown",
//   email: localLead.email || "",
//   phone: localLead.phone || "",
//   status: localLead.status,
//   type: localLead.lead_type,
//   leadSource: localLead.lead_type,
//   leadScore: 60,
//   budget: localLead.budget || "$500K - $750K",
//   timeline: "3-6 months",
//   assignedAgent: localLead.assigned_to_name || null, // Use assigned_to_name
//   lastContact: localLead.created_at.split("T")[0],
//   createdAt: localLead.created_at,
//   interested_project_id: localLead.interested_project_id || 0,
// });

// const mapLocalLeadToFormData = (localLead: LocalLead) => ({
//   id: localLead.id,
//   name: localLead.name || "",
//   email: localLead.email || "",
//   phone: localLead.phone || "",
//   lead_type: localLead.lead_type,
//   address: localLead.address || "",
//   property_type: localLead.property_type || "",
//   budget: localLead.budget || "",
//   message: localLead.message || "",
//   interested_project_id: localLead.interested_project_id?.toString() || "none",
//   status: localLead.status || "new",
//   assigned_to: localLead.assigned_to || null,
//   interest_level: localLead.interest_level || "", // ← FIXED
// });

// const LeadsManagement: React.FC = () => {
//   const { user, token, isAuthenticated, logout, hasPermission } = useAuth();
//   const { leads, filteredLeads, fetchLeads, setFilteredLeads } = useLeads();
//   const [searchQuery, setSearchQuery] = useState<string>("");
//   const [statusFilter, setStatusFilter] = useState<string>("all");
//   const [sourceFilter, setSourceFilter] = useState<string>("all");
//   const [selectedLead, setSelectedLead] = useState<LocalLead | null>(null);
//   const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
//   const [isDetailsOffCanvasOpen, setIsDetailsOffCanvasOpen] =
//     useState<boolean>(false);
//   const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
//   const [selectedLeadForAssign, setSelectedLeadForAssign] =
//     useState<LocalLead | null>(null);
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);
//   const [leadsPerPage] = useState<number>(5);
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [usersMap, setUsersMap] = useState<{ [key: string]: string }>({}); // Map user ID to name
//   const { toast } = useToast();
//   const navigate = useNavigate();

//   const isAdminOrManager = ["admin", "manager"].includes(
//     user?.role?.toLowerCase() || ""
//   );

//   const fetchProjects = useCallback(async () => {
//     if (!isAuthenticated || !token) {
//       navigate("/login");
//       return;
//     }
//     try {
//       const response = await axiosInstance.get("/projects");
//       const data = response.data.data || response.data;
//       setProjects(data);
//     } catch (error: any) {
//       console.error("Error fetching projects:", error);
//       toast({
//         title: "Error",
//         description: `Failed to fetch projects: ${
//           error.response?.data?.error || error.message
//         }`,
//         variant: "destructive",
//       });
//     }
//   }, [isAuthenticated, token, navigate, toast]);

//   const fetchUsers = useCallback(async () => {
//     if (!isAuthenticated || !token) {
//       navigate("/login");
//       return;
//     }
//     try {
//       const response = await axiosInstance.get("/users");
//       const usersData = response.data.reduce(
//         (
//           acc: { [key: string]: string },
//           user: { id: string; name: string }
//         ) => {
//           acc[user.id] = user.name;
//           return acc;
//         },
//         {}
//       );
//       setUsersMap(usersData);
//     } catch (error: any) {
//       console.error("Error fetching users:", error);
//       toast({
//         title: "Error",
//         description: `Failed to fetch users: ${
//           error.response?.data?.error || error.message
//         }`,
//         variant: "destructive",
//       });
//       if (error.response?.status === 403) {
//         logout();
//         navigate("/login");
//       }
//     }
//   }, [isAuthenticated, token, navigate, logout, toast]);

//   // Initial data fetch on mount
//   useEffect(() => {
//     if (isAuthenticated && token) {
//       setIsLoading(true);
//       Promise.all([fetchLeads(), fetchProjects(), fetchUsers()]).finally(() =>
//         setIsLoading(false)
//       );
//     } else {
//       toast({
//         title: "Error",
//         description: "No authentication token found. Please log in.",
//         variant: "destructive",
//       });
//       navigate("/login");
//     }
//   }, [
//     isAuthenticated,
//     token,
//     fetchLeads,
//     fetchProjects,
//     fetchUsers,
//     navigate,
//     toast,
//   ]);

//   // Filter leads based on search and filters
//   useEffect(() => {
//     const filtered = leads
//       .map((lead) => ({
//         ...lead,
//         assigned_to_name:
//           usersMap[lead.assigned_to?.toString()] || "Unassigned",
//       }))
//       .filter((lead) => {
//         const matchesSearch =
//           !searchQuery ||
//           lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           lead.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           lead.assigned_to_name
//             ?.toLowerCase()
//             .includes(searchQuery.toLowerCase());
//         const matchesStatus =
//           statusFilter === "all" || lead.status === statusFilter;
//         const matchesSource =
//           sourceFilter === "all" || lead.lead_type === sourceFilter;
//         return matchesSearch && matchesStatus && matchesSource;
//       });
//     setFilteredLeads(filtered);
//   }, [
//     leads,
//     searchQuery,
//     statusFilter,
//     sourceFilter,
//     usersMap,
//     setFilteredLeads,
//   ]);

//   const indexOfLastLead = currentPage * leadsPerPage;
//   const indexOfFirstLead = indexOfLastLead - leadsPerPage;
//   const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);
//   const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);

//   const handleViewDetails = useCallback((lead: LocalLead) => {
//     window.location.assign(`/leads/${lead.id}`); // Force full browser refresh
//   }, []);

//   const handleAssignLead = useCallback(
//     (lead: LocalLead) => {
//       if (!hasPermission("create_leads")) {
//         toast({
//           title: "Error",
//           description: "You do not have permission to assign a lead.",
//           variant: "destructive",
//         });
//         return;
//       }
//       setSelectedLeadForAssign(lead);
//       setIsAssignModalOpen(true);
//     },
//     [hasPermission, toast]
//   );

//   return (
//     <div className="space-y-6">
//       <Card>
//         <CardHeader>
//           <div className="flex justify-between items-center">
//             <div>
//               <CardTitle className="flex items-center gap-2">
//                 <Users className="h-5 w-5" />
//                 Leads Management
//               </CardTitle>
//               <CardDescription>
//                 Manage and track your real estate leads
//               </CardDescription>
//             </div>
//             <Dialog
//               open={isCreateModalOpen}
//               onOpenChange={(open) => {
//                 if (!hasPermission("create_leads") || !isAdminOrManager) {
//                   toast({
//                     title: "Error",
//                     description: "You do not have permission to create a lead.",
//                     variant: "destructive",
//                   });
//                   return;
//                 }
//                 setIsCreateModalOpen(open);
//               }}
//             >
//               <DialogTrigger asChild>
//                 <Button
//                   onClick={() => {
//                     if (
//                       !isAuthenticated ||
//                       !token ||
//                       !hasPermission("create_leads") ||
//                       !isAdminOrManager
//                     ) {
//                       toast({
//                         title: "Error",
//                         description: "Please log in or check your permissions.",
//                         variant: "destructive",
//                       });
//                       navigate("/login");
//                     }
//                   }}
//                   disabled={
//                     isLoading ||
//                     !hasPermission("create_leads") ||
//                     !isAdminOrManager
//                   }
//                 >
//                   <Plus className="h-4 w-4 mr-2" />
//                   Create Lead
//                 </Button>
//               </DialogTrigger>
//               <DialogContent className="max-w-2xl h-[100vh] overflow-y-auto">
//                 <DialogHeader>
//                   <DialogTitle>Create New Lead</DialogTitle>
//                   <DialogDescription>
//                     Add a new lead to your CRM system
//                   </DialogDescription>
//                 </DialogHeader>
//                 <CreateLeadForm
//                   onClose={() => setIsCreateModalOpen(false)}
//                   onLeadCreated={() => {
//                     fetchLeads(true);
//                     toast({
//                       title: "Lead Created",
//                       description: "New lead has been added successfully",
//                     });
//                   }}
//                   projects={projects}
//                 />
//               </DialogContent>
//             </Dialog>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="flex flex-col sm:flex-row gap-4 mb-6">
//             <div className="relative flex-1">
//               <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//               <Input
//                 placeholder="Search leads..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//             <Select value={statusFilter} onValueChange={setStatusFilter}>
//               <SelectTrigger className="w-40">
//                 <Filter className="h-4 w-4 mr-2" />
//                 <SelectValue placeholder="Status" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Status</SelectItem>
//                 <SelectItem value="new">New</SelectItem>
//                 <SelectItem value="contacted">Contacted</SelectItem>
//                 <SelectItem value="qualified">Qualified</SelectItem>
//                 <SelectItem value="working">Working</SelectItem>
//                 <SelectItem value="proposal sent">Proposal Sent</SelectItem>
//                 {/* <SelectItem value="customer">Customer</SelectItem> */}
//                 <SelectItem value="lost">Lost</SelectItem>
//               </SelectContent>
//             </Select>
//             <Select value={sourceFilter} onValueChange={setSourceFilter}>
//               <SelectTrigger className="w-40">
//                 <SelectValue placeholder="Source" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Sources</SelectItem>
//                 <SelectItem value="meta">Meta</SelectItem>
//                 <SelectItem value="own_crm">Own CRM</SelectItem>
//                 <SelectItem value="website">Website</SelectItem>
//                 <SelectItem value="magicbricks">Magicbricks</SelectItem>
//                 <SelectItem value="99acres">99acres</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="border rounded-lg">
//             <LeadTable
//               leads={currentLeads}
//               isLoading={isLoading}
//               user={user}
//               onStatusChange={async (id, newStatus) => {
//                 if (!isAuthenticated || !token || user?.role === "agent") {
//                   toast({
//                     title: "Error",
//                     description: "You do not have permission to update status.",
//                     variant: "destructive",
//                   });
//                   return;
//                 }
//                 setFilteredLeads((prev) =>
//                   prev.map((lead) =>
//                     lead.id === id
//                       ? { ...lead, status: newStatus.toLowerCase() }
//                       : lead
//                   )
//                 );
//                 try {
//                   await axiosInstance.put(`/leads/${id}`, {
//                     status: newStatus.toLowerCase(),
//                   });
//                   fetchLeads(true);
//                   toast({
//                     title: "Success",
//                     description: `Status updated to ${newStatus}`,
//                   });
//                 } catch (error: any) {
//                   console.error("Error updating status:", error);
//                   toast({
//                     title: "Error",
//                     description: `Failed to update status: ${
//                       error.response?.data?.error || error.message
//                     }`,
//                     variant: "destructive",
//                   });
//                   if (error.response?.status === 403) {
//                     logout();
//                     navigate("/login");
//                   }
//                 }
//               }}
//               onViewDetails={handleViewDetails}
//               onEdit={(lead) => {
//                 if (!hasPermission("create_leads")) {
//                   toast({
//                     title: "Error",
//                     description: "You do not have permission to edit a lead.",
//                     variant: "destructive",
//                   });
//                   return;
//                 }
//                 setSelectedLead(lead);
//                 setIsEditModalOpen(true);
//               }}
//               onAssign={handleAssignLead} // Add onAssign handler
//               hasPermission={hasPermission}
//               formatBudget={formatBudget}
//             />
//           </div>

//           <PaginationControls
//             currentPage={currentPage}
//             totalPages={totalPages}
//             rowsPerPage={rowsPerPage}
//             isLoading={isLoading}
//             onPageChange={setCurrentPage}
//             onRowsPerPageChange={(rows) => {
//               setRowsPerPage(rows);
//               setCurrentPage(1);
//             }}
//             showRowsPerPage={false}
//           />
//         </CardContent>
//       </Card>

//       {selectedLead && (
//         <>
//           <LeadDetailsOffCanvas
//             lead={mapLocalLeadToLead(selectedLead)}
//             isOpen={isDetailsOffCanvasOpen}
//             onClose={() => setIsDetailsOffCanvasOpen(false)}
//             onLeadUpdated={(updatedLead: Lead) => {
//               const localUpdatedLead: LocalLead = {
//                 id: Number(updatedLead.id),
//                 name: updatedLead.name || null,
//                 email: updatedLead.email || null,
//                 phone: updatedLead.phone || null,
//                 lead_type: updatedLead.type,
//                 address: null,
//                 property_type: null,
//                 budget: updatedLead.budget || null,
//                 message: null,
//                 status: updatedLead.status,
//                 interested_project_id: updatedLead.interested_project_id,
//                 project_name: null,
//                 created_at: updatedLead.createdAt,
//                 assigned_to: updatedLead.assignedAgent,
//                 assigned_to_name:
//                   usersMap[updatedLead.assignedAgent?.toString()] ||
//                   "Unassigned",
//                 interest_level: updatedLead.interest_level || null, // ADDED
//               };

//               setFilteredLeads((prev) =>
//                 prev.map((l) =>
//                   l.id === localUpdatedLead.id ? localUpdatedLead : l
//                 )
//               );
//               fetchLeads(true);
//               toast({
//                 title: "Success",
//                 description: "Lead updated successfully",
//               });
//             }}
//           />
//           <Dialog
//             open={isEditModalOpen}
//             onOpenChange={(open) => {
//               if (!hasPermission("create_leads")) {
//                 toast({
//                   title: "Error",
//                   description: "You do not have permission to edit a lead.",
//                   variant: "destructive",
//                 });
//                 return;
//               }
//               setIsEditModalOpen(open);
//               if (!open) setSelectedLead(null);
//             }}
//           >
//             <DialogContent className="max-w-2xl h-[100vh] overflow-y-auto">
//               <DialogHeader>
//                 <DialogTitle>Edit Lead</DialogTitle>
//                 <DialogDescription>Update lead details</DialogDescription>
//               </DialogHeader>
//               <CreateLeadForm
//                 onClose={() => {
//                   setIsEditModalOpen(false);
//                   setSelectedLead(null);
//                 }}
//                 onLeadCreated={() => {
//                   fetchLeads(true);
//                   toast({
//                     title: "Success",
//                     description: "Lead updated successfully",
//                   });
//                 }}
//                 projects={projects}
//                 initialData={mapLocalLeadToFormData(selectedLead)}
//                 isEditMode={true}
//                 leadId={selectedLead.id}
//               />
//             </DialogContent>
//           </Dialog>
//         </>
//       )}

//       {selectedLeadForAssign && (
//         <AssignLeadModal
//           isOpen={isAssignModalOpen}
//           onClose={() => {
//             setIsAssignModalOpen(false);
//             setSelectedLeadForAssign(null);
//           }}
//           leadId={selectedLeadForAssign.id}
//           onLeadAssigned={() => {
//             fetchLeads(true);
//             fetchUsers(); // Refresh users to ensure usersMap is up-to-date
//             toast({
//               title: "Success",
//               description: "Lead assigned successfully",
//             });
//           }}
//         />
//       )}
//     </div>
//   );
// };

// export default LeadsManagement;

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Filter, Users } from "lucide-react";
import CreateLeadForm from "../leads/CreateLeadForm";
import LeadDetailsOffCanvas from "./LeadDetailsOffCanvas";
import { useToast } from "@/hooks/use-toast";
import LeadTable from "../leads/LeadTable";
import { useAuth } from "@/contexts/AuthContext";
import { useLeads } from "@/contexts/LeadsContext";
import { sortLeadsByNewestFirst } from "@/utils/sortLeads";
import axiosInstance from "@/api/axiosInstance";
import { useNavigate } from "react-router-dom";
import AssignLeadModal from "../leads/AssignLeadModal"; // Import AssignLeadModal

export interface LocalLead {
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
  created_at: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  interest_level: string | null; // ← ADDED
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
  interested_project_id: number;
  interest_level?: string | null;
}

interface Project {
  id: number;
  name: string;
}

const formatBudget = (budget: string | null): string => {
  if (!budget) return "N/A";

  const rangeMatch = budget.match(
    /\$?(\d+\.?\d*[KMB]?)\s*-\s*\$?(\d+\.?\d*[KMB]?)/i
  );
  if (rangeMatch) {
    budget = rangeMatch[1];
  }

  let numericValue = budget.replace(/[^\d.KMB]/g, "");
  let multiplier = 1;
  if (numericValue.toUpperCase().endsWith("K")) {
    multiplier = 1000;
    numericValue = numericValue.replace(/[Kk]/, "");
  } else if (numericValue.toUpperCase().endsWith("M")) {
    multiplier = 1000000;
    numericValue = numericValue.replace(/[Mm]/, "");
  } else if (numericValue.toUpperCase().endsWith("B")) {
    multiplier = 1000000000;
    numericValue = numericValue.replace(/[Bb]/, "");
  }

  const parsedValue = parseFloat(numericValue);
  if (isNaN(parsedValue)) return "-";

  const finalValue = parsedValue * multiplier;
  return finalValue.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const mapLocalLeadToLead = (localLead: LocalLead): Lead => ({
  id: localLead.id.toString(),
  name: localLead.name || "Unknown",
  email: localLead.email || "",
  phone: localLead.phone || "",
  status: localLead.status,
  type: localLead.lead_type,
  leadSource: localLead.lead_type,
  leadScore: 60,
  budget: localLead.budget || "$500K - $750K",
  timeline: "3-6 months",
  assignedAgent: localLead.assigned_to_name || null, // Use assigned_to_name
  lastContact: localLead.created_at.split("T")[0],
  createdAt: localLead.created_at,
  interested_project_id: localLead.interested_project_id || 0,
});

const mapLocalLeadToFormData = (localLead: LocalLead) => ({
  id: localLead.id,
  name: localLead.name || "",
  email: localLead.email || "",
  phone: localLead.phone || "",
  lead_type: localLead.lead_type,
  address: localLead.address || "",
  property_type: localLead.property_type || "",
  budget: localLead.budget || "",
  message: localLead.message || "",
  interested_project_id: localLead.interested_project_id?.toString() || "none",
  status: localLead.status || "new",
  assigned_to: localLead.assigned_to || null,
  interest_level: localLead.interest_level || "", // ← FIXED
});

const LeadsManagement: React.FC = () => {
  const { user, token, isAuthenticated, logout, hasPermission } = useAuth();
  const { leads, filteredLeads, fetchLeads, setFilteredLeads, updateLeadStatus } = useLeads();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<LocalLead | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDetailsOffCanvasOpen, setIsDetailsOffCanvasOpen] =
    useState<boolean>(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [selectedLeadForAssign, setSelectedLeadForAssign] =
    useState<LocalLead | null>(null);
  const [leadsPerPage] = useState<number>(10);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [usersMap, setUsersMap] = useState<{ [key: string]: string }>({}); // Map user ID to name
  const { toast } = useToast();
  const navigate = useNavigate();

  const isAdminOrManager = ["admin", "manager"].includes(
    user?.role?.toLowerCase() || ""
  );

  const fetchProjects = useCallback(async () => {
    if (!isAuthenticated || !token) {
      navigate("/login");
      return;
    }
    try {
      const response = await axiosInstance.get("/projects");
      const data = response.data.data || response.data;
      setProjects(data);
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      // toast({
        // title: "Error",
        // description: `Failed to fetch projects: ${
          // error.response?.data?.error || error.message
        // }`,
        // variant: "destructive",
      // });
    }
  }, [isAuthenticated, token, navigate, toast]);

  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated || !token) {
      navigate("/login");
      return;
    }
    try {
      const response = await axiosInstance.get("/users");
      const usersData = response.data.reduce(
        (
          acc: { [key: string]: string },
          user: { id: string; name: string }
        ) => {
          acc[user.id] = user.name;
          return acc;
        },
        {}
      );
      setUsersMap(usersData);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      // toast({
        // title: "Error",
        // description: `Failed to fetch users: ${
          // error.response?.data?.error || error.message
        // }`,
        // variant: "destructive",
      // });
      if (error.response?.status === 403) {
        logout();
        navigate("/login");
      }
    }
  }, [isAuthenticated, token, navigate, logout, toast]);

  // Initial data fetch on mount
  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoading(true);
      Promise.all([fetchLeads(), fetchProjects(), fetchUsers()]).finally(() =>
        setIsLoading(false)
      );
    } else {
      // toast({
        // title: "Error",
        // description: "No authentication token found. Please log in.",
        // variant: "destructive",
      // });
      navigate("/login");
    }
  }, [
    isAuthenticated,
    token,
    fetchLeads,
    fetchProjects,
    fetchUsers,
    navigate,
    toast,
  ]);

  // Filter leads based on search and filters
  useEffect(() => {
    const processedLeads = leads
      .map((lead) => ({
        ...lead,
        assigned_to_name:
          usersMap[lead.assigned_to?.toString()] || "Unassigned",
      }))
      .filter((lead) => {
        const matchesSearch =
          !searchQuery ||
          lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.assigned_to_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || lead.status === statusFilter;
        const matchesSource =
          sourceFilter === "all" || lead.lead_type === sourceFilter;
        return matchesSearch && matchesStatus && matchesSource;
      });

    setFilteredLeads(sortLeadsByNewestFirst(processedLeads));
  }, [
    leads,
    searchQuery,
    statusFilter,
    sourceFilter,
    usersMap,
    setFilteredLeads,
  ]);

  const currentLeads = filteredLeads.slice(0, leadsPerPage);

  const handleViewDetails = useCallback(
    (lead: LocalLead) => {
      navigate(`/leads/${lead.id}`, { state: { returnTo: "/dashboard" } });
    },
    [navigate],
  );

  const handleAssignLead = useCallback(
    (lead: LocalLead) => {
      if (!hasPermission("create_leads")) {
        // toast({
          // title: "Error",
          // description: "You do not have permission to assign a lead.",
          // variant: "destructive",
        // });
        return;
      }
      setSelectedLeadForAssign(lead);
      setIsAssignModalOpen(true);
    },
    [hasPermission, toast]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Leads Management
              </CardTitle>
              <CardDescription>
                Manage and track your real estate leads
              </CardDescription>
            </div>
            <Dialog
              open={isCreateModalOpen}
              onOpenChange={(open) => {
                if (!hasPermission("create_leads") || !isAdminOrManager) {
                  // toast({
                    // title: "Error",
                    // description: "You do not have permission to create a lead.",
                    // variant: "destructive",
                  // });
                  return;
                }
                setIsCreateModalOpen(open);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className="bg-[var(--theme-color)] hover:bg-[var(--theme-color-hover)] text-white border-none shadow-sm hover:shadow-md transition-all font-semibold rounded-lg h-9 px-4"
                  onClick={() => {
                    if (
                      !isAuthenticated ||
                      !token ||
                      !hasPermission("create_leads") ||
                      !isAdminOrManager
                    ) {
                      // toast({
                        // title: "Error",
                        // description: "Please log in or check your permissions.",
                        // variant: "destructive",
                      // });
                      navigate("/login");
                    }
                  }}
                  disabled={
                    isLoading ||
                    !hasPermission("create_leads") ||
                    !isAdminOrManager
                  }
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl h-[100vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Lead</DialogTitle>
                  <DialogDescription>
                    Add a new lead to your CRM system
                  </DialogDescription>
                </DialogHeader>
                <CreateLeadForm
                  onClose={() => setIsCreateModalOpen(false)}
                  onLeadCreated={() => {
                    fetchLeads(true);
                    // toast({
                      // title: "Lead Created",
                      // description: "New lead has been added successfully",
                    // });
                  }}
                  projects={projects}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="working">Working</SelectItem>
                <SelectItem value="proposal sent">Proposal Sent</SelectItem>
                {/* <SelectItem value="customer">Customer</SelectItem> */}
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="meta">Meta</SelectItem>
                <SelectItem value="own_crm">Own CRM</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="magicbricks">Magicbricks</SelectItem>
                <SelectItem value="99acres">99acres</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <LeadTable
              leads={currentLeads}
              isLoading={isLoading}
              user={user}
              totalLeads={leadsPerPage} // Set to 10 for local serial
              currentPage={1}
              leadsPerPage={leadsPerPage}
              useSimpleSerial={true} // Flag for simple 1-10 serial
              onStatusChange={async (id, newStatus) => {
                if (!isAuthenticated || !token || user?.role === "agent") {
                  return;
                }
                // Optimistically update status locally in Redux store
                updateLeadStatus(id, newStatus.toLowerCase());
                try {
                  await axiosInstance.put(`/leads/${id}`, {
                    status: newStatus.toLowerCase(),
                  });
                } catch (error: any) {
                  console.error("Error updating status:", error);
                  // Revert by fetching leads from server on failure
                  fetchLeads(true);
                  if (error.response?.status === 403) {
                    logout();
                    navigate("/login");
                  }
                }
              }}
              onViewDetails={handleViewDetails}
              onEdit={(lead) => {
                if (!hasPermission("create_leads")) {
                  // toast({
                    // title: "Error",
                    // description: "You do not have permission to edit a lead.",
                    // variant: "destructive",
                  // });
                  return;
                }
                setSelectedLead(lead);
                setIsEditModalOpen(true);
              }}
              onAssign={handleAssignLead} // Add onAssign handler
              hasPermission={hasPermission}
              formatBudget={formatBudget}
              allLeads={leads}
            />
          </div>
        </CardContent>
      </Card>

      {selectedLead && (
        <>
          <LeadDetailsOffCanvas
            lead={mapLocalLeadToLead(selectedLead)}
            isOpen={isDetailsOffCanvasOpen}
            onClose={() => setIsDetailsOffCanvasOpen(false)}
            onLeadUpdated={(updatedLead: Lead) => {
              const localUpdatedLead: LocalLead = {
                id: Number(updatedLead.id),
                name: updatedLead.name || null,
                email: updatedLead.email || null,
                phone: updatedLead.phone || null,
                lead_type: updatedLead.type,
                address: null,
                property_type: null,
                budget: updatedLead.budget || null,
                message: null,
                status: updatedLead.status,
                interested_project_id: updatedLead.interested_project_id,
                project_name: null,
                created_at: updatedLead.createdAt,
                assigned_to: updatedLead.assignedAgent,
                assigned_to_name:
                  usersMap[updatedLead.assignedAgent?.toString()] ||
                  "Unassigned",
                interest_level: updatedLead.interest_level || null, // ADDED
              };

              setFilteredLeads((prev) =>
                prev.map((l) =>
                  l.id === localUpdatedLead.id ? localUpdatedLead : l
                )
              );
              fetchLeads(true);
              // toast({
                // title: "Success",
                // description: "Lead updated successfully",
              // });
            }}
          />
          <Dialog
            open={isEditModalOpen}
            onOpenChange={(open) => {
              if (!hasPermission("create_leads")) {
                // toast({
                  // title: "Error",
                  // description: "You do not have permission to edit a lead.",
                  // variant: "destructive",
                // });
                return;
              }
              setIsEditModalOpen(open);
              if (!open) setSelectedLead(null);
            }}
          >
            <DialogContent className="max-w-2xl h-[100vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Lead</DialogTitle>
                <DialogDescription>Update lead details</DialogDescription>
              </DialogHeader>
              <CreateLeadForm
                onClose={() => {
                  setIsEditModalOpen(false);
                  setSelectedLead(null);
                }}
                onLeadCreated={() => {
                  fetchLeads(true);
                  // toast({
                    // title: "Success",
                    // description: "Lead updated successfully",
                  // });
                }}
                projects={projects}
                initialData={mapLocalLeadToFormData(selectedLead)}
                isEditMode={true}
                leadId={selectedLead.id}
              />
            </DialogContent>
          </Dialog>
        </>
      )}

      {selectedLeadForAssign && (
        <AssignLeadModal
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedLeadForAssign(null);
          }}
          leadId={selectedLeadForAssign.id}
          onLeadAssigned={() => {
            fetchLeads(true);
            fetchUsers(); // Refresh users to ensure usersMap is up-to-date
            // toast({
              // title: "Success",
              // description: "Lead assigned successfully",
            // });
          }}
        />
      )}
    </div>
  );
};

export default LeadsManagement;
