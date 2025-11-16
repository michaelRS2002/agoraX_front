import React, { useEffect, useMemo, useRef, useState } from "react";
import "./MovieScreen.scss";
import NavBar from "../../components/NavBar/NavBar";
import HelpButton from "../../components/HelpButton/HelpButton";
import { AiFillStar, AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { FaPaperPlane, FaComment, FaClosedCaptioning } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import {
  insertFavoriteOrRating,
  getFavorites,
  deleteFavorite,
  addUserMovieComment,
  addFavorite,
  setRating as apiSetRating,
  getMovieDetailsWithUser,
} from "../../utils/moviesApi";
import { formatRelativeTime } from "../../utils/time";

/**
 * Represents a single user comment.
 * @interface Comment
 * @property {number} id - Unique identifier of the comment.
 * @property {string} author - Name of the comment author.
 * @property {string} text - Content of the comment.
 * @property {string} date - Time or date when the comment was posted.
 * @property {string} [avatar] - Optional avatar initials or URL for the user.
 */
interface Comment {
  id: number;
  author: string;
  text: string;
  date: string;
  avatar?: string;
}

export function MovieScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const passedMovie = (location?.state as any) || null;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [rating, setRating] = useState(0);
  const [displayRating, setDisplayRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  // Lista de comentarios inicial vacía — los comentarios se cargarán desde el backend
  const [comments, setComments] = useState<Comment[]>([]);

  const [userId, setUserId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string | number>>(
    new Set()
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);

  // -------- Load user and favorites --------
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.id) {
          setUserId(user.id);
          loadUserFavorites(user.id);
          // Load user's existing rating for this movie (if any)
          (async () => {
            try {
              const details = await getMovieDetailsWithUser(String(movie.id), user.id);
              const userRatingFromApi = details?.userRating;
              if (typeof userRatingFromApi === "number") {
                setRating(userRatingFromApi);
                setDisplayRating(
                  typeof details?.movie?.rating === "number"
                    ? details.movie.rating
                    : userRatingFromApi
                );
              }
              // Load comments returned by the backend (if any)
                if (Array.isArray(details?.comments)) {
                const mapped = details.comments.map((c: any) => {
                    // sanitize backend placeholders like 'N/A'
                    const name = c.author_name && c.author_name !== 'N/A' ? c.author_name : '';
                    const surname = c.author_surname && c.author_surname !== 'N/A' ? c.author_surname : '';
                    const full = (name || surname) ? `${name} ${surname}`.trim() : 'Usuario';
                    const avatarInitials = c.avatar || (name ? (name[0] + (surname ? surname[0] : '')).toUpperCase() : undefined);
                    return {
                      id: c.id,
                      author: full,
                      text: c.content || c.text || '',
                      // Format relative time in Spanish (Bogotá reference)
                      date: formatRelativeTime(c.created_at || c.inserted_at || c.createdAt || c.created_at),
                      avatar: avatarInitials,
                    };
                  });
                setComments(mapped);
              }
            } catch (err) {
              // ignore
            }
          })();
        }
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
  }, []);

  const loadUserFavorites = async (userId: string) => {
    try {
      const favs = await getFavorites(userId);
      const favoriteIdSet = new Set(
        favs.map((fav: any) => {
          const id = fav.movies ? fav.movies.id : fav.movie_id;
          // Normalizar a string para comparación consistente
          return String(id);
        })
      );
      setFavoriteIds(favoriteIdSet);
      console.log("Favoritos cargados:", Array.from(favoriteIdSet));
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const toggleSubtitles = () => {
    const video = videoRef.current;
    if (!video) return;

    const tracks = Array.from(video.textTracks);
    const hasVisible = tracks.some((track) => track.mode === "showing");

    // Si ya hay subtítulos visibles → ocultar todos
    if (hasVisible) {
      tracks.forEach((track) => (track.mode = "hidden"));
      setSubtitlesEnabled(false);
      showToast("Subtítulos desactivados", "success");
    } else {
      // Si no hay ninguno visible → mostrar solo el español
      const esTrack = tracks.find((track) => track.language === "es");
      if (esTrack) {
        esTrack.mode = "showing";
        setSubtitlesEnabled(true);
        showToast("Subtítulos activados (Español)", "success");
      } else {
        showToast("No hay subtítulos en español disponibles", "error");
      }
    }
  };



  // -------- Movie data --------
  const movie = useMemo(() => {
    if (passedMovie) {
      const movieObj = {
        id: passedMovie.id || Date.now(),
        title: passedMovie.title || "Video",
        year: new Date().getFullYear().toString(),
        duration: passedMovie.duration || "",
        rating:
          typeof passedMovie.rating === "number"
            ? passedMovie.rating
            : parseFloat(passedMovie.rating) || 0,
        genre: passedMovie.genre || "Video",
        director: passedMovie.director || "Desconocido",
        description: passedMovie.description || "",
        videoUrl: passedMovie.source || "",
        poster: passedMovie.poster || "",
        source: passedMovie.source || "",
      };
      return movieObj;
    }
    return {
      id: Date.now(),
      title: "Video",
      year: new Date().getFullYear().toString(),
      duration: "",
      rating: 0,
      genre: "Video",
      director: "Desconocido",
      description: "",
      videoUrl: "",
      poster: "",
      source: "",
    };
  }, [passedMovie]);

  useEffect(() => {
    setDisplayRating(movie.rating || 0);
    if (videoRef.current && movie.videoUrl) {
      const v = videoRef.current;
      v.muted = true;
      v.play().catch(() => {});
    }
  }, [movie]);

  const handleRatingClick = async (rate: number): Promise<void> => {
    // Guard: only accept valid ratings 1..5 (prevent sending placeholder 0)
    if (typeof rate !== 'number' || Number.isNaN(rate) || rate < 1 || rate > 5) {
      showToast("Selecciona una valoración válida (1-5)", "error");
      return;
    }

    setRating(rate);
    // Send rating to backend (upsert). If user not logged, keep local only.
    if (!userId) {
      showToast("Inicia sesión para guardar tu valoración", "error");
      return;
    }
    try {
      const resp = await apiSetRating(userId, {
        movieId: String(movie.id),
        rating: rate,
      });
      // If backend returns suggestedRating, update display (round to 1 decimal)
      const suggested = resp?.suggestedRating;
      const finalRating = typeof suggested === 'number'
        ? Math.round(Number(suggested) * 10) / 10
        : Math.round(Number(rate) * 10) / 10;
      setDisplayRating(finalRating);
      // Notify other views (Home) that this movie's rating changed
      try {
        const detail = { movieId: String(movie.id), rating: finalRating, userRating: rate };
        window.dispatchEvent(new CustomEvent("movie:rating-updated", { detail } as any));
        // Persist short-lived update so views that mount after this dispatch can still pick it up
        try {
          sessionStorage.setItem('movieRatingUpdate', JSON.stringify(detail));
        } catch (e) {
          // ignore storage errors
        }
      } catch (e) {
        // ignore
      }
      showToast("Listo, tu valoración ha sido guardada", "success");
    } catch (err) {
      console.error("Error guardando valoración:", err);
      showToast("No se pudo guardar la valoración", "error");
    }
  };

  const getGenreDescription = (genre: string): string => {
    const descriptions: { [key: string]: string } = {
      Accion: "Una emocionante película de acción llena de adrenalina.",
      Drama: "Un conmovedor drama lleno de emociones.",
      Comedia: "Una comedia divertida que te hará reír a carcajadas.",
      Thriller: "Un thriller intenso con giros inesperados.",
      Terror: "Una película de terror llena de suspenso.",
      "Ciencia Ficcion": "Una historia futurista de ciencia ficción.",
      Popular: "Un video popular que no puedes perderte.",
      Video: "Un interesante video que debes ver.",
    };
    return descriptions[genre] || `Una fascinante película de ${genre}.`;
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
    if (!userId) {
      showToast("Inicia sesión para comentar", "error");
      return;
    }

    try {
      const resp = await addUserMovieComment(userId, {
        movieId: String(movie.id),
        text: comment.trim(),
      });
      // Backend returns comment with author_name, author_surname and avatar
      const created = resp?.comment ?? null;
      // Refresh comments from server to ensure everyone sees persisted comments
        try {
        const details = await getMovieDetailsWithUser(String(movie.id), userId);
        if (Array.isArray(details?.comments)) {
          const mapped = details.comments.map((c: any) => {
            const name = c.author_name && c.author_name !== 'N/A' ? c.author_name : '';
            const surname = c.author_surname && c.author_surname !== 'N/A' ? c.author_surname : '';
            const full = (name || surname) ? `${name} ${surname}`.trim() : 'Usuario';
            const avatarInitials = c.avatar || (name ? (name[0] + (surname ? surname[0] : '')).toUpperCase() : undefined);
            return {
              id: c.id,
              author: full,
              text: c.content || c.text || '',
              date: formatRelativeTime(c.created_at || c.inserted_at || c.createdAt || c.created_at),
              avatar: avatarInitials,
            };
          });
          setComments(mapped);
        }
      } catch (err) {
        // fallback: prepend the created comment locally
        const authorNameRaw = created?.author_name || '';
        const authorSurnameRaw = created?.author_surname || '';
        const authorName = authorNameRaw && authorNameRaw !== 'N/A' ? authorNameRaw : '';
        const authorSurname = authorSurnameRaw && authorSurnameRaw !== 'N/A' ? authorSurnameRaw : '';
        const authorFull = `${authorName || ''} ${authorSurname || ''}`.trim() || 'Usuario';
        const avatar = created?.avatar || (authorFull ? authorFull.substring(0,2).toUpperCase() : 'UA');
        const newComment: Comment = {
          id: created?.id || comments.length + 1,
          author: authorFull || "Usuario Actual",
          text: created?.content || comment.trim(),
          date: "Justo ahora",
          avatar: avatar,
        };
        setComments([newComment, ...comments]);
      }
      setComment("");
      // Notify other views that a new comment was added for this movie (in-page)
      try {
        const detail = { movieId: String(movie.id), comment: created };
        window.dispatchEvent(new CustomEvent("movie:comment-added", { detail } as any));
      } catch (e) {
        // ignore
      }
      showToast("Comentario publicado", "success");
    } catch (err) {
      console.error("Error publicando comentario:", err);
      showToast("No se pudo publicar el comentario", "error");
    }
  };

  // Listen for remote comments added on the same movie (real-time-ish)
  useEffect(() => {
    const onCommentAdded = (e: any) => {
      try {
        const { movieId, comment: incoming } = e.detail || {};
        if (!movieId || String(movieId) !== String(movie.id)) return;
        if (!incoming) return;
        // Prepend incoming comment if it's not already in the list
        setComments((prev) => {
          if (prev.some((c) => c.id === incoming.id)) return prev;
          return [incoming, ...prev];
        });
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener("movie:comment-added", onCommentAdded as EventListener);
    return () => window.removeEventListener("movie:comment-added", onCommentAdded as EventListener);
  }, [movie.id]);

  // -------- FAVORITES HANDLER --------
  const handleAddToFavorites = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!userId) {
      showToast("Inicia sesión para añadir favoritos", "error");
      navigate("/login");
      return;
    }

    // Normalizar movie.id a string para comparación consistente
    const movieIdStr = String(movie.id);
    const isCurrentlyFavorite = favoriteIds.has(movieIdStr);

    console.log("Movie ID:", movieIdStr, "Is favorite:", isCurrentlyFavorite);
    console.log("Favorites set:", Array.from(favoriteIds));

    // Actualización optimista del UI
    setFavoriteIds((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlyFavorite) {
        newSet.delete(movieIdStr);
      } else {
        newSet.add(movieIdStr);
      }
      return newSet;
    });

    try {
      if (isCurrentlyFavorite) {
        // Use DELETE favorites endpoint
        await deleteFavorite(userId, String(movie.id));
        showToast(`"${movie.title}" eliminada de favoritos`, "success");
        try { window.dispatchEvent(new CustomEvent('movie:favorite-changed', { detail: { movieId: String(movie.id), isFavorite: false } } as any)); } catch(e){}
      } else {
        await addFavorite(userId, {
          movieId: String(movie.id),
          favorite: true,
          title: movie.title,
          thumbnail_url: movie.poster,
          genre: movie.genre,
          source: movie.source,
          duration_seconds: 300,
        });
        showToast(`"${movie.title}" añadida a favoritos`, "success");
        try { window.dispatchEvent(new CustomEvent('movie:favorite-changed', { detail: { movieId: String(movie.id), isFavorite: true } } as any)); } catch(e){}
      }
    } catch (error) {
      console.error("Error modificando favoritos:", error);

      // Revertir cambio optimista en caso de error
      setFavoriteIds((prev) => {
        const newSet = new Set(prev);
        if (isCurrentlyFavorite) {
          newSet.add(movieIdStr);
        } else {
          newSet.delete(movieIdStr);
        }
        return newSet;
      });

      showToast("No se pudo modificar favoritos", "error");
    }
  };

  return (
    <div className="MovieScreen">
      <NavBar />

      {toast && (
        <div className={`toast toast-${toast.type}`} role="alert" aria-live="polite">{toast.message}</div>
      )}

      <div className="movie-container">
        <div className="movie-content">
          {/* ----------------------- Video ----------------------- */}
          <div className="video-section">
            <div className="video-player">
              <video ref={videoRef} controls playsInline aria-label={`Reproduciendo ${movie.title}`}>
                {movie.videoUrl && (
                  <source src={movie.videoUrl} type="video/mp4" />
                )}
                  <track
                  kind="subtitles"
                  src={`/subtitles/${movie.id}-es.vtt`}
                  srcLang="es"
                  label="Español"
                />

                <track
                  kind="subtitles"
                  src={`/subtitles/${movie.id}-en.vtt`}
                  srcLang="en"
                  label="English"
                />
                Tu navegador no soporta el video.
              </video>
              
              {/* Botón de subtítulos */}
              <div className="subtitle-control">
                <button
                  className={`subtitle-btn ${subtitlesEnabled ? "active" : ""}`}
                  onClick={toggleSubtitles}
                  aria-label={subtitlesEnabled ? "Desactivar subtítulos" : "Activar subtítulos"}
                  aria-pressed={subtitlesEnabled ? "true" : "false"}
                >
                  <FaClosedCaptioning />
                </button>
              </div>
            </div>
          </div>

          {/* ----------------------- Movie Info ----------------------- */}
          <div className="movie-info-section">
            <div className="movie-header">
              <h1>{movie.title}</h1>
              <div className="movie-actions">
                <button
                  className={`favorite-button ${
                    favoriteIds.has(String(movie.id)) ? "is-favorite" : ""
                  }`}
                  onClick={handleAddToFavorites}
                  aria-label={
                    favoriteIds.has(String(movie.id))
                      ? `Eliminar ${movie.title} de favoritos`
                      : `Añadir ${movie.title} a favoritos`
                  }
                  aria-pressed={favoriteIds.has(String(movie.id)) ? "true" : "false"}
                >
                  {favoriteIds.has(String(movie.id)) ? (
                    <AiFillHeart color="red" aria-hidden="true" />
                  ) : (
                    <AiOutlineHeart color="gray" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="movie-meta">
              <span className="year">{movie.year}</span>
              <span className="duration">{movie.duration}</span>
            </div>

            <div className="movie-genre">
              <span className="genre-badge">{movie.genre}</span>
            </div>

            <div className="movie-director">
              <span>Director: {movie.director}</span>
            </div>

            <p className="movie-description">
              {getGenreDescription(movie.genre)}
            </p>

            {/* ----------------------- User Rating ----------------------- */}
            <div className="user-rating">
              <label>Tu valoración:</label>
              <div className="rating-stars" role="group" aria-label="Calificar película">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={`star ${
                      star <= (hoverRating || rating) ? "active" : ""
                    }`}
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`Calificar con ${star} estrella${star > 1 ? 's' : ''}`}
                    aria-pressed={star <= rating ? "true" : "false"}
                  >
                    <AiFillStar aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------- Comments ----------------------- */}
          <div className="comments-section">
          <div className="comments-header">
            <h2>
              <FaComment aria-hidden="true" /> Comentarios
            </h2>
            <div className="movie-rating-badge" aria-label={`Calificación de la película: ${displayRating} estrellas`}>
              <AiFillStar aria-hidden="true" />
              <span>{displayRating}</span>
            </div>
          </div>

          <div className="comment-input-box">
            <textarea
              placeholder="Escribe tu comentario..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              aria-label="Escribe tu comentario sobre la película"
            />
          </div>

          <button
            className="comment-submit-btn"
            onClick={handleCommentSubmit}
            disabled={!comment.trim()}
            aria-label="Publicar comentario"
          >
            <FaPaperPlane aria-hidden="true" />
            Comentar
          </button>

          <div className="comment-separator"></div>

          <div className="comments-list" role="list" aria-label="Lista de comentarios">
            {comments.map((comm) => (
              <div key={comm.id} className="comment-item" role="listitem">
                <div className="comment-avatar" aria-hidden="true">
                  {comm.avatar || comm.author.substring(0, 2).toUpperCase()}
                </div>
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="comment-author">{comm.author}</span>
                    <span className="comment-date">{comm.date}</span>
                  </div>
                  <p className="comment-text">{comm.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <HelpButton />
    </div>
  );
}

export default MovieScreen;