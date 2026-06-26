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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Building, Edit, Trash2, Plus, Check, X, ArrowLeft, Home } from "lucide-react"; // Added ArrowLeft and Home
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom"; // Added for navigation
import axiosInstance from "@/api/axiosInstance";

interface Role {
  id: string;
  name: string;
  permissions: string[];
  is_active: boolean;
}

const permissionCategories = [
  "Leads",
  "Projects",
  "Users",
  "Reports",
  "Followups",
  "Settings",
  "Tasks",
  "Roles",
  "Lead Sources",
];

const permissionActions = [
  "View",
  "Create",
  "Update",
  "Delete",
  "Import",
  "Export",
];

const permissionMap: {
  [category: string]: { [action: string]: string | string[] | null };
} = {
  Leads: {
    View: "view_leads",
    Create: "create_leads",
    Update: "assign_leads",
    Delete: null,
    Import: "import_leads",
    Export: "export_leads",
  },
  Projects: {
    View: "view_projects",
    Create: "create_projects",
    Update: ["edit_projects", "manage_project"],
    Delete: "delete_projects",
    Import: "import_projects",
    Export: "export_projects",
  },
  Users: {
    View: null,
    Create: "create_users",
    Update: "manage_users",
    Delete: null,
    Import: "import_users",
    Export: "export_users",
  },
  Reports: {
    View: "view_reports",
    Create: null,
    Update: null,
    Delete: null,
    Import: null,
    Export: "export_reports",
  },
  Followups: {
    View: "view_followups",
    Create: null,
    Update: null,
    Delete: null,
    Import: null,
    Export: null,
  },
  Settings: {
    View: "view_settings",
    Create: null,
    Update: null,
    Delete: null,
    Import: null,
    Export: null,
  },
  Tasks: {
    View: "view_tasks",
    Create: null,
    Update: null,
    Delete: null,
    Import: null,
    Export: null,
  },
  Roles: {
    View: "view_roles",
    Create: "create_roles",
    Update: "update_roles",
    Delete: "delete_roles",
    Import: null,
    Export: null,
  },
  "Lead Sources": {
    View: null,
    Create: "create_lead_types",
    Update: "manage_lead_types",
    Delete: null,
    Import: null,
    Export: null,
  },
};

