import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavBar from "../../../components/NavBar/NavBar";
import {
  getCurrentUser,
  getUserById,
  updateUserById,
} from "../../../utils/authApi";
import { NotFound } from "../../NotFound";
import "./Edit-user.scss";

/**
 * Muestra un mensaje emergente de éxito en la parte superior de la pantalla.
 *
 * @param {string} message - Mensaje de éxito a mostrar.
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
 * Componente React para editar la información del usuario.
 * Carga los datos del usuario al montar el componente y permite actualizar nombre, edad y correo.
 *
 * @component
 * @returns {JSX.Element} Componente de la página de edición de perfil.
 */
const EditUser: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  // If the user logged in via an external provider, show 404 and stop rendering the form
  if (currentUser?.firebaseUid) {
    return <NotFound />;
  }
  const [nombres, setNombres] = useState("");
  const [edad, setEdad] = useState("");
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Loads the current user information from the backend on component mount.
   *
   * @async
   * @returns {Promise<void>}
   */
  useEffect(() => {
    const fetchUser = async () => {
      const localUser = getCurrentUser();
      // If the account is from an external provider (firebaseUid), editing is not allowed
      if (localUser && localUser.firebaseUid) {
        return;
      }
      if (localUser && localUser.id) {
        try {
          const freshUser = await getUserById(localUser.id);
          setNombres(freshUser.name || freshUser.nombres || "");
          setEdad(freshUser.age || freshUser.edad || "");
          setCorreo(freshUser.email || "");
        } catch (err: any) {
          setError("Error al cargar los datos del usuario.");
        }
      }
    };
    fetchUser();
  }, []);

  /**
   * Handles the form submission to update the user's profile.
   * Validates the input fields and sends an update request to the backend.
   *
   * @async
   * @param {React.FormEvent} e - The form submission event.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const localUser = getCurrentUser();
      if (!localUser || !localUser.id) throw new Error("Usuario no encontrado");
      await updateUserById(localUser.id, {
        name: nombres,
        age: Number(edad),
        email: correo,
      });
      showSuccess("¡Perfil actualizado con éxito!");
      setTimeout(() => navigate("/user"), 2000);
    } catch (err: any) {
      setError(err?.message || "Error al actualizar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* If user is provider-authenticated, show 404 */}
      {getCurrentUser()?.firebaseUid ? <NotFound /> : null}
      <NavBar />
      <div className="app-container-edit">
        <div className="main-content-edit">
          <div className="edit-box">
            <Link
              to="/user"
              className="back-arrow-edit"
              aria-label="Volver al perfil"
            >
              <img
                width={16}
                height={16}
                src="https://img.icons8.com/material-sharp/24/c3c3c3/arrow-pointing-left.png"
                className="back-arrow-img"
                alt=""
                aria-hidden
              />
              <div className="back-arrow-text">Volver</div>
            </Link>
            <img
              src="/images/video-call.png"
              alt="Icono de cámara"
              className="icon"
            />
            <h2>Editar Perfil</h2>
            <p>Actualiza tu información personal</p>

            <form className="edit-form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="nombres">Nombre(s)</label>
              <input
                id="nombres"
                type="text"
                className="input"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                required
                autoComplete="name"
              />

              <label htmlFor="edad">Edad</label>
              <input
                id="edad"
                type="number"
                className="input"
                value={edad}
                onChange={(e) => setEdad(e.target.value)}
                min="1"
                max="120"
                required
              />

              <label htmlFor="correo">Correo electrónico</label>
              <input
                id="correo"
                type="email"
                className="input"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                autoComplete="email"
              />

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="button" disabled={loading}>
                {loading ? "Actualizando..." : "Actualizar perfil"}
              </button>
            </form>

            <div className="additional-links">
              <label className="change-password-redirect">
                <Link to="/change-password" className="change-password-link">
                  Cambiar contraseña
                </Link>
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditUser;
