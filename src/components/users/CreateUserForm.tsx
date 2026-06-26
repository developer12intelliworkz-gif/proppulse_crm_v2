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
// import { toast } from "sonner";
// import axiosInstance from "@/api/axiosInstance";
// import {
//   validateEmail,
//   validateFileType,
//   validateFileSize,
//   sanitizeText,
// } from "@/utils/inputSanitization";

// interface CreateUserFormProps {
//   onClose: () => void;
//   onUserCreated: () => void;
// }

// interface Role {
//   id: string;
//   name: string;
//   permissions: string[];
//   is_active: boolean;
// }

// const validateName = (name: string): boolean => /^[A-Za-z\s]+$/.test(name);
// const validatePhoneNumber = (phone: string): boolean => /^\d{10}$/.test(phone);
// const validatePassword = (password: string): boolean => {
//   return (
//     password.length >= 8 &&
//     /[A-Z]/.test(password) &&
//     /[a-z]/.test(password) &&
//     /[0-9]/.test(password) &&
//     /[^A-Za-z0-9]/.test(password)
//   );
// };

// const CreateUserForm = ({ onClose, onUserCreated }: CreateUserFormProps) => {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [phone, setPhone] = useState("");
//   const [password, setPassword] = useState("");
//   const [roleId, setRoleId] = useState<string | null>(null);
//   const [status, setStatus] = useState("true");
//   const [photo, setPhoto] = useState<File | null>(null);
//   const [photoPreview, setPhotoPreview] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [apiError, setApiError] = useState<string | null>(null);
//   const [roles, setRoles] = useState<Role[]>([]);
//   const [submitAttempted, setSubmitAttempted] = useState(false);

//   const [errors, setErrors] = useState<{
//     name: string | null;
//     email: string | null;
//     phone: string | null;
//     password: string | null;
//     role: string | null;
//     photo: string | null;
//   }>({
//     name: null,
//     email: null,
//     phone: null,
//     password: null,
//     role: null,
//     photo: null,
//   });

//   const [touched, setTouched] = useState<{
//     name: boolean;
//     email: boolean;
//     phone: boolean;
//     password: boolean;
//     role: boolean;
//   }>({
//     name: false,
//     email: false,
//     phone: false,
//     password: false,
//     role: false,
//   });

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
//             permissions: details.permissions,
//             is_active: details.status,
//           })
//         );
//         setRoles(rolesData);
//         if (rolesData.length > 0) setRoleId(rolesData[0].id); // Default to first role
//       } catch (err: any) {
//         console.error("Failed to fetch roles:", err);
//         setApiError(
//           "Failed to load roles. Defaulting to first available role."
//         );
//         toast.error(
//           "Failed to load roles. Defaulting to first available role."
//         );
//       }
//     };
//     fetchRoles();
//   }, []);

//   useEffect(() => {
//     const newErrors: typeof errors = { ...errors, photo: errors.photo }; // Preserve photo error as it's handled separately

//     if (!name) {
//       newErrors.name = "Full Name is required";
//     } else if (!validateName(name)) {
//       newErrors.name = "Name must contain only alphabets and spaces";
//     } else {
//       newErrors.name = null;
//     }

//     if (!email) {
//       newErrors.email = "Email is required";
//     } else if (!validateEmail(email)) {
//       newErrors.email =
//         "Please enter a valid email address (e.g., name@example.com)";
//     } else {
//       newErrors.email = null;
//     }

//     if (!phone) {
//       newErrors.phone = "Phone Number is required";
//     } else if (!validatePhoneNumber(phone)) {
//       newErrors.phone = "Please enter a valid phone number (exactly 10 digits)";
//     } else {
//       newErrors.phone = null;
//     }

//     if (!password) {
//       newErrors.password = "Password is required";
//     } else if (!validatePassword(password)) {
//       newErrors.password =
//         "Password must be at least 8 characters long, including uppercase, lowercase, number, and special character";
//     } else {
//       newErrors.password = null;
//     }

//     if (!roleId) {
//       newErrors.role = "Role is required";
//     } else {
//       newErrors.role = null;
//     }

//     setErrors(newErrors);
//   }, [name, email, phone, password, roleId]);

