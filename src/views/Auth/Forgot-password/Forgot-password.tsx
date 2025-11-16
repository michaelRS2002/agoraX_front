import React, { useState } from "react";
import "./Forgot-password.scss";
import { Link } from "react-router-dom";
import { validateEmail } from "../../../utils/validators";
import { forgotPassword } from "../../../utils/authApi";

/**
 * Displays a temporary success popup message.
 *
 * @param {string} message - The success message to display in the popup.
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

  // Remove previous timeout if any
  // @ts-ignore
  clearTimeout((popup as any)._timeout);

  // Hide the popup after 3 seconds
  // @ts-ignore
  (popup as any)._timeout = setTimeout(() => {
    popup?.classList.remove("popup-show");
  }, 3000);
}

/**
 * ForgotPassword component.
 *
 * This component provides a form where users can request a password recovery email.
 * It includes validation for the email field and displays feedback messages for success or error.
 *
 * @component
 * @returns {JSX.Element} The rendered Forgot Password page.
 */
const ForgotPassword: React.FC = (): JSX.Element => {
  /** User email input state */
  const [email, setEmail] = useState("");
  /** Validation error for the email field */
  const [emailError, setEmailError] = useState<string | null>(null);
  /** General form error message */
  const [formError, setFormError] = useState<string | null>(null);
  /** Indicates whether the form submission is in progress */
  const [loading, setLoading] = useState(false);

  /**
   * Handles changes in the email input field.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   * @returns {void}
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
    setEmailError(null);
    setFormError(null);
  };

  /**
   * Handles the form submission to request a password reset email.
   *
   * @async
   * @param {React.FormEvent} e - The form submission event.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setFormError(null);

    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }

    setLoading(true);
    try {
      await forgotPassword({ email });
      showSuccess(
        "¡Enlace de recuperación enviado! Revisa tu correo electrónico."
      );

      // Reset form after short delay
      setTimeout(() => {
        setEmail("");
      }, 2000);
    } catch (error: any) {
      setFormError(
        error.message || "Error al enviar el correo de recuperación"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="app-container-forgot" role="main">
        <div className="main-content-forgot" role="presentation" aria-label="Fondo decorativo de películas">
          <div className="forgot-box">
            <Link
              to="/login"
              className="back-arrow-forgot"
              aria-label="Volver a la página de inicio de sesión"
            >
              <span aria-hidden="true">←</span>
            </Link>
            <img
              src="/static/img/film-icon.jpg"
              alt="Logotipo de PopFix - ícono de carrete de película"
              className="icon"
            />
            <h2>Recuperar contraseña</h2>
            <p>Ingresa el correo para recuperar tu contraseña</p>

            <form className="form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                placeholder="tu@email.com"
                className="input"
                value={email}
                onChange={handleChange}
                disabled={loading}
                aria-label="Ingresa tu correo electrónico"
                aria-required="true"
                aria-invalid={emailError ? "true" : "false"}
              />
              {emailError && (
                <span className="error-message" role="alert">
                  {emailError}
                </span>
              )}

              <button
                type="submit"
                className="button"
                disabled={loading}
                aria-label={
                  loading
                    ? "Enviando enlace de recuperación"
                    : "Enviar enlace de recuperación"
                }
              >
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </button>

              {formError && (
                <div
                  className="error-message"
                  style={{ marginTop: 8 }}
                  role="alert"
                  aria-live="polite"
                >
                  {formError}
                </div>
              )}
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

export default ForgotPassword;
