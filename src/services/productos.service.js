// src/services/productos.service.js
// 
// ESTADO ACTUAL: Usando datos mock (sin acceso al ERP aún)
// MAÑANA: Descomentar las queries reales y comentar el mock
//
// Los nombres de tablas/columnas son PLACEHOLDERS.
// Cuando tengas acceso al ERP, revisa el schema real y ajústalos.

// const { getPool, sql } = require('../config/database');

// =============================================
// DATOS MOCK - Temporal hasta tener el ERP
// =============================================
const PRODUCTOS_MOCK = [
  {
    referencia: 'LED-50W-E27',
    nombre: 'Bombilla LED 50W E27 Luz Fría',
    descripcion: 'Bombilla LED de alta eficiencia 50W con casquillo E27. Temperatura de color 6500K luz fría. Vida útil 25.000 horas.',
    stock: 145,
    ubicacion: 'A-12-3',
    pvp: 12.50,
    unidad: 'ud',
  },
  {
    referencia: 'REGL-2M-IP65',
    nombre: 'Regleta LED 2 metros IP65',
    descripcion: 'Regleta LED estanca 2 metros IP65 para uso en interiores y exteriores con humedad.',
    stock: 38,
    ubicacion: 'B-05-1',
    pvp: 45.90,
    unidad: 'ud',
  },
  {
    referencia: 'FOCO-GU10-7W',
    nombre: 'Foco LED GU10 7W Empotrable',
    descripcion: 'Foco LED empotrable GU10 7W. Ángulo de apertura 36°. Sustituye a halógeno 50W.',
    stock: 0,
    ubicacion: 'C-08-2',
    pvp: 8.75,
    unidad: 'ud',
  },
  {
    referencia: 'PANEL-60X60',
    nombre: 'Panel LED 60x60 36W',
    descripcion: 'Panel LED cuadrado 60x60cm 36W para techo modular. Incluye driver integrado.',
    stock: 22,
    ubicacion: 'D-01-4',
    pvp: 65.00,
    unidad: 'ud',
  },
  {
    referencia: 'TIRA-5M-RGB',
    nombre: 'Tira LED RGB 5 metros 14.4W/m',
    descripcion: 'Tira LED RGB adhesiva 5 metros. 14.4W por metro. Incluye mando y transformador 12V.',
    stock: 67,
    ubicacion: 'A-03-1',
    pvp: 34.99,
    unidad: 'ud',
  },
];

const DESPIECES_MOCK = {
  'PANEL-60X60': [
    { componente: 'Driver LED 36W', referencia: 'DRV-36W', cantidad: 1 },
    { componente: 'Marco aluminio 60x60', referencia: 'MARCO-60', cantidad: 1 },
    { componente: 'Difusor opal 60x60', referencia: 'DIF-60', cantidad: 1 },
    { componente: 'Tira LED interior', referencia: 'TIRA-INT-60', cantidad: 4 },
  ],
  'TIRA-5M-RGB': [
    { componente: 'Mando RF RGB', referencia: 'MANDO-RGB', cantidad: 1 },
    { componente: 'Transformador 12V 5A', referencia: 'TRAFO-12V-5A', cantidad: 1 },
    { componente: 'Conector tira 4 pines', referencia: 'CONEC-4P', cantidad: 2 },
  ],
};

// =============================================
// FUNCIONES DEL SERVICIO
// =============================================

/**
 * Busca productos por referencia o nombre parcial.
 * 
 * QUERY REAL (ajustar nombres de tabla/columna según ERP):
 * SELECT TOP 20
 *   Referencia, Descripcion, Stock, Ubicacion, PVP, UnidadMedida
 * FROM ArticulosAlmacen
 * WHERE Referencia LIKE @termino OR Descripcion LIKE @termino
 * ORDER BY Referencia
 */
const buscar = async (termino) => {
  // TODO: Sustituir por query real cuando tengamos acceso al ERP
  // const pool = getPool();
  // const result = await pool.request()
  //   .input('termino', sql.VarChar, `%${termino}%`)
  //   .query(`
  //     SELECT TOP 20
  //       Referencia    AS referencia,
  //       Descripcion   AS nombre,
  //       DescLarga     AS descripcion,
  //       Stock         AS stock,
  //       Ubicacion     AS ubicacion,
  //       PVP           AS pvp,
  //       UnidadMedida  AS unidad
  //     FROM ArticulosAlmacen
  //     WHERE Referencia LIKE @termino OR Descripcion LIKE @termino
  //     ORDER BY Referencia
  //   `);
  // return result.recordset;

  // MOCK temporal
  const terminoLower = termino.toLowerCase();
  return PRODUCTOS_MOCK.filter(p =>
    p.referencia.toLowerCase().includes(terminoLower) ||
    p.nombre.toLowerCase().includes(terminoLower)
  );
};

/**
 * Sugerencias rápidas para autocompletado (solo referencia y nombre).
 */
const autocompletar = async (termino) => {
  const terminoLower = termino.toLowerCase();
  return PRODUCTOS_MOCK
    .filter(p =>
      p.referencia.toLowerCase().includes(terminoLower) ||
      p.nombre.toLowerCase().includes(terminoLower)
    )
    .slice(0, 10)
    .map(p => ({ referencia: p.referencia, nombre: p.nombre }));
};

/**
 * Detalle completo de un producto por referencia exacta.
 */
const getByReferencia = async (referencia) => {
  // TODO: Query real
  // const pool = getPool();
  // const result = await pool.request()
  //   .input('referencia', sql.VarChar, referencia)
  //   .query(`
  //     SELECT Referencia, Descripcion, DescLarga, Stock, Ubicacion, PVP, UnidadMedida
  //     FROM ArticulosAlmacen
  //     WHERE Referencia = @referencia
  //   `);
  // return result.recordset[0] || null;

  return PRODUCTOS_MOCK.find(p => p.referencia === referencia) || null;
};

/**
 * Componentes del despiece de un producto.
 */
const getDespiece = async (referencia) => {
  // TODO: Query real
  // const pool = getPool();
  // const result = await pool.request()
  //   .input('referencia', sql.VarChar, referencia)
  //   .query(`
  //     SELECT
  //       d.RefComponente   AS referencia,
  //       a.Descripcion     AS componente,
  //       d.Cantidad        AS cantidad
  //     FROM Despieces d
  //     INNER JOIN ArticulosAlmacen a ON a.Referencia = d.RefComponente
  //     WHERE d.RefPadre = @referencia
  //     ORDER BY d.Orden
  //   `);
  // return result.recordset;

  return DESPIECES_MOCK[referencia] || [];
};

module.exports = { buscar, autocompletar, getByReferencia, getDespiece };
