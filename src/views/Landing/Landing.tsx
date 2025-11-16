import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Landing.scss'
import { BiPlay } from 'react-icons/bi'
import { IoLogIn } from 'react-icons/io5'

const Landing: React.FC = () => {
  const navigate = useNavigate()

  const scrollToAbout = () => {
    const aboutSection = document.getElementById('about-section')
    aboutSection?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Popfix</h1>
            <p className="hero-subtitle">Tu plataforma de películas en línea</p>
            <p className="hero-description">
              Descubre miles de películas y series. Crea tu lista de favoritos, 
              califica tus películas favoritas y disfruta del mejor entretenimiento.
            </p>
            <div className="hero-buttons">
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/login')}
              >
                <IoLogIn className="btn-icon" />
                <span>Iniciar Sesión</span>
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/register')}
              >
                <BiPlay className="btn-icon" />
                <span>Registrarse</span>
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-placeholder">
              <BiPlay className="play-icon-large" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>¿Por qué elegir Popfix?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎬</div>
            <h3>Miles de Películas</h3>
            <p>Acceso a un catálogo extenso de películas de todos los géneros</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">❤️</div>
            <h3>Tus Favoritos</h3>
            <p>Crea tu lista personal de películas favoritas y gestiónalas fácilmente</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⭐</div>
            <h3>Calificaciones</h3>
            <p>Califica tus películas y comparte tu opinión con otros usuarios</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Busca Fácilmente</h3>
            <p>Encuentra películas por título, género o cualquier criterio que necesites</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about-section" className="about-section">
        <div className="about-content">
          <h2>Acerca de Popfix</h2>
          <div className="about-text">
            <p>
              Popfix es tu destino definitivo para el entretenimiento en línea. 
              Diseñada con los cinéfilos en mente, nuestra plataforma ofrece una 
              experiencia inmersiva para descubrir, ver y disfrutar de tus películas favoritas.
            </p>
            <p>
              Con una interfaz intuitiva y un catálogo constantemente actualizado, 
              Popflix te permite explorar películas de todos los géneros, crear listas 
              personalizadas de favoritos y conectar con otros amantes del cine.
            </p>
            <p>
              Ya sea que busques acción, drama, comedia o ciencia ficción, 
              Popflix tiene algo para todos. ¡Únete a nuestra comunidad hoy!
            </p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/register')}
          >
            <span>Comenzar Ahora</span>
          </button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>¿Listo para empezar?</h2>
          <p>Únete a miles de usuarios disfrutando del mejor entretenimiento</p>
          <div className="cta-buttons">
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/register')}
            >
              Registrarse Ahora
            </button>
            <button 
              className="btn btn-outline"
              onClick={scrollToAbout}
            >
              Saber Más
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <p>&copy; 2025 Popflix. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
