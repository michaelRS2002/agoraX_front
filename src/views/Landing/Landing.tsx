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
    <div className="landing">
      <div className="landing__container" role="main">
        <h1 className="landing__title">Bienvenido a AgoraX</h1>
        <p className="landing__description">
          Tu plataforma de videoconferencias
        </p>
        <div className="landing__buttons" role="group" aria-label="Opciones de acceso">
          <button 
            className="landing__button landing__button--primary"
            onClick={() => navigate('/login')}
            aria-label="Ir a iniciar sesión"
          >
            Iniciar Sesión
          </button>
          <button 
            className="landing__button landing__button--secondary"
            onClick={() => navigate('/register')}
            aria-label="Ir a crear cuenta"
          >
            Registrarse
          </button>
        </div>
      </div>
    </div>
  )
}

export default Landing
