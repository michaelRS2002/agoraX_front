import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import NavBar from "../../components/NavBar/NavBar";
import { getCurrentUser, getUserById } from "../../utils/authApi";
import "./User.scss";

/**
 * `User` is a React functional component that displays the profile information
 * of the currently authenticated user.
 * It attempts to fetch updated user data from the backend; if the request fails,
 * it falls back to locally stored user data.
 *
 * @component
 * @example
 * return (
 *   <User />
 * )
 *
 * @returns {JSX.Element} The rendered User Profile page.
 */
const User: React.FC = () => {
  /** @type {[any, React.Dispatch<React.SetStateAction<any>>]} */
  const [user, setUser] = useState<any>(null);

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [loading, setLoading] = useState(true);

  /** @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]} */
  const [error, setError] = useState<string | null>(null);

  /**
   * Loads the current user's profile information.
   *
   * It first checks for a valid local user; if available, it attempts to fetch
   * fresh data from the backend using `getUserById`.
   * If the fetch fails, it logs the error and falls back to the cached user data.
   *
   * @async
   * @function
   * @returns {Promise<void>} Resolves when the user data is loaded or a fallback is applied.
   */
  useEffect(() => {
    const loadUserData = async (): Promise<void> => {
      try {
        const localUser = getCurrentUser();
        if (!localUser || !localUser.id) {
          setError("Información del usuario no encontrada");
          setLoading(false);
          return;
        }

        // Fetch updated user data from backend
        const freshUserData = await getUserById(localUser.id);
        setUser(freshUserData);
      } catch (err: any) {
        console.error("Error cargando la información del usuario:", err);
        setError(err.message || "Error cargando la información del usuario");

        // Fallback to locally stored data
        const localUser = getCurrentUser();
        if (localUser) {
          setUser(localUser);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // --- Conditional rendering states ---

  /**
   * Displays a loading message while the user data is being fetched.
   */
  if (loading) {
    return (
      <>
        <NavBar />
        <div className="app-container-user">
          <div className="main-content-user">
            <div className="user-box">
              <p>Cargando...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  /**
   * Displays an error message if the user data could not be loaded.
   */
  if (error && !user) {
    return (
      <>
        <NavBar />
        <div className="app-container-user">
          <div className="main-content-user">
            <div className="user-box">
              <p className="error-message">{error}</p>
              <Link to="/home" className="login-link">
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  /**
   * Displays the user's profile information, including name, age, and email.
   * Also includes links to edit or delete the account.
   */
  return (
    <>
      <NavBar />
      <div className="app-container-user">
        <div className="main-content-user">
          <div className="user-box">
            <Link
              to="/home"
              className="back-arrow-user"
              aria-label="Volver al inicio"
            >
              ←
            </Link>
            <img
              src="/static/img/film-icon.jpg"
              alt="Logotipo de PopFix - ícono de carrete de película"
              className="icon"
            />
            <h2>Perfil de usuario</h2>
            <p>Información de la cuenta</p>

            <div className="user-info">
              <div className="info-group">
                <label>Nombre completo</label>
                <div className="info-value">
                  {user?.name || user?.nombres || "No disponible"}
                </div>
              </div>
              <div className="info-group">
                <label>Edad</label>
                <div className="info-value">
                  {user?.age || user?.edad || "No disponible"}
                </div>
              </div>
              <div className="info-group">
                <label>Correo electrónico</label>
                <div className="info-value">
                  {user?.email || "No disponible"}
                </div>
              </div>
              {error && (
                <p
                  className="error-message"
                  style={{ marginTop: 8, fontSize: "0.85rem" }}
                >
                  ⚠️ Mostrando datos en caché
                </p>
              )}
            </div>

            <div className="user-actions">
              <Link
                to="/edit-user"
                className="btn-edit"
                aria-label="Editar información de tu perfil"
              >
                Editar Perfil
              </Link>
              <Link
                to="/delete-user"
                className="btn-delete"
                aria-label="Eliminar permanentemente tu cuenta"
              >
                Eliminar Cuenta
              </Link>
            </div>

            <label className="login-redirect">
              <Link to="/home" className="login-link">
                Volver al Inicio
              </Link>
            </label>
          </div>
        </div>
      </div>
    </>
  );
};

export default User;
