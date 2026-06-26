// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { DialogClose } from "@/components/ui/dialog";
// import { useAuth } from "@/contexts/AuthContext";
// import { toast } from "sonner";
// import axiosInstance from "@/api/axiosInstance";

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
//   role: string;
//   status: boolean;
//   photo?: string | null;
//   roles_permissions_id?: string;
// }

// interface Role {
//   id: string;
//   name: string;
//   permissions: string[];
//   is_active: boolean;
// }

// interface EditUserFormProps {
//   user: User;
//   onClose: () => void;
//   onUserUpdated: () => void;
// }

// const EditUserForm = ({ user, onClose, onUserUpdated }: EditUserFormProps) => {
//   const { user: currentUser, refreshPermissions } = useAuth();
//   const [name, setName] = useState(user?.name || "");
//   const [email, setEmail] = useState(user?.email || "");
//   const [phone, setPhone] = useState(user?.phone || "");
//   const [roleId, setRoleId] = useState<string | null>(null);
//   const [status, setStatus] = useState(user?.status ? "true" : "false");
//   const [photo, setPhoto] = useState<File | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState(false);
//   const [roles, setRoles] = useState<Role[]>([]);

//   useEffect(() => {
//     const fetchRoles = async () => {
//       try {
//         const response = await axiosInstance.get("/roles-permissions", {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
//           },
//         });
//         const rolesData = Object.entries(response.data).map(
//           ([id, details]: [string, any]) => ({
//             id,
//             name: details.role_name,
//             permissions: details.permissions || [],
//             is_active: details.status,
//           })
//         );
//         setRoles(rolesData);
//         // Prioritize roles_permissions_id, fallback to role name matching
//         const userRole = rolesData.find(
//           (r) =>
//             r.id === user.roles_permissions_id ||
//             r.name.toLowerCase() === user.role.toLowerCase()
//         );
//         if (userRole) {
//           setRoleId(userRole.id);
//         } else if (rolesData.length > 0) {
//           setRoleId(rolesData[0].id);
//           setError("User role not found; defaulting to first available role.");
//           toast.error(
//             "User role not found; defaulting to first available role."
//           );
//         } else {
//           setError("No roles available.");
//           toast.error("No roles available.");
//         }
//       } catch (err: any) {
//         console.error("Failed to fetch roles:", err);
//         setError("Failed to load roles.");
//         toast.error("Failed to load roles.");
//       }
//     };
//     fetchRoles();

//     setName(user?.name || "");
//     setEmail(user?.email || "");
//     setPhone(user?.phone || "");
//     setStatus(user?.status ? "true" : "false");
//   }, [user]);

//   const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       if (file.size > 2 * 1024 * 1024) {
//         setError("File size exceeds 2MB limit");
//         toast.error("File size exceeds 2MB limit");
//         return;
//       }
//       if (!file.type.startsWith("image/")) {
//         setError("Please select an image file");
//         toast.error("Please select an image file");
//         return;
//       }
//       setPhoto(file);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);
//     setSuccess(false);

//     if (!name || !email || !phone || !roleId || !status) {
//       setError("Name, email, phone, role, and status are required");
//       toast.error("Name, email, phone, role, and status are required");
//       setLoading(false);
//       return;
//     }

//     try {
//       const formData = new FormData();
//       formData.append("name", name);
//       formData.append("email", email);
//       formData.append("phone", phone);
//       formData.append("roles_permissions_id", roleId);
//       formData.append("status", status);
//       if (photo) {
//         formData.append("photo", photo);
//       }

//       await axiosInstance.put(`/users/${user.id}`, formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//           Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
//         },
//       });

//       await refreshPermissions();

//       setSuccess(true);
//       toast.success("User updated successfully");
//       onUserUpdated();
//       setTimeout(() => {
//         setSuccess(false);
//         onClose();
//       }, 2000);
//     } catch (error: any) {
//       const errMsg = error.response?.data?.error || "Failed to update user";
//       setError(errMsg);
//       toast.error(errMsg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const isAdmin = currentUser?.role === "admin";
//   const canEdit = isAdmin;

