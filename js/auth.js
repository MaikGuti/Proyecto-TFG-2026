// js/auth.js
const API_URL = 'http://localhost:3000/api';

const Auth = {
  setToken:  (t) => sessionStorage.setItem('tsl_token', t),
  getToken:  ()  => sessionStorage.getItem('tsl_token'),
  setUser:   (u) => sessionStorage.setItem('tsl_user', JSON.stringify(u)),
  getUser:   ()  => { const u = sessionStorage.getItem('tsl_user'); return u ? JSON.parse(u) : null; },
  isLogged:  ()  => !!sessionStorage.getItem('tsl_token'),
  clear:     ()  => { sessionStorage.removeItem('tsl_token'); sessionStorage.removeItem('tsl_user'); },
  logout:    ()  => { Auth.clear(); window.location.href = '/login.html'; },
  requireAuth: () => { if (!Auth.isLogged()) window.location.href = '/login.html'; },
  redirectIfLogged: () => { if (Auth.isLogged()) window.location.href = '/pages/busqueda.html'; },
};

// ── Formulario de login ──────────────────────────────────────
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

  [emailEl, pwdEl].forEach(el => el.addEventListener('input', () => {
    el.classList.remove('is-error');
    alert.classList.remove('show');
  }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailEl.value.trim();
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
    submitBtn.disabled = on;
    btnText.style.display     = on ? 'none' : '';
    btnSpinner.style.display  = on ? 'block' : 'none';
  }
}

if (typeof window !== 'undefined') { window.Auth = Auth; window.API_URL = API_URL; }
