// js/sidebar.js
// Renderiza y gestiona el sidebar en todas las páginas

function initSidebar(activePage) {
  Auth.requireAuth();
  const user = Auth.getUser();
  if (!user) return;

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const isAdmin = user.rol === 'admin';
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
        <button class="btn-logout" id="logoutBtn" title="Cerrar sesión">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  document.getElementById('logoutBtn').addEventListener('click', () => Auth.logout());
}

function setTopbarDate() {
  const el = document.getElementById('topbarDate');
  if (el) {
    el.textContent = new Date().toLocaleDateString('es-ES', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  }
}