//   if (!canEdit) {
//     return (
//       <div className="text-center py-8">
//         <h3 className="text-lg font-semibold text-gray-900 mb-2">
//           Access Denied
//         </h3>
//         <p className="text-gray-600">Only admins can edit users.</p>
//       </div>
//     );
//   }

//   if (success) {
//     return (
//       <div className="text-center py-8">
//         <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
//           <svg
//             className="w-6 h-6 text-green-600"
//             fill="none"
//             stroke="currentColor"
//             viewBox="0 0 24 24"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth="2"
//               d="M5 13l4 4L19 7"
//             />
//           </svg>
//         </div>
//         <h3 className="text-lg font-semibold text-gray-900 mb-2">
//           User Updated Successfully!
//         </h3>
//         <p className="text-gray-600">The user profile has been updated.</p>
//       </div>
//     );
//   }

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       {error && (
//         <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
//           {error}
//         </div>
//       )}
//       <div>
//         <Label htmlFor="name">Full Name</Label>
//         <Input
//           id="name"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           disabled={!canEdit}
//           required
//         />
//       </div>
//       <div>
//         <Label htmlFor="email">Email</Label>
//         <Input
//           id="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           disabled={!canEdit}
//           required
//         />
//       </div>
//       <div>
//         <Label htmlFor="phone">Phone Number</Label>
//         <Input
//           id="phone"
//           value={phone}
//           onChange={(e) => setPhone(e.target.value)}
//           disabled={!canEdit}
//           required
//         />
//       </div>
//       <div>
//         <Label htmlFor="photo">Profile Photo</Label>
//         <Input
//           id="photo"
//           type="file"
//           accept="image/*"
//           onChange={handlePhotoChange}
//           disabled={!canEdit}
//         />
//       </div>
//       <div>
//         <Label htmlFor="role">Role</Label>
//         <Select
//           value={roleId || ""}
//           onValueChange={setRoleId}
//           disabled={!canEdit || roles.length === 0}
//         >
//           <SelectTrigger id="role">
//             <SelectValue placeholder="Select role" />
//           </SelectTrigger>
//           <SelectContent>
//             {roles.map((r) => (
//               <SelectItem key={r.id} value={r.id}>
//                 {r.name}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </div>
//       <div>
//         <Label htmlFor="status">Status</Label>
//         <Select value={status} onValueChange={setStatus} disabled={!canEdit}>
//           <SelectTrigger id="status">
//             <SelectValue placeholder="Select status" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="true">Active</SelectItem>
//             <SelectItem value="false">Inactive</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>
//       <div className="flex justify-end gap-3">
//         <DialogClose asChild>
//           <Button variant="outline">Cancel</Button>
//         </DialogClose>
//         <Button type="submit" disabled={!canEdit || loading || !roleId}>
//           {loading ? "Saving..." : "Save Changes"}
//         </Button>
//       </div>
//     </form>
//   );
// };

// export default EditUserForm;

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogClose } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import {
  validateEmail,
  validateFileType,
  validateFileSize,
  sanitizeText,
} from "@/utils/inputSanitization";
import { SECURITY_CONFIG } from "@/config/security";
import { formatRoleDisplayName } from "@/utils/formatDisplayName";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: boolean;
  photo?: string | null;
  roles_permissions_id?: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
  is_active: boolean;
}

interface EditUserFormProps {
  user: User;
  onClose: () => void;
  onUserUpdated: () => void;
}

const validateName = (name: string): boolean => /^[A-Za-z\s]+$/.test(name);
const validatePhoneNumber = (phone: string): boolean => /^\d{10}$/.test(phone);
const validatePassword = (password: string): boolean => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
};

const PHOTO_BASE_URL = `${SECURITY_CONFIG.ONLY_URL}/public/profile_photos/`;

const getPhotoUrl = (photo: string | null | undefined): string => {
  if (!photo) return "";
  try {
    const filename = photo.includes("http") ? photo.split("/").pop() : photo;
    if (!filename) return "";
    return `${PHOTO_BASE_URL}${filename}`;
  } catch {
    return "";
  }
};

