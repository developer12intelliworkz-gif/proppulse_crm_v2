// ================================ //
//
// For Devlopment
//
// ================================ //

// // src/components/ActivityAndHistory/DocumentsList.tsx
// import { Button } from "@/components/ui/button";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogTrigger,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   AlertDialog,
//   AlertDialogTrigger,
//   AlertDialogContent,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogCancel,
// } from "@/components/ui/alert-dialog";
// import { FileText, Eye, Download, Trash2 } from "lucide-react";
// import axiosInstance from "@/api/axiosInstance";
// import { useAuth } from "@/contexts/AuthContext";

// interface Document {
//   id: number;
//   name: string;
//   type: string;
//   document_name?: string;
// }

// interface DocumentsListProps {
//   activityStates: any;
//   isEditing: boolean;
//   hasPermission: (perm: string) => boolean;
//   handleRemoveDocument: (index: number) => Promise<void>;
//   leadId: number;
// }

// const DocumentsList: React.FC<DocumentsListProps> = ({
//   activityStates,
//   isEditing,
//   hasPermission,
//   handleRemoveDocument,
//   leadId,
// }) => {
//   const { token } = useAuth();
//   const documents = activityStates?.documents?.documents || [];

//   const canDelete = isEditing && hasPermission("create_leads");

//   const getDocumentUrl = (doc: Document) => {
//     const filename = doc.document_name || doc.name;
//     return `http://localhost:3001/documents/lead/${encodeURIComponent(
//       filename
//     )}`;
//   };

//   const handleDownload = async (doc: Document) => {
//     if (!token) return;

//     try {
//       const response = await axiosInstance.get(
//         `/leads/${leadId}/documents/${doc.id}`,
//         {
//           responseType: "blob",
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement("a");
//       link.href = url;
//       link.setAttribute("download", doc.name);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//     } catch (err) {
//       console.error("Download failed", err);
//     }
//   };

//   if (documents.length === 0) {
//     return (
//       <Card className="border-dashed border-2">
//         <CardContent className="py-16 text-center">
//           <p className="text-gray-500 text-lg">No documents uploaded yet.</p>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card>
//       <CardHeader>
//         <div className="flex items-center gap-3">
//           <FileText className="h-8 w-8 text-green-600" />
//           <CardTitle className="text-2xl">
//             Documents ({documents.length})
//           </CardTitle>
//         </div>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         {documents.map((doc, index) => {
//           const url = getDocumentUrl(doc);
//           const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(
//             doc.type.toLowerCase()
//           );
//           const isPdf = doc.type.toLowerCase() === "pdf";
//           const canPreview = isImage || isPdf;

//           return (
//             <div
//               key={doc.id}
//               className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow"
//             >
//               <div className="flex items-center gap-4">
//                 <FileText className="h-12 w-12 text-green-600" />
//                 <div>
//                   <p className="text-xl font-bold text-gray-800">{doc.name}</p>
//                   <p className="text-sm text-gray-600">
//                     {doc.type.toUpperCase()}
//                   </p>
//                 </div>
//               </div>

//               <div className="flex gap-3">
//                 {canPreview && (
//                   <Dialog>
//                     <DialogTrigger asChild>
//                       <Button
//                         size="lg"
//                         className="bg-blue-600 hover:bg-blue-700"
//                       >
//                         <Eye className="mr-2 h-5 w-5" /> View
//                       </Button>
//                     </DialogTrigger>
//                     <DialogContent className="max-w-6xl max-h-screen p-0 overflow-hidden">
//                       <DialogHeader className="p-6 border-b bg-gray-50">
//                         <DialogTitle className="text-2xl">
//                           {doc.name}
//                         </DialogTitle>
//                       </DialogHeader>

//                       <div className="relative w-full h-[85vh] bg-white">
//                         {isPdf ? (
//                           <iframe
//                             src={url}
//                             className="w-full h-full border-0"
//                             title={doc.name}
//                             allowFullScreen
//                           />
//                         ) : isImage ? (
//                           <img
//                             src={url}
//                             alt={doc.name}
//                             className="max-w-full max-h-full mx-auto object-contain"
//                           />
//                         ) : (
//                           <div className="flex flex-col items-center justify-center h-full text-gray-500">
//                             <FileText className="w-24 h-24 mb-4" />
//                             <p className="text-lg mb-4">
//                               Preview not available
//                             </p>
//                             <Button onClick={() => handleDownload(doc)}>
//                               <Download className="w-4 h-4 mr-2" />
//                               Download File
//                             </Button>
//                           </div>
//                         )}
//                       </div>
//                     </DialogContent>
//                   </Dialog>
//                 )}

//                 <Button
//                   size="lg"
//                   variant="outline"
//                   className="border-green-600 text-green-600 hover:bg-green-50"
//                   onClick={() => handleDownload(doc)}
//                 >
//                   <Download className="mr-2 h-5 w-5" /> Download
//                 </Button>

//                 <AlertDialog>
//                   <AlertDialogTrigger asChild>
//                     <Button
//                       size="lg"
//                       variant="destructive"
//                       disabled={!canDelete}
//                     >
//                       <Trash2 className="mr-2 h-5 w-5" /> Delete
//                     </Button>
//                   </AlertDialogTrigger>
//                   <AlertDialogContent>
//                     <AlertDialogHeader>
//                       <AlertDialogTitle>Delete Document?</AlertDialogTitle>
//                       <AlertDialogDescription>
//                         Permanently delete <strong>{doc.name}</strong>?
//                       </AlertDialogDescription>
//                     </AlertDialogHeader>
//                     <AlertDialogFooter>
//                       <AlertDialogCancel>Cancel</AlertDialogCancel>
//                       <Button
//                         variant="destructive"
//                         onClick={() => handleRemoveDocument(index)}
//                       >
//                         Delete Forever
//                       </Button>
//                     </AlertDialogFooter>
//                   </AlertDialogContent>
//                 </AlertDialog>
//               </div>
//             </div>
//           );
//         })}
//       </CardContent>
//     </Card>
//   );
// };

// export default DocumentsList;

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { FileText, Eye, Download, Trash2 } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import { useAuth } from "@/contexts/AuthContext";
import { SECURITY_CONFIG } from "@/config/security";

interface Document {
  id: number;
  name: string;
  type: string;
  document_name?: string;
}

// NEW: Removed hasPermission, added canEditActivities
interface DocumentsListProps {
  activityStates: any;
  isEditing: boolean;
  canEditActivities: boolean; // ← This replaces hasPermission("create_leads")
  handleRemoveDocument: (index: number) => Promise<void>;
  leadId: number;
}

