// src/context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

/** ----------------------------------------------------
 *  TYPES
 * ----------------------------------------------------*/
interface SocketContextType {
  chatSocket: Socket | null;   // Servidor de chat
  audioSocket: Socket | null;  // Servidor de audio / WebRTC signaling
}

/** ----------------------------------------------------
 *  CONTEXT
 * ----------------------------------------------------*/
const SocketContext = createContext<SocketContextType>({
  chatSocket: null,
  audioSocket: null,
});

/** ----------------------------------------------------
 *  PROVIDER
 * ----------------------------------------------------*/
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chatSocket, setChatSocket] = useState<Socket | null>(null);
  const [audioSocket, setAudioSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const CHAT_URL = import.meta.env.VITE_CHAT_SOCKET_URL;
    const AUDIO_URL = import.meta.env.VITE_AUDIO_SOCKET_URL;

    /** Chat socket */
    const chat = io(CHAT_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });

    /** Audio / WebRTC signaling socket */
    const audio = io(AUDIO_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });

    setChatSocket(chat);
    setAudioSocket(audio);

    return () => {
      chat.disconnect();
      audio.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ chatSocket, audioSocket }}>
      {children}
    </SocketContext.Provider>
  );
};

/** ----------------------------------------------------
 *  CUSTOM HOOKS
 * ----------------------------------------------------*/
export const useChatSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useChatSocket must be used inside <SocketProvider>");
  return context.chatSocket;
};

export const useAudioSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useAudioSocket must be used inside <SocketProvider>");
  return context.audioSocket;
};




