import { ReactNode, useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import axiosInstance from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Header from "./Header";
// import GlobalBreadcrumb from "./GlobalBreadcrumb";
import ModernSidebar from "./ModernSidebar";
import { Bell } from "lucide-react";

interface LayoutProps {
  children?: ReactNode;
}

interface Notification {
  id: string;
  user_id: string | null;
  type: "lead" | "project";
  message: string;
  entity_id: string;
  entity_type: string;
  is_read: boolean;
  created_at: string;
  status: string;
}

const Layout = ({ children }: LayoutProps) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [readingAll, setReadingAll] = useState(false); // prevent duplicate runs

  const unreadCount = useMemo(
    () => notifications.reduce((acc, n) => acc + (n.is_read ? 0 : 1), 0),
    [notifications]
  );

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    if (!token) {
      console.warn("No token available, skipping fetchNotifications");
      setError("Please log in to view notifications");
      return;
    }
    try {
      const response = await axiosInstance.get("/notifications");
      setNotifications(response.data.data || []);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      const errorMessage =
        err.response?.data?.error || "Failed to load notifications";
      setError(errorMessage);
    }
  };

  // Mark notification as read (single, fallback)
  const markAsRead = async (id: string) => {
    if (!token) {
      console.warn("No token available, cannot mark notification as read");
      setError("Please log in to update notifications");
      return;
    }
    try {
      // Optimistic update: remove notification from UI immediately
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await axiosInstance.put(`/notifications/${id}/read`);
    } catch (err: any) {
      console.error("Error marking notification as read:", err);
      // Re-sync from server if anything fails
      fetchNotifications();
      const errorMessage =
        err.response?.data?.error || "Failed to update notification";
      setError(errorMessage);
    }
  };

  // ✅ Mark all notifications as read when the menu opens
  const markAllAsRead = async () => {
    if (!token || readingAll) return;

    try {
      setReadingAll(true);

      // Ensure we have the latest list before marking
      if (notifications.length === 0) {
        await fetchNotifications();
      }

      // Gather unread IDs from the most recent state
      const unread = (notifications.length ? notifications : []).filter(
        (n) => !n.is_read
      );
      if (unread.length === 0) {
        setReadingAll(false);
        return;
      }

      const unreadIds = unread.map((n) => n.id);

      // Optimistic: clear all unread immediately in UI
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

      // Sequentially update (safer for rate limits / DBlocks)
      for (const id of unreadIds) {
        try {
          // If any call fails, we’ll re-fetch after the loop
          await axiosInstance.put(`/notifications/${id}/read`);
        } catch (innerErr) {
          console.error(`Failed to mark ${id} as read`, innerErr);
        }
      }

      // Final re-sync to ensure server truth
      await fetchNotifications();
      setError(null);
    } catch (err: any) {
      console.error("Error marking all notifications as read:", err);
      await fetchNotifications(); // revert UI to server truth
      const errorMessage =
        err.response?.data?.error || "Failed to update notifications";
      setError(errorMessage);
    } finally {
      setReadingAll(false);
    }
  };

  // Fetch notifications on mount or when token changes
  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  // Format timestamp for display
  const formatTimestamp = (createdAt: string | Date) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Modern Sidebar */}
      <ModernSidebar />
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <Header />
        {/* Fixed Breadcrumb */}
        {/* <GlobalBreadcrumb /> */}
        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto bg-background relative">
          <div className="h-full">{children || <Outlet />}</div>

          {/* Notification Bell in Bottom-Right Corner */}
          <div className="fixed bottom-6 right-6 z-50">
            <DropdownMenu
              // Mark all as read when the menu actually opens
              onOpenChange={(open) => {
                if (open) markAllAsRead();
              }}
            >
              <DropdownMenuTrigger asChild>
                {/* <Button
                  variant="ghost"
                  className="relative h-12 w-12 rounded-full bg-white shadow-md hover:bg-gray-100"
                  // No onClick here; handled by onOpenChange for reliability
                  aria-label="Notifications"
                >
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                      {unreadCount}
                    </span>
                  )}
                </Button> */}
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-80" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Notifications
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {unreadCount} unread notifications
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="max-h-64 overflow-y-auto">
                  {error && (
                    <DropdownMenuItem
                      disabled
                      className="text-center text-sm text-red-600"
                    >
                      {error}
                    </DropdownMenuItem>
                  )}

                  {/* Only show unread notifications */}
                  {notifications.filter((n) => !n.is_read).length === 0 &&
                    !error && (
                      <DropdownMenuItem
                        disabled
                        className="text-center text-sm text-muted-foreground"
                      >
                        No notifications
                      </DropdownMenuItem>
                    )}

                  {notifications
                    .filter((n) => !n.is_read)
                    .map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex flex-col items-start py-2"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <span className="text-sm">
                          {notification.type === "lead" ? (
                            <span className="font-medium text-blue-600">
                              New Lead:
                            </span>
                          ) : (
                            <span className="font-medium text-green-600">
                              New Project:
                            </span>
                          )}{" "}
                          {notification.message}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(notification.created_at)}
                        </span>
                      </DropdownMenuItem>
                    ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
