/**
 * @fileoverview Conference room component for video calls.
 * Displays video grid, chat, and call controls.
 */

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { BiMicrophone, BiMicrophoneOff } from 'react-icons/bi'
import { PiVideoCameraFill, PiVideoCameraSlashFill } from 'react-icons/pi'
import { IoSend } from 'react-icons/io5'
import { RiChat4Line, RiChatOffLine } from 'react-icons/ri'
import './Conference.scss'

interface Participant {
  id: number
  name: string
  image: string
  isMuted: boolean
  isVideoOff: boolean
}

interface Message {
  id: number
  user: string
  text: string
  timestamp: Date
}

const Conference: React.FC = () => {
  const navigate = useNavigate()
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isChatVisible, setIsChatVisible] = useState(true)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])

  // Mock participants (máximo 10)
  const [participants] = useState<Participant[]>([
    { id: 1, name: 'Natura', image: '/agorax_white.png', isMuted: false, isVideoOff: false },
    { id: 2, name: 'Cristal', image: '/agorax_white.png', isMuted: false, isVideoOff: false },
    { id: 3, name: 'Nico', image: '/agorax_white.png', isMuted: false, isVideoOff: false },
    { id: 4, name: 'Bryan', image: '/agorax_white.png', isMuted: false, isVideoOff: false },
    { id: 5, name: 'Azzura', image: '/agorax_white.png', isMuted: true, isVideoOff: false },
    { id: 6, name: 'Ahmed', image: '/agorax_white.png', isMuted: true, isVideoOff: false },
    { id: 7, name: 'Merry', image: '/agorax_white.png', isMuted: false, isVideoOff: false },
    { id: 8, name: 'Diana', image: '/agorax_white.png', isMuted: false, isVideoOff: false },
    { id: 9, name: 'Lucas', image: '/agorax_white.png', isMuted: false, isVideoOff: false },
    { id: 10, name: 'Mike', image: '/agorax_white.png', isMuted: true, isVideoOff: false }
  ])

  const toggleMic = () => setIsMicOn(!isMicOn)
  const toggleVideo = () => setIsVideoOn(!isVideoOn)
  const toggleChat = () => setIsChatVisible(!isChatVisible)

  const handleLeaveCall = () => {
    setShowLeaveModal(true)
  }

  const confirmLeaveCall = () => {
    navigate('/home')
  }

  const cancelLeaveCall = () => {
    setShowLeaveModal(false)
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([
        ...messages,
        { id: messages.length + 1, user: 'tu', text: message, timestamp: new Date() }
      ])
      setMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  return (
    <div className="conference">
      {/* Simple NavBar with logo only */}
      <nav className="conference-navbar">
        <Link to="/home" className="conference-logo">
          <img src="/agorax_white.png" alt="AgoraX" />
        </Link>
      </nav>

      <div className={`conference-content ${!isChatVisible ? 'conference-content--full' : ''}`}>
        {/* Video Grid */}
        <div className="conference-video-section">
          <div className="video-grid">
            {participants.map((participant) => (
              <div key={participant.id} className="video-tile">
                <img src={participant.image} alt={participant.name} />
                <div className="video-tile-overlay">
                  <span className="video-tile-name">{participant.name}</span>
                  {participant.isMuted && (
                    <span className="video-tile-icon">
                      <BiMicrophoneOff />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Sidebar */}
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
                placeholder="Envia un mensaje"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button onClick={handleSendMessage} title="Enviar mensaje">
                <IoSend />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer with Controls */}
      <footer className={`conference-footer ${isChatVisible ? 'chat-visible' : ''}`}>
        <div className="conference-controls">
          <div className="controls-center">
            <button
              className={`control-btn control-btn--mic ${!isMicOn ? 'control-btn--off' : ''}`}
              onClick={toggleMic}
              title={isMicOn ? 'Silenciar micrófono' : 'Activar micrófono'}
            >
              {isMicOn ? <BiMicrophone /> : <BiMicrophoneOff />}
            </button>

            <button
              className={`control-btn control-btn--video ${!isVideoOn ? 'control-btn--off' : ''}`}
              onClick={toggleVideo}
              title={isVideoOn ? 'Desactivar video' : 'Activar video'}
            >
              {isVideoOn ? <PiVideoCameraFill /> : <PiVideoCameraSlashFill />}
            </button>
          </div>

          <div className="controls-right">
            <button
              className="control-btn control-btn--chat"
              onClick={toggleChat}
              title={isChatVisible ? 'Ocultar chat' : 'Mostrar chat'}
            >
              {isChatVisible ? <RiChatOffLine /> : <RiChat4Line />}
            </button>
            <button
              className="control-btn control-btn--leave"
              onClick={handleLeaveCall}
              title="Dejar reunión"
            >
              Dejar Reunión
            </button>
          </div>
        </div>
      </footer>

      {/* Leave Confirmation Modal */}
      {showLeaveModal && (
        <div className="modal-overlay" onClick={cancelLeaveCall}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">¿Estás seguro que quieres abandonar la reunión?</h3>
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
  )
}

export default Conference
