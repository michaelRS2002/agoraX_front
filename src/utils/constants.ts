// PopFix application configuration and constants

/**
 * Base URL for the API.
 * Replace this value with your backend URL if needed.
 * @constant {string}
 */
export const API_BASE_URL = "http://localhost:5100/api";

/**
 * API endpoint definitions for different functionalities.
 * @constant
 * @type {Object}
 * @property {string} LOGIN - Endpoint for user login.
 * @property {string} REGISTER - Endpoint for user registration.
 * @property {string} FORGOT_PASSWORD - Endpoint for password recovery.
 * @property {string} LOGOUT - Endpoint for logging out the user.
 * @property {string} MOVIES - Endpoint for listing or managing movies.
 * @property {string} MOVIE_DETAILS - Endpoint for fetching movie details by ID.
 * @property {string} SEARCH_MOVIES - Endpoint for searching movies.
 * @property {string} POPULAR_MOVIES - Endpoint for fetching popular movies.
 * @property {string} TRENDING_MOVIES - Endpoint for fetching trending movies.
 * @property {string} USER_PROFILE - Endpoint for getting user profile information.
 * @property {string} USER_FAVORITES - Endpoint for getting user's favorite movies.
 */
export const API_ENDPOINTS = {
  // Autenticación
  LOGIN: '/users/login',
  // changed to match backend auth route
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  LOGOUT: '/logout',
  
  // Películas
  MOVIES: '/movies/mixed',
  MOVIE_DETAILS: '/pexels/:id',
  SEARCH_MOVIES: '/pexels/search',
  POPULAR_MOVIES: '/pexels/popular',
  TRENDING_MOVIES: '/pexels/trending',
  
  // Favoritos y ratings
  MOVIES_FAVORITES: '/movies/favorites/:userId',
  MOVIES_INSERT_FAVORITE_RATING: '/movies/insertFavoriteRating/:userId',
  MOVIES_UPDATE: '/movies/update/:userId',
  MOVIES_RATINGS: '/movies/ratings/:userId',
  
  // Usuario
  USER_PROFILE: '/user/profile',
  USER_FAVORITES: '/user/favorites'
};

/**
 * General application configuration constants.
 * @constant
 * @type {Object}
 * @property {string} APP_NAME - Name of the application.
 * @property {string} DEFAULT_LANGUAGE - Default language of the app (ISO code).
 * @property {number} MOVIES_PER_PAGE - Number of movies to display per page.
 * @property {string} IMAGE_BASE_URL - Base URL for movie poster images.
 */
export const APP_CONFIG = {
  APP_NAME: "PopFix",
  DEFAULT_LANGUAGE: "es",
  MOVIES_PER_PAGE: 20,
  IMAGE_BASE_URL: "https://image.tmdb.org/t/p/w500", // For movie images
};

/**
 * URL del manual de usuario. Puede ser una ruta interna (p. ej. '/manual-de-usuario')
 * o una URL externa (p. ej. 'https://example.com/manual.pdf').
 * Cambia este valor según dónde hospedes la documentación del usuario.
 */
export const MANUAL_URL = "https://www.canva.com/design/DAG3Fl4M-hE/cQ1XIs0pvyvJgbnFsiou9Q/edit";
