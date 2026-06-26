import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { logout, sessionExpired } from "@/store/slices/authSlice";

interface SocketState {
  onlineUsers: string[];
}

const initialState: SocketState = {
  onlineUsers: [],
};

const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    setOnlineUsers(state, action: PayloadAction<string[]>) {
      state.onlineUsers = action.payload;
    },
    clearOnlineUsers(state) {
      state.onlineUsers = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout, (state) => {
        state.onlineUsers = [];
      })
      .addCase(sessionExpired, (state) => {
        state.onlineUsers = [];
      });
  },
});

export const { setOnlineUsers, clearOnlineUsers } = socketSlice.actions;
export const selectOnlineUsers = (state: { socket: SocketState }) =>
  state.socket.onlineUsers;

export default socketSlice.reducer;
