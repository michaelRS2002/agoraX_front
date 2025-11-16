import React, { useState, useEffect } from 'react';
import './FavScreen.scss';
import { IoArrowBack, IoSearchOutline } from 'react-icons/io5';
import { CiHeart } from "react-icons/ci";
import { MdFilterList, MdCalendarToday } from 'react-icons/md';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import { BiPlay } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import { getFavorites, deleteFavorite } from '../../utils/moviesApi';
import NavBar from '../../components/NavBar/NavBar';
import HelpButton from '../../components/HelpButton/HelpButton';

interface Movie {
  id: string | number;
  title: string;
  poster: string;
  rating: number;
  duration: string;
  genre: string;
  addedDate?: string;
  userRating?: number;
  source?: string;
}

const FavScreen: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [navSearchQuery, setNavSearchQuery] = useState('');
    const [genreFilter, setGenreFilter] = useState('Todos los gen');
    const [isGenreOpen, setIsGenreOpen] = useState(false);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
      // Obtener userId del localStorage - viene dentro del objeto 'user'
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          if (user.id) {
            setUserId(user.id)
            loadFavorites(user.id)
          } else {
            alert('Por favor inicia sesión para ver tus favoritos')
            navigate('/login')
          }
        } catch (e) {
          console.error('Error parsing user:', e)
          navigate('/login')
        }
      } else {
        alert('Por favor inicia sesión para ver tus favoritos')
        navigate('/login')
      }
    }, [navigate]);

    // Listen for rating/favorite changes from other views (MovieScreen/Home)
    useEffect(() => {
      const onRatingUpdated = (e: any) => {
        try {
          const { movieId, rating, userRating } = e.detail || {};
          if (!movieId) return;

          // Defensive: ignore invalid/placeholder updates (0) coming from other views
          const validUserRating = typeof userRating === 'number' && userRating >= 1 && userRating <= 5 ? userRating : undefined;
          const validAvgRating = typeof rating === 'number' && rating > 0 ? rating : undefined;

          // If both are undefined / invalid, do nothing
          if (validUserRating === undefined && validAvgRating === undefined) return;

          setMovies((prev) => prev.map((m) => {
            if (String(m.id) !== String(movieId)) return m;
            return {
              ...m,
              // update user's rating only when valid numeric (1..5)
              userRating: validUserRating !== undefined ? validUserRating : m.userRating,
              // update average rating only when valid (>0)
              rating: validAvgRating !== undefined ? validAvgRating : m.rating,
            };
          }));
        } catch (err) {
          // ignore
        }
      };

      const onFavoriteChanged = (e: any) => {
        try {
          const { movieId, isFavorite } = e.detail || {};
          if (!movieId) return;
          if (!isFavorite) {
            // remove from list
            setMovies((prev) => prev.filter(m => String(m.id) !== String(movieId)));
          } else {
            // if added favorite elsewhere, reload favorites to fetch full data
            if (userId) loadFavorites(userId);
          }
        } catch (err) {}
      };

      window.addEventListener('movie:rating-updated', onRatingUpdated as EventListener);
      window.addEventListener('movie:favorite-changed', onFavoriteChanged as EventListener);
      return () => {
        window.removeEventListener('movie:rating-updated', onRatingUpdated as EventListener);
        window.removeEventListener('movie:favorite-changed', onFavoriteChanged as EventListener);
      };
    }, [userId]);

    // Función para formatear segundos a "Xm Ys"
    const formatDurationFromSeconds = (durationValue: any): string => {
      // Si ya está formateado (string con m/h/s), devolverlo
      if (typeof durationValue === 'string' && /^\d+[mhs]/.test(durationValue)) {
        return durationValue;
      }
      
      // Si es número (segundos), formatear
      const seconds = Number(durationValue) || 0;
      if (seconds === 0) return '5m';
      
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

    const loadFavorites = async (userId: string) => {
      setLoading(true);
      try {
        const favs = await getFavorites(userId);
        console.log('Favoritos recibidos del backend (estructura completa):', favs); // Debug
        
        // Recuperar duraciones guardadas en localStorage
        const favoriteDurations = JSON.parse(localStorage.getItem('favoriteDurations') || '{}');
        
        // Aplanar la respuesta y buscar rating en todos los posibles niveles
        const flatMovies = favs.map((fav: any) => {
          // Estructura esperada: { movie_id, movies: {..., rating?}, rating?, duration? }
          const movieData = fav.movies || fav;
          
          // Buscar rating en múltiples lugares
          // user_movie rating (the user's own vote) takes precedence for the stars
          // Try several likely places the user's rating may be returned from the backend
          let userRating: number | null = null;
          const candidates = [
            fav.rating,
            fav.user_rating,
            fav.userMovieRating,
            fav.user_movie_rating,
            fav.user_movies?.rating,
            fav.user_movies?.user_movie?.rating,
            fav.user_movies_rating,
          ];
          for (const c of candidates) {
            const n = Number(c);
            // Accept only valid user ratings in the 1..5 range. Ignore 0 or other invalid values.
            if (Number.isFinite(n) && !Number.isNaN(n) && n >= 1 && n <= 5) {
              userRating = n;
              break;
            }
            // Debug: log ignored candidate so we can trace cases where backend returns 0
            if (c !== undefined && c !== null) {
              console.debug('[FavScreen] ignored userRating candidate (not valid 1..5):', { candidate: c, asNumber: n, movieId: fav.movie_id || fav.movies?.id });
            }
          }
          // movie table average rating (prefer persisted movie.rating)
          const dbRating = movieData.rating !== undefined && movieData.rating !== null ? Number(movieData.rating) : null;
          // fallback: some endpoints may include suggestedRating or updatedMovie with rating
          const suggestedFromFav = fav.suggestedRating ?? fav.suggested_rating ?? fav.updatedMovie?.rating ?? fav.updated_movie?.rating;
          const suggestedNum = typeof suggestedFromFav === 'number' ? suggestedFromFav : (typeof suggestedFromFav === 'string' && suggestedFromFav.trim() !== '' ? Number(suggestedFromFav) : null);
          // final average rating to display (prefer DB movie.rating, then suggestedRating, then deterministic/movieRating)
          const avgRating = dbRating ?? (Number.isFinite(suggestedNum) ? suggestedNum : null);
          const movieRating = userRating ?? avgRating ?? 0;
          
          // Usar duration: primero intenta backend, luego localStorage, luego default
          // Formatear si viene en segundos
          const duration = formatDurationFromSeconds(
            fav.duration || 
            favoriteDurations[String(movieData.id)] || 
            movieData.duration
          );
          
          console.log(`📺 Película: "${movieData.title}"`, {
            id: movieData.id,
            // show all possible rating sources for debugging
            favRaw: fav,
            userMovieRating: userRating,
            movieTableRating: movieData.rating,
            finalRating: movieRating,
            source: movieData.source,
            duration: duration,
            rawDuration: fav.duration,
            hasBackendDuration: !!fav.duration,
            hasLocalStorageDuration: !!favoriteDurations[String(movieData.id)],
            allKeys: Object.keys(fav)
          });
          
          return {
            id: movieData.id,
            title: movieData.title || 'Sin título',
            poster: movieData.thumbnail_url || movieData.poster || 'https://via.placeholder.com/300x450',
            // numeric average rating (for display)
            rating: Number(avgRating) || 0,
            // user's own rating (if any)
            userRating: typeof userRating === 'number' ? userRating : undefined,
            duration: duration || '5m',
            genre: movieData.genre || 'Video',
            addedDate: new Date().toLocaleDateString('es-ES'),
            source: movieData.source || movieData.video_url || movieData.url || ''
          };
        });
        
        console.log('✅ Películas mapeadas finales:', flatMovies);
        setMovies(flatMovies);

        // If we missed a recent rating update (dispatched before this component mounted),
        // check sessionStorage for a short-lived update and apply it to the loaded favorites.
        try {
          const pending = sessionStorage.getItem('movieRatingUpdate');
          if (pending) {
            const parsed = JSON.parse(pending);
            if (parsed && parsed.movieId) {
              const mid = String(parsed.movieId);
              const userRatingVal = typeof parsed.userRating === 'number' && parsed.userRating >= 1 && parsed.userRating <= 5 ? parsed.userRating : undefined;
              const avgVal = typeof parsed.rating === 'number' && parsed.rating > 0 ? parsed.rating : undefined;
              if (userRatingVal !== undefined || avgVal !== undefined) {
                setMovies(prev => prev.map(m => String(m.id) === mid ? { ...m, userRating: userRatingVal !== undefined ? userRatingVal : m.userRating, rating: avgVal !== undefined ? avgVal : m.rating } : m));
                // remove the pending update after applying
                sessionStorage.removeItem('movieRatingUpdate');
                console.debug('[FavScreen] Applied pending movieRatingUpdate from sessionStorage', parsed);
              }
            }
          }
        } catch (e) {
          // ignore storage/json errors
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
        showToast('Error al cargar favoritos', 'error');
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    };

    // Filtrado: por búsqueda y por género
    const filteredMovies = movies.filter(m => {
      const searchTerm = navSearchQuery || searchQuery;
      const matchesSearch = !searchTerm.trim() || 
        m.title.toLowerCase().includes(searchTerm.trim().toLowerCase());
      const matchesGenre = genreFilter === 'Todos los gen' || 
        m.genre.toLowerCase() === genreFilter.toLowerCase();
      return matchesSearch && matchesGenre;
    });

    const handleBack = () => {
        navigate('/home');
    };

    const handleNavSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // La búsqueda se aplica automáticamente a través del filtrado
    };

    const handleRemoveFavorite = async (movieId: string | number) => {
        if (!userId) return;
        
        const movie = movies.find(m => m.id === movieId);
        
        try {
            // Remover del estado local primero para mejor UX
            setMovies(prevMovies => prevMovies.filter(movie => movie.id !== movieId));
        
            // Llamar al backend para eliminar
      await deleteFavorite(userId, String(movieId));
            
            showToast(`"${movie?.title}" eliminada de favoritos`, 'success');
        
        } catch (error) {
            console.error('Error al eliminar favorito:', error);
            showToast('No se pudo eliminar la película de favoritos', 'error');
            // Recargar favoritos si falla
            loadFavorites(userId);
        }
    };

    const handlePlay = (movie: Movie) => {
        // Navegar a MovieScreen con los datos de la película
        console.log('Reproduciendo película:', movie); // Debug
        if (!movie.source) {
            showToast('La película no tiene una fuente disponible', 'error');
            return;
        }
        navigate(`/movie/${movie.id}`, { state: movie });
    };

  // Voting removed from FavScreen per design; ratings are shown but not editable here.

    const renderStars = (rating: number, movieId?: string | number, isClickable: boolean = false) => {
        return [...Array(5)].map((_, index) => {
      // FavScreen does not allow voting here; stars are purely visual.
      const starProps = {
        role: 'img' as const,
        'aria-label': `Estrella ${index + 1}`,
      };

            return (
                <span 
                    key={index} 
                    className={`star ${index < rating ? 'filled' : ''} ${isClickable ? 'clickable' : ''}`}
                    style={{ cursor: isClickable ? 'pointer' : 'default' }}
                    {...starProps}
                >
                    ★
                </span>
            );
        });
    };

  return (
    <div className="fav-screen">
      <NavBar 
        searchQuery={navSearchQuery}
        onSearchChange={setNavSearchQuery}
        onSearchSubmit={handleNavSearch}
      />
      
      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`} role="alert" aria-live="polite">
          {toast.message}
        </div>
      )}
      
      {/* Header */}
      <header className="fav-header">
        <button className="back-button" onClick={handleBack} aria-label="Volver al catálogo">
          <IoArrowBack aria-hidden="true" />
          <span>Volver al Catálogo</span>
        </button>
      </header>

      {/* Main Content */}
      <div className="fav-content">
        {/* Title Section */}
        <div className="title-section">
          <div className="title-group">
            <h1 className="main-title">Mis Películas Favoritas</h1>
            <p className="subtitle">Gestiona tu colección personal de películas favoritas</p>
          </div>
          <div className="favorites-count">
            <CiHeart className="heart-icon" aria-hidden="true" />
            <span>{movies.length} películas favoritas</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="search-filters-container">
          <div className="search-box">
            <IoSearchOutline className="search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar en favoritos"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Buscar películas en favoritos"
            />
          </div>

          <div className="filters">
            <div className="filter-dropdown">
              <button 
                className="filter-button"
                onClick={() => setIsGenreOpen(!isGenreOpen)}
                aria-label={`Filtrar por género: ${genreFilter}`}
                aria-expanded={isGenreOpen ? "true" : "false"}
              >
                <MdFilterList className="filter-icon" aria-hidden="true" />
                <span>{genreFilter}</span>
                <span className="arrow" aria-hidden="true">▼</span>
              </button>
              {isGenreOpen && (
                <div className="dropdown-menu" role="menu">
                  <div 
                    className="dropdown-item" 
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => { setGenreFilter('Todos los generos'); setIsGenreOpen(false); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setGenreFilter('Todos los generos');
                        setIsGenreOpen(false);
                      }
                    }}
                  >
                    Todos los géneros
                  </div>
                  <div 
                    className="dropdown-item" 
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => { setGenreFilter('Accion'); setIsGenreOpen(false); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setGenreFilter('Accion');
                        setIsGenreOpen(false);
                      }
                    }}
                  >
                    Acción
                  </div>
                  <div 
                    className="dropdown-item" 
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => { setGenreFilter('Drama'); setIsGenreOpen(false); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setGenreFilter('Drama');
                        setIsGenreOpen(false);
                      }
                    }}
                  >
                    Drama
                  </div>
                  <div 
                    className="dropdown-item" 
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => { setGenreFilter('Comedia'); setIsGenreOpen(false); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setGenreFilter('Comedia');
                        setIsGenreOpen(false);
                      }
                    }}
                  >
                    Comedia
                  </div>
                  <div 
                    className="dropdown-item" 
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => { setGenreFilter('Terror'); setIsGenreOpen(false); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setGenreFilter('Terror');
                        setIsGenreOpen(false);
                      }
                    }}
                  >
                    Terror
                  </div>
                  <div 
                    className="dropdown-item" 
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => { setGenreFilter('Thriller'); setIsGenreOpen(false); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setGenreFilter('Thriller');
                        setIsGenreOpen(false);
                      }
                    }}
                  >
                    Thriller
                  </div>
                  <div 
                    className="dropdown-item" 
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => { setGenreFilter('Ciencia Ficcion'); setIsGenreOpen(false); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setGenreFilter('Ciencia Ficcion');
                        setIsGenreOpen(false);
                      }
                    }}
                  >
                    Ciencia Ficción
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Movies Grid */}
        <div className="movies-grid">
          {loading ? (
            <p role="status" aria-live="polite">Cargando favoritos...</p>
          ) : filteredMovies.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
              <p role="status">No tienes películas favoritas aún</p>
            </div>
          ) : (
            filteredMovies.map((movie) => (
            <div 
              key={movie.id} 
              className="movie-card"
              aria-label={`${movie.title}, género ${movie.genre}, calificación ${movie.rating}`}
            >
              <div className="movie-image-container">
                <img src={movie.poster} alt={`Póster de la película ${movie.title}`} className="movie-image" />
                <div className="movie-rating" aria-label={`Calificación ${movie.rating} estrellas`}>
                  <span aria-hidden="true">⭐</span>
                  <span>{movie.rating}</span>
                </div>
                <button
                  className={`favorite-button is-favorite`}
                  onClick={() => handleRemoveFavorite(movie.id)}
                  aria-label={`Quitar ${movie.title} de favoritos`}
                  title={`Quitar ${movie.title} de favoritos`}
                >
                  <AiFillHeart aria-hidden="true" />
                </button>
                <div className="movie-overlay">
                  <button 
                    className="play-button" 
                    onClick={() => handlePlay(movie)}
                    aria-label={`Reproducir ${movie.title}`}
                  >
                    <BiPlay className="play-icon" aria-hidden="true" />
                    <span>Reproducir</span>
                  </button>
                </div>
              </div>
              <div className="movie-info">
                <div className="movie-header">
                  <h3 className="movie-title">{movie.title}</h3>
                  <span className="movie-duration">🕒 {movie.duration}</span>
                </div>
                <div className="movie-genre">
                  <span className="genre-tag">{movie.genre}</span>
                </div>
                {/* Lower rating section removed — top badge shows the global rating (movie.rating) */}
                <div className="movie-date">
                  Añadido: {movie.addedDate}
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      <HelpButton />
    </div>
  );
};

export default FavScreen;
