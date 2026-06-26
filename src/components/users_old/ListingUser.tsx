import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Header from "@/components/layout/Header";
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
import {
  User,
  Mail,
  Shield,
  Calendar,
  Edit,
  Trash2,
  List,
  Grid,
} from "lucide-react";
import EditUserForm from "./EditUserForm";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import CreateUserForm from "./CreateUserForm";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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

const ListingUser = () => {
  const { hasPermission, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const navigate = useNavigate();

  const token = localStorage.getItem("auth_token");

  // const fetchUsers = async () => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const response = await fetch('http://localhost:3001/api/users', {
  //       method: 'GET',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //     });

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const result = await response.json();
  //     const updatedUsers = result.map((user: any) => ({
  //       id: user.id,
  //       name: user.name,
  //       email: user.email,
  //       phone: user.phone,
  //       role: user.role,
  //       status: user.is_active === true || user.is_active === 'true',
  //       lastLogin: user.last_login,
  //       createdAt: user.created_at,
  //       assignedLeads: user.assigned_leads ?? 0,
  //       convertedLeads: user.converted_leads ?? 0,
  //     }));

  //     setUsers(updatedUsers);
  //   } catch (err) {
  //     console.error("Failed to fetch users:", err);
  //     setError("Failed to load users. Please try again later.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleDeleteUser = async (userId: string) => {
  //   try {
  //     const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
  //       method: 'DELETE',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //     });

  //     if (!response.ok) {
  //       const text = await response.text();
  //       let errorData;
  //       try {
  //         errorData = JSON.parse(text) || { error: 'Failed to parse error response' };
  //       } catch {
  //         errorData = { error: text || 'Unknown error' };
  //       }
  //       throw new Error(errorData.error || 'Failed to delete user');
  //     }

  //     await fetchUsers();
  //   } catch (err) {
  //     console.error('Error deleting user:', err);
  //     setError(err.message || 'Failed to delete user');
  //   }
  // };

  // using axios
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

      if (!Array.isArray(result)) {
        throw new Error("Invalid response format: Expected an array of users");
      }

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
    } catch (err: any) {
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

      await fetchUsers(); // Refresh the user list after successful deletion
    } catch (err: any) {
      console.error("Error deleting user:", err);

      let errorMessage = "Failed to delete user";
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

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
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center py-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Listing</h2>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>User List</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
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
                <DialogContent className="max-w-md">
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
        </div>
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
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4 mr-2" />
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>
          </CardContent>
        </Card>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{user.name}</CardTitle>
                        <CardDescription className="flex items-center max-w-[200px] truncate">
                          <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </CardDescription>
                      </div>
                    </div>
                    {currentUser?.role === "admin" && (
                      <div className="flex flex-col space-y-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit User: {user.name}</DialogTitle>
                            </DialogHeader>
                            <EditUserForm
                              user={user}
                              onClose={() => {
                                /* No need for setSelectedUser here */
                              }}
                              onUserUpdated={fetchUsers}
                            />
                          </DialogContent>
                        </Dialog>
                        <Dialog
                          open={isDeleteDialogOpen}
                          onOpenChange={setIsDeleteDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
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
                                  onClick={() => setIsDeleteDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => {
                                    handleDeleteUser(user.id);
                                    setIsDeleteDialogOpen(false);
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

                  <div className="pt-2 border-t text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Last login:{" "}
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-4">
                    <User className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="text-lg font-semibold">{user.name}</div>
                      <div className="text-sm text-gray-600 flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="space-y-1 text-sm">
                      <div>Role: {user.role}</div>
                      <div>
                        Last Login:{" "}
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div>Assigned: {user.assignedLeads}</div>
                      <div>Converted: {user.convertedLeads}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(user.status)}>
                        {user.status ? "Active" : "Inactive"}
                      </Badge>
                      {currentUser?.role === "admin" && (
                        <>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>
                                  Edit User: {user.name}
                                </DialogTitle>
                              </DialogHeader>
                              <EditUserForm
                                user={user}
                                onClose={() => {
                                  /* No need for setSelectedUser here */
                                }}
                                onUserUpdated={fetchUsers}
                              />
                            </DialogContent>
                          </Dialog>
                          <Dialog
                            open={isDeleteDialogOpen}
                            onOpenChange={setIsDeleteDialogOpen}
                          >
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
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
                                    onClick={() => setIsDeleteDialogOpen(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => {
                                      handleDeleteUser(user.id);
                                      setIsDeleteDialogOpen(false);
                                    }}
                                  >
                                    Confirm Delete
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingUser;
