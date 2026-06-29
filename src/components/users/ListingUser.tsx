import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  Plus,
  User,
  Mail,
  Shield,
  Calendar,
  Edit,
  Trash2,
  Grid,
  List,
  Home,
} from "lucide-react";
import CreateUserForm from "./CreateUserForm";
import EditUserForm from "./EditUserForm";
import { useAuth } from "@/contexts/AuthContext";
import axiosInstance from "@/api/axiosInstance";
import { SECURITY_CONFIG } from "@/config/security";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "manager" | "agent" | "user(sales)";
  status: boolean;
  lastLogin: string;
  createdAt: string;
  assignedLeads: number;
  convertedLeads: number;
  photo?: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

const ListingUser = () => {
  const { hasPermission, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchFocused, setSearchFocused] = useState(false);

  // Base URL for profile photos
  const PHOTO_BASE_URL = `${SECURITY_CONFIG.ONLY_URL}/public/profile_photos/`;

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get("/users", {
        params: { include_inactive: true },
      });

      const result = response.data;
      // console.log("API Response:", result);

      if (!Array.isArray(result)) {
        throw new Error("Invalid response format: Expected an array of users");
      }

      const updatedUsers = result.map((user: any) => {
        // console.log("Raw photo value:", user.photo);
        return {
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
          photo: user.photo,
          isEmailVerified: user.is_email_verified ?? false,
          isPhoneVerified: user.is_phone_verified ?? false,
        };
      });

      setUsers(updatedUsers);
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: !currentStatus } : u));
    try {
      await axiosInstance.put(`/users/${userId}`, { is_active: !currentStatus });
    } catch (err) {
      // Revert on failure
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: currentStatus } : u));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await axiosInstance.delete(`/users/${userId}`);
      await fetchUsers();
    } catch (err: any) {
      console.error("Error deleting user:", err);
      const errorMessage =
        err.response?.data?.error || err.message || "Failed to delete user";
      setError(errorMessage);
    }
  };

  const getPhotoUrl = (photo: string | null | undefined): string => {
    if (!photo) return "";
    try {
      const filename = photo.includes("http") ? photo.split("/").pop() : photo;
      if (!filename) return "";
      return `${PHOTO_BASE_URL}${filename}`;
    } catch (err) {
      console.error("Error constructing photo URL:", err, "Photo:", photo);
      return "";
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
    const isNotCurrentUser = user.id !== currentUser?.id; // Exclude current user
    return matchesSearch && matchesRole && isNotCurrentUser;
  });


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

  // Role style helper
  const getRoleStyle = (role: string): React.CSSProperties => {
    if (role === "admin") return { background: "rgba(var(--theme-color-rgb), 0.1)", color: "var(--theme-color)" };
    if (role === "manager") return { background: "#EEF3FF", color: "#2563EB" };
    if (role === "agent") return { background: "#ECFDF5", color: "#059669" };
    return { background: "rgba(var(--theme-color-rgb), 0.1)", color: "var(--theme-color)" };
  };

  const avatarColors = ["#2563EB", "#0D9488", "#7C3AED", "#6366F1", "#D97706", "#059669"];
  const getAvatarColor = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length];

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "rgba(var(--theme-color-rgb), 0.02)" }}>
      <div style={{ padding: "22px 24px" }}>

        {/* ── Page header ──────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--theme-color)", fontWeight: 500, marginBottom: 3 }}>USERS</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: "#1A1F36" }}>
              Team Members
              <span style={{ marginLeft: 8, fontSize: 11, background: "rgba(var(--theme-color-rgb), 0.1)", color: "var(--theme-color)", padding: "2px 9px", borderRadius: 20, fontWeight: 400 }}>
                {filteredUsers.length}
              </span>
            </div>
          </div>
          {hasPermission("create_users") && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <button
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--theme-color)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--theme-color-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "var(--theme-color)")}
                >
                  <Plus size={14} />
                  Add User
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md h-[fit] overflow-y-auto">
                <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
                <CreateUserForm onClose={() => setIsCreateDialogOpen(false)} onUserCreated={fetchUsers} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* ── Action bar ───────────────────────────────────── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#fff", border: searchFocused ? "1.5px solid var(--theme-color)" : "1.5px solid #E2E5F0", boxShadow: searchFocused ? "0 0 0 1px var(--theme-color)" : "none", borderRadius: 8, padding: "8px 14px", transition: "all 0.15s" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A92B2" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              placeholder="Search users…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, color: "#1A1F36", width: "100%", fontFamily: "inherit" }}
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{ background: "#fff", border: "1px solid #E2E5F0", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#4B5280", fontFamily: "inherit", cursor: "pointer", outline: "none" }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="agent">Agent</option>
            <option value="sales">User (Sales)</option>
          </select>
          <div style={{ display: "flex", gap: 4 }}>
            {(["grid", "list"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${viewMode === mode ? "var(--theme-color)" : "#E2E5F0"}`, background: viewMode === mode ? "rgba(var(--theme-color-rgb), 0.1)" : "#fff", color: viewMode === mode ? "var(--theme-color)" : "#8A92B2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
              >
                {mode === "grid" ? <Grid size={15} /> : <List size={15} />}
              </button>
            ))}
          </div>
        </div>

        {/* ── Users Display ── */}
        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#8A92B2" }}>
            <User size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <div style={{ fontSize: 14 }}>No users found matching your criteria.</div>
          </div>
        ) : viewMode === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filteredUsers.map((user) => {
              const roleStripColor =
                user.role === "admin" ? "var(--theme-color)"
                : user.role === "manager" ? "#2563EB"
                : user.role === "agent" ? "#059669"
                : "var(--theme-color)";
              const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
              const convRate = user.assignedLeads > 0 ? Math.round((user.convertedLeads / user.assignedLeads) * 100) : 0;
              return (
                <div
                  key={user.id}
                  style={{ background: "#fff", border: "1px solid #E2E5F0", borderRadius: 12, overflow: "hidden", transition: "all 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--theme-color)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "#E2E5F0")}
                >
                  {/* Colored top strip */}
                  <div style={{ height: 4, background: roleStripColor }} />

                  <div style={{ padding: "16px" }}>
                    {/* Avatar + name + badges row */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                      {user.photo ? (
                        <img
                          src={getPhotoUrl(user.photo)}
                          alt={user.name}
                          style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: getAvatarColor(user.name), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, flexShrink: 0 }}>
                          {initials}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1F36", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
                        <div style={{ fontSize: 11, color: "#8A92B2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                          <span style={{ ...getRoleStyle(user.role), fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 3 }}>
                            <Shield size={9} />
                            {user.role}
                          </span>
                          {currentUser?.role === "admin" ? (
                            <button
                              onClick={() => handleToggleStatus(user.id, user.status)}
                              title={user.status ? "Click to deactivate" : "Click to activate"}
                              style={{ fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 6, border: "none", cursor: "pointer", background: user.status ? "#ECFDF5" : "#F3F4F6", color: user.status ? "#059669" : "#6B7280", transition: "all 0.15s", fontFamily: "inherit" }}
                              onMouseEnter={e => { e.currentTarget.style.opacity = "0.75"; }}
                              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                            >
                              {user.status ? "Active" : "Inactive"}
                            </button>
                          ) : (
                            <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 6, background: user.status ? "#ECFDF5" : "#F3F4F6", color: user.status ? "#059669" : "#6B7280" }}>
                              {user.status ? "Active" : "Inactive"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                      {[
                        { label: "Assigned", value: user.assignedLeads },
                        { label: "Converted", value: user.convertedLeads },
                        { label: "Rate", value: `${convRate}%` },
                      ].map(stat => (
                        <div key={stat.label} style={{ background: "rgba(var(--theme-color-rgb), 0.04)", borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1F36" }}>{stat.value}</div>
                          <div style={{ fontSize: 10, color: "#8A92B2", marginTop: 1 }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Footer: last login + actions */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid rgba(var(--theme-color-rgb), 0.08)" }}>
                      <div style={{ fontSize: 10, color: "#8A92B2", display: "flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={10} />
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never logged in"}
                      </div>
                      {currentUser?.role === "admin" && (
                        <div style={{ display: "flex", gap: 4 }}>
                          <Dialog>
                            <DialogTrigger asChild>
                              <button style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E2E5F0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#4B5280", fontFamily: "inherit", transition: "all 0.15s" }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--theme-color)"; e.currentTarget.style.color = "var(--theme-color)"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E5F0"; e.currentTarget.style.color = "#4B5280"; }}
                              >
                                <Edit size={12} />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md h-fit overflow-y-auto">
                              <DialogHeader><DialogTitle>Edit User: {user.name}</DialogTitle></DialogHeader>
                              <EditUserForm user={user} onClose={() => setSelectedUser(null)} onUserUpdated={fetchUsers} />
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <button style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E2E5F0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#4B5280", fontFamily: "inherit", transition: "all 0.15s" }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#EF4444"; e.currentTarget.style.color = "#EF4444"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E5F0"; e.currentTarget.style.color = "#4B5280"; }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md w-full">
                              <DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
                              <div style={{ padding: "8px 0" }}>
                                <p style={{ fontSize: 13, color: "#4B5280", marginBottom: 6 }}>Are you sure you want to delete <strong>{user.name}</strong>?</p>
                                <p style={{ fontSize: 11, color: "#8A92B2", marginBottom: 16 }}>This action cannot be undone.</p>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                  <DialogClose asChild>
                                    <button style={{ padding: "7px 16px", borderRadius: 7, border: "1px solid #E2E5F0", background: "#fff", fontSize: 12, cursor: "pointer", color: "#4B5280", fontFamily: "inherit" }}>Cancel</button>
                                  </DialogClose>
                                  <button
                                    style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: "#EF4444", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}
                                    onClick={() => { handleDeleteUser(user.id); setSelectedUser(null); }}
                                  >Confirm Delete</button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── List view ── */
          <div style={{ background: "#fff", border: "1px solid #E2E5F0", borderRadius: 12, overflow: "hidden" }}>
            {/* Header row */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 80px 80px 80px 90px", gap: 0, background: "rgba(var(--theme-color-rgb), 0.08)", borderBottom: "1px solid #E2E5F0", padding: "10px 16px", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "var(--theme-color)", fontWeight: 500 }}>
              <div>User</div><div>Role / Status</div><div style={{ textAlign: "right" }}>Assigned</div><div style={{ textAlign: "right" }}>Converted</div><div style={{ textAlign: "right" }}>Rate</div><div>Last Login</div><div style={{ textAlign: "right" }}>Actions</div>
            </div>
            {filteredUsers.map((user, idx) => {
              const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
              const convRate = user.assignedLeads > 0 ? Math.round((user.convertedLeads / user.assignedLeads) * 100) : 0;
              return (
                <div
                  key={user.id}
                  style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 80px 80px 80px 90px", gap: 0, padding: "11px 16px", alignItems: "center", borderBottom: idx < filteredUsers.length - 1 ? "1px solid rgba(var(--theme-color-rgb), 0.08)" : "none", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(var(--theme-color-rgb), 0.01)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* User col */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {user.photo ? (
                      <img src={getPhotoUrl(user.photo)} alt={user.name} style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: getAvatarColor(user.name), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{initials}</div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1F36", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
                      <div style={{ fontSize: 11, color: "#8A92B2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
                    </div>
                  </div>
                  {/* Role + status col */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ ...getRoleStyle(user.role), fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 3, width: "fit-content" }}>
                      <Shield size={9} />{user.role}
                    </span>
                    {currentUser?.role === "admin" ? (
                      <button
                        onClick={() => handleToggleStatus(user.id, user.status)}
                        title={user.status ? "Click to deactivate" : "Click to activate"}
                        style={{ fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 6, border: "none", cursor: "pointer", background: user.status ? "#ECFDF5" : "#F3F4F6", color: user.status ? "#059669" : "#6B7280", width: "fit-content", transition: "all 0.15s", fontFamily: "inherit" }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = "0.75"; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                      >
                        {user.status ? "Active" : "Inactive"}
                      </button>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 6, background: user.status ? "#ECFDF5" : "#F3F4F6", color: user.status ? "#059669" : "#6B7280", width: "fit-content" }}>
                        {user.status ? "Active" : "Inactive"}
                      </span>
                    )}
                  </div>
                  {/* Stats cols */}
                  <div style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: "#1A1F36" }}>{user.assignedLeads}</div>
                  <div style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: "#059669" }}>{user.convertedLeads}</div>
                  <div style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: "var(--theme-color)" }}>{convRate}%</div>
                  {/* Last login */}
                  <div style={{ fontSize: 11, color: "#8A92B2" }}>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</div>
                  {/* Actions */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                    {currentUser?.role === "admin" && (
                      <>
                        <Dialog>
                          <DialogTrigger asChild>
                            <button style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E2E5F0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#4B5280", fontFamily: "inherit", transition: "all 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--theme-color)"; e.currentTarget.style.color = "var(--theme-color)"; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E5F0"; e.currentTarget.style.color = "#4B5280"; }}
                            >
                              <Edit size={13} />
                            </button>
                          </DialogTrigger>
                          <DialogContent style={{ maxWidth: 480 }}>
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
                            <button style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E2E5F0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#4B5280", fontFamily: "inherit", transition: "all 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = "#EF4444"; e.currentTarget.style.color = "#EF4444"; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E5F0"; e.currentTarget.style.color = "#4B5280"; }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </DialogTrigger>
                          <DialogContent style={{ maxWidth: 420 }}>
                            <DialogHeader>
                              <DialogTitle>Delete User</DialogTitle>
                            </DialogHeader>
                            <p style={{ fontSize: 13, color: "#4B5280", margin: "8px 0 20px" }}>
                              Are you sure you want to delete <strong>{user.name}</strong>? This action cannot be undone.
                            </p>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                              <DialogClose asChild>
                                <button style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #E2E5F0", background: "#fff", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Cancel</button>
                              </DialogClose>
                              <button
                                style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: "#EF4444", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "inherit" }}
                                onClick={() => { handleDeleteUser(user.id); setSelectedUser(null); }}
                              >
                                Delete
                              </button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredUsers.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "40px 24px", color: "#8A92B2", fontSize: 13 }}>
            No users found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingUser;
