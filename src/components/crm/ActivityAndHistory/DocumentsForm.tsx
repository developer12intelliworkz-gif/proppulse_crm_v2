// import { Button } from "@/components/ui/button";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { FileText } from "lucide-react";
// import { Input } from "@/components/ui/input";
// import { useState } from "react";

// interface DocumentsFormProps {
//   isEditing: boolean;
//   hasPermission: (permission: string) => boolean;
//   handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
// }

// const DocumentsForm: React.FC<DocumentsFormProps> = ({
//   isEditing,
//   hasPermission,
//   handleFileUpload,
// }) => {
//   const [error, setError] = useState<string | null>(null);
//   const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       if (file.size > MAX_FILE_SIZE) {
//         setError("File size exceeds 5MB limit. Please upload a smaller file.");
//         event.target.value = ""; // Clear the input
//         return;
//       }
//       setError(null);
//       handleFileUpload(event);
//     }
//   };

//   return (
//     <Card className="h-full">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <FileText className="h-4 w-4" />
//           Upload Document
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         <div>
//           <Input
//             type="file"
//             accept=".pdf,.docx,.png,.jpeg,.jpg"
//             onChange={handleFileChange}
//             className="w-full mt-1"
//             disabled={!isEditing || !hasPermission("create_leads")}
//           />
//           <p className="text-xs text-muted-foreground mt-1 mb-2">
//             <strong>Note: </strong>Upload in <strong>.png, .jpg, .jpeg</strong>{" "}
//             or <strong>.pdf</strong> and Document{" "}
//             <strong>(Less then 5MB)</strong> format only.
//           </p>
//           {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
//         </div>
//         <p className="text-sm text-gray-500">Upload to add immediately.</p>
//       </CardContent>
//     </Card>
//   );
// };

// export default DocumentsForm;

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface DocumentsFormProps {
  isEditing: boolean;
  canEditActivities: boolean; // ← Replaces hasPermission("create_leads")
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const DocumentsForm: React.FC<DocumentsFormProps> = ({
  isEditing,
  canEditActivities,
  handleFileUpload,
}) => {
  const [error, setError] = useState<string | null>(null);
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError("File size exceeds 5MB limit. Please upload a smaller file.");
        event.target.value = "";
        return;
      }
      setError(null);
      handleFileUpload(event);
    }
  };

  return (
    <Card className="h-full border border-slate-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.01)] rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <div className="p-2 bg-orange-50 text-[var(--theme-color)] border border-orange-100/60 rounded-xl">
          <FileText className="h-4 w-4" />
        </div>
        <CardTitle className="text-base font-bold text-slate-800">
          Upload Document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            type="file"
            accept=".pdf,.docx,.png,.jpeg,.jpg"
            onChange={handleFileChange}
            className="w-full mt-1.5 text-xs h-9 focus-visible:ring-[var(--theme-color)]/30 focus-visible:ring-1 focus-visible:border-[var(--theme-color)] cursor-pointer"
            disabled={!isEditing || !canEditActivities}
          />
          <p className="text-[11px] text-slate-400 mt-1.5 select-none leading-relaxed">
            <strong>Note: </strong>Upload in <strong>.png, .jpg, .jpeg</strong>{" "}
            or <strong>.pdf</strong> format only. Max size: <strong>5MB</strong>
          </p>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
        <p className="text-[11px] font-bold text-[var(--theme-color)] bg-orange-50/50 p-2.5 rounded-xl border border-orange-100/40 select-none inline-block mt-2">
          Upload will add document immediately.
        </p>
      </CardContent>
    </Card>
  );
};

export default DocumentsForm;
