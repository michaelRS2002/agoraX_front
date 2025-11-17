import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavBar from "../../../components/NavBar/NavBar";
import { getCurrentUser, deleteUserById } from "../../../utils/authApi";
import "./Delete-user.scss";

/**
 * Displays a popup message with a specific style and duration.
 *
 * @param {string} message - The message to display in the popup.
 * @param {'success' | 'error'} [type='error'] - The type of popup to display.
 * @returns {void}
 */
function showPopup(message: string, type: "success" | "error" = "error") {
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

/**
 * Displays an undoable popup message with a countdown timer.
 * Allows the user to cancel the pending action before time runs out.
 *
 * @param {string} message - The message displayed in the popup.
 * @param {() => void} onUndo - The callback executed when the user clicks the undo button.
 * @param {number} [seconds=10] - The duration (in seconds) before the popup disappears.
 * @returns {void}
 */
function showUndoPopup(
  message: string,
  onUndo: () => void,
  seconds: number = 10
) {
  let popup = document.getElementById("popup-message");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "popup-message";
    document.body.appendChild(popup);
  }

  let timeLeft = seconds;

  const updateMessage = () => {
    popup!.innerHTML = `${message} (${timeLeft}s) <button id="undo-btn" aria-label="Cancell account deletion" style="margin-left:1rem;background:#3b82f6;color:#fff;border:none;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;">Deshacer</button>`;
    const undoBtn = document.getElementById("undo-btn");
    if (undoBtn) {
      undoBtn.onclick = () => {
        popup?.classList.remove("popup-show");
        onUndo();
      };
    }
  };

  popup.className = "popup-message popup-error popup-show";
  updateMessage();

  const countdown = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(countdown);
      popup?.classList.remove("popup-show");
      return;
    }
    updateMessage();
  }, 1000);

  // @ts-ignore
  (popup as any)._timeout = countdown;
}

/**
 * React component for deleting a user account.
 * Displays a confirmation form that requires the user to type "ELIMINAR" and provide their password.
 * Includes an undo option before the deletion is finalized.
 *
 * @component
 * @returns {JSX.Element} The DeleteUser page component.
 */
const DeleteUser: React.FC = () => {
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Handles form submission for account deletion.
   * Validates confirmation and password, and triggers the deletion after a countdown.
   *
   * @async
   * @param {React.FormEvent} e - The form submission event.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (confirmText !== "ELIMINAR") {
      setError('Debes escribir exactamente "ELIMINAR" para confirmar.');
      return;
    }

    if (!password) {
      setError("Debes ingresar tu contraseña actual.");
      return;
    }

    setLoading(true);
    let cancelled = false;

    showUndoPopup(
      "Cuenta será eliminada en",
      () => {
        cancelled = true;
        showPopup("Eliminación cancelada.", "success");
        setLoading(false);
      },
      10
    );

    setTimeout(async () => {
      if (cancelled) return;
      try {
        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.id)
          throw new Error("Usuario no encontrado");
        await deleteUserById(currentUser.id);
        showPopup("Cuenta eliminada correctamente.", "success");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } catch (err: any) {
        setError(err?.message || "Error al eliminar la cuenta.");
      } finally {
        setLoading(false);
      }
    }, 10000);
  };

  return (
    <>
      <NavBar />
      <div className="app-container-delete">
        <div className="main-content-delete">
          <div className="delete-box">
            <Link
              to="/user"
              className="back-arrow-delete"
              aria-label="Volver al perfil"
            >
              ←
            </Link>
            <img
              src="/static/img/film-icon.jpg"
              alt="Logotipo de PopFix - ícono de carrete de película"
              className="icon"
            />
            <h2>Eliminar Cuenta</h2>
            <p>Esta acción no se puede deshacer. Perderás todos tus datos.</p>

            <form className="delete-form" onSubmit={handleSubmit} noValidate>
              <div className="warning-box">
                <strong>⚠️ ADVERTENCIA:</strong>
                <p>Al eliminar tu cuenta se borrarán permanentemente:</p>
                <ul>
                  <li>Tu perfil y datos personales</li>
                  <li>Todas tus películas favoritas</li>
                  <li>Tu historial de actividad</li>
                  <li>Cualquier configuración personalizada</li>
                </ul>
              </div>

              <label htmlFor="confirmText">
                Para confirmar, escribe <strong>"ELIMINAR"</strong> (sin
                comillas)
              </label>
              <input
                id="confirmText"
                type="text"
                className="input"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                required
              />

              <label htmlFor="password">Confirma tu contraseña actual</label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && <div className="error-message">{error}</div>}

              <button
                type="submit"
                className="button btn-delete-confirm"
                disabled={loading}
              >
                {loading
                  ? "Procesando..."
                  : "Eliminar Mi Cuenta Permanentemente"}
              </button>
            </form>

            <label className="login-redirect">
              <Link to="/user" className="login-link">
                Cancelar y volver al perfil
              </Link>
            </label>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteUser;
