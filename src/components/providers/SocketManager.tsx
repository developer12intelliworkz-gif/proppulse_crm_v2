import { useEffect } from "react";
import io from "socket.io-client";
import { SECURITY_CONFIG } from "@/config/security";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setOnlineUsers, clearOnlineUsers } from "@/store/slices/socketSlice";
import { getSocket, setSocket } from "@/store/socketRef";

/** Manages socket.io connection lifecycle (replaces SocketProvider side effects). */
export const SocketManager = () => {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!user || !token) {
      const existing = getSocket();
      if (existing) {
        existing.disconnect();
        setSocket(null);
      }
      dispatch(clearOnlineUsers());
      return;
    }

    const socket = io(
      import.meta.env.VITE_BACKEND_URL || SECURITY_CONFIG.BASE,
      {
        auth: { token },
        transports: ["websocket", "polling"],
      },
    );

    setSocket(socket);

    socket.on("connect", () => {
      console.log("✅ Chat socket connected successfully! ID:", socket.id);
    });

    socket.on("onlineUsers", (users: string[]) => {
      dispatch(setOnlineUsers(users));
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection failed:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    return () => {
      socket.disconnect();
      setSocket(null);
      dispatch(clearOnlineUsers());
    };
  }, [user, token, dispatch]);

  return null;
};
