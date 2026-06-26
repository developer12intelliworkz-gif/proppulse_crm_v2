// import React, { useState, useEffect } from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { ArrowLeft, Home } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import * as XLSX from "xlsx";
// import axiosInstance from "@/api/axiosInstance";
// import { useAuth } from "@/contexts/AuthContext";
// import PaginationControls from "../leads/PaginationControls";

// // Props interface for ErrorBoundary
// interface ErrorBoundaryProps {
//   children: React.ReactNode;
// }

// // Error Boundary Component
// class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
//   state = { hasError: false };

//   static getDerivedStateFromError(error: Error) {
//     return { hasError: true };
//   }

//   render() {
//     if (this.state.hasError) {
//       return <h1>Something went wrong. Please try again later.</h1>;
//     }
//     return this.props.children;
//   }
// }

// // Type definition for table data
// type RowData = (string | number | null)[];

// const Imports = () => {
//   const { hasPermission, user } = useAuth();
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState("leads");
//   const [leadsData, setLeadsData] = useState<RowData[]>([]);
//   const [leadsHeaders, setLeadsHeaders] = useState<string[]>([]);
//   const [uploadedFile, setUploadedFile] = useState<File | null>(null);
//   const [showLeadConfirm, setShowLeadConfirm] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);
//   const [totalPages, setTotalPages] = useState(1);
//   const [isLoading, setIsLoading] = useState(false);

//   const availableTabs = [
//     {
//       id: "leads",
//       label: "Leads",
//       permission: "import_leads",
//       sampleFile: "/CreateLeadForm_Sample.xlsx",
//     },
//   ].filter((tab) => hasPermission(tab.permission));

//   useEffect(() => {
//     setTotalPages(Math.ceil(leadsData.length / rowsPerPage));
//     setCurrentPage(1);
//   }, [leadsData, rowsPerPage]);

//   // Pagination Logic
//   const startIndex = (currentPage - 1) * rowsPerPage;
//   const endIndex = Math.min(startIndex + rowsPerPage, leadsData.length);
//   const paginatedLeadsData = leadsData.slice(startIndex, endIndex);

//   const handleFileUpload = (
//     e: React.ChangeEvent<HTMLInputElement>,
//     tab: string
//   ) => {
//     setIsLoading(true);
//     const file = e.target.files?.[0];
//     if (!file) {
//       setIsLoading(false);
//       return;
//     }

//     setUploadedFile(file);

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const data = event.target?.result;
//       if (!data) {
//         setIsLoading(false);
//         return;
//       }

//       const workbook = XLSX.read(data, { type: "binary" });
//       const sheetName = workbook.SheetNames[0];
//       const worksheet = workbook.Sheets[sheetName];
//       const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (
//         | string
//         | number
//         | null
//       )[][];
//       const headers = jsonData[0] as string[];
//       const rows = jsonData.slice(1) as RowData[];

//       if (tab === "leads") {
//         setLeadsHeaders(headers.map((h) => String(h)));
//         setLeadsData(rows);
//       }
//       setIsLoading(false);
//     };
//     reader.readAsBinaryString(file);
//   };

//   const handleSave = async (tab: string) => {
//     if (tab === "leads") {
//       setShowLeadConfirm(true);
//       return;
//     }
//     await performSave(tab);
//   };

//   const performSave = async (tab: string) => {
//     if (tab !== "leads" || !uploadedFile) {
//       alert("No file uploaded. Please upload a file first.");
//       return;
//     }

//     setIsSaving(true);

//     const formData = new FormData();
//     formData.append("file", uploadedFile);

//     const formattedData = leadsData.map((row) => {
//       const obj: Record<string, string | number | null> = {};
//       leadsHeaders.forEach((header, index) => {
//         obj[header] = row[index];
//       });
//       return obj;
//     });
//     formData.append("data", JSON.stringify(formattedData));

//     try {
//       const response = await axiosInstance.post(`/leads/import`, formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       });
//       const { added, duplicates } = response.data;
//       alert(
//         `${added} leads added successfully and ${duplicates} were duplicates.`
//       );
//     } catch (error: any) {
//       console.error("Error saving data:", error);
//       if (error.response) {
//         alert(
//           `Error: ${error.response.data.message || "Failed to import leads."}`
//         );
//       } else {
//         alert("Network error. Please check your connection.");
//       }
//     } finally {
//       setIsSaving(false);
//       setShowLeadConfirm(false);
//       setLeadsData([]);
//       setUploadedFile(null);
//     }
//   };

