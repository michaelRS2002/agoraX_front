/**
 * @fileoverview Navigation bar component for the application.
 * Displays navigation links and user menu.
 */

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaRegUser } from 'react-icons/fa'
import './NavBar.scss'
import { logoutUser, isAuthenticated } from '../../utils/authApi'

/**
 * NavBar component - displays the main navigation bar.
 * @component
 */
const NavBar: React.FC = () => {
  const navigate = useNavigate()

  // Estado reactivo para saber si hay sesión
  const [loggedIn, setLoggedIn] = useState<boolean>(isAuthenticated())

  // Si el token cambia en localStorage (login/logout), actualizamos
  useEffect(() => {
    const syncAuth = () => setLoggedIn(isAuthenticated())
    window.addEventListener('storage', syncAuth)
    return () => window.removeEventListener('storage', syncAuth)
  }, [])

  const handleLogout = async () => {
    try {
      await logoutUser()            // llama a tu API y limpia storage
    } catch (e) {
      console.warn('Error al cerrar sesión, pero se limpió el cliente igualmente.')
    } finally {
      setLoggedIn(false)
      navigate('/login')
    }
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
        {/* Logo que lleva a home */}
        <Link to="/home" className="navbar__logo">
          <img src="/agorax_white.png" alt="AgoraX" />
        </Link>

        <div className="navbar__menu">
          {loggedIn ? (
            <>
              {/* CERRAR SESIÓN cuando hay token */}
              <button
                onClick={handleLogout}
                className="navbar__button navbar__button--logout"
              >
                Cerrar Sesión
              </button>

              <Link to="/user" className="navbar__icon-profile">
                <FaRegUser />
              </Link>
            </>
          ) : (
            <>
              {/* INICIAR Y REGISTRARSE cuando NO hay sesión */}
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