//   const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const val = e.target.value.replace(/[^A-Za-z\s]/g, "");
//     setName(val);
//     setTouched((prev) => ({ ...prev, name: true }));
//   };

//   const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setEmail(e.target.value);
//     setTouched((prev) => ({ ...prev, email: true }));
//   };

//   const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const val = e.target.value.replace(/[^0-9]/g, "");
//     setPhone(val);
//     setTouched((prev) => ({ ...prev, phone: true }));
//   };

//   const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setPassword(e.target.value);
//     setTouched((prev) => ({ ...prev, password: true }));
//   };

//   const handleRoleChange = (value: string) => {
//     setRoleId(value);
//     setTouched((prev) => ({ ...prev, role: true }));
//   };

//   const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
//       if (!validateFileType(file, allowedTypes)) {
//         setErrors((prev) => ({
//           ...prev,
//           photo: "Please select a valid image file (JPEG, PNG, or WebP)",
//         }));
//         toast.error("Please select a valid image file (JPEG, PNG, or WebP)");
//         return;
//       }
//       if (!validateFileSize(file, 2)) {
//         setErrors((prev) => ({
//           ...prev,
//           photo: "File size exceeds 2MB limit",
//         }));
//         toast.error("File size exceeds 2MB limit");
//         return;
//       }
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         const arrayBuffer = event.target?.result as ArrayBuffer;
//         const uint8Array = new Uint8Array(arrayBuffer);
//         if (
//           file.type === "image/jpeg" &&
//           (uint8Array[0] !== 0xff || uint8Array[1] !== 0xd8)
//         ) {
//           setErrors((prev) => ({ ...prev, photo: "Invalid JPEG file" }));
//           toast.error("Invalid JPEG file");
//           return;
//         }
//         if (
//           file.type === "image/png" &&
//           (uint8Array[0] !== 0x89 ||
//             uint8Array[1] !== 0x50 ||
//             uint8Array[2] !== 0x4e ||
//             uint8Array[3] !== 0x47)
//         ) {
//           setErrors((prev) => ({ ...prev, photo: "Invalid PNG file" }));
//           toast.error("Invalid PNG file");
//           return;
//         }
//         setPhoto(file);
//         const previewReader = new FileReader();
//         previewReader.onloadend = () => {
//           setPhotoPreview(previewReader.result as string);
//         };
//         previewReader.readAsDataURL(file);
//         setErrors((prev) => ({ ...prev, photo: null }));
//       };
//       reader.readAsArrayBuffer(file.slice(0, 8));
//     }
//   };

//   const hasErrors = Object.values(errors).some((error) => error !== null);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setSubmitAttempted(true);
//     setLoading(true);
//     setApiError(null);

//     if (hasErrors) {
//       toast.error("Please correct the errors before submitting");
//       setLoading(false);
//       return;
//     }

//     const sanitizedName = sanitizeText(name);
//     const sanitizedEmail = sanitizeText(email);
//     const sanitizedPhone = sanitizeText(phone);
//     const sanitizedPassword = sanitizeText(password);

//     try {
//       const formData = new FormData();
//       formData.append("name", sanitizedName);
//       formData.append("email", sanitizedEmail);
//       formData.append("phone", sanitizedPhone);
//       formData.append("password", sanitizedPassword);
//       formData.append("roles_permissions_id", roleId!);
//       formData.append("status", status);
//       if (photo) {
//         formData.append("photo", photo);
//       }

//       await axiosInstance.post("/users", formData, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
//         },
//       });

