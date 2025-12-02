import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { BiMicrophone, BiMicrophoneOff } from "react-icons/bi";
import { IoSend } from "react-icons/io5";
import { RiChat4Line, RiChatOffLine } from "react-icons/ri";
import "./Conference.scss";

import { useChatSocket, useAudioSocket } from "../../context/SocketContext";

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
}

interface RoomUser {
  socketId: string;
  username: string;
}

const Conference: React.FC = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const chatSocket = useChatSocket();
  const audioSocket = useAudioSocket();

  const [isMicOn, setIsMicOn] = useState(true);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<RoomUser[]>([]);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const remoteAudioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = user?.name || user?.email?.split("@")[0] || "Usuario";

  /** ───────────────────────
   *  MIC TOGGLE FIX
   * ───────────────────────*/
  const toggleMic = () => {
  if (!localStream) return;

  const audioTrack = localStream.getAudioTracks()[0];
  if (!audioTrack) return;

  // Cambiar estado local
  audioTrack.enabled = !audioTrack.enabled;
  setIsMicOn(audioTrack.enabled);

  // Aplicar a TODOS los peer connections 💡
  Object.values(peerConnections.current).forEach(pc => {
    pc.getSenders().forEach(sender => {
      if (sender.track && sender.track.kind === "audio") {
        sender.track.enabled = audioTrack.enabled;
      }
    });
  });

  console.log("Mic:", audioTrack.enabled ? "ON" : "OFF");
};


  /** Chat toggle */
  const toggleChat = () => setIsChatVisible(!isChatVisible);

  const handleLeaveCall = () => setShowLeaveModal(true);
  const confirmLeaveCall = () => {
    // cleanup audio and peer connections before leaving
    leaveVoiceRoom();
    navigate("/home");
  };
  const cancelLeaveCall = () => setShowLeaveModal(false);

  /** ───────────────────────
   * CHAT SOCKET LOGIC
   * ───────────────────────*/
  useEffect(() => {
    if (!chatSocket || !roomId) return;

    chatSocket.emit("joinRoom", { roomId, username });

    chatSocket.on("roomUsers", (users: RoomUser[]) => setUsers(users));
    chatSocket.on("message", (msg) => setMessages(prev => [...prev, msg]));

    return () => {
      chatSocket.emit("leaveRoom", roomId);
      chatSocket.off("roomUsers");
      chatSocket.off("message");
    };
  }, [chatSocket, roomId]);

  /** ───────────────────────
   * GET USER MEDIA
   * ───────────────────────*/
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        setLocalStream(stream);
      })
      .catch(err => console.error("Error accessing microphone:", err));
  }, []);

  /** ───────────────────────
   * CREATE OR GET PEER
   * (fix: avoid duplicates & mute breaking)
   * ───────────────────────*/
  const getOrCreatePeerConnection = (userId: string) => {
    if (peerConnections.current[userId]) return peerConnections.current[userId];

    // Build ICE servers from environment (supports VITE_ICE_SERVERS JSON, STUN and TURN)
    let iceServers: RTCIceServer[] = [];

    const iceEnv = import.meta.env.VITE_ICE_SERVERS;
    if (iceEnv) {
      try {
        const parsed = JSON.parse(iceEnv as string) as RTCIceServer[];
        if (Array.isArray(parsed) && parsed.length) {
          iceServers = parsed;
        }
      } catch (e) {
        console.warn('Failed to parse VITE_ICE_SERVERS, falling back to individual vars', e);
      }
    }

    if (!iceServers.length) {
      const stunUrl = import.meta.env.VITE_STUN_URL ?? import.meta.env.VITE_STUN_SERVER;
      const turnUrl = import.meta.env.VITE_TURN_URL;
      const turnUser = import.meta.env.VITE_TURN_USER;
      const turnPass = import.meta.env.VITE_TURN_PASS;

      if (stunUrl) iceServers.push({ urls: stunUrl });
      if (turnUrl) {
        const turnServer: RTCIceServer = { urls: turnUrl } as RTCIceServer;
        if (turnUser) (turnServer as any).username = turnUser;
        if (turnPass) (turnServer as any).credential = turnPass;
        iceServers.push(turnServer);
      }
    }

    const pc = new RTCPeerConnection({ iceServers });

    /** Add track only ONCE */
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];

      const alreadyAdded = pc.getSenders().some(s => s.track?.kind === "audio");

      if (!alreadyAdded) {
        pc.addTrack(audioTrack, localStream);
      }
    }

    pc.ontrack = (event) => {
      if (!remoteAudioRefs.current[userId]) {
        const audio = new Audio();
        audio.autoplay = true;
        remoteAudioRefs.current[userId] = audio;
      }
      remoteAudioRefs.current[userId].srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        audioSocket?.emit("ice-candidate", {
          to: userId,
          candidate: event.candidate
        });
      }
    };

    peerConnections.current[userId] = pc;
    return pc;
  };

  /** ───────────────────────
   * CREATE OFFER
   * ───────────────────────*/
  const createOffer = async (userId: string) => {
    const pc = getOrCreatePeerConnection(userId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    audioSocket?.emit("voice-offer", { to: userId, offer });
  };

  /** ───────────────────────
   * RECEIVE OFFER
   * (Fix: avoid double setRemoteDescription)
   * ───────────────────────*/
  const handleReceiveOffer = async (from: string, offer: RTCSessionDescriptionInit) => {
    const pc = getOrCreatePeerConnection(from);

    if (pc.signalingState !== "stable") {
      console.warn("Offer received while not stable, resetting...");
      await pc.setLocalDescription({ type: "rollback" });
    }

    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    audioSocket?.emit("voice-answer", { to: from, answer });
  };

  /** ───────────────────────
   * RECEIVE ANSWER
   * ───────────────────────*/
  const handleReceiveAnswer = async (from: string, answer: RTCSessionDescriptionInit) => {
    const pc = peerConnections.current[from];
    if (!pc) return;

    if (pc.signalingState === "have-local-offer") {
      await pc.setRemoteDescription(answer);
    }
  };

  /** ───────────────────────
   * AUDIO SIGNALING EVENTS
   * ───────────────────────*/
  useEffect(() => {
    if (!audioSocket || !roomId || !localStream) return;

    audioSocket.emit("join-voice-room", roomId);

    audioSocket.on("user-joined", (userId: string) => {
      createOffer(userId);
    });

    audioSocket.on("voice-offer", async ({ from, offer }) => {
      await handleReceiveOffer(from, offer);
    });

    audioSocket.on("voice-answer", async ({ from, answer }) => {
      await handleReceiveAnswer(from, answer);
    });

    audioSocket.on("ice-candidate", ({ from, candidate }) => {
      const pc = peerConnections.current[from];
      if (pc && candidate) {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    audioSocket.on("user-left", (userId: string) => {
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }
      if (remoteAudioRefs.current[userId]) {
        delete remoteAudioRefs.current[userId];
      }
    });

    return () => {
      audioSocket.off("user-joined");
      audioSocket.off("voice-offer");
      audioSocket.off("voice-answer");
      audioSocket.off("ice-candidate");
      audioSocket.off("user-left");
      // Emit leave and cleanup on unmount
      try {
        audioSocket.emit("leave-voice-room", roomId);
      } catch (e) {
        // ignore
      }
      // Close peer connections and stop tracks
      Object.values(peerConnections.current).forEach(pc => {
        try { pc.close(); } catch (e) {}
      });
      peerConnections.current = {};
      if (localStream) {
        localStream.getTracks().forEach(t => {
          try { t.stop(); } catch (e) {}
        });
      }
      // cleanup remote audio elements
      Object.values(remoteAudioRefs.current).forEach(a => {
        try { a.pause(); a.srcObject = null; } catch (e) {}
      });
      remoteAudioRefs.current = {};
    };

  }, [audioSocket, roomId, localStream]);

  /**
   * Cleanup helper to leave voice room and free resources.
   * Called when user explicitly leaves or component unmounts.
   */
  const leaveVoiceRoom = () => {
    if (audioSocket && roomId) {
      try { audioSocket.emit("leave-voice-room", roomId); } catch (e) {}
    }

    Object.values(peerConnections.current).forEach(pc => {
      try { pc.close(); } catch (e) {}
    });
    peerConnections.current = {};

    if (localStream) {
      try { localStream.getTracks().forEach(t => t.stop()); } catch (e) {}
    }

    Object.values(remoteAudioRefs.current).forEach(a => {
      try { a.pause(); a.srcObject = null; } catch (e) {}
    });
    remoteAudioRefs.current = {};
  };

  /** ───────────────────────
   * CHAT SEND
   * ───────────────────────*/
  const handleSendMessage = () => {
    if (!chatSocket || !roomId || message.trim().length === 0) return;

    chatSocket.emit("sendMessage", {
      roomId,
      user: username,
      text: message.trim(),
    });

    setMessage("");
  };

  return (
    <div className="conference">
      <nav className="conference-navbar">
        <Link to="/home" className="conference-logo">
          <img src="/agorax_white.png" alt="AgoraX Logo" />
        </Link>
      </nav>

      <div className={`conference-content ${!isChatVisible ? "conference-content--full" : ""}`}>
        <div className="conference-video-section">
          <h2 style={{ color: "white", marginTop: "20px" }}>Sala: {roomId}</h2>

          <div className="video-grid">
            <div className="video-tile audio-only">
              <p style={{ color: "white" }}>{username} (Tú)</p>
            </div>

            {users.map(u => (
              u.socketId !== chatSocket?.id && (   
                <div key={u.socketId} className="video-tile audio-only">
                  <p style={{ color: "white" }}>{u.username}</p>
                </div>
              )
            ))}
          </div>
        </div>

        {isChatVisible && (
          <div className="conference-chat">
            <div className="chat-header"><h3>CHAT</h3></div>

            <div className="chat-messages">
              {messages.map(msg => (
                <div key={msg.id} className="chat-message">
                  <span className="chat-message-user">{msg.user}</span>
                  <p className="chat-message-text">{msg.text}</p>
                </div>
              ))}
            </div>

            <div className="chat-input">
              <input
                type="text"
                value={message}
                placeholder="Escribe un mensaje..."
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button onClick={handleSendMessage}><IoSend /></button>
            </div>
          </div>
        )}
      </div>

      <footer className={`conference-footer ${isChatVisible ? "chat-visible" : ""}`}>
        <div className="conference-controls">

          <button
            className={`control-btn control-btn--mic ${!isMicOn ? "control-btn--off" : ""}`}
            onClick={toggleMic}
          >
            {isMicOn ? <BiMicrophone /> : <BiMicrophoneOff />}
          </button>

          <button className="control-btn control-btn--chat" onClick={toggleChat}>
            {isChatVisible ? <RiChatOffLine /> : <RiChat4Line />}
          </button>

          <button className="control-btn control-btn--leave" onClick={handleLeaveCall}>
            Dejar reunión
          </button>
        </div>
      </footer>

      {showLeaveModal && (
        <div className="modal-overlay" onClick={cancelLeaveCall}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">¿Salir de la reunión?</h3>
            <div className="modal-actions">
              <button className="modal-btn modal-btn--cancel" onClick={cancelLeaveCall}>
                Cancelar
              </button>
              <button className="modal-btn modal-btn--confirm" onClick={confirmLeaveCall}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Conference;