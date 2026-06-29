import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, User, Mail, Shield, Calendar, Edit, Trash2 } from "lucide-react";
import CreateUserForm from "./CreateUserForm";
import EditUserForm from "./EditUserForm";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { useToast } from "@/hooks/use-toast";
import { SECURITY_CONFIG } from "@/config/security";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string | null;
  status: boolean;
  lastLogin: string;
  createdAt: string;
  assignedLeads: number;
  convertedLeads: number;
  photo?: string | null;
}

interface Role {
  id: string;
  role_name: string;
  permissions: object;
  status: boolean;
}

const UserManagement = () => {
  const { hasPermission, user: currentUser, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = localStorage.getItem("auth_token");

  // Base URL for profile photos
  const PHOTO_BASE_URL = `${SECURITY_CONFIG.ONLY_URL}/public/profile_photos/`;

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get("/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { include_inactive: true },
      });

      const result = response.data;
      // console.log("Users API Response:", result);

      if (!Array.isArray(result)) {
        throw new Error("Invalid response format: Expected an array of users");
      }

      const updatedUsers = result.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role, // Can be string or null
        status: user.is_active === true || user.is_active === "true",
        lastLogin: user.last_login,
        createdAt: user.created_at,
        assignedLeads: user.assigned_leads ?? 0,
        convertedLeads: user.converted_leads ?? 0,
        photo: user.photo,
      }));

      setUsers(updatedUsers);
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
      const errorMessage =
        err.response?.data?.error || err.message || "Failed to load users";
      setError(errorMessage);
      // toast({
        // title: "Error",
        // description: errorMessage,
        // variant: "destructive",
      // });
    }
  }, [token, toast]);

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/roles-permissions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = response.data;
      // console.log("Roles API Response:", result);

      // Convert object to array of roles
      const rolesArray = Object.entries(result).map(
        ([id, role]: [string, any]) => ({
          id,
          role_name: role.role_name,
          permissions: role.permissions,
          status: role.status,
        })
      );

      setRoles(rolesArray);
    } catch (err: any) {
      console.error("Failed to fetch roles:", err);
      const errorMessage =
        err.response?.data?.error || err.message || "Failed to load roles";
      // toast({
        // title: "Error",
        // description: errorMessage,
        // variant: "destructive",
      // });
    }
  }, [token, toast]);

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    try {
      await axiosInstance.delete(`/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchUsers(); // Refresh user list
      // toast({
        // title: "Success",
        // description: "User deleted successfully",
      // });
    } catch (err: any) {
      console.error("Error deleting user:", err);
      const errorMessage =
        err.response?.data?.error || err.message || "Failed to delete user";
      // toast({
        // title: "Error",
        // description: errorMessage,
        // variant: "destructive",
      // });
    }
  };

  // Fetch users and roles on mount
  useEffect(() => {
    if (isAuthenticated && token) {
      setLoading(true);
      Promise.all([fetchUsers(), fetchRoles()]).finally(() =>
        setLoading(false)
      );
    } else {
      // toast({
        // title: "Error",
        // description: "No authentication token found. Please log in.",
        // variant: "destructive",
      // });
      navigate("/login");
    }
  }, [isAuthenticated, token, fetchUsers, fetchRoles, navigate, toast]);

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string | null) => {
    if (!role) return "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-400"; // Default for null or undefined
    const roleLower = role.toLowerCase();
    switch (roleLower) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400";
      case "manager":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400";
      case "agent":
        return "bg-green-100 text-green-800 dark:bg-emerald-950/40 dark:text-emerald-400";
      case "user(sales)":
        return "bg-yellow-100 text-yellow-800 dark:bg-amber-950/40 dark:text-amber-400";
      case "aryantest2": // Add custom role from API
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-slate-850 dark:text-slate-300";
    }
  };

  const getStatusColor = (status: boolean) => {
    return status ? "bg-green-100 text-green-800 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-400";
  };

  const getPhotoUrl = (photo: string | null | undefined): string => {
    if (!photo) return "";
    try {
      // Handle both filename and full URL cases
      const filename = photo.includes("http") ? photo.split("/").pop() : photo;
      if (!filename) return "";
      return `${PHOTO_BASE_URL}${filename}`;
    } catch (err) {
      console.error("Error constructing photo URL:", err, "Photo:", photo);
      return "";
    }
  };

  if (!hasPermission("manage_users")) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600">
          You don't have permission to manage users.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <Button
          onClick={() => Promise.all([fetchUsers(), fetchRoles()])}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">User Management</h2>
          <p className="text-gray-600 dark:text-slate-400">
            Manage system users and their permissions
          </p>
        </div>
        {hasPermission("create_users") && (
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
             <DialogTrigger asChild>
              <Button className="bg-[var(--theme-color)] hover:bg-[var(--theme-color-hover)] text-white border-none shadow-sm hover:shadow-md transition-all font-semibold rounded-lg h-9 px-4">
                <Plus className="w-4 h-4 mr-1.5" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md h-100 overflow-y-auto dark:bg-slate-900 dark:border-slate-800">
              <DialogHeader>
                <DialogTitle className="dark:text-slate-100">Create New User</DialogTitle>
              </DialogHeader>
              <CreateUserForm
                onClose={() => setIsCreateDialogOpen(false)}
                onUserCreated={fetchUsers}
                roles={roles}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="dark:text-slate-350">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300">
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
              <SelectItem value="all" className="dark:focus:bg-slate-800 dark:focus:text-slate-100">All Roles</SelectItem>
              <SelectItem value="none" className="dark:focus:bg-slate-800 dark:focus:text-slate-100">No Role</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.role_name} className="dark:focus:bg-slate-800 dark:focus:text-slate-100">
                  {role.role_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.slice(0, 5).map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow dark:bg-slate-900 dark:border-slate-800/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {user.photo ? (
                    <img
                      src={getPhotoUrl(user.photo)}
                      alt={`${user.name}'s profile`}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        console.error(
                          "Failed to load image:",
                          getPhotoUrl(user.photo)
                        );
                        (
                          e.target as HTMLImageElement
                        ).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cpath d='M12 6v6l4 2'%3E%3C/path%3E%3C/svg%3E`;
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/40 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg dark:text-slate-100">{user.name}</CardTitle>
                    <CardDescription className="flex items-center max-w-[200px] truncate dark:text-slate-400">
                      <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge className={getRoleColor(user.role)}>
                  <Shield className="w-3 h-3 mr-1" />
                  {user.role || "No Role"}
                </Badge>
                <Badge className={getStatusColor(user.status)}>
                  {user.status ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="dark:text-slate-400">Assigned Leads:</span>
                  <span className="font-medium dark:text-slate-300">{user.assignedLeads}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-slate-400">Converted:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {user.convertedLeads}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-slate-400">Conversion Rate:</span>
                  <span className="font-medium dark:text-slate-350">
                    {user.assignedLeads > 0
                      ? Math.round(
                          (user.convertedLeads / user.assignedLeads) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t dark:border-slate-800 text-xs text-gray-500 dark:text-slate-400">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    Last login: {new Date(user.lastLogin).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    {currentUser?.role === "admin" && (
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-5 w-5 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950"
                            >
                              <Edit className="w-2 h-2" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md w-full h-fit overflow-y-auto dark:bg-slate-900 dark:border-slate-800">
                            <DialogHeader>
                              <DialogTitle className="dark:text-slate-100">Edit User: {user.name}</DialogTitle>
                            </DialogHeader>
                            <EditUserForm
                              user={user}
                              onClose={() => setSelectedUser(null)}
                              onUserUpdated={fetchUsers}
                              roles={roles}
                            />
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-5 w-5 text-muted-foreground dark:text-slate-500 hover:text-destructive dark:border-slate-800 dark:hover:bg-slate-950"
                            >
                              <Trash2 className="w-2 h-2" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md w-full dark:bg-slate-900 dark:border-slate-800">
                            <DialogHeader>
                              <DialogTitle className="dark:text-slate-100">Confirm Delete</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="dark:text-slate-300">
                                Are you sure you want to delete the user{" "}
                                <strong>{user.name}</strong>?
                              </p>
                              <p className="text-sm text-gray-500 dark:text-slate-400">
                                This action cannot be undone.
                              </p>
                              <div className="flex justify-end gap-3">
                                <DialogClose asChild>
                                  <Button variant="outline" className="dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-850">Cancel</Button>
                                </DialogClose>
                                <Button
                                  variant="destructive"
                                  onClick={() => {
                                    handleDeleteUser(user.id);
                                    setSelectedUser(null);
                                  }}
                                >
                                  Confirm Delete
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredUsers.length > 5 && (
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer border-dashed border-2 border-primary/30 dark:border-[var(--theme-color)]/30 bg-primary/5 dark:bg-[var(--theme-color)]/5"
            onClick={() => navigate("/users/list")}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
              <div className="w-12 h-12 bg-primary/10 dark:bg-[var(--theme-color)]/10 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-primary dark:text-[var(--theme-color)]" />
              </div>
              <h3 className="text-lg font-semibold text-primary dark:text-[var(--theme-color)] mb-2">
                View All Users
              </h3>
              <p className="text-sm text-muted-foreground dark:text-slate-400 mb-4">
                {filteredUsers.length - 5} more users
              </p>
              <Button variant="outline" size="sm" className="dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-850">
                View All
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
