import React, { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { BiMicrophone, BiMicrophoneOff } from "react-icons/bi";
import { PiVideoCameraFill, PiVideoCameraSlashFill } from "react-icons/pi";
import { IoSend } from "react-icons/io5";
import { RiChat4Line, RiChatOffLine } from "react-icons/ri";
import "./Conference.scss";
import { useSocket } from "../../context/SocketContext";

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
}

const Conference: React.FC = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const socket = useSocket();

  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  // obtener usuario del localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = user?.name || user?.email?.split("@")[0] || "Usuario";

  const toggleMic = () => setIsMicOn(!isMicOn);
  const toggleVideo = () => setIsVideoOn(!isVideoOn);
  const toggleChat = () => setIsChatVisible(!isChatVisible);

  const handleLeaveCall = () => setShowLeaveModal(true);

  const confirmLeaveCall = () => navigate("/home");

  const cancelLeaveCall = () => setShowLeaveModal(false);

  /** ───────────────────────────────────────────────
   * 🔌 SOCKET.IO – JOIN ROOM & RECEIVE MESSAGES
   * ───────────────────────────────────────────────*/
  useEffect(() => {
    if (!socket || !roomId) return;

    // unirse a la room
    socket.emit("joinRoom", roomId);

    // recibir mensajes del backend
    const handleIncomingMessage = (msg: any) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          user: msg.user,
          text: msg.text,
          timestamp: new Date(),
        },
      ]);
    };

    socket.on("message", handleIncomingMessage);

    return () => {
      socket.off("message", handleIncomingMessage);
      socket.emit("leaveRoom", roomId);
    };
  }, [socket, roomId]);

  /** ───────────────────────────────────────────────
   * ✉️ Enviar mensaje
   * ───────────────────────────────────────────────*/
  const handleSendMessage = () => {
    if (!socket || !roomId || message.trim().length === 0) return;

    socket.emit("sendMessage", {
      roomId,
      user: username,
      text: message.trim(),
    });

    // NO añadimos el mensaje localmente → viene del servidor sin duplicarse
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSendMessage();
  };

  return (
    <div className="conference" role="main" aria-label="Sala de conferencia">
      {/* NavBar simple */}
      <nav className="conference-navbar">
        <Link to="/home" className="conference-logo">
          <img src="/agorax_white.png" alt="AgoraX Logo" />
        </Link>
      </nav>

      <div className={`conference-content ${!isChatVisible ? "conference-content--full" : ""}`}>
        {/* Zona principal video */}
        <div className="conference-video-section">
          <h2 style={{ textAlign: "center", marginTop: "20px", color: "white" }}>
            Sala: {roomId}
          </h2>

          <div className="video-grid">
            <div className="video-tile">
              <img src="/agorax_white.png" alt="Tu video" />
              <div className="video-tile-overlay">
                <span className="video-tile-name">{username}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat */}
        {isChatVisible && (
          <div className="conference-chat">
            <div className="chat-header">
              <h3>CHAT</h3>
            </div>

            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className="chat-message">
                  <span className="chat-message-user">{msg.user}</span>
                  <p className="chat-message-text">{msg.text}</p>
                </div>
              ))}
            </div>

            <div className="chat-input">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button onClick={handleSendMessage}>
                <IoSend />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controles */}
      <footer className={`conference-footer ${isChatVisible ? "chat-visible" : ""}`}>
        <div className="conference-controls">
          <div className="controls-center">
            <button
              className={`control-btn control-btn--mic ${!isMicOn ? "control-btn--off" : ""}`}
              onClick={toggleMic}
            >
              {isMicOn ? <BiMicrophone /> : <BiMicrophoneOff />}
            </button>

            <button
              className={`control-btn control-btn--video ${!isVideoOn ? "control-btn--off" : ""}`}
              onClick={toggleVideo}
            >
              {isVideoOn ? <PiVideoCameraFill /> : <PiVideoCameraSlashFill />}
            </button>
          </div>

          <div className="controls-right">
            <button className="control-btn control-btn--chat" onClick={toggleChat}>
              {isChatVisible ? <RiChatOffLine /> : <RiChat4Line />}
            </button>

            <button className="control-btn control-btn--leave" onClick={handleLeaveCall}>
              Dejar reunión
            </button>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {showLeaveModal && (
        <div className="modal-overlay" onClick={cancelLeaveCall}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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



