// ================================ //
//
// For Devlopment
//
// ================================ //

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Folder,
  FileText,
  Upload,
  Plus,
  Home,
  ArrowLeft,
  Search,
  Trash2,
  MoreVertical,
  Download,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { useAuth } from "@/contexts/AuthContext";

interface FolderItem {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
}

interface FileItem {
  id: number;
  name: string;
  path: string;
  url: string;
  created_at: string;
}

const DocumentMng = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentPath, setCurrentPath] = useState<
    { id: number; name: string }[]
  >([]);
  const [contents, setContents] = useState<{
    folders: FolderItem[];
    files: FileItem[];
  }>({
    folders: [],
    files: [],
  });
  const [filteredContents, setFilteredContents] = useState(contents);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const currentFolderId =
    currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;

  const fetchContents = async () => {
    setIsLoading(true);
    try {
      const url = currentFolderId
        ? `/documents/folders/${currentFolderId}`
        : "/documents/folders";
      const response = await axiosInstance.get(url);
      setContents(response.data);
      setFilteredContents(response.data);
    } catch (error: any) {
      // toast({
        // title: "Error",
        // description: error.response?.data?.error || "Failed to load contents",
        // variant: "destructive",
      // });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [currentFolderId]);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    setFilteredContents({
      folders: contents.folders.filter((f) =>
        f.name.toLowerCase().includes(query)
      ),
      files: contents.files.filter((f) => f.name.toLowerCase().includes(query)),
    });
  }, [searchQuery, contents]);

  const handleNavigateToFolder = (folder: FolderItem) => {
    setCurrentPath([...currentPath, { id: folder.id, name: folder.name }]);
  };

  const handleNavigateBack = (index: number) => {
    setCurrentPath(currentPath.slice(0, index + 1));
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await axiosInstance.post("/documents/folders", {
        name: newFolderName.trim(),
        parent_id: currentFolderId || null,
      });
      setNewFolderName("");
      fetchContents();
      // toast({ title: "Success", description: "Folder created!" });
    } catch (error: any) {
      // toast({
        // title: "Error",
        // description: "Failed to create folder",
        // variant: "destructive",
      // });
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    if (currentFolderId)
      formData.append("folder_id", currentFolderId.toString());

    try {
      // FIXED: Correct API endpoint
      await axiosInstance.post("/documents/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSelectedFile(null);
      const input = document.getElementById("upload-file") as HTMLInputElement;
      if (input) input.value = "";
      fetchContents();
      // toast({ title: "Success", description: "File uploaded!" });
    } catch (error: any) {
      // toast({
        // title: "Error",
        // description: error.response?.data?.error || "Upload failed",
        // variant: "destructive",
      // });
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (!confirm("Delete this folder and all its contents?")) return;
    try {
      await axiosInstance.delete(`/documents/folders/${folderId}`);
      fetchContents();
      // toast({ title: "Deleted", description: "Folder removed" });
    } catch (error) {
      // toast({
        // title: "Error",
        // description: "Cannot delete folder",
        // variant: "destructive",
      // });
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm("Delete this file permanently?")) return;
    try {
      await axiosInstance.delete(`/documents/documents/${fileId}`);
      fetchContents();
      // toast({ title: "Deleted", description: "File removed" });
    } catch (error) {
      // toast({
        // title: "Error",
        // description: "Cannot delete file",
        // variant: "destructive",
      // });
    }
  };

  const handlePreviewFile = (file: FileItem) => {
    setPreviewFile(file);
    setShowPreview(true);
  };

  const handleDownloadFile = async (file: FileItem) => {
    try {
      const response = await axiosInstance.get(
        `/documents/documents/${file.id}`,
        {
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      // toast({
        // title: "Error",
        // description: "Download failed",
        // variant: "destructive",
      // });
    }
  };

  const handleInitializeFolders = async () => {
    try {
      await axiosInstance.post("/documents/initialize-folders");
      fetchContents();
      // toast({ title: "Success", description: "Folders initialized!" });
    } catch (error: any) {
      // toast({
        // title: "Error",
        // description: error.response?.data?.error || "Failed to initialize",
        // variant: "destructive",
      // });
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
              <p className="text-gray-600">Manage your files and folders</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                <Home className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <Card>
            <CardHeader>
              {/* Breadcrumb + Search + Actions */}
              <div className="flex flex-col gap-4">
                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="New folder name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleCreateFolder()
                        }
                        className="w-64"
                      />
                      <Button
                        onClick={handleCreateFolder}
                        disabled={!newFolderName.trim()}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Folder
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        id="upload-file"
                        type="file"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          setSelectedFile(e.target.files[0])
                        }
                        className="w-64"
                      />
                      <Button
                        onClick={handleUploadFile}
                        disabled={!selectedFile}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  </div>

                  {user?.role === "admin" && (
                    <Button
                      onClick={handleInitializeFolders}
                      variant="secondary"
                    >
                      Initialize User Folders
                    </Button>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  {/* Breadcrumb - Top Left */}
                  <Breadcrumb className="flex items-center gap-2">
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        className="cursor-pointer hover:underline font-medium"
                        onClick={() => setCurrentPath([])}
                      >
                        Root
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {currentPath.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-1">
                        <BreadcrumbSeparator className="list-none" />
                        <BreadcrumbItem>
                          <BreadcrumbLink
                            className="cursor-pointer hover:underline"
                            onClick={() => handleNavigateBack(index)}
                          >
                            {item.name}
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                      </div>
                    ))}
                  </Breadcrumb>

                  {/* Search - Top Right */}
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search files & folders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="text-center py-20 text-gray-500">
                  Loading...
                </div>
              ) : filteredContents.folders.length === 0 &&
                filteredContents.files.length === 0 ? (
                <div className="text-center py-20 text-gray-500 text-lg">
                  {searchQuery
                    ? "No items match your search"
                    : "This folder is empty"}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {/* Folders */}
                  {filteredContents.folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="group relative bg-white border rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
                      onDoubleClick={() => handleNavigateToFolder(folder)}
                    >
                      <div className="flex flex-col items-center">
                        <Folder className="w-16 h-16 text-blue-600 mb-3" />
                        <p className="text-sm font-medium text-center line-clamp-2">
                          {folder.name}
                        </p>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Files */}
                  {filteredContents.files.map((file) => (
                    <div
                      key={file.id}
                      className="group relative bg-white border rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
                      onDoubleClick={() => handlePreviewFile(file)}
                    >
                      <div className="flex flex-col items-center">
                        <FileText className="w-16 h-16 text-gray-700 mb-3" />
                        <p className="text-sm font-medium text-center line-clamp-2">
                          {file.name}
                        </p>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewFile(file);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadFile(file);
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* File Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="w-fit max-h-screen">
            <DialogHeader>
              <DialogTitle>{previewFile?.name}</DialogTitle>
            </DialogHeader>
            {previewFile && (
              <div className="mt-4">
                {previewFile.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className="max-w-full h-auto"
                  />
                ) : previewFile.name.match(/\.(pdf)$/i) ? (
                  <iframe
                    src="{previewFile.url}"
                    className="w-full h-screen"
                    title={previewFile.name}
                  />
                ) : (
                  <div className="text-center py-20 text-gray-500">
                    <FileText className="w-20 h-20 mx-auto mb-4" />
                    <p>Preview not available for this file type</p>
                    <Button
                      className="mt-4"
                      onClick={() => handleDownloadFile(previewFile)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Instead
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Toaster />
      </div>
    </>
  );
};

export default DocumentMng;

// ================================ //
//
// For Production
//
// ================================ //

// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbSeparator,
// } from "@/components/ui/breadcrumb";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { useToast } from "@/components/ui/use-toast";
// import { Toaster } from "@/components/ui/toaster";
// import {
//   Folder,
//   FileText,
//   Upload,
//   Plus,
//   Home,
//   ArrowLeft,
//   Search,
//   Trash2,
//   Download,
//   Eye,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import axiosInstance from "@/api/axiosInstance";
// import { useAuth } from "@/contexts/AuthContext";

// interface FolderItem {
//   id: number;
//   name: string;
//   parent_id: number | null;
//   created_at: string;
// }

// interface FileItem {
//   id: number;
//   name: string;
//   path: string;
//   url: string;
//   created_at: string;
// }

// // THIS IS THE CORRECT BASE URL — matches your Express static route
// const API_PUBLIC_BASE = "https://intelliworkz.digital/documents/";

// const DocumentMng = () => {
//   const { user } = useAuth();
//   const { toast } = useToast();
//   const navigate = useNavigate();

//   const [currentPath, setCurrentPath] = useState<
//     { id: number; name: string }[]
//   >([]);
//   const [contents, setContents] = useState<{
//     folders: FolderItem[];
//     files: FileItem[];
//   }>({ folders: [], files: [] });
//   const [filteredContents, setFilteredContents] = useState(contents); // ← FIXED: was contents193
//   const [isLoading, setIsLoading] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [newFolderName, setNewFolderName] = useState("");
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
//   const [showPreview, setShowPreview] = useState(false);

//   const currentFolderId =
//     currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;

//   const fetchContents = async () => {
//     setIsLoading(true);
//     try {
//       const url = currentFolderId
//         ? `/documents/folders/${currentFolderId}`
//         : "/documents/folders";
//       const response = await axiosInstance.get(url);

//       const modifiedData = {
//         folders: response.data.folders,
//         files: response.data.files.map((file: FileItem) => ({
//           ...file,
//           url: `${API_PUBLIC_BASE}${encodeURIComponent(file.path)}`,
//         })),
//       };

//       setContents(modifiedData);
//       setFilteredContents(modifiedData);
//     } catch (error: any) {
//       toast({
//         title: "Error",
//         description: error.response?.data?.error || "Failed to load contents",
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchContents();
//   }, [currentFolderId]);

//   useEffect(() => {
//     const query = searchQuery.toLowerCase();
//     setFilteredContents({
//       folders: contents.folders.filter((f) =>
//         f.name.toLowerCase().includes(query)
//       ),
//       files: contents.files.filter((f) => f.name.toLowerCase().includes(query)),
//     });
//   }, [searchQuery, contents]);

//   const handleNavigateToFolder = (folder: FolderItem) => {
//     setCurrentPath([...currentPath, { id: folder.id, name: folder.name }]);
//   };

//   const handleNavigateBack = (index: number) => {
//     setCurrentPath(currentPath.slice(0, index + 1));
//   };

//   const handleCreateFolder = async () => {
//     if (!newFolderName.trim()) return;
//     try {
//       await axiosInstance.post("/documents/folders", {
//         name: newFolderName.trim(),
//         parent_id: currentFolderId || null,
//       });
//       setNewFolderName("");
//       fetchContents();
//       toast({ title: "Success", description: "Folder created!" });
//     } catch (error: any) {
//       toast({
//         title: "Error",
//         description: "Failed to create folder",
//         variant: "destructive",
//       });
//     }
//   };

//   const handleUploadFile = async () => {
//     if (!selectedFile) return;
//     const formData = new FormData();
//     formData.append("file", selectedFile);
//     if (currentFolderId)
//       formData.append("folder_id", currentFolderId.toString());

//     try {
//       await axiosInstance.post("/documents/documents", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       setSelectedFile(null);
//       const input = document.getElementById("upload-file") as HTMLInputElement;
//       if (input) input.value = "";
//       fetchContents();
//       toast({ title: "Success", description: "File uploaded!" });
//     } catch (error: any) {
//       toast({
//         title: "Error",
//         description: error.response?.data?.error || "Upload failed",
//         variant: "destructive",
//       });
//     }
//   };

//   const handleDeleteFolder = async (folderId: number) => {
//     if (!confirm("Delete this folder and all its contents?")) return;
//     try {
//       await axiosInstance.delete(`/documents/folders/${folderId}`);
//       fetchContents();
//       toast({ title: "Deleted", description: "Folder removed" });
//     } catch {
//       toast({
//         title: "Error",
//         description: "Cannot delete folder",
//         variant: "destructive",
//       });
//     }
//   };

//   const handleDeleteFile = async (fileId: number) => {
//     if (!confirm("Delete this file permanently?")) return;
//     try {
//       await axiosInstance.delete(`/documents/documents/${fileId}`);
//       fetchContents();
//       toast({ title: "Deleted", description: "File removed" });
//     } catch {
//       toast({
//         title: "Error",
//         description: "Cannot delete file",
//         variant: "destructive",
//       });
//     }
//   };

//   const handlePreviewFile = (file: FileItem) => {
//     setPreviewFile(file);
//     setShowPreview(true);
//   };

//   const handleDownloadFile = async (file: FileItem) => {
//     try {
//       const response = await axiosInstance.get(
//         `/documents/documents/${file.id}`,
//         {
//           responseType: "blob",
//         }
//       );
//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement("a");
//       link.href = url;
//       link.setAttribute("download", file.name);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//     } catch {
//       toast({
//         title: "Error",
//         description: "Download failed",
//         variant: "destructive",
//       });
//     }
//   };

//   const handleInitializeFolders = async () => {
//     try {
//       await axiosInstance.post("/documents/initialize-folders");
//       fetchContents();
//       toast({ title: "Success", description: "Folders initialized!" });
//     } catch (error: any) {
//       toast({
//         title: "Error",
//         description: error.response?.data?.error || "Failed to initialize",
//         variant: "destructive",
//       });
//     }
//   };

//   return (
//     <>
//       <div className="min-h-screen bg-gray-50">
//         <div className="bg-white border-b shadow-sm">
//           <div className="px-6 py-4 flex justify-between items-center">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
//               <p className="text-gray-600">Manage your files and folders</p>
//             </div>
//             <div className="flex gap-3">
//               <Button variant="outline" onClick={() => navigate("/dashboard")}>
//                 <Home className="w-4 h-4" />
//               </Button>
//               <Button variant="outline" onClick={() => navigate(-1)}>
//                 <ArrowLeft className="w-4 h-4 mr-2" />
//                 Back
//               </Button>
//             </div>
//           </div>
//         </div>

//         <div className="p-6">
//           <Card>
//             <CardHeader>
//               <div className="flex flex-col gap-4">
//                 <div className="flex justify-between items-center">
//                   <div className="flex gap-4">
//                     <div className="flex gap-2">
//                       <Input
//                         placeholder="New folder name"
//                         value={newFolderName}
//                         onChange={(e) => setNewFolderName(e.target.value)}
//                         onKeyDown={(e) =>
//                           e.key === "Enter" && handleCreateFolder()
//                         }
//                         className="w-64"
//                       />
//                       <Button
//                         onClick={handleCreateFolder}
//                         disabled={!newFolderName.trim()}
//                       >
//                         <Plus className="w-4 h-4 mr-2" />
//                         Create Folder
//                       </Button>
//                     </div>
//                     <div className="flex gap-2">
//                       <Input
//                         id="upload-file"
//                         type="file"
//                         onChange={(e) =>
//                           e.target.files?.[0] &&
//                           setSelectedFile(e.target.files[0])
//                         }
//                         className="w-64"
//                       />
//                       <Button
//                         onClick={handleUploadFile}
//                         disabled={!selectedFile}
//                       >
//                         <Upload className="w-4 h-4 mr-2" />
//                         Upload
//                       </Button>
//                     </div>
//                   </div>
//                   {user?.role === "admin" && (
//                     <Button
//                       onClick={handleInitializeFolders}
//                       variant="secondary"
//                     >
//                       Initialize User Folders
//                     </Button>
//                   )}
//                 </div>

//                 <div className="flex justify-between items-center">
//                   <Breadcrumb>
//                     <BreadcrumbItem>
//                       <BreadcrumbLink
//                         className="cursor-pointer hover:underline font-medium"
//                         onClick={() => setCurrentPath([])}
//                       >
//                         Root
//                       </BreadcrumbLink>
//                     </BreadcrumbItem>
//                     {currentPath.map((item, index) => (
//                       <div key={item.id} className="flex items-center gap-1">
//                         <BreadcrumbSeparator />
//                         <BreadcrumbItem>
//                           <BreadcrumbLink
//                             className="cursor-pointer hover:underline"
//                             onClick={() => handleNavigateBack(index)}
//                           >
//                             {item.name}
//                           </BreadcrumbLink>
//                         </BreadcrumbItem>
//                       </div>
//                     ))}
//                   </Breadcrumb>

//                   <div className="relative w-80">
//                     <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//                     <Input
//                       placeholder="Search files & folders..."
//                       value={searchQuery}
//                       onChange={(e) => setSearchQuery(e.target.value)}
//                       className="pl-10"
//                     />
//                   </div>
//                 </div>
//               </div>
//             </CardHeader>

//             <CardContent>
//               {isLoading ? (
//                 <div className="text-center py-20 text-gray-500">
//                   Loading...
//                 </div>
//               ) : filteredContents.folders.length === 0 &&
//                 filteredContents.files.length === 0 ? (
//                 <div className="text-center py-20 text-gray-500 text-lg">
//                   {searchQuery
//                     ? "No items match your search"
//                     : "This folder is empty"}
//                 </div>
//               ) : (
//                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
//                   {filteredContents.folders.map((folder) => (
//                     <div
//                       key={folder.id}
//                       className="group relative bg-white border rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
//                       onDoubleClick={() => handleNavigateToFolder(folder)}
//                     >
//                       <div className="flex flex-col items-center">
//                         <Folder className="w-16 h-16 text-blue-600 mb-3" />
//                         <p className="text-sm font-medium text-center line-clamp-2">
//                           {folder.name}
//                         </p>
//                       </div>
//                       <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
//                         <Button
//                           size="icon"
//                           variant="ghost"
//                           className="h-8 w-8"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             handleDeleteFolder(folder.id);
//                           }}
//                         >
//                           <Trash2 className="w-4 h-4 text-red-600" />
//                         </Button>
//                       </div>
//                     </div>
//                   ))}

//                   {filteredContents.files.map((file) => (
//                     <div
//                       key={file.id}
//                       className="group relative bg-white border rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
//                       onDoubleClick={() => handlePreviewFile(file)}
//                     >
//                       <div className="flex flex-col items-center">
//                         <FileText className="w-16 h-16 text-gray-700 mb-3" />
//                         <p className="text-sm font-medium text-center line-clamp-2">
//                           {file.name}
//                         </p>
//                       </div>
//                       <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
//                         <Button
//                           size="icon"
//                           variant="ghost"
//                           className="h-8 w-8"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             handlePreviewFile(file);
//                           }}
//                         >
//                           <Eye className="w-4 h-4" />
//                         </Button>
//                         <Button
//                           size="icon"
//                           variant="ghost"
//                           className="h-8 w-8"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             handleDownloadFile(file);
//                           }}
//                         >
//                           <Download className="w-4 h-4" />
//                         </Button>
//                         <Button
//                           size="icon"
//                           variant="ghost"
//                           className="h-8 w-8"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             handleDeleteFile(file.id);
//                           }}
//                         >
//                           <Trash2 className="w-4 h-4 text-red-600" />
//                         </Button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>

//         <Dialog open={showPreview} onOpenChange={setShowPreview}>
//           <DialogContent className="max-w-5xl max-h-screen">
//             <DialogHeader>
//               <DialogTitle>{previewFile?.name}</DialogTitle>
//             </DialogHeader>
//             {previewFile && (
//               <div className="mt-4">
//                 {previewFile.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
//                   <img
//                     src={previewFile.url}
//                     alt={previewFile.name}
//                     className="max-w-full h-auto mx-auto"
//                   />
//                 ) : previewFile.name.match(/\.(pdf)$/i) ? (
//                   <iframe
//                     src={previewFile.url}
//                     className="w-full h-screen"
//                     title={previewFile.name}
//                     allowFullScreen
//                   />
//                 ) : (
//                   <div className="text-center py-20 text-gray-500">
//                     <FileText className="w-20 h-20 mx-auto mb-4" />
//                     <p>Preview not available for this file type</p>
//                     <Button
//                       className="mt-4"
//                       onClick={() => handleDownloadFile(previewFile)}
//                     >
//                       <Download className="w-4 h-4 mr-2" />
//                       Download Instead
//                     </Button>
//                   </div>
//                 )}
//               </div>
//             )}
//           </DialogContent>
//         </Dialog>

//         <Toaster />
//       </div>
//     </>
//   );
// };

// export default DocumentMng;
