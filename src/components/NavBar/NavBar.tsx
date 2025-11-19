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
    <nav className="navbar" role="navigation" aria-label="Navegación principal">
      <div className="navbar__container">
        {/* Logo que lleva a home */}
        <Link to="/home" className="navbar__logo" aria-label="Ir a la página de inicio">
          <img src="/agorax_white.png" alt="Logotipo de AgoraX" />
        </Link>

        <div className="navbar__menu" role="menubar" aria-label="Menú de usuario">
          {loggedIn ? (
            <>
              {/* CERRAR SESIÓN cuando hay token */}
              <button
                onClick={handleLogout}
                className="navbar__button navbar__button--logout"
                aria-label="Cerrar sesión"
                role="menuitem"
              >
                Cerrar Sesión
              </button>

              <Link to="/user" className="navbar__icon-profile" aria-label="Ir a mi perfil" role="menuitem">
                <FaRegUser aria-hidden="true" />
              </Link>
            </>
          ) : (
            <>
              {/* INICIAR Y REGISTRARSE cuando NO hay sesión */}
              <button onClick={handleLogin} className="navbar__button" aria-label="Iniciar sesión" role="menuitem">
                Iniciar Sesión
              </button>
              <button onClick={handleRegister} className="navbar__button" aria-label="Crear cuenta nueva" role="menuitem">
                Registrarse
              </button>

              <Link to="/login" className="navbar__icon-profile" aria-label="Ir a iniciar sesión" role="menuitem">
                <FaRegUser aria-hidden="true" />
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default NavBar
