/**
 * @fileoverview Landing page component - the main entry point of the application.
 */

// Esta es generada por IA, entonces es nada más de prueba

import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Landing.scss'

/**
 * Landing component - displays the welcome page with options to login or register.
 * @component
 */
const Landing: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="landing" role="region" aria-label="Página de bienvenida">
      <div className="landing-container">
        <div className="landing-card">
          {/* Left Side - Logo */}
          <div className="landing-left" role="img" aria-label="Sección de marca AgoraX">
            <div className="landing-logo-wrapper">
              <img 
                src="/agorax_white.png" 
                alt="Logotipo de AgoraX - Plataforma de videoconferencias" 
                className="landing-logo-image"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="landing-divider" role="separator"></div>

          {/* Right Side - Auth Options */}
          <div className="landing-right" role="complementary" aria-label="Opciones de autenticación">
            <div className="landing-header">
              <h1 className="landing-title" id="landing-title">Bienvenido a AgoraX</h1>
              <p className="landing-description">
                Tu plataforma de videoconferencias profesional
              </p>
            </div>
            
            <nav className="landing-buttons" role="navigation" aria-labelledby="landing-title">
              <button 
                className="landing-button landing-button-primary"
                onClick={() => navigate('/login')}
                aria-label="Iniciar sesión en tu cuenta"
                type="button"
              >
                <span className="landing-button-text">Iniciar Sesión</span>
              </button>
              <button 
                className="landing-button landing-button-secondary"
                onClick={() => navigate('/register')}
                aria-label="Crear una cuenta nueva"
                type="button"
              >
                <span className="landing-button-text">Registrarse</span>
              </button>
            </nav>

            <div className="landing-footer">
              <p className="landing-footer-text">
                ¿Necesitas ayuda? <a href="/site-map" className="landing-footer-link" aria-label="Ver información del sitio">Más información</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing
