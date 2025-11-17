/**
 * @fileoverview Navigation bar component for the application.
 * Displays navigation links and user menu.
 */

import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaRegUser } from 'react-icons/fa'
import './NavBar.scss'

/**
 * NavBar component - displays the main navigation bar.
 * @component
 */
const NavBar: React.FC = () => {
  const navigate = useNavigate()
  const token = localStorage.getItem('authToken')

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handleLogin = () => {
    navigate('/login')
  }

  const handleRegister = () => {
    navigate('/register')
  }

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <Link to="/home" className="navbar__logo">
          <img src="/agorax_white.png" alt="AgoraX" />
        </Link>

        <div className="navbar__menu">
          {token ? (
            <>
              <button onClick={handleLogout} className="navbar__button navbar__button--logout">
                Cerrar Sesión
              </button>
              <Link to="/user" className="navbar__icon-profile">
                <FaRegUser />
              </Link>
            </>
          ) : (
            <>
              <button onClick={handleLogin} className="navbar__button">
                Iniciar Sesión
              </button>
              <button onClick={handleRegister} className="navbar__button">
                Registrarse
              </button>
              <Link to="/login" className="navbar__icon-profile">
                <FaRegUser />
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default NavBar