const DocumentsList: React.FC<DocumentsListProps> = ({
  activityStates,
  isEditing,
  canEditActivities,
  handleRemoveDocument,
  leadId,
}) => {
  const { token } = useAuth();
  const documents = activityStates?.documents?.documents || [];

  const getDocumentUrl = (doc: Document) => {
    const filename = doc.document_name || doc.name;
    return `${SECURITY_CONFIG.DOCUMENT_BASE_URL}/${encodeURIComponent(
      filename
    )}`;
  };

  const handleDownload = async (doc: Document) => {
    if (!token) return;

    try {
      const response = await axiosInstance.get(
        `/leads/${leadId}/documents/${doc.id}`,
        {
          responseType: "blob",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  if (documents.length === 0) {
    return (
      <Card className="border-dashed border-2 border-slate-200 bg-slate-50/25 rounded-2xl overflow-hidden shadow-none">
        <CardContent className="py-12 text-center text-slate-400">
          <FileText className="mx-auto h-10 w-10 mb-3 opacity-35 text-[var(--theme-color)]" />
          <p className="text-xs font-bold">No documents uploaded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.01)] rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <div className="p-2 bg-orange-50 text-[var(--theme-color)] border border-orange-100/60 rounded-xl">
          <FileText className="h-4 w-4" />
        </div>
        <CardTitle className="text-base font-bold text-slate-800">
          Documents ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((doc, index) => {
          const url = getDocumentUrl(doc);
          const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(
            doc.type.toLowerCase()
          );
          const isPdf = doc.type.toLowerCase() === "pdf";
          const canPreview = isImage || isPdf;

          return (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 bg-slate-50/40 hover:bg-slate-50/90 border border-slate-150/60 rounded-2xl transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-50 text-[var(--theme-color)] border border-orange-100/50 rounded-xl">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[180px]" title={doc.name}>
                    {doc.name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    {doc.type.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {canPreview && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-[var(--theme-color)] hover:bg-[var(--theme-color-hover)] text-white text-xs font-bold rounded-lg h-8 px-3.5 flex items-center gap-1.5 shadow-sm shadow-orange-100/30"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-screen p-0 overflow-hidden">
                      <DialogHeader className="p-6 border-b bg-gray-50">
                        <DialogTitle className="text-2xl">
                          {doc.name}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="relative w-full h-[85vh] bg-white">
                        {isPdf ? (
                          <iframe
                            src={url}
                            className="w-full h-full border-0"
                            title={doc.name}
                            allowFullScreen
                          />
                        ) : isImage ? (
                          <img
                            src={url}
                            alt={doc.name}
                            className="max-w-full max-h-full mx-auto object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <FileText className="w-24 h-24 mb-4" />
                            <p className="text-lg mb-4">
                              Preview not available
                            </p>
                            <Button onClick={() => handleDownload(doc)}>
                              <Download className="w-4 h-4 mr-2" />
                              Download File
                            </Button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg h-8 px-3.5 flex items-center gap-1.5"
                  onClick={() => handleDownload(doc)}
                >
                  <Download className="h-3.5 w-3.5 text-[var(--theme-color)]" /> Download
                </Button>

                {isEditing && canEditActivities && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg text-xs font-bold h-8 px-3.5 flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Permanently delete <strong>{doc.name}</strong>?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button
                          variant="destructive"
                          onClick={() => handleRemoveDocument(index)}
                        >
                          Delete Forever
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default DocumentsList;

// ================================ //
//
// For Production
//
// ================================ //

// src/components/ActivityAndHistory/DocumentsList.tsx
// import { Button } from "@/components/ui/button";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogTrigger,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   AlertDialog,
//   AlertDialogTrigger,
//   AlertDialogContent,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogCancel,
// } from "@/components/ui/alert-dialog";
// import { FileText, Eye, Download, Trash2 } from "lucide-react";
// import axiosInstance from "@/api/axiosInstance";
// import { useAuth } from "@/contexts/AuthContext";

// interface Document {
//   id: number;
//   name: string;
//   type: string;
//   document_name?: string;
// }

// interface DocumentsListProps {
//   activityStates: any;
//   isEditing: boolean;
//   hasPermission: (perm: string) => boolean;
//   handleRemoveDocument: (index: number) => Promise<void>;
//   leadId: number;
// }

// const API_PUBLIC_BASE =
//   "https://intelliworkz.digital/api/public/documents/lead/";

// const DocumentsList: React.FC<DocumentsListProps> = ({
//   activityStates,
//   isEditing,
//   hasPermission,
//   handleRemoveDocument,
//   leadId,
// }) => {
//   const { token } = useAuth();
//   const documents = activityStates?.documents?.documents || [];

//   const canDelete = isEditing && hasPermission("create_leads");

//   const getDocumentUrl = (doc: Document) => {
//     const filename = doc.document_name || doc.name;
//     return `${API_PUBLIC_BASE}${encodeURIComponent(filename)}`;
//   };

//   const handleDownload = async (doc: Document) => {
//     if (!token) return;

//     try {
//       const response = await axiosInstance.get(
//         `/leads/${leadId}/documents/${doc.id}`,
//         {
//           responseType: "blob",
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement("a");
//       link.href = url;
//       link.setAttribute("download", doc.name);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//     } catch (err) {
//       console.error("Download failed", err);
//     }
//   };

//   if (documents.length === 0) {
//     return (
//       <Card className="border-dashed border-2">
//         <CardContent className="py-16 text-center">
//           <p className="text-gray-500 text-lg">No documents uploaded yet.</p>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card>
//       <CardHeader>
//         <div className="flex items-center gap-3">
//           <FileText className="h-8 w-8 text-green-600" />
//           <CardTitle className="text-2xl">
//             Documents ({documents.length})
//           </CardTitle>
//         </div>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         {documents.map((doc, index) => {
//           const url = getDocumentUrl(doc);
//           const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(
//             doc.type.toLowerCase()
//           );
//           const isPdf = doc.type.toLowerCase() === "pdf";
//           const canPreview = isImage || isPdf;

//           return (
//             <div
//               key={doc.id}
//               className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow"
//             >
//               <div className="flex items-center gap-4">
//                 <FileText className="h-12 w-12 text-green-600" />
//                 <div>
//                   <p className="text-xl font-bold text-gray-800">{doc.name}</p>
//                   <p className="text-sm text-gray-600">
//                     {doc.type.toUpperCase()}
//                   </p>
//                 </div>
//               </div>

//               <div className="flex gap-3">
//                 {canPreview && (
//                   <Dialog>
//                     <DialogTrigger asChild>
//                       <Button
//                         size="lg"
//                         className="bg-blue-600 hover:bg-blue-700"
//                       >
//                         <Eye className="mr-2 h-5 w-5" /> View
//                       </Button>
//                     </DialogTrigger>
//                     <DialogContent className="max-w-6xl max-h-screen p-0 overflow-hidden">
//                       <DialogHeader className="p-6 border-b bg-gray-50">
//                         <DialogTitle className="text-2xl">
//                           {doc.name}
//                         </DialogTitle>
//                       </DialogHeader>

//                       <div className="relative w-full h-[85vh] bg-white">
//                         {isPdf ? (
//                           <iframe
//                             src={url}
//                             className="w-full h-full border-0"
//                             title={doc.name}
//                             allowFullScreen
//                           />
//                         ) : isImage ? (
//                           <img
//                             src={url}
//                             alt={doc.name}
//                             className="max-w-full max-h-full mx-auto object-contain"
//                           />
//                         ) : (
//                           <div className="flex flex-col items-center justify-center h-full text-gray-500">
//                             <FileText className="w-24 h-24 mb-4" />
//                             <p className="text-lg mb-4">
//                               Preview not available
//                             </p>
//                             <Button onClick={() => handleDownload(doc)}>
//                               <Download className="w-4 h-4 mr-2" />
//                               Download File
//                             </Button>
//                           </div>
//                         )}
//                       </div>
//                     </DialogContent>
//                   </Dialog>
//                 )}

//                 <Button
//                   size="lg"
//                   variant="outline"
//                   className="border-green-600 text-green-600 hover:bg-green-50"
//                   onClick={() => handleDownload(doc)}
//                 >
//                   <Download className="mr-2 h-5 w-5" /> Download
//                 </Button>

//                 <AlertDialog>
//                   <AlertDialogTrigger asChild>
//                     <Button
//                       size="lg"
//                       variant="destructive"
//                       disabled={!canDelete}
//                     >
//                       <Trash2 className="mr-2 h-5 w-5" /> Delete
//                     </Button>
//                   </AlertDialogTrigger>
//                   <AlertDialogContent>
//                     <AlertDialogHeader>
//                       <AlertDialogTitle>Delete Document?</AlertDialogTitle>
//                       <AlertDialogDescription>
//                         Permanently delete <strong>{doc.name}</strong>?
//                       </AlertDialogDescription>
//                     </AlertDialogHeader>
//                     <AlertDialogFooter>
//                       <AlertDialogCancel>Cancel</AlertDialogCancel>
//                       <Button
//                         variant="destructive"
//                         onClick={() => handleRemoveDocument(index)}
//                       >
//                         Delete Forever
//                       </Button>
//                     </AlertDialogFooter>
//                   </AlertDialogContent>
//                 </AlertDialog>
//               </div>
//             </div>
//           );
//         })}
//       </CardContent>
//     </Card>
//   );
// };

// export default DocumentsList;
