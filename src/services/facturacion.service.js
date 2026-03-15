// src/services/facturacion.service.js

const { getPool, isMockMode, sql } = require('../config/database');
const { DASHBOARD_MOCK, EVOLUCION_MOCK, COMPARATIVA_MOCK } = require('../config/mock-data');

// abreviaturas de meses en español — las uso para la gráfica de evolución
const NOMBRES_MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// devuelve el rango de fechas según el período seleccionado
// el switch del trimestre me costó un rato entenderlo: Math.floor(mes / 3) da el índice del trimestre (0,1,2,3)
const getPeriodoFechas = (periodo) => {
  const hoy  = new Date();
  const anio = hoy.getFullYear();
  const mes  = hoy.getMonth();

  switch (periodo) {
    case 'mes':
      return { desde: new Date(anio, mes, 1), hasta: new Date(anio, mes + 1, 0) };
    case 'trimestre': {
      const trim = Math.floor(mes / 3);
      return { desde: new Date(anio, trim * 3, 1), hasta: new Date(anio, trim * 3 + 3, 0) };
    }
    case 'anio':
      return { desde: new Date(anio, 0, 1), hasta: new Date(anio, 11, 31) };
    default:
      return getPeriodoFechas('mes');
  }
};

const getDashboard = async (periodo) => {
  if (isMockMode()) return DASHBOARD_MOCK[periodo] || DASHBOARD_MOCK.mes;

  const { desde, hasta } = getPeriodoFechas(periodo);
  const pool = getPool();

  // paso las fechas como string porque SQL Server a veces tiene problemas
  // con el tipo Date directamente dependiendo de la configuración regional del servidor
  const desdeStr = `${desde.getFullYear()}-${String(desde.getMonth() + 1).padStart(2, '0')}-${String(desde.getDate()).padStart(2, '0')}`;
  const hastaStr = `${hasta.getFullYear()}-${String(hasta.getMonth() + 1).padStart(2, '0')}-${String(hasta.getDate()).padStart(2, '0')}`;

  const result = await pool.request()
    .input('desde', sql.VarChar(10), desdeStr)
    .input('hasta', sql.VarChar(10), hastaStr)
    .query(`
      SELECT
        COUNT(*)          AS numFacturas,
        COALESCE(SUM(total_amount), 0) AS totalFacturado,
        COALESCE(AVG(total_amount), 0) AS ticketMedio
      FROM sales_invoice
      WHERE company_id  = 1
        AND cancel_date IS NULL
        AND CONVERT(date, issue_date) >= @desde
        AND CONVERT(date, issue_date) <= @hasta
    `);

  const row = result.recordset[0];
  return {
    periodo,
    desde: desdeStr,
    hasta: hastaStr,
    numFacturas:    row.numFacturas,
    totalFacturado: parseFloat(row.totalFacturado),
    ticketMedio:    parseFloat(row.ticketMedio),
  };
};

const getEvolucionMensual = async (anio) => {
  if (isMockMode()) return EVOLUCION_MOCK;

  const pool = getPool();
  const result = await pool.request()
    .input('anio', sql.Int, anio)
    .query(`
      SELECT
        MONTH(issue_date)              AS mes,
        COALESCE(SUM(total_amount), 0) AS total,
        COUNT(*)                       AS numFacturas
      FROM sales_invoice
      WHERE company_id  = 1
        AND cancel_date IS NULL
        AND YEAR(issue_date) = @anio
      GROUP BY MONTH(issue_date)
      ORDER BY mes
    `);

  // la query solo devuelve los meses con facturas, así que relleno los vacíos con 0
  // para que la gráfica siempre tenga los 12 meses
  const porMes = {};
  result.recordset.forEach(r => { porMes[r.mes] = r; });

  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return {
      mes:         m,
      nombreMes:   NOMBRES_MES[i],
      total:       porMes[m] ? parseFloat(porMes[m].total) : 0,
      numFacturas: porMes[m] ? porMes[m].numFacturas : 0,
    };
  });
};

