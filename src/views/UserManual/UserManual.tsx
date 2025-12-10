import React from 'react';
import NavBar from '../../components/NavBar/NavBar';
import './UserManual.scss';

const UserManual: React.FC = () => {
  return (
    <div className="user-manual-page">
      <NavBar />
      <div className="manual-container">
        <h1>Manual de Usuario AgoraX</h1>

        {/* SECCIÓN 1: ACCESO Y REGISTRO */}
        <section className="manual-section">
          <h2>1. Acceso y Registro</h2>
          
          <div className="manual-content">
            {/* Landing Page */}
            <div className="manual-block">
              <h3>Página de Bienvenida (Landing)</h3>
              <div className="image-placeholder">
                <img src="/images/captura1.png" alt="Captura de la Landing Page" />
              </div>
              <ul className="legend-list">
                <li>
                  <span className="number-badge">1</span>
                  <span className="description">
                    <strong>Iniciar Sesión:</strong> Botón para acceder a tu cuenta si ya estás registrado.
                  </span>
                </li>
                <li>
                  <span className="number-badge">2</span>
                  <span className="description">
                    <strong>Registrarse:</strong> Botón para crear una nueva cuenta en la plataforma.
                  </span>
                </li>
                <li>
                  <span className="number-badge">3</span>
                  <span className="description">
                    <strong>Más información:</strong> Enlace al mapa del sitio y ayuda adicional.
                  </span>
                </li>
              </ul>
            </div>

            {/* Login / Register */}
            <div className="manual-block">
              <h3>Inicio de Sesión y Registro</h3>
              <div className="image-placeholder">
                <img src="/images/captura2.png" alt="Captura de Inicio de Sesión y Registro" />
              </div>
              <ul className="legend-list">
                <li>
                  <span className="number-badge">1</span>
                  <span className="description">
                    <strong>Formulario de Datos:</strong> Campos para ingresar tu correo electrónico y contraseña (o nombre y edad para registro).
                  </span>
                </li>
                <li>
                  <span className="number-badge">2</span>
                  <span className="description">
                    <strong>Botones de Acción:</strong> "Iniciar sesión" o "Crear cuenta" para enviar el formulario.
                  </span>
                </li>
                <li>
                  <span className="number-badge">3</span>
                  <span className="description">
                    <strong>Acceso con Redes Sociales:</strong> Botones para iniciar sesión rápidamente usando tu cuenta de Google o GitHub.
                  </span>
                </li>
                <li>
                  <span className="number-badge">4</span>
                  <span className="description">
                    <strong>Recuperar Contraseña:</strong> Enlace "¿Olvidaste tu contraseña?" para restablecer el acceso si lo has perdido.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECCIÓN 2: PANEL PRINCIPAL */}
        <section className="manual-section">
          <h2>2. Panel Principal (Home)</h2>
          
          <div className="manual-content">
            <div className="manual-block">
              <h3>Dashboard de Usuario</h3>
              <div className="image-placeholder">
                <img src="/images/captura3.png" alt="Captura del Dashboard de Usuario" />
              </div>
              <ul className="legend-list">
                <li>
                  <span className="number-badge">1</span>
                  <span className="description">
                    <strong>Iniciar Videoconferencia:</strong> Crea una nueva sala de reunión instantánea y te redirige a ella automáticamente.
                  </span>
                </li>
                <li>
                  <span className="number-badge">2</span>
                  <span className="description">
                    <strong>Unirse a Reunión:</strong> Campo de texto para ingresar el ID de una reunión existente.
                  </span>
                </li>
                <li>
                  <span className="number-badge">3</span>
                  <span className="description">
                    <strong>Botón Unirse:</strong> Al hacer clic, te conecta a la sala especificada en el campo de texto.
                  </span>
                </li>
                <li>
                  <span className="number-badge">4</span>
                  <span className="description">
                    <strong>Barra de Navegación:</strong> Acceso rápido a tu perfil, cierre de sesión y otras secciones.
                  </span>
                </li>
                <li>
                  <span className="number-badge">5</span>
                  <span className="description">
                    <strong>Pie de Página:</strong> Enlaces útiles como el Mapa del Sitio, Perfil y este Manual de Usuario.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECCIÓN 3: SALA DE CONFERENCIAS */}
        <section className="manual-section">
          <h2>3. Sala de Conferencias</h2>
          
          <div className="manual-content">
            <div className="manual-block">
              <h3>Interfaz de Videollamada</h3>
              <div className="image-placeholder">
                <img src="/images/captura4.png" alt="Captura de la Sala de Conferencias" />
              </div>
              <ul className="legend-list">
                <li>
                  <span className="number-badge">1</span>
                  <span className="description">
                    <strong>Video Principal:</strong> Muestra tu cámara local y las cámaras de los demás participantes en una cuadrícula.
                  </span>
                </li>
                <li>
                  <span className="number-badge">2</span>
                  <span className="description">
                    <strong>Información del Participante:</strong> Sobre cada video verás el nombre del usuario y un icono indicando si su micrófono está activo o silenciado.
                  </span>
                </li>
                <li>
                  <span className="number-badge">3</span>
                  <span className="description">
                    <strong>Chat Lateral:</strong> Panel para enviar mensajes de texto en tiempo real a todos los participantes.
                  </span>
                </li>
                <li>
                  <span className="number-badge">4</span>
                  <span className="description">
                    <strong>Controles de Medios:</strong> Botones para activar/desactivar tu micrófono y tu cámara.
                  </span>
                </li>
                <li>
                  <span className="number-badge">5</span>
                  <span className="description">
                    <strong>Botón de Chat:</strong> Muestra u oculta el panel de chat lateral.
                  </span>
                </li>
                <li>
                  <span className="number-badge">6</span>
                  <span className="description">
                    <strong>Salir:</strong> Botón rojo para desconectarse y abandonar la reunión.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECCIÓN 4: GESTIÓN DE PERFIL */}
        <section className="manual-section">
          <h2>4. Gestión de Perfil</h2>
          
          <div className="manual-content">
            <div className="manual-block">
              <h3>Perfil de Usuario</h3>
              <div className="image-placeholder">
                <img src="/images/captura5.png" alt="Captura del Perfil de Usuario" />
              </div>
              <ul className="legend-list">
                <li>
                  <span className="number-badge">1</span>
                  <span className="description">
                    <strong>Información Personal:</strong> Visualización de tu nombre, correo electrónico y edad registrados.
                  </span>
                </li>
                <li>
                  <span className="number-badge">2</span>
                  <span className="description">
                    <strong>Editar Perfil:</strong> Opción para modificar tus datos personales.
                  </span>
                </li>
                <li>
                  <span className="number-badge">3</span>
                  <span className="description">
                    <strong>Eliminar Cuenta:</strong> Opción avanzada para borrar permanentemente tu cuenta y datos.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default UserManual;