//   const handleDownloadSample = (tab: string) => {
//     const tabConfig = availableTabs.find((t) => t.id === tab);
//     if (tabConfig) {
//       const link = document.createElement("a");
//       link.href = tabConfig.sampleFile;
//       link.download = tabConfig.sampleFile.split("/").pop() || "sample.xlsx";
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     }
//   };

//   const handleCancel = () => {
//     navigate("/settings");
//   };

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <div className="bg-card border-b shadow-sm flex-shrink-0">
//         <div className="px-6 py-4">
//           <div className="flex justify-between items-center">
//             <div>
//               <h1 className="text-3xl font-bold text-foreground">
//                 Import Leads
//               </h1>
//               <p className="text-muted-foreground">
//                 Import your leads efficiently
//               </p>
//             </div>
//             <div className="flex gap-3">
//               <Button variant="outline" onClick={() => navigate("/dashboard")}>
//                 <Home className="w-4 h-4" />
//               </Button>
//               <Button variant="outline" onClick={handleCancel}>
//                 <ArrowLeft className="w-4 h-4 mr-2" />
//                 Back to Settings
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="p-6">
//         <div className="mx-auto flex flex-col">
//           <div className="flex-1 min-h-0">
//             <Tabs
//               value={activeTab}
//               onValueChange={setActiveTab}
//               className="h-full flex flex-col"
//             >
//               <TabsList className="grid w-full grid-cols-1">
//                 {availableTabs.map((tab) => (
//                   <TabsTrigger key={tab.id} value={tab.id}>
//                     {tab.label}
//                   </TabsTrigger>
//                 ))}
//               </TabsList>

//               <div className="flex-1 min-h-0 mt-6">
//                 <TabsContent value="leads" className="h-full m-0">
//                   <Card>
//                     <CardHeader>
//                       <CardTitle>Import Leads</CardTitle>
//                       <CardDescription>
//                         <p className="text-xs text-muted-foreground mt-1 mb-2">
//                           <strong>Note: </strong>Upload in{" "}
//                           <strong>.xlsx </strong>format only.
//                         </p>
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="flex space-x-4 mb-4">
//                         <Input
//                           type="file"
//                           onChange={(e) => handleFileUpload(e, "leads")}
//                           accept=".xlsx,.xls"
//                           disabled={isLoading}
//                         />
//                         <Button
//                           onClick={() => handleDownloadSample("leads")}
//                           variant="outline"
//                         >
//                           Download Sample
//                         </Button>
//                       </div>

//                       {leadsData.length > 0 ? (
//                         <>
//                           <div className="rounded-md border overflow-hidden">
//                             <Table>
//                               <TableHeader>
//                                 <TableRow>
//                                   {leadsHeaders.map((header, index) => (
//                                     <TableHead key={index}>{header}</TableHead>
//                                   ))}
//                                 </TableRow>
//                               </TableHeader>
//                               <TableBody>
//                                 {paginatedLeadsData.map((row, rowIndex) => (
//                                   <TableRow key={rowIndex}>
//                                     {row.map((cell, cellIndex) => (
//                                       <TableCell key={cellIndex}>
//                                         {cell?.toString() || ""}
//                                       </TableCell>
//                                     ))}
//                                   </TableRow>
//                                 ))}
//                               </TableBody>
//                             </Table>
//                           </div>

//                           {/* Pagination & Save Button */}
//                           <div className="mt-6 space-y-4">
//                             <div className="flex justify-between items-center">
//                               <div className="text-sm text-muted-foreground">
//                                 Showing{" "}
//                                 {leadsData.length > 0 ? startIndex + 1 : 0} to{" "}
//                                 {endIndex} of {leadsData.length} rows
//                               </div>
//                               <PaginationControls
//                                 currentPage={currentPage}
//                                 totalPages={totalPages}
//                                 rowsPerPage={rowsPerPage}
//                                 isLoading={isLoading}
//                                 onPageChange={setCurrentPage}
//                                 onRowsPerPageChange={(rows) => {
//                                   setRowsPerPage(rows);
//                                   setCurrentPage(1);
//                                 }}
//                                 showRowsPerPage={false}
//                               />
//                             </div>

