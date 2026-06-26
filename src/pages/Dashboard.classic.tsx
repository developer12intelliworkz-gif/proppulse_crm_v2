/**
 * CLASSIC DASHBOARD — DISABLED (kept for future use).
 * Live app uses Dashboard.tsx (enhanced layout).
 * To restore: copy this file content into Dashboard.tsx (remove leading //).
 */
// import { useState, useEffect } from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Link } from "react-router-dom";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Users, Home, Calendar, Building, Bell, Phone } from "lucide-react";
// import LeadsManagement from "@/components/crm/LeadsManagement";
// import ProjectManagement from "@/components/projects/ProjectManagement";
// import UserManagement from "@/components/users/UserManagement";
// import { useAuth } from "@/contexts/AuthContext";
// import { useLeads } from "@/contexts/LeadsContext";
// import axiosInstance from "@/api/axiosInstance";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// 
// const Dashboard = () => {
//   const { hasPermission, token } = useAuth();
//   const { leads } = useLeads();
//   const [activeTab, setActiveTab] = useState("leads");
// 
//   const [stats, setStats] = useState([
//     {
//       title: "Total Leads",
//       value: "0",
//       description: "Active leads in pipeline",
//       icon: Users,
//       change: "+12% from last month",
//       link: "/leads",
//     },
//     {
//       title: "Users",
//       value: "0",
//       description: "Listed users",
//       icon: Home,
//       change: "+8% from last month",
//       link: "#",
//     },
//     {
//       title: "Projects",
//       value: "0",
//       description: "Active projects",
//       icon: Building,
//       change: "+2 new this month",
//       link: "/projects",
//     },
//     {
//       title: "Follow-ups",
//       value: "0",
//       description: "Pending (today & future)",
//       icon: Calendar,
//       change: "", // Will be dynamic if needed
//       link: "#",
//     },
//   ]);
// 
//   const [latestLeads, setLatestLeads] = useState([]);
//   const [todaysFollowups, setTodaysFollowups] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
// 
//   useEffect(() => {
//     const fetchAllData = async () => {
//       if (!token) {
//         setError("Authentication required.");
//         setIsLoading(false);
//         return;
//       }
// 
//       setIsLoading(true);
//       setError(null);
// 
//       try {
//         // 1. Fetch basic stats (users, projects, leads count from context)
//         const usersRes = await axiosInstance.get("/users");
//         const usersCount = usersRes.data?.length || 0;
// 
//         const projectsRes = await axiosInstance.get("/projects");
//         const projectsCount =
//           projectsRes.data?.data?.length || projectsRes.data?.length || 0;
// 
//         const leadsCount = leads.length;
// 
//         // 2. Fetch dashboard summary (latest leads + followups + count)
//         const summaryRes = await axiosInstance.get("/leads/summary");
//         const { latestLeads, todaysFollowups, totalPendingFollowups } =
//           summaryRes.data;
// 
//         setLatestLeads(latestLeads);
//         setTodaysFollowups(todaysFollowups);
// 
//         // Update stats with real data
//         setStats([
//           { ...stats[0], value: leadsCount.toString() },
//           { ...stats[1], value: usersCount.toString() },
//           { ...stats[2], value: projectsCount.toString() },
//           { ...stats[3], value: totalPendingFollowups.toString() },
//         ]);
//       } catch (err: any) {
//         console.error("Dashboard data fetch error:", err);
//         setError(err.response?.data?.error || "Failed to load dashboard data");
//       } finally {
//         setIsLoading(false);
//       }
//     };
// 
//     fetchAllData();
//   }, [token, leads.length]);
// 
//   const availableTabs = [
//     { id: "leads", label: "Leads Management", permission: "view_leads" },
//     { id: "projects", label: "Projects", permission: "create_projects" },
//     { id: "users", label: "Users", permission: "manage_users" },
//   ].filter((tab) => hasPermission(tab.permission));
// 
//   if (isLoading) {
//     return (
//       <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
//         <p className="text-muted-foreground">Loading dashboard...</p>
//       </div>
//     );
//   }
// 
//   if (error) {
//     return (
//       <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
//         <p className="text-red-600 text-center">{error}</p>
//       </div>
//     );
//   }
// 
//   return (
//     <div className="bg-gray-100">
//       <div className="p-6 h-full">
//         <div className="mx-auto h-full flex flex-col">
//           <div className="mb-8 flex-shrink-0">
//             <h1 className="text-3xl font-bold text-foreground">
//               Real Estate CRM
//             </h1>
//             <p className="text-muted-foreground mt-2">
//               Manage your leads, properties, projects, and follow-ups
//               efficiently
//             </p>
//           </div>
// 
//           {/* Main 50-50 Layout */}
//           <div className="grid items-start grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
//             {/* Left: 4 Compact Square Cards */}
//             <div className="grid grid-cols-2 gap-6">
//               {stats.map((stat, index) => {
//                 const Icon = stat.icon;
//                 return (
//                   <Link key={index} to={stat.link || "#"}>
//                     <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-center p-6 bg-white">
//                       <div className="text-center space-y-4">
//                         <Icon className="h-12 w-12 mx-auto text-muted-foreground opacity-80" />
//                         <div>
//                           <div className="text-3xl font-bold text-foreground">
//                             {stat.value}
//                           </div>
//                           <p className="text-sm font-medium text-foreground mt-2">
//                             {stat.title}
//                           </p>
//                         </div>
//                         {/* {stat.change && (
//                           <p className="text-xs text-green-600 font-medium">
//                             {stat.change}
//                           </p>
//                         )} */}
//                       </div>
//                     </Card>
//                   </Link>
//                 );
//               })}
//             </div>
// 
//             {/* Right: Real-time Activity Panel */}
//             <div className="h-[284px]"
//             >
//               <Card className="shadow-lg h-full flex flex-col">
//                 <CardHeader className="pb-4">
//                   <CardTitle className="flex items-center gap-3 text-lg">
//                     <Bell className="h-5 w-5" />
//                     Latest Activity
//                   </CardTitle>
//                   <CardDescription>Real-time updates</CardDescription>
//                 </CardHeader>
//                 <CardContent className="pt-2 flex-1 overflow-y-auto">
//                   {/* Latest Leads */}
//                   <div className="mb-6">
//                     <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
//                       <Badge variant="default" className="text-xs">
//                         New
//                       </Badge>
//                       Latest Leads
//                     </h3>
//                     <div className="space-y-3">
//                       {latestLeads.length === 0 ? (
//                         <p className="text-sm text-muted-foreground">
//                           No new leads yet
//                         </p>
//                       ) : (
//                         latestLeads.map((lead: any) => (
//                           <div
//                             key={lead.id}
//                             className="flex justify-between items-center py-2 border-b last:border-0"
//                           >
//                             <div className="truncate max-w-[70%]">
//                               <p className="font-medium text-sm truncate">
//                                 {lead.name}
//                               </p>
//                               <p className="text-xs text-muted-foreground truncate">
//                                 {lead.phone} ΓÇó {lead.source}
//                               </p>
//                             </div>
//                             <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
//                               {lead.time}
//                             </span>
//                           </div>
//                         ))
//                       )}
//                     </div>
//                   </div>
// 
//                   <Separator className="my-4" />
// 
//                   {/* Today's Follow-ups */}
//                   <div>
//                     <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
//                       <Phone className="h-4 w-4" />
//                       Today's Follow-ups
//                     </h3>
//                     <div className="space-y-3">
//                       {todaysFollowups.length === 0 ? (
//                         <p className="text-sm text-muted-foreground">
//                           No follow-ups scheduled for today
//                         </p>
//                       ) : (
//                         todaysFollowups.map((followup: any) => (
//                           <div
//                             key={followup.id}
//                             className="flex justify-between items-center py-2 border-b last:border-0"
//                           >
//                             <div className="truncate max-w-[80%]">
//                               <p className="font-medium text-sm truncate">
//                                 {followup.name}
//                               </p>
//                               <p className="text-xs text-muted-foreground truncate">
//                                 {followup.time} ΓÇó {followup.note}
//                               </p>
//                             </div>
//                           </div>
//                         ))
//                       )}
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           </div>
// 
//           {/* Tabs Section */}
//           <Tabs value={activeTab} onValueChange={setActiveTab}>
//             <TabsList
//               className="grid w-full bg-gray-300 rounded-md"
//               style={{
//                 gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)`,
//               }}
//             >
//               {availableTabs.map((tab) => (
//                 <TabsTrigger key={tab.id} value={tab.id}>
//                   {tab.label}
//                 </TabsTrigger>
//               ))}
//             </TabsList>
// 
//             <div className="mt-6 bg-white rounded-lg shadow">
//               <TabsContent value="leads" className="m-0 p-4">
//                 <LeadsManagement />
//               </TabsContent>
//               <TabsContent value="projects" className="m-0 p-4">
//                 <ProjectManagement />
//               </TabsContent>
//               <TabsContent value="users" className="m-0 p-4">
//                 <UserManagement />
//               </TabsContent>
//             </div>
//           </Tabs>
//         </div>
//       </div>
//     </div>
//   );
// };
// 
// export default Dashboard;

