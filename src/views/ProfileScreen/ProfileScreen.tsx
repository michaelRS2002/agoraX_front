import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileScreen.scss";
import { AiFillClockCircle, AiFillTrophy, AiFillSetting } from "react-icons/ai";
import { CiHeart, CiStar } from "react-icons/ci";
import { IoArrowBack } from "react-icons/io5";
import { FaFilm } from "react-icons/fa6";
import { PiFilmSlate } from "react-icons/pi";

import { getCurrentUser } from "../../utils/authApi";
import { getFavorites } from "../../utils/moviesApi";

interface Movie {
  id: number;
  title: string;
  rating: number;
  genre: string;
  poster: string;
  duration: string;
  addedDate: string;
}

export function ProfileScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "favoritos" | "historial" | "valoraciones" | "logros"
  >("favoritos");
  const [userData, setUserData] = useState<any>(null);
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = getCurrentUser();
        if (!user) {
          navigate("/login");
          return;
        }

        setUserData({
          name: user.name || user.username || "Usuario",
          bio: user.bio || "Sin biografía disponible.",
          stats: {
            moviesWatched: user.moviesWatched || 0,
            hoursWatched: user.hoursWatched || "0h",
            averageRating: user.averageRating || 0,
            favoriteGenre: user.favoriteGenre || "N/A",
          },
        });

        const favoritesResponse = await getFavorites(user.id);
        const formattedFavorites = favoritesResponse.map((f: any) => ({
          id: f.movie_id,
          title: f.movies.title,
          rating: f.movies.rating || 0,
          genre: f.movies.genre || "Desconocido",
          poster: f.movies.thumbnail_url || "/static/img/placeholder.jpg",
          duration: f.movies.duration || "0m",
          addedDate: f.movies.addedDate || "Sin fecha",
        }));

        setFavoriteMovies(formattedFavorites);
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleEditProfile = () => {
    navigate("/edit-user");
  };

  const handleBackToCatalog = () => {
    navigate("/home");
  };

  if (loading) {
    return (
      <div className="ProfileScreen">
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="ProfileScreen">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <button
            className="back-button"
            onClick={handleBackToCatalog}
            aria-label="Volver al catálogo"
          >
            <IoArrowBack />
            <span>Volver al Catálogo</span>
          </button>
          <button
            className="edit-button"
            onClick={handleEditProfile}
            aria-label="Editar perfil"
          >
            <AiFillSetting aria-hidden="true" />
            <span>Editar Perfil</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="profile-main-content">
          {/* Profile Info Card */}
          <div className="profile-info-card">
            <div className="profile-avatar">
              <FaFilm aria-hidden="true" />
            </div>

            <div className="profile-details">
              <h1>{userData.name}</h1>
              <p className="profile-bio">{userData.bio}</p>

              {/* Stats */}
              <div className="profile-stats">
                <div className="stat-item">
                  <PiFilmSlate />
                  <div className="stat-content">
                    <span
                      className="stat-number"
                      aria-label="All the watched Movies"
                    >
                      {userData.stats.moviesWatched}
                    </span>
                    <span className="stat-label">Películas vistas</span>
                  </div>
                </div>

                <div className="stat-item">
                  <AiFillClockCircle aria-hidden="true" />
                  <div className="stat-content">
                    <span
                      className="stat-number"
                      aria-label="Hours of watched movies"
                    >
                      {userData.stats.hoursWatched}
                    </span>
                    <span className="stat-label">Horas vistas</span>
                  </div>
                </div>

                <div className="stat-item stat-rating">
                  <CiStar aria-hidden="true" />
                  <div className="stat-content">
                    <span
                      className="stat-number"
                      aria-label="Average rating of watched movies"
                    >
                      {userData.stats.averageRating}
                    </span>
                    <span className="stat-label">Rating promedio</span>
                  </div>
                </div>

                <div className="stat-item stat-favorites">
                  <CiHeart aria-hidden="true" />
                  <div className="stat-content">
                    <span
                      className="stat-number"
                      aria-label="Number of favorite movies"
                    >
                      {favoriteMovies.length}
                    </span>
                    <span className="stat-label">Favoritos</span>
                  </div>
                </div>

                <div className="stat-item favorite-genre">
                  <AiFillTrophy aria-hidden="true" />
                  <div className="stat-content">
                    <span
                      className="stat-number"
                      aria-label="Favorite genre of movies"
                    >
                      {userData.stats.favoriteGenre}
                    </span>
                    <span className="stat-label">Género Favorito</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs and Content */}
          <div className="profile-content-wrapper">
            {/* Tabs */}
            <div className="profile-tabs">
              <button
                className={`tab-button ${
                  activeTab === "favoritos" ? "active" : ""
                }`}
                onClick={() => setActiveTab("favoritos")}
              >
                Favoritos
              </button>
              <button
                className={`tab-button ${
                  activeTab === "historial" ? "active" : ""
                }`}
                onClick={() => setActiveTab("historial")}
              >
                Historial
              </button>
              <button
                className={`tab-button ${
                  activeTab === "valoraciones" ? "active" : ""
                }`}
                onClick={() => setActiveTab("valoraciones")}
              >
                Valoraciones
              </button>
              <button
                className={`tab-button ${
                  activeTab === "logros" ? "active" : ""
                }`}
                onClick={() => setActiveTab("logros")}
              >
                Logros
              </button>
            </div>

            {/* Content */}
            <div className="profile-content">
              {activeTab === "favoritos" && (
                <div className="favorites-section">
                  <div className="section-header">
                    <CiHeart className="section-icon" aria-hidden="true" />
                    <div>
                      <h2>Mis Películas Favoritas</h2>
                      <p>Películas que has marcado como favoritas</p>
                    </div>
                  </div>

                  <div className="movies-grid">
                    {favoriteMovies.length > 0 ? (
                      favoriteMovies.map((movie) => (
                        <div
                          key={movie.id}
                          className="movie-card-profile"
                          onClick={() => navigate(`/movie/${movie.id}`)}
                        >
                          <div className="movie-poster">
                            <img
                              src={movie.poster}
                              alt={`Póster de la película ${movie.title}`}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?q=80&w=800&auto=format&fit=crop";
                              }}
                            />
                            <div className="movie-rating-badge">
                              {[...Array(5)].map((_, i) => (
                                <CiStar
                                  key={i}
                                  className={
                                    i < movie.rating ? "filled" : "empty"
                                  }
                                  aria-hidden="true"
                                />
                              ))}
                            </div>
                          </div>
                          <div className="movie-info">
                            <h3>{movie.title}</h3>
                            <span className="movie-genre">{movie.genre}</span>
                            <div className="movie-meta">
                              <span className="movie-duration">
                                <AiFillClockCircle aria-hidden="true" />
                                {movie.duration}
                              </span>
                            </div>
                            <p className="movie-added">
                              Añadida: {movie.addedDate}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-favorites">
                        No tienes películas favoritas aún.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "historial" && (
                <div className="empty-state">
                  <AiFillClockCircle aria-hidden="true" />
                  <h3>Historial de Visualización</h3>
                  <p>
                    Aquí aparecerán las películas que hayas visto recientemente
                  </p>
                </div>
              )}

              {activeTab === "valoraciones" && (
                <div className="empty-state">
                  <CiStar aria-hidden="true" />
                  <h3>Tus Valoraciones</h3>
                  <p>Aquí aparecerán todas las películas que hayas valorado</p>
                </div>
              )}

              {activeTab === "logros" && (
                <div className="empty-state">
                  <AiFillTrophy aria-hidden="true" />
                  <h3>Logros Desbloqueados</h3>
                  <p>
                    Completa desafíos y obtén logros por tu actividad en la
                    plataforma
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