const EditUserForm = ({ user, onClose, onUserUpdated }: EditUserFormProps) => {
  const { user: currentUser, refreshPermissions } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [roleId, setRoleId] = useState<string | null>(
    user?.roles_permissions_id || null
  );
  const [status, setStatus] = useState(user?.status ? "true" : "false");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    user?.photo ? getPhotoUrl(user.photo) : null
  );
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [errors, setErrors] = useState<{
    name: string | null;
    email: string | null;
    phone: string | null;
    role: string | null;
    photo: string | null;
  }>({
    name: null,
    email: null,
    phone: null,
    role: null,
    photo: null,
  });

  const [touched, setTouched] = useState<{
    name: boolean;
    email: boolean;
    phone: boolean;
    role: boolean;
  }>({
    name: false,
    email: false,
    phone: false,
    role: false,
  });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axiosInstance.get("/roles-permissions", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        });
        const rolesData = Object.entries(response.data).map(
          ([id, details]: [string, any]) => ({
            id,
            name: formatRoleDisplayName(details.role_name ?? id),
            permissions: details.permissions || [],
            is_active: details.status,
          })
        );
        setRoles(rolesData);
        // Set the user's current role if available
        if (user.roles_permissions_id) {
          setRoleId(user.roles_permissions_id);
        } else {
          const userRole = rolesData.find(
            (r) => r.name.toLowerCase() === user.role.toLowerCase()
          );
          if (userRole) {
            setRoleId(userRole.id);
          } else if (rolesData.length > 0) {
            setRoleId(rolesData[0].id);
            setApiError(
              "User role not found; defaulting to first available role."
            );
            // toast.error(
              // "User role not found; defaulting to first available role."
            // );
          } else {
            setApiError("No roles available.");
            // toast.error("No roles available.");
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch roles:", err);
        setApiError("Failed to load roles.");
        // toast.error("Failed to load roles.");
      }
    };
    fetchRoles();
  }, [user]);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(user?.photo ? getPhotoUrl(user.photo) : null);
    }
  }, [user, photo]);

  useEffect(() => {
    const newErrors: typeof errors = { ...errors, photo: errors.photo };

    if (!name) {
      newErrors.name = "Full Name is required";
    } else if (!validateName(name)) {
      newErrors.name = "Name must contain only alphabets and spaces";
    } else {
      newErrors.name = null;
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email =
        "Please enter a valid email address (e.g., name@example.com)";
    } else {
      newErrors.email = null;
    }

    if (!phone) {
      newErrors.phone = "Phone Number is required";
    } else if (!validatePhoneNumber(phone)) {
      newErrors.phone = "Please enter a valid phone number (exactly 10 digits)";
    } else {
      newErrors.phone = null;
    }

    if (!roleId) {
      newErrors.role = "Role is required";
    } else {
      newErrors.role = null;
    }

    setErrors(newErrors);
  }, [name, email, phone, roleId]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^A-Za-z\s]/g, "");
    setName(val);
    setTouched((prev) => ({ ...prev, name: true }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setTouched((prev) => ({ ...prev, email: true }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setPhone(val);
    setTouched((prev) => ({ ...prev, phone: true }));
  };

  const handleRoleChange = (value: string) => {
    setRoleId(value);
    setTouched((prev) => ({ ...prev, role: true }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validateFileType(file, allowedTypes)) {
        setErrors((prev) => ({
          ...prev,
          photo: "Please select a valid image file (JPEG, PNG, or WebP)",
        }));
        // toast.error("Please select a valid image file (JPEG, PNG, or WebP)");
        return;
      }
      if (!validateFileSize(file, 2)) {
        setErrors((prev) => ({
          ...prev,
          photo: "File size exceeds 2MB limit",
        }));
        // toast.error("File size exceeds 2MB limit");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        if (
          file.type === "image/jpeg" &&
          (uint8Array[0] !== 0xff || uint8Array[1] !== 0xd8)
        ) {
          setErrors((prev) => ({ ...prev, photo: "Invalid JPEG file" }));
          // toast.error("Invalid JPEG file");
          return;
        }
        if (
          file.type === "image/png" &&
          (uint8Array[0] !== 0x89 ||
            uint8Array[1] !== 0x50 ||
            uint8Array[2] !== 0x4e ||
            uint8Array[3] !== 0x47)
        ) {
          setErrors((prev) => ({ ...prev, photo: "Invalid PNG file" }));
          // toast.error("Invalid PNG file");
          return;
        }
        setPhoto(file);
        const previewReader = new FileReader();
        previewReader.onloadend = () => {
          setPhotoPreview(previewReader.result as string);
        };
        previewReader.readAsDataURL(file);
        setErrors((prev) => ({ ...prev, photo: null }));
      };
      reader.readAsArrayBuffer(file.slice(0, 8));
    }
  };

  const hasErrors = Object.values(errors).some((error) => error !== null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setLoading(true);
    setApiError(null);
    setSuccess(false);

    if (hasErrors) {
      // toast.error("Please correct the errors before submitting");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", sanitizeText(name));
      formData.append("email", sanitizeText(email));
      formData.append("phone", sanitizeText(phone));
      formData.append("roles_permissions_id", roleId!);
      formData.append("status", status);
      if (photo) {
        formData.append("photo", photo);
      }

      await axiosInstance.put(`/users/${user.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      await refreshPermissions();

      setSuccess(true);
      // toast.success("User updated successfully");
      onUserUpdated();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (error: any) {
      const errMsg = error.response?.data?.error || "Failed to update user";
      setApiError(errMsg);
      // toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = currentUser?.role === "admin";
  const canEdit = isAdmin;

  const showError = (field: keyof typeof errors) =>
    (touched[field as keyof typeof touched] || submitAttempted) &&
    errors[field];

  if (!canEdit) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Access Denied
        </h3>
        <p className="text-gray-600">Only admins can edit users.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          User Updated Successfully!
        </h3>
        <p className="text-gray-600">The user profile has been updated.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {apiError}
        </div>
      )}
      <div>
        <Label htmlFor="name">Full Name*</Label>
        <Input
          id="name"
          value={name}
          onChange={handleNameChange}
          disabled={!canEdit}
          required
        />
        {showError("name") && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>
      <div>
        <Label htmlFor="email">Email*</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          disabled={!canEdit}
          required
        />
        {showError("email") && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>
      <div>
        <Label htmlFor="phone">Phone Number*</Label>
        <Input
          id="phone"
          value={phone}
          onChange={handlePhoneChange}
          disabled={!canEdit}
          required
        />
        {showError("phone") && (
          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
        )}
      </div>
      <div>
        <Label htmlFor="photo">Profile Photo</Label>
        <Input
          id="photo"
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          disabled={!canEdit}
        />
        {errors.photo && (
          <p className="text-red-500 text-sm mt-1">{errors.photo}</p>
        )}
        {photoPreview ? (
          <div className="mt-2">
            <img
              src={photoPreview}
              alt="Profile preview"
              className="w-24 h-24 object-cover rounded-full"
            />
          </div>
        ) : (
          <div className="mt-2 w-24 h-24 rounded-full border border-dashed border-muted-foreground/40 bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
            No photo
          </div>
        )}
      </div>
      <div>
        <Label htmlFor="role">Role*</Label>
        <Select
          key={roleId}
          value={roleId || ""}
          onValueChange={handleRoleChange}
          disabled={!canEdit || roles.length === 0}
        >
          <SelectTrigger id="role">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showError("role") && (
          <p className="text-red-500 text-sm mt-1">{errors.role}</p>
        )}
      </div>
      <div>
        <Label htmlFor="status">Status*</Label>
        <Select value={status} onValueChange={setStatus} disabled={!canEdit}>
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-3">
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={!canEdit || loading || hasErrors}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};

export default EditUserForm;
