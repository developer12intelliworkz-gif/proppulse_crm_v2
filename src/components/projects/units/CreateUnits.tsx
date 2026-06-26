// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { DialogClose } from "@/components/ui/dialog";

// const CreateUnits = () => {
//   const [formData, setFormData] = useState({
//     project: "",
//     tower: "",
//     unitConfig: "",
//     propertyPurpose: "Sale",
//     name: "",
//     floor: 0,
//     baseRate: 0,
//     type: "",
//     category: "",
//     bedrooms: 0,
//     bathrooms: 0,
//     carpetArea: 0,
//     saleableArea: 0,
//     loading: 0,
//     description: "",
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSave = () => {
//     console.log(formData);
//   };

//   return (
//     <div className="p-6">
//       <div className="space-y-4">
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Project *
//             </label>
//             <Input
//               name="project"
//               value={formData.project}
//               onChange={handleChange}
//               placeholder="Select a Project"
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Tower *
//             </label>
//             <Input
//               name="tower"
//               value={formData.tower}
//               onChange={handleChange}
//               placeholder="Select a Project Tower"
//               className="mt-1"
//             />
//           </div>
//         </div>
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Unit Config *
//             </label>
//             <Input
//               name="unitConfig"
//               value={formData.unitConfig}
//               onChange={handleChange}
//               placeholder="Select a Floor Plan"
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Property Purpose *
//             </label>
//             <select
//               name="propertyPurpose"
//               value={formData.propertyPurpose}
//               onChange={handleChange}
//               className="mt-1 w-full p-2 border rounded"
//             >
//               <option value="Sale">Sale</option>
//               <option value="Rent">Rent</option>
//             </select>
//           </div>
//         </div>
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Name *
//             </label>
//             <Input
//               name="name"
//               value={formData.name}
//               onChange={handleChange}
//               placeholder="Unit Name"
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Floor *
//             </label>
//             <Input
//               name="floor"
//               type="number"
//               value={formData.floor}
//               onChange={handleChange}
//               className="mt-1"
//             />
//           </div>
//         </div>
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Base Rate *
//             </label>
//             <Input
//               name="baseRate"
//               type="number"
//               value={formData.baseRate}
//               onChange={handleChange}
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Type
//             </label>
//             <Input
//               name="type"
//               value={formData.type}
//               onChange={handleChange}
//               className="mt-1"
//             />
//           </div>
//         </div>
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Category
//             </label>
//             <Input
//               name="category"
//               value={formData.category}
//               onChange={handleChange}
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Bedrooms
//             </label>
//             <Input
//               name="bedrooms"
//               type="number"
//               value={formData.bedrooms}
//               onChange={handleChange}
//               className="mt-1"
//             />
//           </div>
//         </div>
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Bathrooms
//             </label>
//             <Input
//               name="bathrooms"
//               type="number"
//               value={formData.bathrooms}
//               onChange={handleChange}
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Carpet Area
//             </label>
//             <Input
//               name="carpetArea"
//               type="number"
//               value={formData.carpetArea}
//               onChange={handleChange}
//               placeholder="0.0"
//               className="mt-1"
//             />
//           </div>
//         </div>
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Saleable Area
//             </label>
//             <Input
//               name="saleableArea"
//               type="number"
//               value={formData.saleableArea}
//               onChange={handleChange}
//               placeholder="0.0"
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Loading
//             </label>
//             <Input
//               name="loading"
//               type="number"
//               value={formData.loading}
//               onChange={handleChange}
//               placeholder="0.0"
//               className="mt-1"
//             />
//           </div>
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             Description
//           </label>
//           <textarea
//             name="description"
//             value={formData.description}
//             onChange={handleChange}
//             className="mt-1 w-full p-2 border rounded"
//           />
//         </div>
//         <DialogClose asChild>
//           <Button variant="outline">Cancel</Button>
//         </DialogClose>
//         <Button onClick={handleSave} className="mt-4 mx-1">
//           Save
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default CreateUnits;

// CreateUnits.tsx - Updated (modal-friendly, with props for hierarchy)
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axiosInstance from "@/api/axiosInstance";

interface CreateUnitsProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  towerId: string;
  floorId: string;
  onSuccess: () => void; // Refresh list
}

const CreateUnits = ({
  isOpen,
  onClose,
  projectId,
  towerId,
  floorId,
  onSuccess,
}: CreateUnitsProps) => {
  const [formData, setFormData] = useState({
    unit_number: "",
    facing: "",
    is_corner: false,
    plc_applicable: false,
    floor_rise_applicable: true,
    status: "available",
    remarks: "",
  });
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [projectUnits, setProjectUnits] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen || !projectId) return;
    const loadUnits = async () => {
      try {
        const res = await axiosInstance.get(`/projects/${projectId}/units`);
        const rows = res.data?.data ?? [];
        setProjectUnits(
          (Array.isArray(rows) ? rows : []).map((row: { unit_number?: string }) =>
            String(row.unit_number ?? "").trim().toUpperCase(),
          ),
        );
      } catch {
        setProjectUnits([]);
      }
    };
    void loadUnits();
  }, [isOpen, projectId]);

  const handleUnitNumberChange = (value: string) => {
    setFormData((prev) => ({ ...prev, unit_number: value }));
    const normalized = value.trim().toUpperCase();
    if (!normalized) {
      setDuplicateError(null);
      return;
    }
    setDuplicateError(
      projectUnits.includes(normalized)
        ? "This unit number already exists"
        : null,
    );
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (name === "unit_number") {
      handleUnitNumberChange(value);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateError) return;
    try {
      await axiosInstance.post(
        `/projects/${projectId}/towers/${towerId}/floors/${floorId}/units`,
        formData
      );
      onSuccess(); // Refresh units list
      onClose();
      console.log("Unit created!");
    } catch (err) {
      console.error("Error creating unit:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[90vh] overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>Add Unit to Floor {floorId}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fixed fields */}
          <div>
            <Label>Project ID: {projectId}</Label>
            <Input value={projectId} disabled />
          </div>
          <div>
            <Label>Tower ID: {towerId}</Label>
            <Input value={towerId} disabled />
          </div>
          <div>
            <Label>Floor ID: {floorId}</Label>
            <Input value={floorId} disabled />
          </div>

          {/* Dynamic fields */}
          <div>
            <Label>Unit Number *</Label>
            <Input
              name="unit_number"
              value={formData.unit_number}
              placeholder="e.g., A101"
              onChange={handleChange}
              onBlur={(e) => handleUnitNumberChange(e.target.value)}
              className={duplicateError ? "border-destructive" : undefined}
              required
            />
            {duplicateError && (
              <p className="text-sm text-destructive mt-1">{duplicateError}</p>
            )}
          </div>
          <div>
            <Label>Facing</Label>
            <Input
              name="facing"
              placeholder="North/South"
              onChange={handleChange}
            />
          </div>
          {/* Add checkboxes for is_corner, etc. */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_corner"
              id="is_corner"
              onChange={handleChange}
            />
            <Label htmlFor="is_corner">Corner Unit</Label>
          </div>
          {/* More fields from your original: baseRate, bedrooms, etc. – add as needed */}

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!!duplicateError}>
              Save Unit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUnits;
