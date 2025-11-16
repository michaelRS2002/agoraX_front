// Functions to fetch and handle movie-related data
import { httpClient } from "./httpClient.js";
import { API_ENDPOINTS, APP_CONFIG } from "./constants.js";

// Tipos comunes
export type MovieSummary = {
  id: string
  title: string
  thumbnail_url?: string
  genre?: string
  source?: string
}
/**
 * Fetches a list of popular movies from the backend API.
 *
 * @async
 * @function getPopularMovies
 * @param {number} [page=1] - The page number for pagination.
 * @returns {Promise<any>} The API response containing a list of popular movies.
 * @throws {Error} If the request fails or the backend returns an error.
 */
// Obtener películas populares
export const getPopularMovies = async (page: number = 1) => {
  try {
    const response = await httpClient.get(`${API_ENDPOINTS.POPULAR_MOVIES}?page=${page}`)
    return response
  } catch (error: any) {
    throw new Error('Error al obtener películas populares: ' + (error?.message || ''))
  }
};

/**
 * Fetches trending movies from the backend API.
 *
 * @async
 * @function getTrendingMovies
 * @returns {Promise<any>} The API response containing trending movies.
 * @throws {Error} If the request fails or the backend returns an error.
 */
export const getTrendingMovies = async () => {
  try {
    const response = await httpClient.get(API_ENDPOINTS.TRENDING_MOVIES)
    return response
  } catch (error: any) {
    throw new Error('Error al obtener películas en tendencia: ' + (error?.message || ''))
  }
};

/**
 * Searches for movies by title.
 *
 * @async
 * @function searchMovies
 * @param {string} query - The search query or movie title.
 * @param {number} [page=1] - The page number for pagination.
 * @returns {Promise<any>} The API response containing the search results.
 * @throws {Error} If the request fails or the backend returns an error.
 */
export const searchMovies = async (query: string, page: number = 1) => {
  try {
    const response = await httpClient.get(`${API_ENDPOINTS.SEARCH_MOVIES}?q=${encodeURIComponent(query)}&page=${page}`)
    return response
  } catch (error: any) {
    throw new Error('Error al buscar películas: ' + (error?.message || ''))
  }
};

/**
 * Fetches detailed information for a specific movie by its ID.
 *
 * @async
 * @function getMovieDetails
 * @param {string|number} movieId - The ID of the movie to fetch details for.
 * @returns {Promise<any>} The API response containing movie details.
 * @throws {Error} If the request fails or the backend returns an error.
 */
export const getMovieDetails = async (movieId: string) => {
  try {
    const endpoint = `/movies/details/${encodeURIComponent(movieId)}`
    const response = await httpClient.get(endpoint)
    return response
  } catch (error: any) {
    throw new Error('Error al obtener detalles de la película: ' + (error?.message || ''))
  }
};

// Fetch movie details with optional userId to get user's rating and comments
export const getMovieDetailsWithUser = async (movieId: string, userId?: string) => {
  try {
    const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const endpoint = `/movies/details/${encodeURIComponent(movieId)}${q}`;
    const response = await httpClient.get(endpoint);
    return response;
  } catch (error: any) {
    throw new Error('Error al obtener detalles de la película: ' + (error?.message || ''));
  }
};

/**
 * Fetches all movies from the backend with pagination support.
 *
 * @async
 * @function getAllMovies
 * @param {number} [page=1] - The page number for pagination.
 * @returns {Promise<any>} The API response containing the list of movies.
 * @throws {Error} If the request fails or the backend returns an error.
 */
export const getAllMovies = async (page: number = 1) => {
  try {
    const response = await httpClient.get(`${API_ENDPOINTS.MOVIES}?page=${page}&limit=${APP_CONFIG.MOVIES_PER_PAGE}`)
    return response
  } catch (error: any) {
    throw new Error('Error al obtener películas: ' + (error?.message || ''))
  }
}

// ===================== FAVORITOS Y RATINGS (BACK /api/movies) =====================
export type InsertFavoriteOrRatingPayload = {
  movieId: string
  favorite?: boolean | null
  rating?: number | null
  title?: string
  thumbnail_url?: string
  genre?: string
  source?: string
  duration_seconds?: number
}

export type UpdateUserMoviePayload = {
  movieId: string
  is_favorite?: boolean | null
  rating?: number | null
}

// Validar rating en cliente (1..5)
const validateRating = (rating?: number) => {
  if (rating == null) return
  const n = Number(rating)
  if (Number.isNaN(n) || n < 1 || n > 5) {
    throw new Error('El rating debe estar entre 1 y 5')
  }
};