//       toast.success("User created successfully", { duration: 3000 });
//       onUserCreated();
//       setName("");
//       setEmail("");
//       setPhone("");
//       setPassword("");
//       setRoleId(roles[0]?.id || null);
//       setStatus("true");
//       setPhoto(null);
//       setPhotoPreview(null);
//       onClose();
//     } catch (error: any) {
//       const errorMsg = error.response?.data?.error || "Failed to create user";
//       setApiError(errorMsg);
//       toast.error(errorMsg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const showError = (field: keyof typeof errors) =>
//     (touched[field as keyof typeof touched] || submitAttempted) &&
//     errors[field];

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       {apiError && (
//         <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
//           {apiError}
//         </div>
//       )}
//       <div>
//         <Label htmlFor="name">Full Name*</Label>
//         <Input id="name" value={name} onChange={handleNameChange} required />
//         {showError("name") && (
//           <p className="text-red-500 text-sm mt-1">{errors.name}</p>
//         )}
//       </div>
//       <div>
//         <Label htmlFor="email">Email*</Label>
//         <Input
//           id="email"
//           type="email"
//           value={email}
//           onChange={handleEmailChange}
//           required
//         />
//         {showError("email") && (
//           <p className="text-red-500 text-sm mt-1">{errors.email}</p>
//         )}
//       </div>
//       <div>
//         <Label htmlFor="phone">Phone Number*</Label>
//         <Input id="phone" value={phone} onChange={handlePhoneChange} required />
//         {showError("phone") && (
//           <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
//         )}
//       </div>
//       <div>
//         <Label htmlFor="password">Password*</Label>
//         <Input
//           id="password"
//           type="password"
//           value={password}
//           onChange={handlePasswordChange}
//           required
//         />
//         {showError("password") && (
//           <p className="text-red-500 text-sm mt-1">{errors.password}</p>
//         )}
//       </div>
//       <div>
//         <Label htmlFor="photo">Profile Photo</Label>
//         <Input
//           id="photo"
//           type="file"
//           accept="image/*"
//           onChange={handlePhotoChange}
//         />
//         {errors.photo && (
//           <p className="text-red-500 text-sm mt-1">{errors.photo}</p>
//         )}
//         {photoPreview && (
//           <div className="mt-2">
//             <img
//               src={photoPreview}
//               alt="Profile preview"
//               className="w-24 h-24 object-cover rounded-full"
//             />
//           </div>
//         )}
//       </div>
//       <div>
//         <Label htmlFor="role">Role*</Label>
//         <Select value={roleId || ""} onValueChange={handleRoleChange}>
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
//         {showError("role") && (
//           <p className="text-red-500 text-sm mt-1">{errors.role}</p>
//         )}
//       </div>
//       <div>
//         <Label htmlFor="status">Status*</Label>
//         <Select value={status} onValueChange={setStatus}>
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
//         <Button type="button" variant="outline" onClick={onClose}>
//           Cancel
//         </Button>
//         <Button type="submit" disabled={loading || hasErrors}>
//           {loading ? "Creating..." : "Create User"}
//         </Button>
//       </div>
//     </form>
//   );
// };

// export default CreateUserForm;

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
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import {
  validateEmail,
  validateFileType,
  validateFileSize,
  sanitizeText,
} from "@/utils/inputSanitization";
import { formatRoleDisplayName } from "@/utils/formatDisplayName";

interface CreateUserFormProps {
  onClose: () => void;
  onUserCreated: () => void;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
  is_active: boolean;
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

const CreateUserForm = ({ onClose, onUserCreated }: CreateUserFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<string | null>(null);
  const [status, setStatus] = useState("true");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [errors, setErrors] = useState<{
    name: string | null;
    email: string | null;
    phone: string | null;
    password: string | null;
    role: string | null;
    photo: string | null;
  }>({
    name: null,
    email: null,
    phone: null,
    password: null,
    role: null,
    photo: null,
  });

  const [touched, setTouched] = useState<{
    name: boolean;
    email: boolean;
    phone: boolean;
    password: boolean;
    role: boolean;
  }>({
    name: false,
    email: false,
    phone: false,
    password: false,
    role: false,
  });

  // Fetch Roles
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
            permissions: details.permissions,
            is_active: details.status,
          }),
        );
        setRoles(rolesData);
      } catch (err: any) {
        console.error("Failed to fetch roles:", err);
        // toast.error("Failed to load roles.");
      }
    };
    fetchRoles();
  }, []);

  // Validation Logic
  useEffect(() => {
    const newErrors: typeof errors = { ...errors, photo: errors.photo };

    // Name Validation
    if (!name) {
      newErrors.name = "Full Name is required";
    } else if (!validateName(name)) {
      newErrors.name = "Name must contain only alphabets and spaces";
    } else {
      newErrors.name = null;
    }

    // Email Validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email =
        "Please enter a valid email address (e.g., name@example.com)";
    } else {
      newErrors.email = null;
    }

    // Phone Validation
    if (!phone) {
      newErrors.phone = "Phone Number is required";
    } else if (!validatePhoneNumber(phone)) {
      newErrors.phone = "Please enter a valid phone number (exactly 10 digits)";
    } else {
      newErrors.phone = null;
    }

    // Password Validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (!validatePassword(password)) {
      newErrors.password =
        "Password must be at least 8 characters long, including uppercase, lowercase, number, and special character";
    } else {
      newErrors.password = null;
    }

    if (!roleId) {
      newErrors.role = "Please select a role";
    } else {
      newErrors.role = null;
    }

    setErrors(newErrors);
  }, [name, email, phone, password, roleId]);

  // Change Handlers
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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setTouched((prev) => ({ ...prev, password: true }));
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
        previewReader.onloadend = () =>
          setPhotoPreview(previewReader.result as string);
        previewReader.readAsDataURL(file);
        setErrors((prev) => ({ ...prev, photo: null }));
      };
      reader.readAsArrayBuffer(file.slice(0, 8));
    }
  };

  const hasFieldErrors = Object.values(errors).some((error) => error !== null);

  const isFormComplete =
    name.trim().length > 0 &&
    validateName(name.trim()) &&
    email.trim().length > 0 &&
    validateEmail(email.trim()) &&
    phone.trim().length > 0 &&
    validatePhoneNumber(phone.trim()) &&
    password.length > 0 &&
    validatePassword(password) &&
    Boolean(roleId) &&
    Boolean(status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setApiError(null);

    if (!isFormComplete || hasFieldErrors) {
      return;
    }

    setLoading(true);

    const sanitizedName = sanitizeText(name);
    const sanitizedEmail = sanitizeText(email);
    const sanitizedPhone = sanitizeText(phone);
    const sanitizedPassword = sanitizeText(password);

    try {
      const formData = new FormData();
      formData.append("name", sanitizedName);
      formData.append("email", sanitizedEmail);
      formData.append("phone", sanitizedPhone);
      formData.append("password", sanitizedPassword);
      formData.append("roles_permissions_id", roleId!);
      formData.append("status", status);
      if (photo) formData.append("photo", photo);

      await axiosInstance.post("/users", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      // toast.success("User created successfully");
      onUserCreated();
      onClose();

      // Reset Form
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRoleId(null);
      setStatus("true");
      setPhoto(null);
      setPhotoPreview(null);
      setSubmitAttempted(false);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to create user";
      const isValidationSummary = /all fields are required/i.test(errorMsg);
      if (!isValidationSummary) {
        setApiError(errorMsg);
        // toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const showError = (field: keyof typeof errors) => {
    if (field === "role") {
      return (touched.role || submitAttempted) && errors.role;
    }
    return (
      (touched[field as keyof typeof touched] || submitAttempted) &&
      errors[field]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {apiError}
        </div>
      )}

      <div>
        <Label htmlFor="name">Full Name*</Label>
        <Input id="name" value={name} onChange={handleNameChange} required />
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
          autoComplete="off"
          required
        />
        {showError("email") && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">Phone Number*</Label>
        <Input id="phone" value={phone} onChange={handlePhoneChange} required />
        {showError("phone") && (
          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password*</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={handlePasswordChange}
          autoComplete="new-password"
          required
        />
        {showError("password") && (
          <p className="text-red-500 text-sm mt-1">{errors.password}</p>
        )}
      </div>

      <div>
        <Label htmlFor="photo">Profile Photo</Label>
        <Input
          id="photo"
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
        />
        {errors.photo && (
          <p className="text-red-500 text-sm mt-1">{errors.photo}</p>
        )}
        {photoPreview && (
          <div className="mt-2">
            <img
              src={photoPreview}
              alt="Preview"
              className="w-24 h-24 object-cover rounded-full"
            />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="role">Role*</Label>
        <Select
          value={roleId ?? undefined}
          onValueChange={handleRoleChange}
        >
          <SelectTrigger id="role">
            <SelectValue placeholder="Select a role" />
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
        <Select value={status} onValueChange={setStatus}>
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
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !isFormComplete}>
          {loading ? "Creating..." : "Create User"}
        </Button>
      </div>
    </form>
  );
};

export default CreateUserForm;
