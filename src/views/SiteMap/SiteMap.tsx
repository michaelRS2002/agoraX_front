/**
 * @file SiteMap.tsx
 * @description Displays a complete sitemap for the AgoraX application, allowing users to easily navigate between different sections.
 * @module SiteMap
 */

import React from "react";
import { Link } from "react-router-dom";
import "./SiteMap.scss";
import NavBar from "../../components/NavBar/NavBar";

/**
 * Renders the Site Map page component.
 *
 * This page provides a structured list of navigation links categorized by
 * main site sections, user-related actions, and conference options.
 *
 * @component
 * @example
 * return (
 *   <SiteMap />
 * )
 *
 * @returns {JSX.Element} A JSX element displaying the site map layout.
 */
const SiteMap: React.FC = () => {
  return (
    <div className="sitemap">
      <NavBar />

      <div className="sitemap-container">
        <div className="sitemap-header">
          <h1>Mapa del Sitio</h1>
          <p className="sitemap-description">
            Encuentra todas las funcionalidades de AgoraX. Aquí está el mapa completo de navegación.
          </p>
        </div>

        <div className="sitemap-grid">
          {/* Main Navigation Section */}
          <div className="sitemap-card">
            <div className="card-icon">🏠</div>
            <h2>Navegación Principal</h2>
            <ul>
              <li>
                <Link to="/">Página de Bienvenida</Link>
              </li>
              <li>
                <Link to="/home">Inicio</Link>
              </li>
            </ul>
          </div>

          {/* User Section */}
          <div className="sitemap-card">
            <div className="card-icon">👤</div>
            <h2>Usuario</h2>
            <ul>
              <li>
                <Link to="/login">Iniciar Sesión</Link>
              </li>
              <li>
                <Link to="/register">Registrarse</Link>
              </li>
              <li>
                <Link to="/user">Mi Perfil</Link>
              </li>
              <li>
                <Link to="/user/edit">Editar Perfil</Link>
              </li>
              <li>
                <Link to="/user/change-password">Cambiar Contraseña</Link>
              </li>
              <li>
                <Link to="/user/delete">Eliminar Cuenta</Link>
              </li>
            </ul>
          </div>

          {/* Conference Section */}
          <div className="sitemap-card">
            <div className="card-icon">📹</div>
            <h2>Videoconferencias</h2>
            <ul>
              <li>
                <span className="disabled-link">Iniciar Reunión</span>
              </li>
              <li>
                <span className="disabled-link">Unirse a Reunión</span>
              </li>
              <li>
                <span className="disabled-link">Sala de Conferencia</span>
              </li>
            </ul>
          </div>

          {/* Recovery Section */}
          <div className="sitemap-card">
            <div className="card-icon">🔐</div>
            <h2>Recuperación</h2>
            <ul>
              <li>
                <Link to="/forgot-password">Olvidé mi Contraseña</Link>
              </li>
              <li>
                <Link to="/reset-password">Restablecer Contraseña</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteMap;
