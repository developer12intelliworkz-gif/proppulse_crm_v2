import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Settings, Lock, Edit, Palette, Check, Sun, Moon, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import EditProfileForm from "../users/EditProfileForm";
import ChangePasswordForm from "../users/ChangePasswordForm";
import axiosInstance from "@/api/axiosInstance";
import { formatRoleDisplayName } from "@/utils/formatDisplayName";
import { getRoleBadgeClass } from "@/utils/dashboardHelpers";
import { Badge } from "@/components/ui/badge";
import { SECURITY_CONFIG } from "@/config/security";
import { updateThemeColor, updateThemeMode } from "@/utils/themeManager";
import { resolveCompanyId } from "@/utils/tenant";
import { useBrand } from "@/contexts/BrandContext";

// Define the User type to match the useAuth hook output
interface User {
  id: string;
  name: string;
  email?: string;
  role: "admin" | "manager" | "agent" | "user(sales)";
  phone: string;
  photo?: string;
  is_active?: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  roles_permissions_id?: string;
  companyId?: string; // Added to link user to company
}

// Define the CompanyData interface
interface CompanyData {
  name: string;
}

// Define the EditProfileFormProps interface
interface EditProfileFormProps {
  user: {
    id: string;
    name: string;
    email?: string;
    role: "admin" | "manager" | "agent" | "user(sales)";
    phone: string;
    photo?: string;
  } | null;
  onClose: () => void;
}

const Header = () => {
  const { user, logout } = useAuth();
  const { brands, activeBrand, switchBrand } = useBrand();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentColor, setCurrentColor] = useState("#6366F1");
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedColor = localStorage.getItem("theme-color") || "#6366F1";
    setCurrentColor(savedColor);

    const savedMode = localStorage.getItem("theme-mode") as 'light' | 'dark' | null;
    if (savedMode) {
      setThemeMode(savedMode);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeMode(prefersDark ? 'dark' : 'light');
    }
  }, []);

  const handleThemeChange = (hex: string) => {
    setCurrentColor(hex);
    updateThemeColor(hex);
  };

  const handleModeChange = (mode: 'light' | 'dark') => {
    setThemeMode(mode);
    updateThemeMode(mode);
  };

  const presetColors = [
    { name: "Indigo", hex: "#6366F1" },
    { name: "Orange", hex: "#ea4c2a" },
    { name: "Blue", hex: "#2563eb" },
    { name: "Green", hex: "#059669" },
    { name: "Violet", hex: "#7c3aed" },
    { name: "Crimson", hex: "#dc2626" },
    { name: "Slate", hex: "#334155" },
  ];

  const companyId = resolveCompanyId(user);
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/companies/${companyId}`);
        setCompany(response.data);
      } catch (err) {
        console.error("Error fetching company data:", err);
        setError("Failed to load company name");
      } finally {
        setLoading(false);
      }
    };
    fetchCompanyData();
  }, [companyId]);

  const displayTitle =
    activeBrand?.brand_display_name ||
    company?.name ||
    (loading ? "Loading..." : error ? "Company CRM" : "Company CRM");

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 sticky top-0 z-50 shadow-sm h-20 flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="min-w-0">
            {brands.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-auto px-0 py-1 font-bold text-gray-900 dark:text-slate-100 max-w-[280px] hover:bg-transparent"
                  >
                    <span className="truncate text-2xl">{displayTitle}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Switch brand</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {brands.map((brand) => (
                    <DropdownMenuItem
                      key={brand.id}
                      onClick={() => void switchBrand(brand.id)}
                      className={
                        brand.id === activeBrand?.id ? "font-medium" : ""
                      }
                    >
                      {brand.brand_display_name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 truncate">
                {displayTitle}
              </h1>
            )}
            <p className="text-sm text-gray-600 dark:text-slate-400">Welcome back, {user?.name}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-slate-200">{user?.name}</p>
              <Badge
                variant="outline"
                className={`mt-1 text-[10px] px-2 py-0 h-5 font-semibold border ${getRoleBadgeClass(user?.role)}`}
              >
                {formatRoleDisplayName(user?.role || "user")}
              </Badge>
            </div>

            {/* Theme Customizer Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:text-[var(--theme-color)] transition-all shadow-sm flex items-center justify-center"
                  title="Theme Customizer"
                >
                  <Palette className="h-4.5 w-4.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 p-3" align="end" forceMount>
                <DropdownMenuLabel className="font-bold text-xs uppercase tracking-wider text-slate-400 pb-2">
                  Theme Color
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <div className="grid grid-cols-3 gap-2 py-2">
                  {presetColors.map((color) => {
                    const isSelected = currentColor.toLowerCase() === color.hex.toLowerCase();
                    return (
                      <button
                        key={color.name}
                        onClick={() => handleThemeChange(color.hex)}
                        className={`h-8 w-full rounded-xl flex items-center justify-center transition-all border relative ${
                          isSelected
                            ? "border-[var(--theme-color)] shadow-sm scale-95"
                            : "border-slate-200 hover:border-slate-350 hover:scale-105"
                        }`}
                        title={color.name}
                        style={{ backgroundColor: color.hex + "10" }} // Wash background
                      >
                        <div
                          className="w-4 h-4 rounded-full shadow-sm flex items-center justify-center"
                          style={{ backgroundColor: color.hex }}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5 text-white stroke-[3px]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between gap-2 mt-2 pt-2.5 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-500">Custom Color</span>
                  <div className="relative w-8 h-8 rounded-xl border border-slate-200/85 cursor-pointer overflow-hidden shadow-sm flex items-center justify-center hover:border-slate-350 transition-colors">
                    <input
                      type="color"
                      value={currentColor}
                      onChange={(e) => handleThemeChange(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div
                      className="w-5 h-5 rounded-md border border-slate-200/50 shadow-inner"
                      style={{ backgroundColor: currentColor }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 mt-2 pt-2.5 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-500">Theme Mode</span>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-700">
                    <button
                      onClick={() => handleModeChange("light")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        themeMode === "light"
                          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                    >
                      <Sun className="h-3.5 w-3.5" />
                      Light
                    </button>
                    <button
                      onClick={() => handleModeChange("dark")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        themeMode === "dark"
                          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                    >
                      <Moon className="h-3.5 w-3.5" />
                      Dark
                    </button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    {user?.photo ? (
                      <img
                        src={`${SECURITY_CONFIG.ONLY_URL}/public/profile_photos/${user.photo}`}
                        alt={`${user.name}'s profile`}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          console.error(
                            "Failed to load profile photo:",
                            user.photo
                          );
                          e.currentTarget.style.display = "none";
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallback =
                              parent.querySelector(".avatar-fallback");
                            if (fallback instanceof HTMLElement) {
                              fallback.style.display = "flex";
                            }
                          }
                        }}
                      />
                    ) : (
                      <AvatarFallback
                        className="avatar-fallback"
                        style={{ display: "flex" }}
                      >
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsEditProfileOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsChangePasswordOpen(true)}>
                  <Lock className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <EditProfileForm
            user={
              user
                ? {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    phone: user.phone || "",
                    photo: user.photo,
                    email: user.email,
                  }
                : null
            }
            onClose={() => setIsEditProfileOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <ChangePasswordForm
            onClose={() => setIsChangePasswordOpen(false)}
            onPasswordChanged={() => setIsChangePasswordOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;
