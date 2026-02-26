// src/services/facturacion.service.js
//
// ESTADO ACTUAL: Datos mock
// MAÑANA: Activar queries reales contra SQL Server del ERP

// const { getPool, sql } = require('../config/database');

// =============================================
// HELPERS
// =============================================

const getPeriodoFechas = (periodo) => {
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1;

  switch (periodo) {
    case 'mes':
      return {
        desde: new Date(anioActual, mesActual - 1, 1),
        hasta: new Date(anioActual, mesActual, 0),
      };
    case 'trimestre': {
      const trimestre = Math.floor((mesActual - 1) / 3);
      return {
        desde: new Date(anioActual, trimestre * 3, 1),
        hasta: new Date(anioActual, trimestre * 3 + 3, 0),
      };
    }
    case 'anio':
      return {
        desde: new Date(anioActual, 0, 1),
        hasta: new Date(anioActual, 11, 31),
      };
    default:
      return getPeriodoFechas('mes');
  }
};

// =============================================
// FUNCIONES DEL SERVICIO
// =============================================

/**
 * Dashboard principal de facturación.
 *
 * QUERY REAL EJEMPLO (ajustar según estructura del ERP):
 * SELECT
 *   SUM(ImporteTotal) AS totalFacturado,
 *   COUNT(*)          AS numFacturas,
 *   AVG(ImporteTotal) AS ticketMedio
 * FROM Facturas
 * WHERE FechaFactura BETWEEN @desde AND @hasta
 *   AND TipoDocumento = 'FAC'
 *   AND Anulada = 0
 */
const getDashboard = async (periodo) => {
  const { desde, hasta } = getPeriodoFechas(periodo);

  // TODO: Activar cuando tengamos el ERP
  // const pool = getPool();
  // const result = await pool.request()
  //   .input('desde', sql.Date, desde)
  //   .input('hasta', sql.Date, hasta)
  //   .query(`
  //     SELECT
  //       SUM(ImporteTotal) AS totalFacturado,
  //       COUNT(*)          AS numFacturas,
  //       AVG(ImporteTotal) AS ticketMedio
  //     FROM Facturas
  //     WHERE FechaFactura BETWEEN @desde AND @hasta
  //       AND TipoDocumento = 'FAC'
  //       AND Anulada = 0
  //   `);
  // return result.recordset[0];

  // MOCK temporal
  return {
    periodo,
    desde: desde.toISOString().split('T')[0],
    hasta: hasta.toISOString().split('T')[0],
    totalFacturado: 48750.25,
    numFacturas: 87,
    ticketMedio: 560.35,
  };
};

/**
 * Evolución mensual de facturación de un año completo.
 * Devuelve array de 12 meses con el total de cada uno.
 */
const getEvolucionMensual = async (anio) => {
  // TODO: Query real
  // const pool = getPool();
  // const result = await pool.request()
  //   .input('anio', sql.Int, anio)
  //   .query(`
  //     SELECT
  //       MONTH(FechaFactura) AS mes,
  //       SUM(ImporteTotal)   AS total,
  //       COUNT(*)            AS numFacturas
  //     FROM Facturas
  //     WHERE YEAR(FechaFactura) = @anio
  //       AND TipoDocumento = 'FAC'
  //       AND Anulada = 0
  //     GROUP BY MONTH(FechaFactura)
  //     ORDER BY mes
  //   `);
  // return result.recordset;

  // MOCK temporal - Evolución de 12 meses
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return meses.map((nombre, i) => ({
    mes: i + 1,
    nombreMes: nombre,
    total: Math.floor(Math.random() * 30000) + 20000,
    numFacturas: Math.floor(Math.random() * 50) + 40,
  }));
};

/**
 * Comparativa entre periodos (mes actual vs anterior, año actual vs anterior).
 */
const getComparativa = async () => {
  // TODO: Query real con CTEs para calcular ambos periodos en una sola query

  // MOCK temporal
  return {
    mes: {
      actual: { total: 48750.25, numFacturas: 87 },
      anterior: { total: 42100.00, numFacturas: 79 },
      variacionPorcentaje: 15.8,
      tendencia: 'subida',
    },
    anio: {
      actual: { total: 285400.00, numFacturas: 512 },
      anterior: { total: 260800.00, numFacturas: 478 },
      variacionPorcentaje: 9.4,
      tendencia: 'subida',
    },
  };
};

module.exports = { getDashboard, getEvolucionMensual, getComparativa };
