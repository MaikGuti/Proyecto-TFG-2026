// js/productos.js
document.addEventListener('DOMContentLoaded', () => {
  initSidebar('busqueda');
  setTopbarDate();

  const searchInput    = document.getElementById('searchInput');
  const searchBtn      = document.getElementById('searchBtn');
  const acDrop         = document.getElementById('acDrop');
  const resultsSection = document.getElementById('resultsSection');
  const initialState   = document.getElementById('initialState');
  const prodList       = document.getElementById('prodList');
  const resultsLabel   = document.getElementById('resultsLabel');
  const clearBtn       = document.getElementById('clearBtn');

  // guardo el timeout del debounce aquí para poder cancelarlo en cada pulsación
  let debounce = null;

  // no lanzo el autocompletado hasta que el usuario lleve 2 caracteres escritos
  // y espero 260ms para no machacar el servidor con cada tecla
  searchInput.addEventListener('input', () => {
    clearTimeout(debounce);
    const q = searchInput.value.trim();
    if (q.length < 2) { acDrop.style.display = 'none'; return; }
    debounce = setTimeout(() => fetchAC(q), 260);
  });

  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { acDrop.style.display = 'none'; buscar(searchInput.value.trim()); }
  });

  searchBtn.addEventListener('click', () => { acDrop.style.display = 'none'; buscar(searchInput.value.trim()); });

  // cierro el dropdown si el usuario hace clic fuera del buscador
  document.addEventListener('click', e => {
    if (!e.target.closest('#acWrapper')) acDrop.style.display = 'none';
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    resultsSection.style.display = 'none';
    initialState.style.display = 'block';
  });

  async function fetchAC(q) {
    try {
      const res  = await fetch(`${API_URL}/productos/autocompletar?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${Auth.getToken()}` },
      });
      const data = await res.json();
      if (!data.success || !data.data.length) { acDrop.style.display = 'none'; return; }

      acDrop.innerHTML = data.data.map(p => `
        <div class="ac-item" onclick="selectAC('${p.referencia}')">
          <span class="ac-ref">${p.referencia}</span>
          <span class="ac-name">${p.nombre}</span>
        </div>`).join('');
      acDrop.style.display = 'block';
    } catch { acDrop.style.display = 'none'; }
  }

  // expongo selectAC en window porque lo llamo desde el onclick del HTML generado dinámicamente
  window.selectAC = (ref) => {
    searchInput.value = ref;
    acDrop.style.display = 'none';
    buscar(ref);
  };

  async function buscar(q) {
    if (!q || q.length < 2) return;

    initialState.style.display = 'none';
    resultsSection.style.display = 'block';
    resultsLabel.textContent = 'Buscando...';
    prodList.innerHTML = skeletons(3); // muestro skeletons mientras carga

    try {
      const res  = await fetch(`${API_URL}/productos/buscar?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${Auth.getToken()}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      const items = data.data;
      // console.log('resultados:', items); // debug

      if (!items.length) {
        resultsLabel.innerHTML = `Sin resultados para <strong>"${q}"</strong>`;
        prodList.innerHTML = `
          <div class="card">
            <div class="card-body">
              <div class="empty">
                <div class="empty-ico">📦</div>
                <h3>SIN RESULTADOS</h3>
                <p>Prueba con otra referencia o nombre del producto</p>
              </div>
            </div>
          </div>`;
        return;
      }

      resultsLabel.innerHTML = `<strong>${items.length}</strong> resultado${items.length !== 1 ? 's' : ''} para "${q}"`;

      prodList.innerHTML = items.map(p => renderCard(p)).join('');

      // añado el delay de animación por índice para que entren escalonados
      prodList.querySelectorAll('.prod-card').forEach((el, i) => {
        el.style.animationDelay = `${i * 0.04}s`;
        el.classList.add('fade-up');
      });

    } catch (err) {
      prodList.innerHTML = `
        <div class="card"><div class="card-body">
          <div class="empty"><div class="empty-ico">⚠️</div><h3>ERROR</h3><p>${err.message}</p></div>
        </div></div>`;
    }
  }

  function renderCard(p) {
    const stockBadge = p.stock > 0
      ? `<span class="badge badge-green">▲ ${p.stock}</span>`
      : `<span class="badge badge-red">SIN STOCK</span>`;

    return `
      <div class="prod-card" onclick="window.location.href='producto.html?ref=${encodeURIComponent(p.referencia)}'">
        <div class="prod-icon">💡</div>
        <div class="prod-info">
          <p class="prod-ref">${p.referencia}</p>
          <p class="prod-name">${p.nombre}</p>
        </div>
        <div class="prod-metas">
          <div class="prod-meta"><p class="prod-meta-label">Stock</p><div>${stockBadge}</div></div>
          <div class="prod-meta"><p class="prod-meta-label">Familia</p><p class="prod-meta-val">${p.familia || '—'}</p></div>
          <div class="prod-meta"><p class="prod-meta-label">Unidad</p><p class="prod-meta-val">${p.unidad || '—'}</p></div>
          <div class="prod-meta"><p class="prod-meta-label">PVP</p><p class="prod-meta-val">${p.pvp ? p.pvp.toFixed(2) + ' €' : '—'}</p></div>
        </div>
        <div class="prod-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18l6-6-6-6"/></svg></div>
      </div>`;
  }

  // genero N tarjetas skeleton para simular que hay contenido mientras carga
  function skeletons(n) {
    return Array.from({ length: n }, () => `
      <div class="prod-card" style="pointer-events:none">
        <div class="skel" style="width:40px;height:40px;border-radius:8px;flex-shrink:0"></div>
        <div style="flex:1;display:flex;flex-direction:column;gap:8px">
          <div class="skel" style="height:11px;width:80px"></div>
          <div class="skel" style="height:14px;width:200px"></div>
        </div>
        <div style="display:flex;gap:24px">
          <div class="skel" style="height:20px;width:65px;border-radius:4px"></div>
          <div class="skel" style="height:18px;width:45px"></div>
          <div class="skel" style="height:18px;width:55px"></div>
        </div>
      </div>`).join('');
  }
});
