// js/producto-detalle.js
document.addEventListener('DOMContentLoaded', async () => {
  initSidebar('busqueda');

  const ref = new URLSearchParams(window.location.search).get('ref');
  if (!ref) { window.location.href = 'busqueda.html'; return; }

  document.getElementById('topbarRef').textContent = ref;

  const page = document.getElementById('pageContent');

  try {
    const token = Auth.getToken();
    const [rP, rD] = await Promise.all([
      fetch(`${API_URL}/productos/${encodeURIComponent(ref)}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/productos/${encodeURIComponent(ref)}/despiece`, { headers: { Authorization: `Bearer ${token}` } }),
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
          <p class="stat-box-sub">unidades</p>
        </div>
        <div class="stat-box">
          <div class="stat-box-line"></div>
          <p class="stat-box-label">Precio PVP</p>
          <p class="stat-box-val">${p.pvp ? p.pvp.toFixed(2) : '—'}</p>
          <p class="stat-box-sub">€ por unidad</p>
        </div>
        <div class="stat-box">
          <div class="stat-box-line"></div>
          <p class="stat-box-label">Ubicación</p>
          <p class="stat-box-val" style="font-size:26px">${p.ubicacion || '—'}</p>
          <p class="stat-box-sub">en almacén</p>
        </div>
      </div>

      <!-- Grid principal -->
      <div class="detail-grid">
        <div>
          <!-- Despiece -->
          <div class="card fade-up">
            <div class="card-head">
              <p class="card-title">Despiece / Componentes</p>
              <span class="badge badge-gray">${despiece.length} componente${despiece.length !== 1 ? 's' : ''}</span>
            </div>
            ${despiece.length > 0 ? `
              <div style="overflow-x:auto">
                <table class="despiece-table">
                  <thead>
                    <tr>
                      <th>Referencia</th>
                      <th>Componente</th>
                      <th>Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${despiece.map(c => `
                      <tr>
                        <td><span class="dp-ref">${c.referencia}</span></td>
                        <td>${c.componente}</td>
                        <td><strong>${c.cantidad}</strong> ud</td>
                      </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div class="card-body">
                <div class="empty" style="padding:28px">
                  <div class="empty-ico">🔩</div>
                  <h3>SIN DESPIECE</h3>
                  <p>Este producto no tiene componentes registrados</p>
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
              <div class="info-row"><span class="info-row-label">Unidad de venta</span><span class="info-row-val">${p.unidad || 'ud'}</span></div>
              <div class="info-row"><span class="info-row-label">Stock</span><span class="info-row-val">${p.stock} ${p.unidad || 'ud'}</span></div>
              <div class="info-row"><span class="info-row-label">Ubicación almacén</span><span class="info-row-val">${p.ubicacion || '—'}</span></div>
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
            <div class="empty-ico">⚠️</div>
            <h3>NO ENCONTRADO</h3>
            <p>${err.message}</p>
            <button class="btn-primary" style="margin-top:20px;width:auto;padding:0 24px" onclick="history.back()">VOLVER</button>
          </div>
        </div>
      </div>`;
  }
});
