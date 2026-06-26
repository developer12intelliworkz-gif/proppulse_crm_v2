import { getSocket } from "@/store/socketRef";
import { useAppSelector } from "@/store/hooks";
import { SocketManager } from "@/components/providers/SocketManager";

/** Socket connection is managed by SocketManager; state is in Redux. */
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <>
      <SocketManager />
      {children}
    </>
  );
};

export const useSocket = () => {
  const onlineUsers = useAppSelector((state) => state.socket.onlineUsers);
  return {
    socket: getSocket(),
    onlineUsers,
  };
};
