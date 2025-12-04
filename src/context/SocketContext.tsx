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
    // Allow easy local defaults during development. Prefer explicit VITE_ vars.
    const CHAT_URL = import.meta.env.VITE_CHAT_SOCKET_URL ?? 'http://localhost:3001';
    const AUDIO_URL = import.meta.env.VITE_AUDIO_SOCKET_URL ?? 'http://localhost:9000';

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

    console.log('[SocketContext] connecting sockets', { CHAT_URL, AUDIO_URL });

    chat.on('connect', () => console.log('[SocketContext] chat connected', chat.id));
    chat.on('connect_error', (err: any) => console.error('[SocketContext] chat connect_error', err));
    audio.on('connect', () => console.log('[SocketContext] audio connected', audio.id));
    audio.on('connect_error', (err: any) => console.error('[SocketContext] audio connect_error', err));

    setChatSocket(chat);
    setAudioSocket(audio);

    return () => {
      chat.off('connect');
      chat.off('connect_error');
      audio.off('connect');
      audio.off('connect_error');
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





