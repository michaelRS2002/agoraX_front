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
    <div className="conference" role="main" aria-label="Sala de conferencia">
      {/* Simple NavBar with logo only */}
      <nav className="conference-navbar" role="navigation" aria-label="Navegación principal de conferencia">
        <Link to="/home" className="conference-logo" aria-label="Volver a la página de inicio">
          <img src="/agorax_white.png" alt="Logotipo de AgoraX" />
        </Link>
      </nav>

      <div className={`conference-content ${!isChatVisible ? 'conference-content--full' : ''}`}>
        {/* Video Grid */}
        <div className="conference-video-section" role="region" aria-label="Cuadrícula de participantes">
          <div className="video-grid" role="list" aria-label="Lista de participantes en la reunión">
            {participants.map((participant) => (
              <div 
                key={participant.id} 
                className="video-tile" 
                role="listitem"
                aria-label={`Participante ${participant.name}${participant.isMuted ? ', micrófono silenciado' : ''}`}
              >
                <img src={participant.image} alt={`Video de ${participant.name}`} />
                <div className="video-tile-overlay">
                  <span className="video-tile-name" aria-label={`Nombre: ${participant.name}`}>{participant.name}</span>
                  {participant.isMuted && (
                    <span className="video-tile-icon" aria-label="Micrófono silenciado">
                      <BiMicrophoneOff aria-hidden="true" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Sidebar */}
        {isChatVisible && (
          <div className="conference-chat" role="complementary" aria-label="Panel de chat">
            <div className="chat-header">
              <h3 id="chat-title">CHAT</h3>
            </div>

            <div 
              className="chat-messages" 
              role="log" 
              aria-live="polite" 
              aria-atomic="false"
              aria-labelledby="chat-title"
            >
              {messages.map((msg) => (
                <div key={msg.id} className="chat-message" role="article">
                  <span className="chat-message-user" aria-label="Remitente">{msg.user}</span>
                  <p className="chat-message-text">{msg.text}</p>
                </div>
              ))}
            </div>

            <div className="chat-input" role="form" aria-label="Enviar mensaje de chat">
              <input
                type="text"
                placeholder="Envia un mensaje"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                aria-label="Escribir mensaje"
                aria-describedby="chat-input-hint"
              />
              <span id="chat-input-hint" className="sr-only">Presiona Enter para enviar</span>
              <button 
                onClick={handleSendMessage} 
                aria-label="Enviar mensaje"
                type="submit"
              >
                <IoSend aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer with Controls */}
      <footer className={`conference-footer ${isChatVisible ? 'chat-visible' : ''}`} role="toolbar" aria-label="Controles de reunión">
        <div className="conference-controls">
          <div className="controls-center" role="group" aria-label="Controles de audio y video">
            <button
              className={`control-btn control-btn--mic ${!isMicOn ? 'control-btn--off' : ''}`}
              onClick={toggleMic}
              aria-label={isMicOn ? 'Silenciar micrófono' : 'Activar micrófono'}
              aria-pressed={isMicOn ? 'true' : 'false'}
            >
              {isMicOn ? <BiMicrophone aria-hidden="true" /> : <BiMicrophoneOff aria-hidden="true" />}
            </button>

            <button
              className={`control-btn control-btn--video ${!isVideoOn ? 'control-btn--off' : ''}`}
              onClick={toggleVideo}
              aria-label={isVideoOn ? 'Desactivar video' : 'Activar video'}
              aria-pressed={isVideoOn ? 'true' : 'false'}
            >
              {isVideoOn ? <PiVideoCameraFill aria-hidden="true" /> : <PiVideoCameraSlashFill aria-hidden="true" />}
            </button>
          </div>

          <div className="controls-right" role="group" aria-label="Controles adicionales">
            <button
              className="control-btn control-btn--chat"
              onClick={toggleChat}
              aria-label={isChatVisible ? 'Ocultar chat' : 'Mostrar chat'}
              aria-pressed={isChatVisible ? 'true' : 'false'}
              aria-expanded={isChatVisible ? 'true' : 'false'}
            >
              {isChatVisible ? <RiChatOffLine aria-hidden="true" /> : <RiChat4Line aria-hidden="true" />}
            </button>
            <button
              className="control-btn control-btn--leave"
              onClick={handleLeaveCall}
              aria-label="Abandonar reunión"
            >
              Dejar Reunión
            </button>
          </div>
        </div>
      </footer>

      {/* Leave Confirmation Modal */}
      {showLeaveModal && (
        <div 
          className="modal-overlay" 
          onClick={cancelLeaveCall}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 id="modal-title" className="modal-title">¿Estás seguro que quieres abandonar la reunión?</h3>
            <div className="modal-actions" role="group" aria-label="Acciones del modal">
              <button 
                className="modal-btn modal-btn--cancel" 
                onClick={cancelLeaveCall}
                aria-label="Cancelar y permanecer en la reunión"
              >
                Cancelar
              </button>
              <button 
                className="modal-btn modal-btn--confirm" 
                onClick={confirmLeaveCall}
                aria-label="Confirmar y abandonar la reunión"
              >
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
