// src/pages/ChatHome.tsx

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import moment from "moment";

interface User {
  id: string;
  name: string;
  email: string;
  photo?: string;
}

interface Conversation {
  conversationId?: string;
  otherUser: User;
  lastMessage?: {
    text?: string;
    imageUrl?: string;
    videoUrl?: string;
    createdAt?: string;
  };
  unseenCount: number;
}

interface Message {
  id: string;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  messageByUser: string;
  createdAt: string;
}

const ChatHome: React.FC = () => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load all active users from REST API
  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        const response = await axiosInstance.get("/chat/all-users");
        setAllUsers(response.data);
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadAllUsers();
  }, []);

  // Socket: Load conversations & handle sidebar updates
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit("sidebar", user.id);

    const handleConversations = (data: Conversation[]) => {
      setConversations(data);
    };

    const handleSidebarUpdate = () => {
      socket.emit("sidebar", user.id);
    };

    socket.on("conversations", handleConversations);
    socket.on("sidebar-update", handleSidebarUpdate);

    return () => {
      socket.off("conversations", handleConversations);
      socket.off("sidebar-update", handleSidebarUpdate);
    };
  }, [socket, user]);

  // Open chat with a user – load message history
  const openChat = (targetUser: User) => {
    setSelectedUser(targetUser);
    setMessages([]); // Clear previous messages

    if (!socket) return;

    // Remove any existing listener to avoid duplicates
    socket.off("message");

    socket.emit("message-page", targetUser.id);

    const handleMessages = (msgs: Message[]) => {
      setMessages(msgs);
    };

    socket.on("message", handleMessages);
  };

  // Real-time incoming messages (from others or self via server)
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg: Message) => {
      // Only add if this chat is currently open
      if (
        selectedUser &&
        (newMsg.messageByUser === selectedUser.id ||
          newMsg.messageByUser === user?.id)
      ) {
        setMessages((prev) => {
          // Remove any temporary optimistic messages
          const withoutTemp = prev.filter(
            (m) => !String(m.id).startsWith("temp-")
          );

          // Prevent real duplicates
          if (withoutTemp.some((m) => m.id === newMsg.id)) {
            return withoutTemp;
          }

          return [...withoutTemp, newMsg];
        });
      }

      // Always refresh sidebar to update last message
      socket.emit("sidebar", user?.id);
    };

    socket.on("new-message-received", handleNewMessage);

    return () => {
      socket.off("new-message-received", handleNewMessage);
    };
  }, [socket, selectedUser, user]);

  // Send message with optimistic UI
  const sendMessage = () => {
    if (!inputText.trim() || !selectedUser || !socket || !user) return;

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage: Message = {
      id: tempId,
      text: inputText.trim(),
      messageByUser: user.id,
      createdAt: new Date().toISOString(),
    };

    // Show immediately on UI
    setMessages((prev) => [...prev, optimisticMessage]);

    // Send to server
    socket.emit("new-message", {
      receiver: selectedUser.id,
      text: inputText.trim(),
    });

    // Clear input
    setInputText("");
  };

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check if user is online
  const isOnline = (userId: string) => onlineUsers.includes(userId);

  // Merge all users with conversation data for sidebar
  const mergedList = allUsers.map((u) => {
    const conv = conversations.find((c) => c.otherUser.id === u.id);
    return {
      otherUser: u,
      lastMessage: conv?.lastMessage,
      unseenCount: conv?.unseenCount || 0,
    };
  });

  // Sort by most recent message
  mergedList.sort((a, b) => {
    const timeA = a.lastMessage?.createdAt || "0";
    const timeB = b.lastMessage?.createdAt || "0";
    return new Date(timeB).getTime() - new Date(timeA).getTime();
  });

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar - All Users + Last Message */}
      <div className="w-96 border-r bg-white flex flex-col">
        <div className="p-5 border-b">
          <h2 className="text-xl font-semibold">Messages</h2>
        </div>

        <ScrollArea className="flex-1">
          {loadingUsers ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : mergedList.length === 0 ? (
            <p className="text-center text-gray-500 p-10">No users available</p>
          ) : (
            mergedList.map((item) => (
              <div
                key={item.otherUser.id}
                onClick={() => openChat(item.otherUser)}
                className={`p-4 hover:bg-gray-50 cursor-pointer border-b transition-all ${
                  selectedUser?.id === item.otherUser.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={item.otherUser.photo || undefined} />
                      <AvatarFallback>
                        {item.otherUser.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline(item.otherUser.id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-medium truncate">
                        {item.otherUser.name}
                      </h4>
                      {item.lastMessage?.createdAt && (
                        <span className="text-xs text-gray-500 ml-2">
                          {moment(item.lastMessage.createdAt).format("h:mm A")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {item.lastMessage?.imageUrl
                        ? "📷 Photo"
                        : item.lastMessage?.videoUrl
                        ? "🎥 Video"
                        : item.lastMessage?.text || "Start chatting..."}
                    </p>
                  </div>

                  {item.unseenCount > 0 && (
                    <Badge variant="destructive">{item.unseenCount}</Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser.photo || undefined} />
                <AvatarFallback>
                  {selectedUser.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                <p className="text-sm text-gray-500">
                  {isOnline(selectedUser.id) ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6 bg-gray-50">
              <div className="max-w-4xl mx-auto space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.messageByUser === user?.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-sm ${
                        msg.messageByUser === user?.id
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-900 border"
                      }`}
                    >
                      <p className="break-words">{msg.text}</p>
                      <p
                        className={`text-xs mt-2 ${
                          msg.messageByUser === user?.id
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {moment(msg.createdAt).format("h:mm A")}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 bg-white border-t">
              <div className="flex gap-3 max-w-4xl mx-auto">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 text-base"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputText.trim()}
                  size="icon"
                  className="h-12 w-12"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <p className="text-xl text-gray-500">
              Select a user to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHome;