// TODO: separar en dos queries distintas si en algún momento el rendimiento empeora
// de momento meto todo en una sola para no hacer dos roundtrips al servidor
const getComparativa = async () => {
  if (isMockMode()) return COMPARATIVA_MOCK;

  const pool = getPool();
  const result = await pool.request().query(`
    SELECT
      COALESCE(SUM(CASE WHEN issue_date >= DATEADD(MONTH, DATEDIFF(MONTH,0,GETDATE()),   0)
                        AND  issue_date <  DATEADD(MONTH, DATEDIFF(MONTH,0,GETDATE())+1, 0)
                        THEN total_amount END), 0) AS totalMesActual,
      COUNT(CASE WHEN issue_date >= DATEADD(MONTH, DATEDIFF(MONTH,0,GETDATE()),   0)
                 AND  issue_date <  DATEADD(MONTH, DATEDIFF(MONTH,0,GETDATE())+1, 0)
                 THEN 1 END)                        AS facturasMesActual,
      COALESCE(SUM(CASE WHEN issue_date >= DATEADD(MONTH, DATEDIFF(MONTH,0,GETDATE())-1, 0)
                        AND  issue_date <  DATEADD(MONTH, DATEDIFF(MONTH,0,GETDATE()),   0)
                        THEN total_amount END), 0) AS totalMesAnterior,
      COUNT(CASE WHEN issue_date >= DATEADD(MONTH, DATEDIFF(MONTH,0,GETDATE())-1, 0)
                 AND  issue_date <  DATEADD(MONTH, DATEDIFF(MONTH,0,GETDATE()),   0)
                 THEN 1 END)                        AS facturasMesAnterior,
      COALESCE(SUM(CASE WHEN YEAR(issue_date) = YEAR(GETDATE()) THEN total_amount END), 0) AS totalAnioActual,
      COUNT(CASE WHEN YEAR(issue_date) = YEAR(GETDATE()) THEN 1 END)                        AS facturasAnioActual,
      COALESCE(SUM(CASE WHEN YEAR(issue_date) = YEAR(GETDATE())-1 THEN total_amount END), 0) AS totalAnioAnterior,
      COUNT(CASE WHEN YEAR(issue_date) = YEAR(GETDATE())-1 THEN 1 END)                        AS facturasAnioAnterior
    FROM sales_invoice
    WHERE company_id  = 1
      AND cancel_date IS NULL
  `);

  const r = result.recordset[0];

  // si el mes/año anterior es 0 no puedo calcular variación — devuelvo null
  const variacionMes  = r.totalMesAnterior > 0
    ? parseFloat(((r.totalMesActual - r.totalMesAnterior) / r.totalMesAnterior * 100).toFixed(1))
    : null;
  const variacionAnio = r.totalAnioAnterior > 0
    ? parseFloat(((r.totalAnioActual - r.totalAnioAnterior) / r.totalAnioAnterior * 100).toFixed(1))
    : null;

  return {
    mes: {
      actual:              { total: parseFloat(r.totalMesActual),   numFacturas: r.facturasMesActual },
      anterior:            { total: parseFloat(r.totalMesAnterior), numFacturas: r.facturasMesAnterior },
      variacionPorcentaje: variacionMes,
      tendencia:           variacionMes === null ? 'neutral' : variacionMes >= 0 ? 'subida' : 'bajada',
    },
    anio: {
      actual:              { total: parseFloat(r.totalAnioActual),   numFacturas: r.facturasAnioActual },
      anterior:            { total: parseFloat(r.totalAnioAnterior), numFacturas: r.facturasAnioAnterior },
      variacionPorcentaje: variacionAnio,
      tendencia:           variacionAnio === null ? 'neutral' : variacionAnio >= 0 ? 'subida' : 'bajada',
    },
  };
};

module.exports = { getDashboard, getEvolucionMensual, getComparativa };
