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

// CONTEXT (nuevo)
import { SocketProvider } from './context/SocketContext'

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
import UserManual from './views/UserManual/UserManual'
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

    {/* -------------- ENVOLVEMOS TODA LA APP EN EL PROVIDER DE SOCKETS -------------- */}
    <SocketProvider>
      <BrowserRouter>
        {/* Scrolls to top when navigating to a new page */}
        <ScrollToTop />

        <Routes>
          {/* 🌐 Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/home" element={<Home />} />
          <Route path="/site-map" element={<SiteMap />} />
          <Route path="/manual-usuario" element={<UserManual />} />

          {/* Rutas de conferencia */}
          <Route path="/conference" element={<Conference />} />
          <Route path="/conference/:roomId" element={<ProtectedRoute element={<Conference />} />} />

          {/* 🔒 Protected Routes */}
          <Route path="/user" element={<ProtectedRoute element={<User />} />} />
          <Route path="/edit-user" element={<ProtectedRoute element={<EditUser />} />} />
          <Route path="/delete-user" element={<ProtectedRoute element={<DeleteUser />} />} />
          <Route path="/change-password" element={<ProtectedRoute element={<ChangePassword />} />} />

          {/* ❌ 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
    {/* --------------------------------------------------------------------------- */}

  </React.StrictMode>
)

