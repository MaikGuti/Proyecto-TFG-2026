// js/dashboard.js
let chart = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = Auth.getUser();
  if (!user || user.rol !== 'admin') { window.location.href = 'busqueda.html'; return; }

  initSidebar('dashboard');
  setTopbarDate();

  document.querySelectorAll('.period-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadKPIs(tab.dataset.p);
    });
  });

  await loadKPIs('mes');
  await loadChart();
  await loadComp();
});

async function loadKPIs(periodo) {
  const grid = document.getElementById('kpiGrid');
  try {
    const res  = await fetch(`${API_URL}/facturacion/dashboard?periodo=${periodo}`, {
      headers: { Authorization: `Bearer ${Auth.getToken()}` },
    });
    const data = await res.json();
    if (!data.success) throw new Error();
    const d = data.data;

    grid.innerHTML = `
      <div class="kpi kpi-accent fade-up">
        <div class="kpi-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div>
        <p class="kpi-label">Total facturado</p>
        <p class="kpi-val">${fmt(d.totalFacturado)}</p>
        <p class="kpi-sub">${d.desde} – ${d.hasta}</p>
      </div>
      <div class="kpi fade-up">
        <div class="kpi-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>
        <p class="kpi-label">Facturas emitidas</p>
        <p class="kpi-val">${d.numFacturas}</p>
        <p class="kpi-sub">documentos</p>
      </div>
      <div class="kpi fade-up">
        <div class="kpi-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg></div>
        <p class="kpi-label">Ticket medio</p>
        <p class="kpi-val">${fmt(d.ticketMedio)}</p>
        <p class="kpi-sub">por factura</p>
      </div>
    `;
  } catch {
    grid.innerHTML = `<div class="kpi" style="grid-column:1/-1"><p style="color:var(--gray-400);font-size:13px;padding:20px">Error al cargar métricas</p></div>`;
  }
}

async function loadChart() {
  const anio = new Date().getFullYear();
  document.getElementById('chartYearBadge').textContent = anio;

  try {
    const res  = await fetch(`${API_URL}/facturacion/evolucion?anio=${anio}`, {
      headers: { Authorization: `Bearer ${Auth.getToken()}` },
    });
    const data = await res.json();
    if (!data.success) throw new Error();

    const meses   = data.data.map(m => m.nombreMes);
    const totales = data.data.map(m => m.total);
    const max     = Math.max(...totales);

    const ctx = document.getElementById('evChart').getContext('2d');
    if (chart) chart.destroy();

    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: meses,
        datasets: [{
          data: totales,
          backgroundColor: totales.map(v => v === max ? '#CC1719' : 'rgba(204,23,25,0.15)'),
          borderRadius: 5,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111318',
            titleColor: '#CC1719',
            titleFont: { family: 'Outfit', weight: '700', size: 11 },
            bodyColor: '#fff',
            bodyFont: { family: 'Outfit', size: 13 },
            borderColor: '#2E3340',
            borderWidth: 1,
            padding: 12,
            callbacks: { label: ctx => ` ${fmt(ctx.parsed.y)}` },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#9CA3AF', font: { family: 'Outfit', size: 11, weight: '500' } },
            border: { display: false },
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
            ticks: { color: '#9CA3AF', font: { family: 'Outfit', size: 11 }, callback: v => fmtShort(v) },
            border: { display: false },
          },
        },
      },
    });
  } catch {
    document.getElementById('evChart').parentElement.innerHTML =
      '<p style="text-align:center;color:var(--gray-400);padding:40px;font-size:13px">Error al cargar gráfica</p>';
  }
}

async function loadComp() {
  const el = document.getElementById('compContent');
  try {
    const res  = await fetch(`${API_URL}/facturacion/comparativa`, {
      headers: { Authorization: `Bearer ${Auth.getToken()}` },
    });
    const data = await res.json();
    if (!data.success) throw new Error();
    const { mes, anio } = data.data;

    el.innerHTML = `
      ${compBlock('Este mes vs anterior', mes)}
      ${compBlock('Este año vs anterior', anio)}
    `;

    // Animar barras
    setTimeout(() => {
      document.querySelectorAll('.comp-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.w;
      });
    }, 100);

  } catch {
    el.innerHTML = '<p style="color:var(--gray-400);font-size:13px">Error al cargar comparativa</p>';
  }
}

function compBlock(titulo, d) {
  const up  = d.tendencia === 'subida';
  const pct = Math.abs(d.variacionPorcentaje).toFixed(1);
  const w   = Math.min(100, (d.actual.total / (d.actual.total + d.anterior.total)) * 100);

  return `
    <div class="comp-block">
      <p class="comp-title">${titulo}</p>
      <div class="comp-vals">
        <span class="comp-val-main">${fmt(d.actual.total)}</span>
        <span class="comp-val-prev">${fmt(d.anterior.total)}</span>
      </div>
      <div class="comp-bar">
        <div class="comp-bar-fill" style="width:0%" data-w="${w}%"></div>
      </div>
      <div class="comp-change">
        <span class="comp-pct ${up ? 'up' : 'down'}">${up ? '↑' : '↓'} ${pct}%</span>
      </div>
    </div>`;
}

const fmt      = n => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
const fmtShort = n => n >= 1000 ? `${(n/1000).toFixed(0)}k` : n;