// GET /api/movies/favorites/:userId
export const getFavorites = async (userId: string) => {
  if (!userId) throw new Error('userId es requerido')
  try {
    const endpoint = API_ENDPOINTS.MOVIES_FAVORITES.replace(':userId', encodeURIComponent(userId))
    const response = await httpClient.get(endpoint)
    return response as Array<{ movie_id: string; movies: MovieSummary }>
  } catch (error: any) {
    throw new Error(error?.message || 'Error al obtener favoritos')
  }
};

// POST /api/movies/insertFavoriteRating/:userId
export const insertFavoriteOrRating = async (userId: string, payload: InsertFavoriteOrRatingPayload) => {
  if (!userId) throw new Error('userId es requerido')
  if (!payload || !payload.movieId) throw new Error('movieId es requerido')
  validateRating(payload.rating ?? undefined)
  try {
    const endpoint = API_ENDPOINTS.MOVIES_INSERT_FAVORITE_RATING.replace(':userId', encodeURIComponent(userId))
    const response = await httpClient.post(endpoint, payload)
    return response // { message, data: UserMovie[] }
  } catch (error: any) {
    throw new Error(error?.message || 'Error al insertar favorito/rating')
  }
}

// PUT /api/movies/update/:userId
export const updateUserMovie = async (userId: string, payload: UpdateUserMoviePayload) => {
  if (!userId) throw new Error('userId es requerido')
  if (!payload || !payload.movieId) throw new Error('movieId es requerido')
  validateRating(payload.rating ?? undefined)
  try {
    const endpoint = API_ENDPOINTS.MOVIES_UPDATE.replace(':userId', encodeURIComponent(userId))
    const response = await httpClient.put(endpoint, payload)
    return response // { message, data: UserMovie }
  } catch (error: any) {
    throw new Error(error?.message || 'Error al actualizar favorito/rating')
  }
};

// POST /api/movies/favorite/:userId - add a movie to favorites (creates movie if needed)
export const addFavorite = async (userId: string, payload: InsertFavoriteOrRatingPayload) => {
  if (!userId) throw new Error('userId es requerido')
  if (!payload || !payload.movieId) throw new Error('movieId es requerido')
  try {
    const endpoint = `/movies/favorite/${encodeURIComponent(userId)}`
    const response = await httpClient.post(endpoint, payload)
    return response
  } catch (error: any) {
    throw new Error(error?.message || 'Error al añadir favorito')
  }
}

// PUT /api/movies/rating/:userId - set rating only
export const setRating = async (userId: string, payload: { movieId: string; rating: number }) => {
  if (!userId) throw new Error('userId es requerido')
  if (!payload || !payload.movieId) throw new Error('movieId es requerido')
  const n = Number(payload.rating)
  if (Number.isNaN(n) || n < 1 || n > 5) throw new Error('El rating debe estar entre 1 y 5')
  try {
    const endpoint = `/movies/rating/${encodeURIComponent(userId)}`
    const response = await httpClient.put(endpoint, payload)
    return response
  } catch (error: any) {
    throw new Error(error?.message || 'Error al guardar rating')
  }
}

// DELETE /api/movies/favorites/:userId/:movieId
export const deleteFavorite = async (userId: string, movieId: string) => {
  if (!userId) throw new Error('userId es requerido')
  if (!movieId) throw new Error('movieId es requerido')
  try {
    const endpoint = API_ENDPOINTS.MOVIES_FAVORITES.replace(':userId', encodeURIComponent(userId))
    // endpoint currently is '/movies/favorites/:userId' - backend expects /movies/favorites/:userId/:movieId for delete
    const full = `${endpoint}/${encodeURIComponent(movieId)}`
    const response = await httpClient.delete(full)
    return response
  } catch (error: any) {
    throw new Error(error?.message || 'Error al eliminar favorito')
  }
}

// POST /api/movies/addUserMovieComment/:userId
export const addUserMovieComment = async (userId: string, payload: { movieId: string; text: string }) => {
  if (!userId) throw new Error('userId es requerido')
  if (!payload || !payload.movieId) throw new Error('movieId es requerido')
  try {
    const endpoint = `/movies/addUserMovieComment/${encodeURIComponent(userId)}`
    const response = await httpClient.post(endpoint, payload)
    return response
  } catch (error: any) {
    throw new Error(error?.message || 'Error al añadir comentario')
  }
}

/**
 * Helper function to construct a full movie image URL.
 * Returns a placeholder if the image path is missing.
 *
 * @function getImageUrl
 * @param {string} imagePath - The image path provided by the API.
 * @param {string} [size='w500'] - The desired image size (e.g., 'w200', 'w500', 'original').
 * @returns {string} The complete image URL or a placeholder path.
 */
export const getImageUrl = (imagePath: string | null | undefined, size: string = 'w500'): string => {
  if (!imagePath) return '/placeholder-movie.jpg'
  return `${APP_CONFIG.IMAGE_BASE_URL.replace('w500', size)}${imagePath}`
}