//                             <div className="flex justify-end">
//                               <Button
//                                 onClick={() => handleSave("leads")}
//                                 disabled={isSaving || !uploadedFile}
//                               >
//                                 {isSaving ? "Saving..." : "Save"}
//                               </Button>
//                             </div>
//                           </div>
//                         </>
//                       ) : uploadedFile ? (
//                         <p className="text-center text-muted-foreground py-8">
//                           No valid data found in the uploaded file.
//                         </p>
//                       ) : (
//                         <p className="text-center text-muted-foreground py-8">
//                           Upload an Excel file to preview and import leads.
//                         </p>
//                       )}
//                     </CardContent>
//                   </Card>
//                 </TabsContent>
//               </div>
//             </Tabs>
//           </div>
//         </div>
//       </div>

//       {/* Confirmation Dialog */}
//       <Dialog open={showLeadConfirm} onOpenChange={setShowLeadConfirm}>
//         <DialogContent className="max-w-4xl">
//           <DialogHeader>
//             <DialogTitle>Confirm Leads Import</DialogTitle>
//             <DialogDescription>
//               Review the leads below. Duplicates (by email/phone) will be
//               skipped.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="overflow-auto max-h-96 border rounded-md">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   {leadsHeaders.map((header, index) => (
//                     <TableHead key={index}>{header}</TableHead>
//                   ))}
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {leadsData.map((row, rowIndex) => (
//                   <TableRow key={rowIndex}>
//                     {row.map((cell, cellIndex) => (
//                       <TableCell key={cellIndex}>
//                         {cell?.toString() || ""}
//                       </TableCell>
//                     ))}
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>
//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => setShowLeadConfirm(false)}
//               disabled={isSaving}
//             >
//               Cancel
//             </Button>
//             <Button onClick={() => performSave("leads")} disabled={isSaving}>
//               {isSaving ? "Adding..." : "Add to Database"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// const ImportsWithBoundary = () => (
//   <ErrorBoundary>
//     <Imports />
//   </ErrorBoundary>
// );

// export default ImportsWithBoundary;

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Home, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import axiosInstance from "@/api/axiosInstance";
import { useAuth } from "@/contexts/AuthContext";
import PaginationControls from "../leads/PaginationControls";

// Error Boundary
interface ErrorBoundaryProps {
  children: React.ReactNode;
}
class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please try again later.</h1>;
    }
    return this.props.children;
  }
}

type RowData = (string | number | null)[];

// Required columns in correct order
const REQUIRED_COLUMNS = [
  "Name",
  "Email",
  "Phone",
  "Address",
  "Interested Project ID",
  "Property Type",
  "Budget",
  "Message",
  "Lead Source",
  "Status",
  "Interest Level",
  "Created Date",
] as const;

type ColumnKey = (typeof REQUIRED_COLUMNS)[number];

