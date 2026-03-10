// js/producto-detalle.js
document.addEventListener('DOMContentLoaded', async () => {
  initSidebar('busqueda');

  const ref = new URLSearchParams(window.location.search).get('ref');
  if (!ref) { window.location.href = 'busqueda.html'; return; }

  document.getElementById('topbarRef').textContent = ref;

  const page = document.getElementById('pageContent');

  try {
    const token = Auth.getToken();
    const headers = { Authorization: `Bearer ${token}` };

    const [rP, rD] = await Promise.all([
      fetch(`${API_URL}/productos/${encodeURIComponent(ref)}`, { headers }),
      fetch(`${API_URL}/productos/${encodeURIComponent(ref)}/despiece`, { headers }),
    ]);

    const dP = await rP.json();
    const dD = await rD.json();

    if (!dP.success || !dP.data) throw new Error('Producto no encontrado');

    const p = dP.data;
    const despiece = dD.success ? dD.data : [];

    document.title = `TECSOLED · ${p.referencia}`;
    document.getElementById('topbarRef').textContent = p.referencia;

    const stockBadge = p.stock > 0
      ? `<span class="badge badge-green">▲ EN STOCK</span>`
      : `<span class="badge badge-red">SIN STOCK</span>`;

    page.innerHTML = `
      <!-- Cabecera oscura -->
      <div class="detail-header fade-up">
        <div class="detail-header-inner">
          <div class="back-link" onclick="history.back()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M15 18l-6-6 6-6"/></svg>
            Volver a resultados
          </div>
          <div class="detail-ref-tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            ${p.referencia}
          </div>
          <h1 class="detail-name">${p.nombre}</h1>
          <p class="detail-desc">${p.descripcion || 'Sin descripción disponible.'}</p>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row fade-up">
        <div class="stat-box primary">
          <div class="stat-box-line"></div>
          <p class="stat-box-label">Stock disponible</p>
          <p class="stat-box-val">${p.stock}</p>
          <p class="stat-box-sub">${p.unidad || 'ud'}</p>
        </div>
        <div class="stat-box">
          <div class="stat-box-line"></div>
          <p class="stat-box-label">Precio PVP</p>
          <p class="stat-box-val">${p.pvp ? p.pvp.toFixed(2) : '—'}</p>
          <p class="stat-box-sub">€ por ${p.unidad || 'ud'}</p>
        </div>
        <div class="stat-box">
          <div class="stat-box-line"></div>
          <p class="stat-box-label">Familia</p>
          <p class="stat-box-val" style="font-size:20px">${p.familia || '—'}</p>
          <p class="stat-box-sub">categoría</p>
        </div>
      </div>

      <!-- Grid principal -->
      <div class="detail-grid">
        <div>
          <!-- Despiece -->
          <div class="card fade-up">
            <div class="card-head">
              <p class="card-title">Despiece / Componentes</p>
              <div style="display:flex;align-items:center;gap:10px">
                <span class="badge badge-gray">${despiece.length} componente${despiece.length !== 1 ? 's' : ''}</span>
                ${despiece.length > 0 ? `
                <button class="btn-ver-ub" id="btnTodasUb" onclick="toggleTodasUbicaciones(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Ver todas las ubicaciones
                </button>` : `
                <button class="btn-ver-ub"
                  data-ref="${p.referencia}"
                  data-loaded="false"
                  data-open="false"
                  onclick="toggleUbicacionesProd(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Ver ubicaciones
                </button>`}
              </div>
            </div>
            ${despiece.length > 0 ? `
              <div style="overflow-x:auto">
                <table class="despiece-table">
                  <thead>
                    <tr>
                      <th>Referencia</th>
                      <th>Componente</th>
                      <th style="text-align:right">Cantidad</th>
                      <th style="text-align:right">Stock disp.</th>
                      <th style="text-align:right">Ubicaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${despiece.map(c => {
                      const stockOk = c.stockDisponible !== null && c.stockDisponible >= c.cantidad;
                      const stockBadge = c.stockDisponible === null
                        ? `<span style="color:var(--gray-400)">—</span>`
                        : stockOk
                          ? `<span class="badge badge-green">${c.stockDisponible}</span>`
                          : `<span class="badge badge-red">${c.stockDisponible}</span>`;

                      return `
                      <tr>
                        <td><span class="dp-ref">${c.referencia}</span></td>
                        <td>${c.componente}</td>
                        <td style="text-align:right"><strong>${c.cantidad}</strong> ${c.unidad || 'ud'}</td>
                        <td style="text-align:right">${stockBadge}</td>
                        <td style="text-align:right">
                          <button class="btn-ver-ub"
                            data-ref="${c.referencia}"
                            data-loaded="false"
                            data-open="false"
                            onclick="toggleUbicaciones(this)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            Ver ubicaciones
                          </button>
                        </td>
                      </tr>
                      <tr class="dp-loc-group" id="ub-${c.referencia}" style="display:none">
                        <td colspan="6" style="padding:0">
                          <div class="dp-loc-inner" id="ub-content-${c.referencia}">
                            <div class="dp-loc-loading">Cargando...</div>
                          </div>
                        </td>
                      </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div class="card-body" style="padding:0">
                <div class="empty" style="padding:24px 28px 20px">
                  <div class="empty-ico empty-ico-svg">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>
                  </div>
                  <h3>SIN DESPIECE</h3>
                  <p>Este producto no tiene componentes registrados</p>
                </div>
                <div id="ub-prod-${p.referencia}" style="display:none">
                  <div class="dp-loc-inner" id="ub-prod-content-${p.referencia}">
                    <div class="dp-loc-loading">Cargando...</div>
                  </div>
                </div>
              </div>
            `}
          </div>
        </div>

        <!-- Panel info lateral -->
        <div class="info-panel">
          <div class="card fade-up">
            <div class="card-head">
              <p class="card-title">Ficha técnica</p>
              ${stockBadge}
            </div>
            <div class="card-body">
              <div class="info-row"><span class="info-row-label">Referencia</span><span class="info-row-val" style="color:var(--red);font-family:var(--font-display);letter-spacing:0.06em">${p.referencia}</span></div>
              <div class="info-row"><span class="info-row-label">Familia</span><span class="info-row-val">${p.familia || '—'}</span></div>
              <div class="info-row"><span class="info-row-label">Unidad de venta</span><span class="info-row-val">${p.unidad || '—'}</span></div>
              <div class="info-row"><span class="info-row-label">Stock disponible</span><span class="info-row-val">${p.stock} ${p.unidad || 'ud'}</span></div>
              <div class="info-row"><span class="info-row-label">Stock mínimo</span><span class="info-row-val">${p.stockMinimo != null ? p.stockMinimo : '—'}</span></div>
              <div class="info-row"><span class="info-row-label">Pend. recibir</span><span class="info-row-val">${p.pendienteRecibir}</span></div>
              <div class="info-row"><span class="info-row-label">Reservado</span><span class="info-row-val">${p.reservada}</span></div>
              <div class="info-row"><span class="info-row-label">PVP</span><span class="info-row-val" style="font-family:var(--font-display);font-size:20px;letter-spacing:0.04em">${p.pvp ? p.pvp.toFixed(2) + ' €' : '—'}</span></div>
            </div>
          </div>
        </div>
      </div>
    `;

  } catch (err) {
    page.innerHTML = `
      <div class="card" style="max-width:460px;margin:0 auto">
        <div class="card-body">
          <div class="empty">
            <div class="empty-ico empty-ico-svg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3>NO ENCONTRADO</h3>
            <p>${err.message}</p>
            <button class="btn-primary" style="margin-top:20px;width:auto;padding:0 24px" onclick="history.back()">VOLVER</button>
          </div>
        </div>
      </div>`;
  }
});

// ── Ver/ocultar todas las ubicaciones a la vez ─────────────────
async function toggleTodasUbicaciones(btnTodas) {
  const botones = document.querySelectorAll('.btn-ver-ub[data-ref]');
  const hayAlgunaAbierta = [...botones].some(b => b.dataset.open === 'true');

  // Si hay alguna abierta → cerrar todas; si no → abrir todas
  const abrir = !hayAlgunaAbierta;

  await Promise.all([...botones].map(btn => {
    const estaAbierto = btn.dataset.open === 'true';
    if (abrir && !estaAbierto) return toggleUbicaciones(btn);
    if (!abrir && estaAbierto)  return toggleUbicaciones(btn);
  }));

  btnTodas.innerHTML = abrir
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12"><polyline points="18 15 12 9 6 15"/></svg> Ocultar todas`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Ver todas las ubicaciones`;
}

// ── Toggle ubicaciones por componente ──────────────────────────
async function toggleUbicaciones(btn) {
  const ref     = btn.dataset.ref;
  const loaded  = btn.dataset.loaded === 'true';
  const isOpen  = btn.dataset.open   === 'true';
  const row     = document.getElementById(`ub-${ref}`);
  const content = document.getElementById(`ub-content-${ref}`);

  // Ocultar si ya está abierto
  if (isOpen) {
    row.style.display = 'none';
    btn.dataset.open  = 'false';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
      Ver ubicaciones`;
    return;
  }

  // Mostrar fila contenedora
  row.style.display = '';
  btn.dataset.open  = 'true';
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12"><polyline points="18 15 12 9 6 15"/></svg>
    Ocultar`;

  // Si ya se cargó, no volver a pedir
  if (loaded) return;

  btn.dataset.loaded = 'true';

  try {
    const res  = await fetch(`${API_URL}/productos/${encodeURIComponent(ref)}/ubicaciones`, {
      headers: { Authorization: `Bearer ${Auth.getToken()}` },
    });
    const data = await res.json();
    const ubicaciones = data.success ? data.data : [];

    if (!ubicaciones.length) {
      content.innerHTML = `
        <div class="dp-loc-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Sin ubicaciones con stock registradas
        </div>`;
      return;
    }

    content.innerHTML = `
      <table class="dp-loc-table">
        <thead>
          <tr>
            <th>Almacén</th>
            <th>Subalmacén</th>
            <th>Ubicación</th>
            <th style="text-align:right">Stock físico</th>
          </tr>
        </thead>
        <tbody>
          ${ubicaciones.map(u => `
          <tr>
            <td>${u.almacen || '—'}</td>
            <td>${u.subalmacen || '—'}</td>
            <td><span class="dp-loc-tag">${u.ubicacion || '—'}</span></td>
            <td style="text-align:right"><strong>${u.stock.toLocaleString('es-ES')}</strong> ud</td>
          </tr>`).join('')}
        </tbody>
      </table>`;

  } catch {
    content.innerHTML = `<div class="dp-loc-empty">Error al cargar ubicaciones</div>`;
  }
}

// ── Ubicaciones para producto SIN despiece (div, no table row) ──
async function toggleUbicacionesProd(btn) {
  const ref       = btn.dataset.ref;
  const loaded    = btn.dataset.loaded === 'true';
  const isOpen    = btn.dataset.open   === 'true';
  const container = document.getElementById(`ub-prod-${ref}`);
  const content   = document.getElementById(`ub-prod-content-${ref}`);

  if (isOpen) {
    container.style.display = 'none';
    btn.dataset.open = 'false';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
      Ver ubicaciones`;
    return;
  }

  container.style.display = '';
  btn.dataset.open = 'true';
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12"><polyline points="18 15 12 9 6 15"/></svg>
    Ocultar`;

  if (loaded) return;
  btn.dataset.loaded = 'true';

  try {
    const res  = await fetch(`${API_URL}/productos/${encodeURIComponent(ref)}/ubicaciones`, {
      headers: { Authorization: `Bearer ${Auth.getToken()}` },
    });
    const data = await res.json();
    const ubicaciones = data.success ? data.data : [];

    if (!ubicaciones.length) {
      content.innerHTML = `
        <div class="dp-loc-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Sin ubicaciones con stock registradas
        </div>`;
      return;
    }

    content.innerHTML = `
      <table class="dp-loc-table">
        <thead>
          <tr>
            <th>Almacén</th>
            <th>Subalmacén</th>
            <th>Ubicación</th>
            <th style="text-align:right">Stock físico</th>
          </tr>
        </thead>
        <tbody>
          ${ubicaciones.map(u => `
          <tr>
            <td>${u.almacen || '—'}</td>
            <td>${u.subalmacen || '—'}</td>
            <td><span class="dp-loc-tag">${u.ubicacion || '—'}</span></td>
            <td style="text-align:right"><strong>${u.stock.toLocaleString('es-ES')}</strong> ud</td>
          </tr>`).join('')}
        </tbody>
      </table>`;

  } catch {
    content.innerHTML = `<div class="dp-loc-empty">Error al cargar ubicaciones</div>`;
  }
}