// ===================== Adaptadores PEXELS -> Home =====================
// Tipos mínimos de Pexels (lo que solemos usar)
type PexelsVideoFile = {
  id?: number
  quality?: string
  link?: string
  width?: number
  height?: number
}

type PexelsUser = {
  name?: string
}

type PexelsVideo = {
  id: number
  image?: string
  duration?: number
  url?: string
  user?: PexelsUser
  video_files?: PexelsVideoFile[]
}

type PexelsResponse = {
  page?: number
  per_page?: number
  total_results?: number
  videos?: PexelsVideo[]
} | PexelsVideo[]

// Tipo esperado por Home
export type HomeMovie = {
  id: string | number
  title: string
  rating: number
  duration: string
  genre: string
  description: string
  poster: string
  director?: string
  isFavorite?: boolean
  source?: string
}

const secondsToHhMm = (seconds?: number | string): string => {
  if (seconds == null || seconds === '') return ''
  const s = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds
  if (Number.isNaN(s)) return ''
  const n = Math.max(0, Math.floor(s))
  const h = Math.floor(n / 3600)
  const m = Math.floor((n % 3600) / 60)
  const sec = n % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${sec}s`
}

const mapPexelsToHomeMovies = (data: PexelsResponse): HomeMovie[] => {
  const list: PexelsVideo[] = Array.isArray(data) ? data : (data?.videos || [])
  const pickBestSource = (files?: PexelsVideoFile[]): string | undefined => {
    if (!files || files.length === 0) return undefined
    // Prefer highest width; fallback to first
    const sorted = [...files].sort((a, b) => (b.width || 0) - (a.width || 0))
    return sorted[0]?.link
  }
  return list.map((v: any) => {
    // Soporta ambas formas: Pexels raw y backend adaptado
    // Si el backend ya mapea, recibe: id, title, rating (número), duration, genre, description, poster, source
    // Si es Pexels raw, recibe: id, image, duration, url, user, video_files
    const isBackendMapped = v.source || (typeof v.rating === 'number' && v.poster);
    
    if (isBackendMapped) {
      // Backend ya mapeó: usa directamente
      return {
        id: v.id || v.pk_id,
        title: v.title,
        rating: typeof v.rating === 'number' ? v.rating : 0,
        duration: v.duration || '0m',
        genre: v.genre ? v.genre.charAt(0).toUpperCase() + v.genre.slice(1) : 'Video',
        description: v.description && !v.description.startsWith('http') ? v.description : `Disfruta esta película de ${(v.genre || 'Video').toLowerCase()}.`,
        poster: v.poster || '/static/img/placeholder.jpg',
        director: v.director || 'Desconocido',
        source: v.source || v.link,
      };
    } else {
      // Pexels raw: mapea como antes
      return {
        id: v.id,
        title: v.user?.name ? `Video ${v.id} by ${v.user.name}` : `Video ${v.id}`,
        rating: 0,
        duration: secondsToHhMm(v.duration),
        genre: 'Video',
        description: 'Un interesante video que no te puedes perder.',
        poster: v.image || '/static/img/placeholder.jpg',
        director: v.user?.name || 'Desconocido',
        source: pickBestSource(v.video_files),
      };
    }
  });
};

// GET /api/movies/ratings/:userId - fetch all ratings for a user
export const getUserRatings = async (userId: string) => {
  if (!userId) throw new Error('userId es requerido')
  try {
    const endpoint = API_ENDPOINTS.MOVIES_RATINGS.replace(':userId', encodeURIComponent(userId))
    const response = await httpClient.get(endpoint)
    // response shape: { ratings: [{ movie_id, rating }, ...] }
    return response as { ratings: Array<{ movie_id: string; rating: number }> }
  } catch (error: any) {
    throw new Error(error?.message || 'Error al obtener ratings del usuario')
  }
}

// Devuelve películas para Home usando endpoints /pexels
export const getPexelsPopularForHome = async (page: number = 1, userId?: string): Promise<HomeMovie[]> => {
  // Include userId when available so backend can merge user-specific data (userRating) into results
  const q = `?perPage=30${userId ? `&userId=${encodeURIComponent(userId)}` : ''}`;
  const res = await httpClient.get(`${API_ENDPOINTS.POPULAR_MOVIES}${q}`)
  const movies = mapPexelsToHomeMovies(res as PexelsResponse)
  // If backend already mapped genre or included user-specific fields, keep them.
  return movies.map(m => m.genre === 'Video' && Array.isArray(res) ? { ...m, genre: 'Popular' } : m)
}

export const searchPexelsForHome = async (query: string, page: number = 1): Promise<HomeMovie[]> => {
  const res = await httpClient.get(`${API_ENDPOINTS.SEARCH_MOVIES}?q=${encodeURIComponent(query)}&page=${page}`)
  return mapPexelsToHomeMovies(res as PexelsResponse)
}