const Imports = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("leads");
  const [leadsData, setLeadsData] = useState<RowData[]>([]);
  const [leadsHeaders, setLeadsHeaders] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showLeadConfirm, setShowLeadConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const availableTabs = [
    {
      id: "leads",
      label: "Leads",
      permission: "import_leads",
      sampleFile: "/CreateLeadForm_Sample.xlsx",
    },
  ].filter((tab) => hasPermission(tab.permission));

  useEffect(() => {
    setTotalPages(Math.ceil(leadsData.length / rowsPerPage));
    setCurrentPage(1);
  }, [leadsData, rowsPerPage]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, leadsData.length);
  const paginatedLeadsData = leadsData.slice(startIndex, endIndex);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    tab: string
  ) => {
    setIsLoading(true);
    const file = e.target.files?.[0];
    if (!file) {
      setIsLoading(false);
      return;
    }

    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      if (!data) {
        setIsLoading(false);
        return;
      }

      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (
        | string
        | number
        | null
      )[][];
      const headers = (jsonData[0] as string[]) || [];
      const rows = jsonData.slice(1) as RowData[];

      if (tab === "leads") {
        // Normalize headers
        const normalizedHeaders = headers.map((h) =>
          String(h).trim().replace(/\s+/g, " ")
        );

        // Transform rows: ensure correct order + default lead_type
        const transformedRows = rows.map((row) => {
          const obj: Record<string, any> = {};
          normalizedHeaders.forEach((h, i) => {
            obj[h] = row[i];
          });

          // Default Lead Source = own_crm (accept legacy "Lead Type" column too)
          const leadSourceValue =
            obj["Lead Source"] ?? obj["Lead Type"] ?? "";
          if (!leadSourceValue || leadSourceValue === "") {
            obj["Lead Source"] = "own_crm";
          } else {
            obj["Lead Source"] = leadSourceValue;
          }

          // Ensure all required columns exist in output
          const orderedRow: any[] = [];
          REQUIRED_COLUMNS.forEach((col) => {
            orderedRow.push(obj[col] ?? "");
          });
          return orderedRow;
        });

        setLeadsHeaders(Array.from(REQUIRED_COLUMNS));
        setLeadsData(transformedRows);
      }
      setIsLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleSave = async (tab: string) => {
    if (tab === "leads") {
      setShowLeadConfirm(true);
      return;
    }
    await performSave(tab);
  };

  const performSave = async (tab: string) => {
    if (tab !== "leads" || !uploadedFile) {
      alert("No file uploaded. Please upload a file first.");
      return;
    }

    setIsSaving(true);

    const formData = new FormData();
    formData.append("file", uploadedFile);

    // Send only the data in correct order
    const formattedData = leadsData.map((row) => {
      const obj: Record<string, any> = {};
      REQUIRED_COLUMNS.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
    formData.append("data", JSON.stringify(formattedData));

    try {
      const response = await axiosInstance.post(`/leads/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { added, duplicates } = response.data;
      alert(
        `${added} leads added successfully and ${duplicates} were duplicates.`
      );
    } catch (error: any) {
      console.error("Error saving data:", error);
      const msg = error.response?.data?.message || "Failed to import leads.";
      alert(`Error: ${msg}`);
    } finally {
      setIsSaving(false);
      setShowLeadConfirm(false);
      setLeadsData([]);
      setUploadedFile(null);
    }
  };

  const handleDownloadSample = (tab: string) => {
    const tabConfig = availableTabs.find((t) => t.id === tab);
    if (tabConfig) {
      const link = document.createElement("a");
      link.href = tabConfig.sampleFile;
      link.download = "CreateLeadForm_Sample.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCancel = () => {
    navigate("/settings");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-card border-b shadow-sm flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Import Leads
              </h1>
              <p className="text-muted-foreground">
                Import leads via Excel. Lead Source will be set to{" "}
                <strong>own_crm</strong>.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                <Home className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-1">
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="leads" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Import Leads</CardTitle>
                  <CardDescription>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p>
                        <strong>Note:</strong> Upload in <strong>.xlsx</strong>{" "}
                        format only.
                      </p>
                      <p className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <strong>Lead Source</strong> will be auto-set to{" "}
                        <code className="bg-muted px-1 rounded">own_crm</code>
                      </p>
                      <p>
                        <strong>Created Date</strong> format:{" "}
                        <code className="bg-muted px-1 rounded">
                          YYYY-MM-DD
                        </code>
                      </p>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4 mb-4">
                    <Input
                      type="file"
                      onChange={(e) => handleFileUpload(e, "leads")}
                      accept=".xlsx,.xls"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => handleDownloadSample("leads")}
                      variant="outline"
                    >
                      Download Sample
                    </Button>
                  </div>

                  {leadsData.length > 0 ? (
                    <>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {leadsHeaders.map((header) => (
                                <TableHead key={header}>{header}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedLeadsData.map((row, rowIndex) => (
                              <TableRow key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                  <TableCell key={cellIndex}>
                                    {cell?.toString() || ""}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="mt-6 space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            Showing {startIndex + 1} to {endIndex} of{" "}
                            {leadsData.length} rows
                          </div>
                          <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            rowsPerPage={rowsPerPage}
                            isLoading={isLoading}
                            onPageChange={setCurrentPage}
                            onRowsPerPageChange={(rows) => {
                              setRowsPerPage(rows);
                              setCurrentPage(1);
                            }}
                            showRowsPerPage={false}
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button
                            onClick={() => handleSave("leads")}
                            disabled={isSaving || !uploadedFile}
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : uploadedFile ? (
                    <p className="text-center text-muted-foreground py-8">
                      No valid data found in the uploaded file.
                    </p>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Upload an Excel file to preview and import leads.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showLeadConfirm} onOpenChange={setShowLeadConfirm}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Confirm Leads Import</DialogTitle>
            <DialogDescription>
              Review the leads below. Duplicates (by email/phone) will be
              skipped.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-96 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {leadsHeaders.map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>
                        {cell?.toString() || ""}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLeadConfirm(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={() => performSave("leads")} disabled={isSaving}>
              {isSaving ? "Adding..." : "Add to Database"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ImportsWithBoundary = () => (
  <ErrorBoundary>
    <Imports />
  </ErrorBoundary>
);

export default ImportsWithBoundary;
