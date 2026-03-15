// js/sidebar.js
// lo incluyo en todas las páginas via <script src="../js/sidebar.js">
// recibe el nombre de la página activa para marcar el enlace correcto en el nav

function initSidebar(activePage) {
  Auth.requireAuth();
  const user = Auth.getUser();
  if (!user) return;

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const isAdmin  = user.rol === 'admin';
  // cojo las dos primeras letras del nombre para el avatar — no hay fotos de perfil
  const initials = user.nombre.substring(0, 2).toUpperCase();
  const rolLabel = isAdmin ? 'Administrador' : 'Operativo';

  sidebar.innerHTML = `
    <div class="sidebar-head">
      <div class="sb-brand-mark">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      </div>
      <span class="sb-brand-name">TECSOLED</span>
      <span class="sb-version">v1.0</span>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-group">
        <p class="nav-group-label">Operativa</p>
        <a href="/pages/busqueda.html" class="nav-link ${activePage === 'busqueda' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          Búsqueda de productos
        </a>
      </div>

      ${isAdmin ? `
      <div class="nav-group">
        <p class="nav-group-label">Administración</p>
        <a href="/pages/dashboard.html" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          Dashboard facturación
        </a>
      </div>
      ` : ''}
    </nav>

    <div class="sidebar-foot">
      <div class="user-row">
        <div class="user-av">${initials}</div>
        <div class="user-inf">
          <p class="user-name">${user.nombre}</p>
          <p class="user-role">${rolLabel}</p>
        </div>
        <button class="btn-theme-toggle" id="themeToggleBtn" title="Alternar tema">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" id="themeIcon">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
        <button class="btn-change-pwd" id="changePwdBtn" title="Cambiar contraseña">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </button>
        <button class="btn-logout" id="logoutBtn" title="Cerrar sesión">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  document.getElementById('logoutBtn').addEventListener('click', () => Auth.logout());
  document.getElementById('changePwdBtn').addEventListener('click', () => Auth.openChangePwdModal());

  // toggle de tema claro/oscuro — guardo la preferencia en localStorage
  // para que se recuerde entre recargas (el script anti-FOUC en <head> lo lee al arrancar)
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    const icon = document.getElementById('themeIcon');
    const SUN  = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
    const MOON = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';

    const updateIcon = () => {
      icon.innerHTML = document.documentElement.getAttribute('data-theme') === 'dark' ? SUN : MOON;
    };

    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('tsl_theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('tsl_theme', 'dark');
      }
      updateIcon();
    });

    updateIcon();
  }
}

function setTopbarDate() {
  const el = document.getElementById('topbarDate');
  if (el) {
    el.textContent = new Date().toLocaleDateString('es-ES', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  }
}
