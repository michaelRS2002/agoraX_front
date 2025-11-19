import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.scss';
import NavBar from "../../components/NavBar/NavBar";

const Home: React.FC = () => {
  const [meetingId, setMeetingId] = useState('');
  const navigate = useNavigate();

  const handleStartMeeting = () => {
    // Generar un ID único para la reunión
    const newRoomId = Math.random().toString(36).substring(2, 15)
    navigate(`/conference/${newRoomId}`)
  };

  const handleJoinMeeting = () => {
    if (meetingId.trim()) {
      navigate(`/conference/${meetingId}`)
    }
  };

  return (
    <>
      <NavBar />
      <div className="home-container" role="main">
        {/* Hero Section */}
        <div className="hero-section" role="region" aria-labelledby="hero-title">
        <div className="hero-content">
          <h1 id="hero-title" className="hero-title">Video conferencias para todos</h1>
          
          <div className="video-icon" role="img" aria-label="Logotipo de AgoraX">
            <img src="/agorax_white.png" alt="Logotipo grande de AgoraX" />
          </div>

          <div className="action-buttons" role="group" aria-label="Acciones de videoconferencia">
            <button 
              className="btn-primary" 
              onClick={handleStartMeeting}
              aria-label="Iniciar una nueva videoconferencia"
            >
              Iniciar una videoconferencia
            </button>
            <div className="join-meeting-container" role="search">
              <input
                type="text"
                placeholder="Introduce el Id de la reunion"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
                className="meeting-input"
                aria-label="Introducir ID de reunión"
                aria-describedby="join-hint"
              />
              <span id="join-hint" className="sr-only">Ingresa el código de la reunión a la que deseas unirte</span>
              <button 
                className="btn-join" 
                onClick={handleJoinMeeting}
                aria-label="Unirse a la reunión"
              >
                Unirse
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="footer-section" role="contentinfo">
        <div className="footer-content">
          <div className="footer-column">
            <ul role="list" aria-label="Enlaces de cuenta">
              <li><a href="/site-map" aria-label="Ir al mapa del sitio">Sobre nosotros</a></li>
              <li><a href="/register" aria-label="Crear una cuenta nueva">Registrarse</a></li>
              <li><a href="/login" aria-label="Iniciar sesión en tu cuenta">Iniciar sesión</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <ul role="list" aria-label="Enlaces de funciones">
              <li><a href="/conference" aria-label="Iniciar una videollamada">Videollamada</a></li>
              <li><a href="/perfil" aria-label="Ver tu perfil">Perfil</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default Home;
