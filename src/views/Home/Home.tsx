import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.scss';
import NavBar from "../../components/NavBar/NavBar";
import { createMeeting } from '../../utils/meetingsApi';

const Home: React.FC = () => {
  const [meetingId, setMeetingId] = useState('');
  const navigate = useNavigate();

  const handleStartMeeting = () => {
    // Llamar al backend para crear la reunión y navegar al roomId devuelto
    (async () => {
      try {
        const stored = localStorage.getItem('user');
        const user = stored ? JSON.parse(stored) : null;
        const hostId = user?.id || user?.uid || undefined;
        const resp = await createMeeting({ hostId });
        const roomId = resp?.meeting?.roomId;
        if (roomId) {
          navigate(`/conference/${roomId}`);
          return;
        }
        // fallback: generar localmente si el backend no devuelve roomId
        const newRoomId = Math.random().toString(36).substring(2, 15);
        navigate(`/conference/${newRoomId}`);
      } catch (err) {
        console.error('Error creando reunión, usando fallback:', err);
        const newRoomId = Math.random().toString(36).substring(2, 15);
        navigate(`/conference/${newRoomId}`);
      }
    })();
  };

  const handleJoinMeeting = () => {
    if (meetingId.trim()) {
      navigate(`/conference/${meetingId}`)
    }
  };

  return (
    <>
      <NavBar />
      <div className="home-container">
        {/* Hero Section */}
        <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Video conferencias para todos</h1>
          
          <div className="video-icon">
            <img src="/agorax_white.png" alt="AgoraX Logo" />
          </div>

          <div className="action-buttons">
            <button className="btn-primary" onClick={handleStartMeeting}>
              Iniciar una videoconferencia
            </button>
            <div className="join-meeting-container">
              <input
                type="text"
                placeholder="Introduce el Id de la reunion"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
                className="meeting-input"
              />
              <button className="btn-join" onClick={handleJoinMeeting}>
                Unirse
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="footer-section">
        <div className="footer-content">
          <div className="footer-column">
            <ul>
              <li><a href="/site-map">Sobre nosotros</a></li>
              <li><a href="/register">Registrarse</a></li>
              <li><a href="/login">Iniciar sesión</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <ul>
              <li><a href="/conference">Videollamada</a></li>
              <li><a href="/perfil">Perfil</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default Home;
