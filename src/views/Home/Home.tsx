import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Home.scss";
import NavBar from "../../components/NavBar/NavBar";
import HelpButton from "../../components/HelpButton/HelpButton";
import {
  getPexelsPopularForHome,
  insertFavoriteOrRating,
  getFavorites,
  addFavorite,
  deleteFavorite,
} from "../../utils/moviesApi";
import {
  AiFillStar,
  AiFillPlayCircle,
  AiOutlineHeart,
  AiFillHeart,
} from "react-icons/ai";

/**
 * @typedef {Object} Movie
 * @property {number} id - Unique identifier of the movie.
 * @property {string} title - Title of the movie.
 * @property {number} rating - Average rating of the movie.
 * @property {string} duration - Duration of the movie (e.g. "2h 14m").
 * @property {string} genre - Genre of the movie.
 * @property {string} description - Short description or synopsis.
 * @property {string} poster - URL of the movie poster image.
 */
interface Movie {
  id: string | number;
  title: string;
  rating: number;
  duration: string;
  genre: string;
  description: string;
  poster: string;
  isFavorite?: boolean;
}

export function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState(() => {
    // Permite que el NavBar navegue a /home con ?q=busqueda
    const params = new URLSearchParams(location.search);
    return params.get("q") || "";
  });
  const [selectedCategory, setSelectedCategory] = useState("Películas");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string | number>>(
    new Set()
  );

  /** @constant categories - Predefined list of categories for filtering */
  const categories = [
    "Películas",
    "Accion",
    "Drama",
    "Comedia",
    "Thriller",
    "Terror",
    "Ciencia Ficcion",
  ];

  /**
   * Loads movie data when the component mounts.
   *
   * @effect
   */
  useEffect(() => {
    // Primero intentar leer user desde localStorage para poder pasar userId al loadMovies
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.id) {
          setUserId(user.id);
          // Cargar favoritos del usuario para saber cuáles marcar
          loadUserFavorites(user.id);
          // Cargar películas incluyendo info del usuario (userRating) cuando esté disponible
          loadMovies(user.id);
          return;
        }
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
    // Si no hay usuario, carga películas sin userId (solo averages globales)
    loadMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for updates coming from other views (MovieScreen)
  useEffect(() => {
    const onRatingUpdated = (e: any) => {
      try {
        const { movieId, rating, userRating } = e.detail || {};
        if (!movieId) return;

        // Defensive: ignore placeholder or invalid updates (rating 0)
        const validUserRating = typeof userRating === 'number' && userRating >= 1 && userRating <= 5 ? userRating : undefined;
        const validAvgRating = typeof rating === 'number' && rating > 0 ? rating : undefined;

        if (validUserRating === undefined && validAvgRating === undefined) return;

        setMovies((prev) =>
          prev.map((m) => {
            if (String(m.id) !== String(movieId)) return m;
            // Cast to any when adding userRating to avoid TypeScript errors for the local shape
            const updated: any = { ...(m as any) };
            if (validAvgRating !== undefined) updated.rating = validAvgRating;
            if (validUserRating !== undefined) updated.userRating = validUserRating;
            return updated as Movie;
          })
        );
      } catch (err) {
        // ignore
      }
    };

    const onFavoriteChanged = (e: any) => {
      try {
        const { movieId, isFavorite } = e.detail || {};
        if (!movieId) return;
        setFavoriteIds((prev) => {
          const s = new Set(prev);
          if (isFavorite) s.add(movieId);
          else s.delete(movieId);
          return s;
        });
      } catch (err) {}
    };

    window.addEventListener("movie:rating-updated", onRatingUpdated as EventListener);
    window.addEventListener("movie:favorite-changed", onFavoriteChanged as EventListener);
    return () => {
      window.removeEventListener("movie:rating-updated", onRatingUpdated as EventListener);
      window.removeEventListener("movie:favorite-changed", onFavoriteChanged as EventListener);
    };
  }, []);

  const loadUserFavorites = async (userId: string) => {
    try {
      const favs = await getFavorites(userId);
      console.log("📺 Favoritos cargados del backend:", favs);
      // Construir Set de IDs de películas favoritas
      const favoriteIdSet = new Set(
        favs.map((fav: any) => {
          const movieData = fav.movies || fav;
          return movieData.id;
        })
      );
      console.log("❤️ IDs de favoritos:", Array.from(favoriteIdSet));
      setFavoriteIds(favoriteIdSet);
    } catch (error) {
      console.error("Error loading favorites:", error);
      // No es crítico, continuar sin favoritos precargados
    }
  };

  // Filtrado en cliente: por título (searchQuery) Y por género (selectedCategory)
  const filteredMovies = movies.filter((m) => {
    // Filtro por búsqueda (título)
    const matchesSearch =
      !searchQuery.trim() ||
      m.title.toLowerCase().includes(searchQuery.trim().toLowerCase());

    // Filtro por categoría (género)
    const matchesCategory =
      selectedCategory === "Películas" ||
      m.genre.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const loadMovies = async (forUserId?: string) => {
    setLoading(true);
    try {
      // Popular de Pexels ya mapeado al shape de Home
      // If forUserId is provided, backend may include user's own rating in the response
      const items = await getPexelsPopularForHome(1, forUserId || undefined);
      setMovies(items);
    } catch (error) {
      console.error("Error loading movies:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  // Ya no se usa handleSearch, la búsqueda es reactiva al escribir

  // (El filtrado ya es en cliente, no se necesita handleSearchInternal)

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000); // Desaparece después de 3 segundos
  };

  // Convertir duración string a segundos
  const durationToSeconds = (durationStr: string): number => {
    if (!durationStr) return 0;

    // Remover espacios y convertir a minúsculas
    const normalized = durationStr.toLowerCase().trim();
    let totalSeconds = 0;

    // Buscar horas (h)
    const hoursMatch = normalized.match(/(\d+)\s*h/i);
    if (hoursMatch) {
      totalSeconds += parseInt(hoursMatch[1]) * 3600;
    }

    // Buscar minutos (m)
    const minutesMatch = normalized.match(/(\d+)\s*m(?!s)/);
    if (minutesMatch) {
      totalSeconds += parseInt(minutesMatch[1]) * 60;
    }

    // Buscar segundos (s)
    const secondsMatch = normalized.match(/(\d+)\s*s/);
    if (secondsMatch) {
      totalSeconds += parseInt(secondsMatch[1]);
    }

    return totalSeconds || 0;
  };

  // Formatear segundos a "Xm Ys"
  const formatDurationFromSeconds = (durationValue: any): string => {
    // Si ya está formateado (string con m/h/s), devolverlo
    if (typeof durationValue === "string" && /^\d+[mhs]/.test(durationValue)) {
      return durationValue;
    }

    // Si es número (segundos), formatear
    const seconds = Number(durationValue) || 0;
    if (seconds === 0) return "5m";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
      return `${remainingSeconds}s`;
    } else if (remainingSeconds === 0) {
      return `${minutes}m`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  const handleAddToFavorites = async (
    e: React.MouseEvent,
    movieId: string | number
  ) => {
    e.stopPropagation();

    if (!userId) {
      showToast("Por favor inicia sesión para añadir favoritos", "error");
      navigate("/login");
      return;
    }

    const movie = movies.find((m) => m.id === movieId);
    if (!movie) return;

    const isCurrentlyFavorite = favoriteIds.has(movieId);

    try {
      // Llamar al backend
      if (isCurrentlyFavorite) {
        // Si ya era favorito, lo quitamos (DELETE /api/movies/favorites/:userId/:movieId)
        await deleteFavorite(userId, String(movieId));
        // Actualizar Set de favoritos
        setFavoriteIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(movieId);
          return newSet;
        });
        showToast(`"${movie.title}" eliminada de favoritos`, "success");
      } else {
        // Si no era favorito, lo añadimos (POST /api/movies/insertFavoriteRating)
        // Necesitamos enviar todos los datos de la película
        const durationSeconds = durationToSeconds(movie.duration);
        const response = await addFavorite(userId, {
          movieId: String(movieId),
          favorite: true,
          title: movie.title,
          thumbnail_url: movie.poster,
          genre: movie.genre,
          source: (movie as any).source || "", // source opcional en Movie
          duration_seconds: durationSeconds, // Convertir duración a segundos
        });

        // Usar la duración devuelta por el backend (puede venir en segundos o formateada)
        // y formatearla si es necesario
        const backendDuration = formatDurationFromSeconds(
          (response as any)?.duration || movie.duration
        );

        // Guardar duración formateada en localStorage para recuperarla después
        const favorites = JSON.parse(
          localStorage.getItem("favoriteDurations") || "{}"
        );
        favorites[String(movieId)] = backendDuration;
        localStorage.setItem("favoriteDurations", JSON.stringify(favorites));

        // Actualizar Set de favoritos
        setFavoriteIds((prev) => new Set([...prev, movieId]));

        showToast(`"${movie.title}" añadida a favoritos`, "success");
      }
    } catch (error) {
      console.error("Error al modificar favoritos:", error);
      showToast("No se pudo modificar los favoritos", "error");
    }
  };

  const handlePlayMovie = (e: React.MouseEvent, movieObj: Movie) => {
    e.stopPropagation();
    navigate(`/movie/${movieObj.id}`, { state: movieObj });
  };

  return (
    <div className="Home">
      <NavBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`} role="alert" aria-live="polite">
          {toast.message}
        </div>
      )}

      <div className="home-container">
        {/* Catalog Section */}
        <div className="catalog-section">
          <div className="catalog-header">
            <h2>Explora Nuestro Catálogo</h2>
            <p>Descubre miles de películas y series en alta definición</p>
          </div>

          {/* Categories Filter */}
          <div className="categories-filter">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-btn ${
                  selectedCategory === category ? "active" : ""
                }`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Movie Grid */}
          <div className="movies-grid-home">
            {loading ? (
              <p role="status" aria-live="polite">Cargando películas...</p>
            ) : (
              filteredMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="movie-card-home"
                  onClick={() =>
                    navigate(`/movie/${movie.id}`, { state: movie })
                  }
                  role="button"
                  tabIndex={0}
                  aria-label={`${movie.title}, género ${movie.genre}, calificación ${movie.rating}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/movie/${movie.id}`, { state: movie });
                    }
                  }}
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
                    <div className="movie-overlay">
                      <span className="movie-duration">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <path
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        {movie.duration}
                      </span>
                    </div>
                    <div className="movie-hover-actions">
                      <button
                        className="play-button"
                        onClick={(e) => handlePlayMovie(e, movie)}
                        aria-label={`Reproducir ${movie.title}`}
                      >
                        <AiFillPlayCircle aria-hidden="true" />
                        <span>Reproducir</span>
                      </button>
                      <button
                        className={`favorite-button ${
                          favoriteIds.has(movie.id) ? "is-favorite" : ""
                        }`}
                        onClick={(e) => handleAddToFavorites(e, movie.id)}
                        aria-label={favoriteIds.has(movie.id) ? `Quitar ${movie.title} de favoritos` : `Añadir ${movie.title} a favoritos`}
                        title={favoriteIds.has(movie.id) ? "Eliminar de favoritos" : "Añadir a favoritos"}
                      >
                        {favoriteIds.has(movie.id) ? <AiFillHeart aria-hidden="true" /> : <AiOutlineHeart aria-hidden="true" />}
                      </button>
                    </div>
                  </div>
                  <div className="movie-info">
                    <div className="movie-header">
                      <h3>{movie.title}</h3>
                      <div className="movie-rating">
                        <AiFillStar />
                        {/* Mostrar siempre la media global (movie.rating) como principal */}
                        <span>{(Number(movie.rating) || 0).toFixed(1)}</span>
                        {/* Si el usuario ya votó, mostrar su voto como badge secundario */}
                        {(movie as any).userRating !== undefined && (typeof (movie as any).userRating === 'number') && (
                          <span className="user-badge" aria-label={`Tu valoración: ${(movie as any).userRating}`}>
                            Tu: {(movie as any).userRating.toFixed ? (movie as any).userRating.toFixed(1) : (movie as any).userRating}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="movie-genre">
                      <span className="genre-badge">{movie.genre}</span>
                    </div>
                    <p className="movie-description">{movie.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <HelpButton />
    </div>
  );
}
