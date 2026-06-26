import type { Socket } from "socket.io-client";

/** Socket instance is non-serializable — kept outside Redux state. */
let socketInstance: Socket | null = null;

export const getSocket = () => socketInstance;

export const setSocket = (socket: Socket | null) => {
  socketInstance = socket;
};
