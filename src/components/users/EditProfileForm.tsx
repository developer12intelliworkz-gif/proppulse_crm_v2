import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";
import { getCroppedImg } from "@/utils/cropImage";
import {
  validateEmail,
  validateFileType,
  validateFileSize,
  sanitizeText,
} from "@/utils/inputSanitization";
import { SECURITY_CONFIG } from "@/config/security";

// Define the User type to match the useAuth hook output

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "agent" | "user(sales)";
  phone: string;
  photo?: string | null;
  roles_permissions_id?: string;
}

interface EditProfileFormProps {
  user: User | null;
  onClose: () => void;
}

const validateName = (name: string): boolean => /^[A-Za-z\s]+$/.test(name);
const validatePhoneNumber = (phone: string): boolean => /^\d{10}$/.test(phone);

const EditProfileForm = ({ user, onClose }: EditProfileFormProps) => {
  const { user: currentUser, setUser } = useAuth();
  const [name, setName] = useState(user?.name || currentUser?.name || "");
  const [email, setEmail] = useState(user?.email || currentUser?.email || "");
  const [phone, setPhone] = useState(user?.phone || currentUser?.phone || "");
  const [roles_permissions_id, setRolesPermissionsId] = useState(
    user?.roles_permissions_id || currentUser?.roles_permissions_id || ""
  );
  const [role, setRole] = useState(user?.role || currentUser?.role || "agent");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [errors, setErrors] = useState<{
    name: string | null;
    email: string | null;
    phone: string | null;
    photo: string | null;
  }>({
    name: null,
    email: null,
    phone: null,
    photo: null,
  });

  const [touched, setTouched] = useState<{
    name: boolean;
    email: boolean;
    phone: boolean;
  }>({
    name: false,
    email: false,
    phone: false,
  });

  useEffect(() => {
    const fetchRolesPermissionsId = async () => {
      if (!roles_permissions_id && role) {
        try {
          const response = await axiosInstance.get("/roles-permissions");
          const rolesData = response.data;
          const roleEntry = Object.entries(rolesData).find(
            ([, details]: [string, any]) => details.role_name === role
          );
          if (roleEntry) {
            setRolesPermissionsId(roleEntry[0]);
          } else {
            setApiError("Role not found in database");
            // toast.error("Role not found in database");
          }
        } catch (err) {
          setApiError("Failed to fetch role permissions");
          // toast.error("Failed to fetch role permissions");
        }
      }
    };
    fetchRolesPermissionsId();
  }, [roles_permissions_id, role]);

  useEffect(() => {
    setName(user?.name || currentUser?.name || "");
    setEmail(user?.email || currentUser?.email || "");
    setPhone(user?.phone || currentUser?.phone || "");
    setRole(user?.role || currentUser?.role || "agent");
    setRolesPermissionsId(
      user?.roles_permissions_id || currentUser?.roles_permissions_id || ""
    );
    const initialPhoto = user?.photo || currentUser?.photo;
    if (initialPhoto) {
      const filename = initialPhoto.includes("http")
        ? new URL(initialPhoto).pathname.split("/").pop()
        : initialPhoto;
      setPhotoPreview(
        `${SECURITY_CONFIG.ONLY_URL}/public/profile_photos/${filename}`
      );
    } else {
      setPhotoPreview(null);
    }
  }, [user, currentUser]);

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

    setErrors(newErrors);
  }, [name, email, phone]);

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
        const previewReader = new FileReader();
        previewReader.onloadend = () => {
          if (typeof previewReader.result === "string") {
            setPhotoPreview(previewReader.result);
            setPhoto(file);
            setShowCropper(true);
            setErrors((prev) => ({ ...prev, photo: null }));
          } else {
            setErrors((prev) => ({
              ...prev,
              photo: "Failed to read image file",
            }));
            // toast.error("Failed to read image file");
          }
        };
        previewReader.onerror = () => {
          setErrors((prev) => ({ ...prev, photo: "Error reading image file" }));
          // toast.error("Error reading image file");
        };
        previewReader.readAsDataURL(file);
      };
      reader.readAsArrayBuffer(file.slice(0, 8));
    }
  };

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCrop = useCallback(async () => {
    try {
      if (photoPreview && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(
          photoPreview,
          croppedAreaPixels,
          200,
          200
        );
        setPhoto(croppedImage);
        setPhotoPreview(URL.createObjectURL(croppedImage));
        setShowCropper(false);
        setErrors((prev) => ({ ...prev, photo: null }));
        // toast.success("Image cropped successfully");
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, photo: "Failed to crop image" }));
      // toast.error("Failed to crop image");
    }
  }, [photoPreview, croppedAreaPixels]);

  const hasErrors = Object.values(errors).some((error) => error !== null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setLoading(true);
    setApiError(null);
    setSuccess(false);

    if (hasErrors || !roles_permissions_id) {
      const msg = "Please correct the errors and ensure role is set";
      setApiError(msg);
      // toast.error(msg);
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", sanitizeText(name));
      formData.append("email", sanitizeText(email));
      formData.append("phone", sanitizeText(phone));
      formData.append("roles_permissions_id", roles_permissions_id);
      if (photo) {
        formData.append("photo", photo);
      }

      const response = await axiosInstance.put("/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const result = response.data;

      const updatedUser: User = {
        ...currentUser!,
        name,
        email,
        phone,
        role,
        roles_permissions_id,
        photo: result.updatedUser.photo || null,
      };

      setUser(updatedUser);
      localStorage.setItem("user_data", JSON.stringify(updatedUser));
      setSuccess(true);
      // toast.success("Profile updated successfully");

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (error: any) {
      const msg =
        error.response?.data?.error ||
        error.message ||
        "Failed to update profile";
      setApiError(msg);
      // toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = currentUser?.role === "admin";
  const canEdit = isAdmin || currentUser?.id === user?.id;

  const showError = (field: keyof typeof errors) =>
    (touched[field as keyof typeof touched] || submitAttempted) &&
    errors[field];

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
          Profile Updated Successfully!
        </h3>
        <p className="text-gray-600">Your profile has been updated.</p>
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
        <Label htmlFor="email">Email ID*</Label>
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
        {showCropper && photoPreview && (
          <div className="mt-4">
            <div className="relative w-full h-64">
              <Cropper
                image={photoPreview}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                showGrid={true}
                cropSize={{ width: 200, height: 200 }}
              />
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCropper(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleCrop}>
                Crop Image
              </Button>
            </div>
          </div>
        )}
        {photoPreview && !showCropper && (
          <div className="mt-2">
            <img
              src={photoPreview}
              alt="Profile preview"
              className="w-24 h-24 object-cover rounded-full"
              onError={() => {
                console.error("Image failed to load:", photoPreview);
                setPhotoPreview(null);
                setErrors((prev) => ({
                  ...prev,
                  photo: "Failed to load image preview",
                }));
                // toast.error("Failed to load image preview");
              }}
            />
          </div>
        )}
        {!photoPreview && (user?.photo || currentUser?.photo) && (
          <div className="mt-2">
            <img
              src={`${SECURITY_CONFIG.ONLY_URL}/public/profile_photos/${
                (user?.photo || currentUser?.photo || "").includes("http")
                  ? new URL(user?.photo || currentUser?.photo || "").pathname
                      .split("/")
                      .pop()
                  : user?.photo || currentUser?.photo
              }`}
              alt="Current profile"
              className="w-24 h-24 object-cover rounded-full"
              onError={() => {
                console.error(
                  "Existing image failed to load:",
                  user?.photo || currentUser?.photo
                );
                setErrors((prev) => ({
                  ...prev,
                  photo: "Failed to load existing image",
                }));
                // toast.error("Failed to load existing image");
              }}
            />
          </div>
        )}
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <Input id="role" value={role} disabled={true} className="bg-gray-100" />
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canEdit || loading || hasErrors}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};

export default EditProfileForm;
