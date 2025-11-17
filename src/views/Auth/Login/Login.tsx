/**
 * @file Login.tsx
 * @description Login page component for PopFix. Handles user authentication,
 * form validation, error display, and success feedback through a popup.
 *
 * This component allows users to log in using their email and password,
 * validates inputs, and provides visual feedback during the process.
 */

import React, { useState, useEffect } from "react";
import "./Login.scss";
import { Link, useNavigate } from "react-router-dom";
import { validateLoginForm } from "../../../utils/validators";
import { loginUser } from "../../../utils/authApi";
import useAuthStore from "../../../stores/useAuthStore";

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // 🔥 Importamos la función real de Google Login
  const { loginWithGoogle } = useAuthStore();

  useEffect(() => {
    const applyNoScroll = () => {
      if (window.innerWidth >= 720) document.body.classList.add("no-scroll");
      else document.body.classList.remove("no-scroll");
    };

    applyNoScroll();
    window.addEventListener("resize", applyNoScroll);

    return () => {
      window.removeEventListener("resize", applyNoScroll);
      document.body.classList.remove("no-scroll");
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setErrors({ ...errors, [e.target.id]: undefined });
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const { isValid, errors: validationErrors } = validateLoginForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await loginUser(formData);
      showSuccess("¡Inicio de sesión exitoso! Redirigiendo...");
      setTimeout(() => {
        window.location.href = "/home";
      }, 1500);
    } catch (error: any) {
      setFormError(error.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
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
  };

  // ⭐⭐⭐ GOOGLE LOGIN REAL ⭐⭐⭐
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle(); // usa el store
      navigate("/home");
    } catch (err) {
      console.error("Error en Google Login:", err);
    }
  };

  return (
    <>
      <div className="app-container">
        <div className="login-box">
          <div className="card-header-icon" aria-hidden>
            <img
              src="/images/video-call.png"
              alt="Icono de cámara"
              className="card-header-image"
            />
          </div>
          <h2>Inicia Sesión</h2>
          <p>para acceder a tu biblioteca de películas</p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Correo electrónico</label>
              <div className="field-inner">
                <span className="field-icon" aria-hidden>
                  <img src="/images/icon-mail-white.svg" alt="" />
                </span>
                <input
                  type="email"
                  id="email"
                  placeholder="tu@email.com"
                  className="input"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  aria-label="Ingresa tu correo electrónico"
                  aria-required="true"
                  aria-invalid={errors.email ? "true" : "false"}
                />
              </div>
            </div>
            {errors.email && (
              <span className="error-message" role="alert">
                {errors.email}
              </span>
            )}

            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <div className="field-inner">
                <span className="field-icon" aria-hidden>
                  <img src="/images/icon-lock-white.svg" alt="" />
                </span>
                <input
                  type="password"
                  id="password"
                  placeholder="*********"
                  className="input"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  aria-label="Ingresa tu contraseña"
                  aria-required="true"
                  aria-invalid={errors.password ? "true" : "false"}
                />
              </div>
            </div>
            {errors.password && (
              <span className="error-message" role="alert">
                {errors.password}
              </span>
            )}

            <button
              type="submit"
              className="button"
              disabled={loading}
              aria-label={loading ? "Iniciando sesión" : "Iniciar sesión"}
            >
              {loading ? "Loading..." : "Iniciar sesión"}
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

          <a href="/forgot-password" className="forgot">
            ¿Olvidaste tu contraseña?
          </a>

          <div className="social-divider">
            <span>O continúa con</span>
          </div>

          <div className="social-buttons">
            {/* ⭐ BOTÓN GOOGLE CORREGIDO ⭐ */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="social-btn google-btn"
              aria-label="Continuar con Google"
            >
              <img src="/images/google.png" alt="Google" />
              <span>Continuar con Google</span>
            </button>

            <button
              type="button"
              className="social-btn github-btn"
              aria-label="Continuar con GitHub"
            >
              <img src="/images/github.png" alt="GitHub" />
              <span>Continuar con GitHub</span>
            </button>
          </div>

          <p className="register-text">
            ¿No tienes cuenta?{" "}
            <a href="/register" className="to-register-link">
              Regístrate aquí
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;
