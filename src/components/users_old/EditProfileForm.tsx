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
import { useAuth, User } from "@/contexts/AuthContext"; // Import User type
import axiosInstance from "@/api/axiosInstance";

const EditProfileForm = ({ user, onClose }) => {
  const { user: currentUser, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [role, setRole] = useState(user?.role || "agent");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user?.profile_photo || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setRole(user?.role || "agent");
    setPreviewUrl(user?.profile_photo || null);
  }, [user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setError(null);
  //   setSuccess(false);

  //   const formData = new FormData();
  //   formData.append("name", name);
  //   formData.append("phone", phone);
  //   formData.append("role", role);
  //   if (profilePhoto) {
  //     formData.append("profile_photo", profilePhoto);
  //   }

  //   try {
  //     const response = await fetch(`http://localhost:3001/api/profile`, {
  //       method: "PUT",
  //       headers: {
  //         Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
  //       },
  //       body: formData,
  //     });

  //     const result = await response.json();

  //     if (!response.ok) {
  //       throw new Error(result.error || "Failed to update profile");
  //     }

  //     if (setUser && typeof setUser === "function") {
  //       const updatedUser: User = {
  //         id: currentUser?.id || "", // Use currentUser.id
  //         email: currentUser?.email || "", // Use currentUser.email
  //         name,
  //         role: role as "admin" | "manager" | "agent" | "user(sales)",
  //         phone: phone || undefined,
  //         profile_photo:
  //           result.updatedUser.profile_photo ||
  //           currentUser?.profile_photo ||
  //           undefined,
  //       };
  //       setUser(updatedUser);
  //       localStorage.setItem(
  //         "user_data",
  //         JSON.stringify({
  //           ...currentUser,
  //           name,
  //           phone,
  //           role,
  //           profile_photo:
  //             result.updatedUser.profile_photo || currentUser?.profile_photo,
  //         })
  //       );
  //     } else {
  //       console.warn("setUser is not available, updating localStorage only");
  //       localStorage.setItem(
  //         "user_data",
  //         JSON.stringify({
  //           ...currentUser,
  //           name,
  //           phone,
  //           role,
  //           profile_photo:
  //             result.updatedUser.profile_photo || currentUser?.profile_photo,
  //         })
  //       );
  //     }
  //     setSuccess(true);
  //     setTimeout(() => {
  //       setSuccess(false);
  //       onClose();
  //     }, 2000);
  //   } catch (error) {
  //     setError(error.message || "Failed to update profile");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  //Using axios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("role", role);
    if (profilePhoto) {
      formData.append("profile_photo", profilePhoto);
    }

    try {
      const response = await axiosInstance.put("/profile", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          // 'Content-Type' will be set automatically by Axios when sending FormData
        },
      });

      const result = response.data;

      if (setUser && typeof setUser === "function") {
        const updatedUser: User = {
          id: currentUser?.id || "",
          email: currentUser?.email || "",
          name,
          role: role as "admin" | "manager" | "agent" | "user(sales)",
          phone: phone || undefined,
          profile_photo:
            result.updatedUser.profile_photo ||
            currentUser?.profile_photo ||
            undefined,
        };

        setUser(updatedUser);
        localStorage.setItem(
          "user_data",
          JSON.stringify({
            ...currentUser,
            name,
            phone,
            role,
            profile_photo:
              result.updatedUser.profile_photo || currentUser?.profile_photo,
          })
        );
      } else {
        console.warn("setUser is not available, updating localStorage only");
        localStorage.setItem(
          "user_data",
          JSON.stringify({
            ...currentUser,
            name,
            phone,
            role,
            profile_photo:
              result.updatedUser.profile_photo || currentUser?.profile_photo,
          })
        );
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (error: any) {
      setError(
        error.response?.data?.error ||
          error.message ||
          "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = currentUser?.role === "admin";
  const canEdit = isAdmin || currentUser?.id === user?.id;

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
            ></path>
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
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canEdit}
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={!canEdit}
          required
        />
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <Select value={role} onValueChange={setRole} disabled={!canEdit}>
          <SelectTrigger id="role">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="agent">Agent</SelectItem>
            <SelectItem value="user(sales)">User (Sales)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="profile_photo">Profile Photo</Label>
        <Input
          id="profile_photo"
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          disabled={!canEdit}
        />
        {previewUrl && (
          <div className="mt-2">
            <img
              src={
                previewUrl.startsWith("http")
                  ? previewUrl
                  : `http://localhost:3001${previewUrl}`
              }
              alt="Profile Preview"
              className="w-24 h-24 object-cover rounded-full"
            />
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canEdit || loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};

export default EditProfileForm;
