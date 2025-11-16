import React, { useState, useRef, useEffect } from "react";
import "./NavBar.scss";
import { FaUserCircle, FaUser, FaHeart, FaEdit, FaSignOutAlt, FaSearch, FaBars, FaTimes } from "react-icons/fa";
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../../utils/authApi';

/**
 * Muestra un popup consistente con otras partes de la app.
 * Reutiliza el mismo enfoque DOM que se usa en `Edit-user.tsx`.
 */
function showPopup(message: string, type: 'success' | 'error' = 'success') {
  let popup = document.getElementById("popup-message");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "popup-message";
    document.body.appendChild(popup);
  }
  popup.className = `popup-message popup-${type} popup-show`;
  popup.textContent = message;
  // @ts-ignore
  clearTimeout((popup as any)._timeout);
  // @ts-ignore
  (popup as any)._timeout = setTimeout(() => {
    popup?.classList.remove("popup-show");
  }, 3000);
}

interface NavBarProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
}

const NavBar: React.FC<NavBarProps> = ({
  searchQuery = "",
  onSearchChange,
  onSearchSubmit,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Determinar si mostrar NavBar según la ruta
  const hideNavBar = ['/login', '/register', '/forgot-password', '/reset-password', '/'].includes(location.pathname);
  const isHome = location.pathname === '/home';
  const isFavorites = location.pathname === '/favoritos';
  const showSearch = isHome || isFavorites;
  const showFavoritesLink = !isFavorites;

  if (hideNavBar) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(e);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await logoutUser();
      if (res && res.message) {
        showPopup("Sesión cerrada correctamente", 'success');
      } else {
        showPopup("Sesión cerrada correctamente", 'success');
      }
    } catch (err: any) {
      console.error("Logout error:", err);
      showPopup("Error al cerrar sesión", 'error');
    } finally {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  // Close the menu when user click outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => handleNavigate('/home')}>
          PopFix
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-desktop">
          {/* Links */}
          <ul className="navbar-links">
            <li>
              <button 
                className="nav-link"
                onClick={() => handleNavigate('/home')}
              >
                Inicio
              </button>
            </li>
            {showFavoritesLink && (
              <li>
                <button 
                  className="nav-link"
                  onClick={() => handleNavigate('/favoritos')}
                >
                  Favoritos
                </button>
              </li>
            )}
          </ul>

          {/* Search Bar - Only on Home */}
          {showSearch && (
            <form onSubmit={handleSubmit} className="navbar-search">
              <button type="submit" className="navbar-search-icon" aria-label="Buscar">
                <FaSearch aria-hidden="true" />
              </button>
              <input
                type="text"
                placeholder="Buscar películas..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="navbar-search-input"
              />
            </form>
          )}

          {/* Profile Menu */}
          <div className="navbar-actions" ref={menuRef}>
            <button 
              className="navbar-user-icon" 
              aria-label="Perfil de usuario"
              onClick={toggleMenu}
            >
              <FaUserCircle size={28} aria-hidden="true" />
            </button>
            
            {isMenuOpen && (
              <div className="user-menu">
                <button 
                  className="user-menu-item"
                  onClick={() => handleNavigate('/user')}
                >
                  <FaUser aria-hidden="true" />
                  <span>Mi perfil</span>
                </button>
                <button 
                  className="user-menu-item"
                  onClick={() => handleNavigate('/edit-user')}
                >
                  <FaEdit aria-hidden="true" />
                  <span>Editar perfil</span>
                </button>
                <button 
                  className="user-menu-item"
                  onClick={() => handleNavigate('/mapa-del-sitio')}
                >
                  <FaBars aria-hidden="true" />
                  <span>Mapa del sitio</span>
                </button>
                <button 
                  className="user-menu-item logout-item"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt aria-hidden="true" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="navbar-mobile-toggle"
          onClick={toggleMobileMenu}
          aria-label="Menú móvil"
        >
          {isMobileMenuOpen ? <FaTimes size={24} aria-hidden="true" /> : <FaBars size={24} aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="navbar-mobile">
          <ul className="mobile-links">
            <li>
              <button 
                className="mobile-link"
                onClick={() => handleNavigate('/home')}
              >
                Inicio
              </button>
            </li>
            {showFavoritesLink && (
              <li>
                <button 
                  className="mobile-link"
                  onClick={() => handleNavigate('/favoritos')}
                >
                  Favoritos
                </button>
              </li>
            )}
          </ul>

          {/* Mobile Search - Only on Home */}
          {showSearch && (
            <form onSubmit={handleSubmit} className="mobile-search">
              <button type="submit" className="mobile-search-icon" aria-label="Buscar">
                <FaSearch aria-hidden="true" />
              </button>
              <input
                type="text"
                placeholder="Buscar películas..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="mobile-search-input"
              />
            </form>
          )}

          {/* Mobile Profile Menu */}
          <div className="mobile-profile">
            <button 
              className="mobile-profile-item"
              onClick={() => handleNavigate('/user')}
            >
              <FaUser aria-hidden="true" />
              <span>Mi perfil</span>
            </button>
            <button 
              className="mobile-profile-item"
              onClick={() => handleNavigate('/mapa-del-sitio')}
            >
              <FaBars aria-hidden="true" />
              <span>Mapa del sitio</span>
            </button>
            <button 
              className="mobile-profile-item"
              onClick={() => handleNavigate('/edit-user')}
            >
              <FaEdit aria-hidden="true" />
              <span>Editar perfil</span>
            </button>
            <button 
              className="mobile-profile-item logout-item"
              onClick={handleLogout}
            >
              <FaSignOutAlt aria-hidden="true" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
