import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.scss';
import NavBar from "../../components/NavBar/NavBar";

const Home: React.FC = () => {
  const [meetingId, setMeetingId] = useState('');
  const navigate = useNavigate();

  const handleStartMeeting = () => {
    // Lógica para iniciar una nueva videoconferencia
    console.log('Iniciar videoconferencia');
  };

  const handleJoinMeeting = () => {
    if (meetingId.trim()) {
      // Lógica para unirse a una reunión
      console.log('Unirse a reunión:', meetingId);
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
              <li><a href="#">Sobre nosotros</a></li>
              <li><a href="/register">Registrarse</a></li>
              <li><a href="/login">Iniciar sesión</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <ul>
              <li><a href="#">Videollamada</a></li>
              <li><a href="#">Perfil</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default Home;
