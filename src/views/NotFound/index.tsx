/**
 * @file NotFound.tsx
 * @description Displays a simple 404 "Not Found" page when the requested resource or route does not exist.
 * @module NotFound
 */

import "./NotFound.scss";

/**
 * Renders a 404 error page component.
 *
 * This component is typically displayed when the user navigates to a route
 * that does not exist within the application.
 *
 * @function NotFound
 * @returns {JSX.Element} A JSX element displaying a 404 "Not Found" message.
 */
export function NotFound(): JSX.Element {
  return (
    <div className="NotFound">
      <h1>404</h1>
      <h2>Not Found</h2>
      <p>¡El recurso solicitado no se pudo encontrar en este servidor!</p>
    </div>
  );
}
