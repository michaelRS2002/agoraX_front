/**
 * @file ResetPassword.tsx
 * @description React component for handling the password reset process in the PopFix app.
 * It allows users to input and confirm a new password after receiving a reset token via email.
 * Includes validation, API integration, and success feedback.
 */

import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { resetPassword } from "../../../utils/authApi";
import NavBar from "../../../components/NavBar/NavBar";
import "./Reset-password.scss";

/**
 * Displays a success popup message for a short duration.
 *
 * @param {string} message - The message text to be displayed.
 * @returns {void}
 */
function showSuccess(message: string): void {
  let popup = document.getElementById("popup-message");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "popup-message";
    document.body.appendChild(popup);
  }

  popup.className = "popup-message popup-success popup-show";
  popup.textContent = message;

  // Remove after 3 seconds
  // @ts-ignore
  clearTimeout((popup as any)._timeout);
  // @ts-ignore
  (popup as any)._timeout = setTimeout(() => {
    popup?.classList.remove("popup-show");
  }, 3000);
}

/**
 * @component ResetPassword
 * @description Page for setting a new password using a reset token.
 * Handles form validation, password confirmation, and API communication.
 *
 * @returns {JSX.Element} The rendered Reset Password page component.
 */
const ResetPassword: React.FC = (): JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();

  /** @state password - New password entered by the user */
  const [password, setPassword] = useState("");
  /** @state confirmPassword - Confirmation of the new password */
  const [confirmPassword, setConfirmPassword] = useState("");
  /** @state error - Error message for form or API issues */
  const [error, setError] = useState<string | null>(null);
  /** @state success - Optional success message (popup handled globally) */
  const [success, setSuccess] = useState<string | null>(null);
  /** @state loading - Indicates if the request is being processed */
  const [loading, setLoading] = useState(false);

  // Extract token from URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");

  /**
   * Handles form submission for password reset.
   * Validates inputs, interacts with the backend API, and provides user feedback.
   *
   * @async
   * @param {React.FormEvent} e - Form submission event.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!password || !confirmPassword) {
      setError("Por favor ingresa y confirma tu nueva contraseña.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!token) {
      setError("Token inválido o expirado.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, newPassword: password });
      showSuccess("¡Contraseña restablecida correctamente!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(
        err?.data?.message ||
          err?.message ||
          "Error al restablecer la contraseña."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar />
      <div className="app-container-reset" role="main">
        <div className="main-content-reset" role="presentation" aria-label="Fondo decorativo de películas">
          <div className="reset-box">
            <Link
              to="/login"
              className="back-arrow-reset"
              aria-label="Volver a la página de inicio de sesión"
            >
              <span aria-hidden="true">←</span>
            </Link>
            <img
              src="/static/img/film-icon.jpg"
              alt="Logotipo de PopFix - ícono de carrete de película"
              className="icon"
            />
            <h2>Restablecer contraseña</h2>
            <p>Ingresa tu nueva contraseña para tu cuenta</p>

            <form
              className="reset-password-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <label htmlFor="password">Nueva contraseña</label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                aria-label="Ingresa tu nueva contraseña"
                aria-required="true"
              />
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <input
                id="confirmPassword"
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                aria-label="Confirma tu nueva contraseña"
                aria-required="true"
              />
              {error && <div className="error-message" role="alert" aria-live="polite">{error}</div>}

              <button type="submit" className="button" disabled={loading} aria-label={loading ? "Restableciendo contraseña" : "Restablecer contraseña"}>
                {loading ? "Restableciendo..." : "Restablecer contraseña"}
              </button>
            </form>

            <label className="login-redirect">
              ¿Recordaste tu contraseña?{" "}
              <Link to="/login" className="login-link">
                Volver al Inicio de Sesión
              </Link>
            </label>
            <label className="login-redirect">
              ¿Aún no tienes cuenta?{" "}
              <Link to="/register" className="login-link">
                Registrarse
              </Link>
            </label>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
