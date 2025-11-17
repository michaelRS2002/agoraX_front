/**
 * @fileoverview Entry point for the React application.
 * Initializes the ReactDOM root, configures client-side routing using React Router,
 * and defines both public and protected routes.
 *
 * The app uses `ProtectedRoute` to restrict access to authenticated users only.
 * Additionally, `ScrollToTop` ensures that the viewport resets to the top
 * whenever a new route is visited.
 *
 * @module main
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Global styles
import './main.scss'

// VIEWS
import Home from './views/Home/Home'
import Login from './views/Auth/Login/Login'
import Register from './views/Auth/Register/Register'
import ForgotPassword from './views/Auth/Forgot-password/Forgot-password'
import ResetPassword from './views/Auth/Reset-password/Reset-password'
import User from './views/User/User'
import EditUser from './views/User/Edit-user/Edit-user'
import DeleteUser from './views/User/Delete-user/Delete-user'
import ChangePassword from './views/User/Change-password/Change-password'
import SiteMap from './views/SiteMap/SiteMap'
import { NotFound } from './views/NotFound'
import Landing from './views/Landing/Landing'
import Conference from './views/ConferenceRoom/Conference'

// COMPONENTS
import ScrollToTop from './components/ScrollToTop/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'

/**
 * Renders the root React component into the HTML element with the ID 'root'.
 * The app is wrapped in React.StrictMode for highlighting potential issues.
 * 
 * BrowserRouter enables client-side routing without full-page reloads.
 * 
 * @component
 * @returns {void}
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Scrolls to top when navigating to a new page */}
      <ScrollToTop />

      <Routes>
        {/**
         * 🌐 Public Routes — accessible without authentication.
         *
         * @route /
         * @component Landing - Displays the landing page (entry point of the site).
         *
         * @route /login
         * @component Login - Allows users to sign in.
         *
         * @route /register
         * @component Register - Allows new users to create an account.
         *
         * @route /forgot-password
         * @component ForgotPassword - Lets users request a password reset link.
         *
         * @route /reset-password
         * @component ResetPassword - Enables users to reset their password using a token.
         */}
        
        {/** Esta hay que modificarla, debido a que solo se hizo de prueba
         * o modificar /home para que quede de predeterminada con las demás
         * rutas */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/home" element={<Home />} />
        <Route path="/site-map" element={<SiteMap />} />
        {/** Esta es solo de prueba, para ver el Front*/}
        <Route path="/conference" element={<Conference />} />

        {/**
         * 🔒 Protected Routes — require authentication.
         * These routes are wrapped with `ProtectedRoute`, which checks
         * if the user is logged in before granting access.
         *
         * @route /home
         * @component Home - Displays the main content page with movies.
         *
         * @route /perfil
         * @component ProfileScreen - Displays the user's profile overview.
         *
         * @route /user
         * @component User - Displays the user dashboard.
         *
         * @route /edit-user
         * @component EditUser - Allows users to edit profile information.
         *
         * @route /delete-user
         * @component DeleteUser - Handles user account deletion.
         *
         * @route /change-password
         * @component ChangePassword - Enables password updates for authenticated users.
         *
         * @route /site-map
         * @component SiteMap - Displays a structured overview of all available routes.
         */}
        
        <Route path="/user" element={<ProtectedRoute element={<User />} />} />
        <Route path="/edit-user" element={<ProtectedRoute element={<EditUser />} />} />
        <Route path="/delete-user" element={<ProtectedRoute element={<DeleteUser />} />} />
        <Route path="/change-password" element={<ProtectedRoute element={<ChangePassword />} />} />
        {/**
         * Esta de aquí si es la ruta, ya que aquí tmb se maneja la lógica del id
         * <Route path="/conference/:roomId" element={<ProtectedRoute element={<Conference />} />} /> 
         * */}

        {/**
         * ❌ Fallback Route — catches undefined URLs.
         *
         * @route *
         * @component NotFound - Displays a 404 page for invalid routes.
         */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
