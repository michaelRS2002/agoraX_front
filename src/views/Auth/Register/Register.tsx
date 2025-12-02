/**
 * @file Register.tsx
 * @description Registration page component (sanitized). Handles user creation,
 * form validation, backend integration, and feedback via popups.
 */

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.scss";
import { Link } from "react-router-dom";
import { validateRegisterForm } from "../../../utils/validators";
import { registerUser } from "../../../utils/authApi";

/**
 * Displays a temporary popup message for successful actions.
 * Automatically hides the popup after 3 seconds.
 *
 * @param {string} message - The success message to display.
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

  // Remove popup after 3 seconds
  // @ts-ignore
  clearTimeout((popup as any)._timeout);
  // @ts-ignore
  (popup as any)._timeout = setTimeout(() => {
    popup?.classList.remove("popup-show");
  }, 3000);
}

/**
 * Register component for user account creation.
 * Handles input changes, validation, submission, and feedback.
 *
 * @component
 * @returns {JSX.Element} The rendered registration form.
 */
const Register: React.FC = () => {
  /** @state {Object} formData - Stores all form field values for registration. */
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    password: "",
    confirmPassword: "",
  });

  /** @state {Object} errors - Holds field-specific validation error messages. */
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  /** @state {string|null} formError - Stores backend or global form errors. */
  const [formError, setFormError] = useState<string | null>(null);

  /** @state {string|null} formSuccess - Stores success messages upon registration. */
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  /** @state {boolean} loading - Indicates whether form submission is in progress. */
  const [loading, setLoading] = useState(false);

  /** React Router navigation hook. */
  const navigate = useNavigate();

  // form ref used to find the next focusable control when Enter is pressed
  const formRef = useRef<HTMLFormElement | null>(null);

  /**
   * Handles updates to form input fields.
   * Removes field-specific errors when the user modifies input.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });

    // Remove the error of the modified field
    const { [e.target.id]: removed, ...rest } = errors;
    setErrors(rest);
    setFormError(null);
  };

  // Show validation errors in a popup listing messages
  function showValidationPopup(messages: string[]) {
    let popup = document.getElementById("popup-validation");
    if (!popup) {
      popup = document.createElement("div");
      popup.id = "popup-validation";
      document.body.appendChild(popup);
    }
    popup.className = "popup-message popup-error popup-show";
    popup.innerHTML = `<div style="text-align:left"><strong>Error:</strong><ul style=\"margin:8px 0 0 16px;\">${messages
      .map((m) => `<li>${m}</li>`)
      .join("")}</ul></div>`;

    // remove previous timeout
    // @ts-ignore
    clearTimeout((popup as any)._timeout);
    // @ts-ignore
    (popup as any)._timeout = setTimeout(() => {
      popup?.classList.remove("popup-show");
    }, 5000);
  }

  /**
   * Handles form submission for user registration.
   * Validates input, sends data to backend, and provides user feedback.
   *
   * @async
   * @param {React.FormEvent} e - Form submission event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // client-side validation: show inline errors only (no popup)
    const { isValid, errors: validationErrors } =
      validateRegisterForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return; // do not show popup for client validation
    }

    setLoading(true);
    try {
      await registerUser({
        name: formData.name,
        email: formData.email,
        age: Number(formData.age),
        password: formData.password,
      });

      // Backend success: show popup
      showSuccess("¡Registro exitoso! Redirigiendo a inicio de sesión...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error: any) {
      // Normalize and translate common network/backend messages to Spanish
      const backendMsg = error?.data?.message || error?.message || String(error);

      const translateBackendError = (msg: string) => {
        if (!msg) return "Error al registrar usuario";
        const lower = msg.toLowerCase();
        if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("network request failed")) {
          return "No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.";
        }
        // common backend messages can be returned as-is, but prefer Spanish fallback
        return msg;
      };

      const userVisible = translateBackendError(backendMsg);
      // show backend errors in the popup (we avoid duplicating the inline form error)
      showValidationPopup([userVisible]);
      // clear any inline form error — we rely on the popup for backend messages
      setFormError(null);
      // log original error for debugging
      // eslint-disable-next-line no-console
      console.error("Register error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Validate a single field on blur and show inline error if any
  const validateField = (field: string, value: string) => {
    const tempData = { ...formData, [field]: value };
    const { errors: vErrors } = validateRegisterForm(tempData);
    // set or clear only this field's error
    setErrors((prev) => ({ ...prev, [field]: vErrors[field] || "" }));
  };

  // When Enter is pressed in any input, move focus to the next field.
  // If the current field is the last input, submit the form.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const form = formRef.current;
    if (!form) {
      // fallback: submit
      handleSubmit(({} as unknown) as React.FormEvent);
      return;
    }

    // collect focusable controls in DOM order inside the form
    const controls = Array.from(
      form.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button[type="submit"]'
      )
    );

    const current = e.currentTarget as HTMLElement;
    const idx = controls.indexOf(current);

    // find next focusable control after current
    let next: HTMLElement | undefined;
    if (idx >= 0) {
      for (let i = idx + 1; i < controls.length; i++) {
        const el = controls[i];
        // skip non-focusable or visually hidden
        if (el && typeof el.focus === "function") {
          next = el;
          break;
        }
      }
    }

    if (next) {
      // if next is the submit button, trigger click (submit)
      if (next.tagName.toLowerCase() === "button") {
        (next as HTMLButtonElement).click();
      } else {
        next.focus();
      }
    } else {
      // no next control -> submit
      const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      if (submitBtn) submitBtn.click();
      else handleSubmit(({} as unknown) as React.FormEvent);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="card-header-icon" aria-hidden>
          <img
            src="/images/video-call.png"
            alt="Icono de cámara"
            className="card-header-image"
          />
        </div>

        <h1 className="title">Crear cuenta</h1>
        <p className="subtitle">Únete y comienza a hacer videollamadas</p>

        <form className="form-register" onSubmit={handleSubmit} noValidate ref={formRef}>
          <div className="field">
            <label>Nombre completo</label>
            <div className="field-inner">
              <span className="field-icon" aria-hidden>
                {/* user icon */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input
                className="input"
                id="name"
                placeholder="Tu nombre"
                value={formData.name}
                onChange={handleChange}
                onBlur={(e) => validateField(e.currentTarget.id, e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                aria-label="Ingresa tu nombre completo"
                aria-required="true"
                aria-invalid={errors.name ? 'true' : 'false'}
                autoComplete="name"
              />
            </div>
            {errors.name && (
              <div className="error-message" role="alert">
                {errors.name}
              </div>
            )}
          </div>

          <div className="field">
            <label>Edad</label>
            <div className="field-inner">
              <span className="field-icon" aria-hidden>
                <img
                  width="20"
                  height="20"
                  src="https://img.icons8.com/external-sbts2018-solid-sbts2018/58/FFFFFF/external-age-basic-ui-elements-2.3-sbts2018-solid-sbts2018.png"
                  alt="age icon"
                />
              </span>
              <input
                className="input"
                id="age"
                placeholder="Tu Edad"
                value={formData.age}
                onChange={handleChange}
                onBlur={(e) => validateField(e.currentTarget.id, e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                min={0}
                aria-label="Ingresa tu edad"
                aria-required="true"
                aria-invalid={errors.age ? 'true' : 'false'}
              />
            </div>
            {errors.age && (
              <div className="error-message" role="alert">
                {errors.age}
              </div>
            )}
          </div>

          <div className="field">
            <label>Correo electrónico</label>
            <div className="field-inner">
              <span className="field-icon" aria-hidden>
                <img
                  src="https://img.icons8.com/ios/50/FFFFFF/mail.png"
                  alt="mail icon"
                  width={20}
                  height={20}
                />
              </span>
              <input
                className="input"
                id="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={(e) => validateField(e.currentTarget.id, e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                aria-label="Ingresa tu correo electrónico"
                aria-required="true"
                aria-invalid={errors.email ? 'true' : 'false'}
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <div className="error-message" role="alert">
                {errors.email}
              </div>
            )}
          </div>

          <div className="field">
            <label>Contraseña</label>
            <div className="field-inner">
              <span className="field-icon" aria-hidden>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17 11V9a5 5 0 10-10 0v2"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="10"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input
                className="input"
                type="password"
                id="password"
                placeholder="************"
                value={formData.password}
                onChange={handleChange}
                onBlur={(e) => validateField(e.currentTarget.id, e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                aria-label="Ingresa tu contraseña"
                aria-required="true"
                aria-invalid={errors.password ? 'true' : 'false'}
                autoComplete="new-password"
              />
            </div>
            {errors.password && (
              <div className="error-message" role="alert">
                {errors.password}
              </div>
            )}
          </div>

          <div className="field">
            <label>Confirmar contraseña</label>
            <div className="field-inner">
              <span className="field-icon" aria-hidden>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17 11V9a5 5 0 10-10 0v2"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="10"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input
                className="input"
                type="password"
                id="confirmPassword"
                placeholder="************"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={(e) => validateField(e.currentTarget.id, e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                aria-label="Confirma tu contraseña"
                aria-required="true"
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                autoComplete="new-password"
              />
            </div>
            {errors.confirmPassword && (
              <div className="error-message" role="alert">
                {errors.confirmPassword}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="button"
            disabled={loading}
            aria-label={loading ? "Creando cuenta" : "Crear cuenta"}
          >
            {loading ? "Creando..." : "Crear cuenta"}
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

          {formSuccess && (
            <div
              className="success-message"
              style={{ marginTop: 8, color: "green" }}
              role="status"
              aria-live="polite"
            >
              {formSuccess}
            </div>
          )}

          <div className="register-redirect">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="to-login-link">
              Inicia sesión
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
