/**
 * @file Change-password.tsx
 * @description Provides the user interface and logic for updating a user's password. Includes input validation, API integration, and popup feedback for success and error states.
 * @module ChangePassword
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavBar from "../../../components/NavBar/NavBar";
import { changePassword } from "../../../utils/authApi";
import "./Change-password.scss";

/**
 * Displays a success popup message for a few seconds.
 *
 * @param {string} message - The success message to display.
 * @returns {void}
 */
function showSuccess(message: string) {
  let popup = document.getElementById("popup-message");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "popup-message";
    document.body.appendChild(popup);
  }
  popup.className = "popup-message popup-success popup-show";
  popup.textContent = message;

  // @ts-ignore
  clearTimeout((popup as any)._timeout);
  // @ts-ignore
  (popup as any)._timeout = setTimeout(() => {
    popup?.classList.remove("popup-show");
  }, 3000);
}

/**
 * Displays an error popup message for a few seconds.
 *
 * @param {string} message - The error message to display.
 * @returns {void}
 */
function showError(message: string) {
  let popup = document.getElementById("popup-message");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "popup-message";
    document.body.appendChild(popup);
  }
  popup.className = "popup-message popup-error popup-show";
  popup.textContent = message;

  // @ts-ignore
  clearTimeout((popup as any)._timeout);
  // @ts-ignore
  (popup as any)._timeout = setTimeout(() => {
    popup?.classList.remove("popup-show");
  }, 3000);
}

/**
 * React component that renders the "Change Password" page.
 *
 * This component allows users to update their current password by providing
 * form validation, feedback via popup notifications, and integration with
 * the backend authentication API.
 *
 * @component
 * @example
 * return (
 *   <ChangePassword />
 * )
 *
 * @returns {JSX.Element} The rendered Change Password page.
 */
const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Handles form submission to change the user's password.
   *
   * Performs client-side validation and communicates with the backend API.
   * Displays success or error messages via popup notifications.
   *
   * @async
   * @param {React.FormEvent} e - The form submission event.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError("Debes ingresar tu contraseña actual.");
      return;
    }

    if (!newPassword) {
      setError("Debes ingresar una nueva contraseña.");
      return;
    }

    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("La nueva contraseña debe ser diferente a la actual.");
      return;
    }

    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      showSuccess("¡Contraseña cambiada correctamente!");
      setTimeout(() => navigate("/user"), 2000);
    } catch (err: any) {
      showError(err?.message || "Error al cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar />
      <div className="app-container-change-password">
        <div className="main-content-change-password">
          <div className="change-password-box">
            <Link
              to="/edit-user"
              className="back-arrow-change-password"
              aria-label="Volver a editar perfil"
            >
              ←
            </Link>
            <img
              src="/static/img/film-icon.jpg"
              alt="Logotipo de PopFix - ícono de carrete de película"
              className="icon"
            />
            <h2>Cambiar Contraseña</h2>
            <p>Actualiza tu contraseña de acceso</p>

            <form
              className="change-password-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <label htmlFor="currentPassword">Contraseña actual</label>
              <input
                id="currentPassword"
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />

              <label htmlFor="newPassword">Nueva contraseña</label>
              <input
                id="newPassword"
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />

              <label htmlFor="confirmPassword">
                Confirmar nueva contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                required
              />

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="button" disabled={loading}>
                {loading ? "Cambiando..." : "Cambiar Contraseña"}
              </button>
            </form>

            <div className="additional-links">
              <label className="login-redirect">
                <Link to="/edit-user" className="login-link">
                  Volver a editar perfil
                </Link>
              </label>
              <label className="login-redirect">
                <Link to="/user" className="login-link">
                  Ir al perfil
                </Link>
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChangePassword;
