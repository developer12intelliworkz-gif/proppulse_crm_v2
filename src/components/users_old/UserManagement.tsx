import { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";
import { Plus, User, Mail, Shield, Calendar, Edit, Trash2 } from "lucide-react";
import CreateUserForm from "./CreateUserForm";
import EditUserForm from "./EditUserForm";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import axiosInstance from "@/api/axiosInstance";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "manager" | "agent";
  status: boolean;
  lastLogin: string;
  createdAt: string;
  assignedLeads: number;
  convertedLeads: number;
}

const UserManagement = () => {
  const { hasPermission, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const navigate = useNavigate(); // Initialize useNavigate

  const token = localStorage.getItem("auth_token");

  // Using Axios
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = response.data;
      const updatedUsers = result.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.is_active === true || user.is_active === "true",
        lastLogin: user.last_login,
        createdAt: user.created_at,
        assignedLeads: user.assigned_leads ?? 0,
        convertedLeads: user.converted_leads ?? 0,
      }));

      setUsers(updatedUsers);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await axiosInstance.delete(`/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchUsers(); // Refresh after delete
    } catch (err: any) {
      console.error("Error deleting user:", err);
      const errorMessage =
        err.response?.data?.error || err.message || "Failed to delete user";
      setError(errorMessage);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "agent":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: boolean) => {
    return status ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
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
        <Button onClick={fetchUsers} className="mt-4">
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
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">
            Manage system users and their permissions
          </p>
        </div>
        {hasPermission("create_users") && (
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md h-[100vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <CreateUserForm
                onClose={() => setIsCreateDialogOpen(false)}
                onUserCreated={fetchUsers}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="agent">Agent</option>
          </select>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.slice(0, 5).map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-center">
                <div className="flex items-center flex-col space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <CardDescription className="flex items-center max-w-[200px] truncate">
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
                  {user.role}
                </Badge>
                <Badge className={getStatusColor(user.status)}>
                  {user.status ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Assigned Leads:</span>
                  <span className="font-medium">{user.assignedLeads}</span>
                </div>
                <div className="flex justify-between">
                  <span>Converted:</span>
                  <span className="font-medium text-green-600">
                    {user.convertedLeads}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Conversion Rate:</span>
                  <span className="font-medium">
                    {user.assignedLeads > 0
                      ? Math.round(
                          (user.convertedLeads / user.assignedLeads) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t text-xs text-gray-500 flex justify-between items-center">
                <div className="flex items-center justify-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  Last login: {new Date(user.lastLogin).toLocaleDateString()}
                </div>
                {currentUser?.role === "admin" && (
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-0 p-1"
                        >
                          <Edit className="w-2 h-2" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md w-full">
                        <DialogHeader>
                          <DialogTitle>Edit User: {user.name}</DialogTitle>
                        </DialogHeader>
                        <EditUserForm
                          user={user}
                          onClose={() => setSelectedUser(null)}
                          onUserUpdated={fetchUsers}
                        />
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-0"
                        >
                          <Trash2 className="w-2 h-2" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md w-full">
                        <DialogHeader>
                          <DialogTitle>Confirm Delete</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>
                            Are you sure you want to delete the user{" "}
                            <strong>{user.name}</strong>?
                          </p>
                          <p className="text-sm text-gray-500">
                            This action cannot be undone.
                          </p>
                          <div className="flex justify-end gap-3">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedUser(null)}
                            >
                              Cancel
                            </Button>
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
            </CardContent>
          </Card>
        ))}
        {/* <div className="flex items-center justify-center">
          <Button
            variant="outline"
            className="inline-flex items-center justify-center gap-0 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-fit h-fit text-lg"
            onClick={() => {
              console.log("View all users clicked");
            }}
          >
            View All
          </Button>
        </div> */}
        <Card className="hover:shadow-lg transition-shadow flex items-center justify-center">
          <Button
            variant="outline"
            className="inline-flex items-center justify-center gap-0 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-fit h-fit text-lg"
            onClick={() => navigate("/userslisting")}
          >
            View All
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;
