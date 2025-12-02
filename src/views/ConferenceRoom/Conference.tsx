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

  // ─────────────────────────────────────────────
  // TOGGLE MIC
  // ─────────────────────────────────────────────
  const toggleMic = () => {
    if (!localStream) return;

    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setIsMicOn(audioTrack.enabled);

    Object.values(peerConnections.current).forEach(pc => {
      pc.getSenders().forEach(sender => {
        if (sender.track?.kind === "audio") {
          sender.track.enabled = audioTrack.enabled;
        }
      });
    });
  };

  const toggleChat = () => setIsChatVisible(!isChatVisible);

  const handleLeaveCall = () => setShowLeaveModal(true);

  // ─────────────────────────────────────────────
  // CLEAN DISCONNECT (VERY IMPORTANT)
  // ─────────────────────────────────────────────
  const cleanDisconnect = () => {

    console.log("Cleaning WebRTC + Sockets + Streams");

    // Close peer connections
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};

    // Stop local audio stream
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }

    // Disconnect sockets
    audioSocket?.emit("leaveRoom", roomId);
    audioSocket?.disconnect();

    chatSocket?.emit("leaveRoom", roomId);
    chatSocket?.disconnect();
  };

  const confirmLeaveCall = () => {
    cleanDisconnect();
    navigate("/home");
  };

  const cancelLeaveCall = () => setShowLeaveModal(false);

  // ─────────────────────────────────────────────
  // CHAT SOCKET
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!chatSocket || !roomId) return;

    chatSocket.emit("joinRoom", { roomId, username });

    chatSocket.on("roomUsers", setUsers);
    chatSocket.on("message", msg => setMessages(prev => [...prev, msg]));

    return () => {
      chatSocket.emit("leaveRoom", roomId);
      chatSocket.off("roomUsers");
      chatSocket.off("message");
    };
  }, [chatSocket, roomId]);

  // ─────────────────────────────────────────────
  // GET AUDIO STREAM
  // ─────────────────────────────────────────────
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(setLocalStream);
  }, []);

  // ─────────────────────────────────────────────
  // GET / CREATE PC
  // ─────────────────────────────────────────────
  const getOrCreatePeerConnection = (userId: string) => {
    if (peerConnections.current[userId]) return peerConnections.current[userId];

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: import.meta.env.VITE_STUN_SERVER }]
    });

    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];

      if (!pc.getSenders().some(s => s.track?.kind === "audio")) {
        pc.addTrack(audioTrack, localStream);
      }
    }

    pc.ontrack = event => {
      if (!remoteAudioRefs.current[userId]) {
        const audio = new Audio();
        audio.autoplay = true;
        remoteAudioRefs.current[userId] = audio;
      }
      remoteAudioRefs.current[userId].srcObject = event.streams[0];
    };

    pc.onicecandidate = event => {
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

  // CREATE OFFER
  const createOffer = async (userId: string) => {
    const pc = getOrCreatePeerConnection(userId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    audioSocket?.emit("voice-offer", { to: userId, offer });
  };

  const handleReceiveOffer = async (from: string, offer: RTCSessionDescriptionInit) => {
    const pc = getOrCreatePeerConnection(from);

    if (pc.signalingState !== "stable") {
      await pc.setLocalDescription({ type: "rollback" });
    }

    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    audioSocket?.emit("voice-answer", { to: from, answer });
  };

  const handleReceiveAnswer = async (from: string, answer: RTCSessionDescriptionInit) => {
    const pc = peerConnections.current[from];
    if (!pc) return;

    if (pc.signalingState === "have-local-offer") {
      await pc.setRemoteDescription(answer);
    }
  };

  // ─────────────────────────────────────────────
  // AUDIO SOCKET EVENTS
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!audioSocket || !roomId || !localStream) return;

    audioSocket.emit("join-voice-room", roomId);

    // SALA LLENA
    audioSocket.on("room-full", ({ max }) => {
      alert(`La sala está llena. Máximo permitido: ${max} personas`);
      navigate("/home");
    });

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
      delete remoteAudioRefs.current[userId];
    });

    return () => {
      audioSocket.off("room-full");
      audioSocket.off("user-joined");
      audioSocket.off("voice-offer");
      audioSocket.off("voice-answer");
      audioSocket.off("ice-candidate");
      audioSocket.off("user-left");
    };

  }, [audioSocket, roomId, localStream]);

  // ─────────────────────────────────────────────
  // SEND CHAT MESSAGE
  // ─────────────────────────────────────────────
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

            {users.map(u =>
              u.socketId !== chatSocket?.id && (
                <div key={u.socketId} className="video-tile audio-only">
                  <p style={{ color: "white" }}>{u.username}</p>
                </div>
              )
            )}
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
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendMessage()}
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










