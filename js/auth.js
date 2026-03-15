// js/auth.js
// lo incluyo en todas las páginas — gestiona el token JWT en sessionStorage
// uso sessionStorage en vez de localStorage para que la sesión no persista si cierran el navegador

const API_URL = 'http://localhost:3000/api';

const Auth = {
  setToken: (t) => sessionStorage.setItem('tsl_token', t),
  getToken: () => sessionStorage.getItem('tsl_token'),
  setUser: (u) => sessionStorage.setItem('tsl_user', JSON.stringify(u)),
  getUser: () => {
    const u = sessionStorage.getItem('tsl_user');
    return u ? JSON.parse(u) : null;
  },
  isLogged: () => !!sessionStorage.getItem('tsl_token'),
  clear: () => {
    sessionStorage.removeItem('tsl_token');
    sessionStorage.removeItem('tsl_user');
  },
  logout: () => { Auth.clear(); window.location.href = '/login.html'; },
  requireAuth: () => { if (!Auth.isLogged()) window.location.href = '/login.html'; },
  redirectIfLogged: () => { if (Auth.isLogged()) window.location.href = '/pages/busqueda.html'; },
};

// el formulario de login solo existe en login.html
// en el resto de páginas este bloque no hace nada
const form = document.getElementById('loginForm');
if (form) {
  Auth.redirectIfLogged();

  const emailEl    = document.getElementById('email');
  const pwdEl      = document.getElementById('password');
  const togglePwd  = document.getElementById('togglePwd');
  const submitBtn  = document.getElementById('submitBtn');
  const btnText    = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');
  const alert      = document.getElementById('loginAlert');
  const alertMsg   = document.getElementById('loginAlertMsg');

  togglePwd.addEventListener('click', () => {
    const show = pwdEl.type === 'password';
    pwdEl.type = show ? 'text' : 'password';
  });

  // quito el error del campo en cuanto el usuario empieza a escribir de nuevo
  [emailEl, pwdEl].forEach(el => el.addEventListener('input', () => {
    el.classList.remove('is-error');
    alert.classList.remove('show');
  }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = emailEl.value.trim();
    const password = pwdEl.value;
    let ok = true;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('emailError').textContent = 'Introduce un email válido';
      emailEl.classList.add('is-error'); ok = false;
    } else { document.getElementById('emailError').textContent = ''; }

    if (!password || password.length < 6) {
      document.getElementById('passwordError').textContent = 'Mínimo 6 caracteres';
      pwdEl.classList.add('is-error'); ok = false;
    } else { document.getElementById('passwordError').textContent = ''; }

    if (!ok) return;

    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Credenciales incorrectas');

      Auth.setToken(data.data.token);
      Auth.setUser(data.data.usuario);

      // admin va al dashboard, el resto a búsqueda
      window.location.href = data.data.usuario.rol === 'admin'
        ? '/pages/dashboard.html'
        : '/pages/busqueda.html';

    } catch (err) {
      alertMsg.textContent = err.message;
      alert.classList.add('show');
      emailEl.classList.add('is-error');
      pwdEl.classList.add('is-error');
    } finally { setLoading(false); }
  });

  function setLoading(on) {
    submitBtn.disabled        = on;
    btnText.style.display     = on ? 'none'  : '';
    btnSpinner.style.display  = on ? 'block' : 'none';
  }
}

if (typeof window !== 'undefined') { window.Auth = Auth; window.API_URL = API_URL; }

// modal para cambiar la contraseña — lo abro desde el sidebar
// lo genero con JS para no tener que meterlo en cada HTML a mano
Auth.openChangePwdModal = () => {
  const prev = document.getElementById('changePwdModal');
  if (prev) prev.remove();

  const modal = document.createElement('div');
  modal.id = 'changePwdModal';
  modal.className = 'cpwd-overlay';
  modal.innerHTML = `
    <div class="cpwd-modal" role="dialog" aria-modal="true" aria-labelledby="cpwdTitle">
      <div class="cpwd-header">
        <h2 class="cpwd-title" id="cpwdTitle">Cambiar contraseña</h2>
        <button class="cpwd-close" id="cpwdClose" aria-label="Cerrar">&times;</button>
      </div>
      <form id="cpwdForm" class="cpwd-form" novalidate>
        <div class="cpwd-field">
          <label for="cpwdActual">Contraseña actual</label>
          <input type="password" id="cpwdActual" placeholder="Tu contraseña actual" autocomplete="current-password"/>
          <span class="cpwd-err" id="cpwdActualErr"></span>
        </div>
        <div class="cpwd-field">
          <label for="cpwdNueva">Nueva contraseña</label>
          <input type="password" id="cpwdNueva" placeholder="Mínimo 6 caracteres" autocomplete="new-password"/>
          <span class="cpwd-err" id="cpwdNuevaErr"></span>
        </div>
        <div class="cpwd-field">
          <label for="cpwdConfirm">Confirmar nueva contraseña</label>
          <input type="password" id="cpwdConfirm" placeholder="Repite la nueva contraseña" autocomplete="new-password"/>
          <span class="cpwd-err" id="cpwdConfirmErr"></span>
        </div>
        <div class="cpwd-feedback" id="cpwdFeedback"></div>
        <div class="cpwd-actions">
          <button type="button" class="cpwd-btn-cancel" id="cpwdCancel">Cancelar</button>
          <button type="submit" class="cpwd-btn-submit" id="cpwdSubmit">Guardar contraseña</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => modal.remove();
  document.getElementById('cpwdClose').addEventListener('click', close);
  document.getElementById('cpwdCancel').addEventListener('click', close);
  // cierro el modal también si hacen clic fuera del recuadro
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  document.getElementById('cpwdForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const actual   = document.getElementById('cpwdActual').value;
    const nueva    = document.getElementById('cpwdNueva').value;
    const confirm  = document.getElementById('cpwdConfirm').value;
    const feedback = document.getElementById('cpwdFeedback');
    const btn      = document.getElementById('cpwdSubmit');

    ['cpwdActualErr', 'cpwdNuevaErr', 'cpwdConfirmErr'].forEach(id => {
      document.getElementById(id).textContent = '';
    });
    feedback.textContent = '';
    feedback.className = 'cpwd-feedback';

    let valid = true;
    if (!actual) {
      document.getElementById('cpwdActualErr').textContent = 'Introduce tu contraseña actual';
      valid = false;
    }
    if (!nueva || nueva.length < 6) {
      document.getElementById('cpwdNuevaErr').textContent = 'Mínimo 6 caracteres';
      valid = false;
    }
    if (nueva !== confirm) {
      document.getElementById('cpwdConfirmErr').textContent = 'Las contraseñas no coinciden';
      valid = false;
    }
    if (!valid) return;

    btn.disabled = true;
    btn.textContent = 'Guardando…';

    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Auth.getToken()}`,
        },
        body: JSON.stringify({ passwordActual: actual, passwordNueva: nueva }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || 'Error al cambiar la contraseña');

      feedback.textContent = '✔ Contraseña actualizada correctamente';
      feedback.classList.add('cpwd-feedback--ok');
      setTimeout(close, 1800);

    } catch (err) {
      feedback.textContent = err.message;
      feedback.classList.add('cpwd-feedback--err');
      btn.disabled = false;
      btn.textContent = 'Guardar contraseña';
    }
  });
};