const RolesandResponse = () => {
  const { hasPermission, user: currentUser, refreshPermissions } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate(); // Added for navigation
  const [roles, setRoles] = useState<Role[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  const [newIsActive, setNewIsActive] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const extractPermissions = (perms: any): string[] => {
    if (Array.isArray(perms)) {
      return perms;
    } else if (typeof perms === "object" && perms !== null) {
      const values = Object.values(perms);
      return Array.isArray(values[0]) ? values[0] : [];
    }
    return [];
  };

  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.get("/roles-permissions");
      const rolesData = Object.entries(response.data).map(
        ([id, details]: [string, any]) => ({
          id,
          name: details.role_name,
          permissions: extractPermissions(details.permissions),
          is_active: details.status,
        })
      );
      setRoles(rolesData);
    } catch (error) {
      // toast({
        // title: "Error",
        // description: "Failed to fetch roles.",
        // variant: "destructive",
      // });
    }
  };

  const handleCreateOrEditRole = async () => {
    if (!newRoleName.trim()) {
      // toast({
        // title: "Error",
        // description: "Role name is required.",
        // variant: "destructive",
      // });
      return;
    }

    const roleData = {
      role_name: newRoleName,
      permissions: { [newRoleName]: newRolePermissions },
      status: newIsActive,
    };

    try {
      if (isEditMode && editRole) {
        const response = await axiosInstance.put(
          `/roles-permissions/${editRole.id}`,
          roleData
        );
        const updatedDetails = response.data[editRole.id];
        const updatedRole = {
          id: editRole.id,
          name: updatedDetails.role_name,
          permissions: extractPermissions(updatedDetails.permissions),
          is_active: updatedDetails.status,
        };
        setRoles(roles.map((r) => (r.id === editRole.id ? updatedRole : r)));
        // toast({
          // title: "Success",
          // description: "Role updated successfully.",
        // });
      } else {
        const response = await axiosInstance.post(
          "/roles-permissions",
          roleData
        );
        const newId = Object.keys(response.data)[0];
        const newDetails = response.data[newId];
        const newRole = {
          id: newId,
          name: newDetails.role_name,
          permissions: extractPermissions(newDetails.permissions),
          is_active: newDetails.status,
        };
        setRoles([...roles, newRole]);
        // toast({
          // title: "Success",
          // description: "Role created successfully.",
        // });
      }

      if (refreshPermissions) {
        refreshPermissions();
      }

      setNewRoleName("");
      setNewRolePermissions([]);
      setNewIsActive(true);
      setIsEditMode(false);
      setEditRole(null);
      setIsCreateDialogOpen(false);
    } catch (error) {
      // toast({
        // title: "Error",
        // description: "Failed to save role.",
        // variant: "destructive",
      // });
    }
  };

  const handleEditRole = (role: Role) => {
    setIsEditMode(true);
    setEditRole(role);
    setNewRoleName(role.name);
    setNewRolePermissions(role.permissions);
    setNewIsActive(role.is_active);
    setIsCreateDialogOpen(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await axiosInstance.delete(`/roles-permissions/${roleId}`);
      setRoles(roles.filter((r) => r.id !== roleId));
      // toast({
        // title: "Success",
        // description: "Role deleted successfully.",
      // });

      if (refreshPermissions) {
        refreshPermissions();
      }
    } catch (error) {
      // toast({
        // title: "Error",
        // description: "Failed to delete role.",
        // variant: "destructive",
      // });
    }
  };

  const handleCancel = () => {
    navigate("/settings"); // Navigate back to settings
  };

  const getStatusColor = (status: boolean) =>
    status ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";

  const resetForm = () => {
    setNewRoleName("");
    setNewRolePermissions([]);
    setNewIsActive(true);
    setIsEditMode(false);
    setEditRole(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const hasAction = (
    rolePerms: string[],
    category: string,
    action: string
  ): boolean => {
    const perm = permissionMap[category]?.[action];
    if (perm === null) return false;
    const required = Array.isArray(perm) ? perm : [perm];
    return required.every((p) => rolePerms.includes(p));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b shadow-sm flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Roles & Responsibilities
              </h1>
              <p className="text-muted-foreground">
                Define and manage roles and responsibilities within your
                organization.
              </p>
            </div>
            <div className="flex gap-3">
              {hasPermission("manage_users") && (
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={handleDialogOpenChange}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl w-full">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditMode ? "Edit Role" : "Create New Role"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Role Name
                      </label>
                      <Input
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        placeholder="Enter role name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Permissions
                      </label>
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full min-w-max">
                          <thead>
                            <tr>
                              <th className="text-left pb-2">Permission</th>
                              {permissionActions.map((action) => (
                                <th
                                  key={action}
                                  className="text-left pb-2 px-2"
                                >
                                  {action}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {permissionCategories.map((category) => (
                              <tr key={category} className="py-2">
                                <td className="text-left py-2 pr-2 font-medium">
                                  {category}
                                </td>
                                {permissionActions.map((action) => {
                                  const perm = permissionMap[category][action];
                                  return (
                                    <td key={action} className="py-2 px-2">
                                      <Checkbox
                                        id={`${category}-${action}`}
                                        checked={
                                          perm !== null &&
                                          (Array.isArray(perm)
                                            ? perm.every((p) =>
                                                newRolePermissions.includes(p)
                                              )
                                            : newRolePermissions.includes(perm))
                                        }
                                        onCheckedChange={(checked) => {
                                          if (perm === null) return;
                                          const required = Array.isArray(perm)
                                            ? perm
                                            : [perm];
                                          setNewRolePermissions((prev) => {
                                            let newPerms = [...prev];
                                            if (checked) {
                                              newPerms = [
                                                ...new Set([
                                                  ...newPerms,
                                                  ...required,
                                                ]),
                                              ];
                                            } else {
                                              newPerms = newPerms.filter(
                                                (p) => !required.includes(p)
                                              );
                                            }
                                            return newPerms;
                                          });
                                        }}
                                        disabled={perm === null}
                                      />
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={newIsActive}
                        onCheckedChange={setNewIsActive}
                      />
                      <label
                        htmlFor="active"
                        className="text-sm font-medium text-gray-700"
                      >
                        Active
                      </label>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          resetForm();
                          setIsCreateDialogOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateOrEditRole}>
                        {isEditMode ? "Update Role" : "Create Role"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                <Home className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="mx-auto flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <Card key={role.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                        <CardDescription className="flex items-center">
                          <span className="truncate">
                            {role.permissions.length} Permissions
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    {currentUser?.role === "admin" && (
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditRole(role)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Dialog
                          open={
                            isDeleteDialogOpen && selectedRole?.id === role.id
                          }
                          onOpenChange={(open) => {
                            setIsDeleteDialogOpen(open);
                            if (!open) {
                              setSelectedRole(null);
                            } else {
                              setSelectedRole(role);
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Confirm Delete</DialogTitle>
                            </DialogHeader>
                            <DialogDescription>
                              Confirm deletion of the selected role.
                            </DialogDescription>
                            <div className="space-y-4 py-4">
                              <p>
                                Are you sure you want to delete the role{" "}
                                <strong>{role.name}</strong>?
                              </p>
                              <div className="flex justify-end gap-3">
                                <Button
                                  variant="outline"
                                  onClick={() => setIsDeleteDialogOpen(false)}
                                  className="w-full md:w-auto"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDeleteRole(role.id)}
                                  className="w-full md:w-auto"
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
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <Badge className={getStatusColor(role.is_active)}>
                      {role.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-max">
                      <thead>
                        <tr>
                          <th className="text-left font-medium pb-2">
                            Permission
                          </th>
                          {permissionActions.map((action) => (
                            <th key={action} className="text-center pb-2">
                              {action}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {permissionCategories.map((category) => (
                          <tr key={category}>
                            <td className="py-1">{category}</td>
                            {permissionActions.map((action) => (
                              <td key={action} className="text-center">
                                {permissionMap[category][action] === null ? (
                                  <X className="w-4 h-4 text-gray-300 mx-auto" />
                                ) : hasAction(
                                    role.permissions,
                                    category,
                                    action
                                  ) ? (
                                  <Check className="w-4 h-4 text-green-500 mx-auto" />
                                ) : (
                                  <X className="w-4 h-4 text-red-500 mx-auto" />
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolesandResponse;