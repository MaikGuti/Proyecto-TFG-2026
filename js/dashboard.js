// js/dashboard.js
// solo accesible para admin — si el rol no es correcto redirige a búsqueda
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

  // cargo primero los KPIs y después la gráfica y comparativa
  // no uso Promise.all aquí para que los KPIs aparezcan antes visualmente
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
        <div class="kpi-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg></div>
        <p class="kpi-label">Total facturado</p>
        <p class="kpi-val">${fmt(d.totalFacturado)}</p>
        <p class="kpi-sub">${d.desde} – ${d.hasta}</p>
      </div>
      <div class="kpi fade-up">
        <div class="kpi-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg></div>
        <p class="kpi-label">Facturas emitidas</p>
        <p class="kpi-val">${d.numFacturas}</p>
        <p class="kpi-sub">documentos</p>
      </div>
      <div class="kpi fade-up">
        <div class="kpi-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div>
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
  // Chart viene del CDN de Chart.js — el IDE lo marca como desconocido pero funciona
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

// genera el HTML de un bloque de comparativa (mes o año)
// el ancho de la barra lo calculo como proporción actual/total para visualizar la diferencia
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
        <span class="comp-pct ${up ? 'up' : 'down'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12">
            ${up ? '<polyline points="18 15 12 9 6 15"/>' : '<polyline points="6 9 12 15 18 9"/>'}
          </svg>
          ${pct}%
        </span>
      </div>
    </div>`;
}


const fmt      = n => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
const fmtShort = n => n >= 1000 ? `${(n/1000).toFixed(0)}k` : n;
