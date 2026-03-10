// src/services/productos.service.js

const { getPool, isMockMode, sql } = require('../config/database');
const {
  PRODUCTOS_MOCK,
  ALERTAS_STOCK_MOCK,
  DESPIECE_MOCK,
  UBICACIONES_DESPIECES_MOCK,
} = require('../config/mock-data');

// Subconsulta de stock reutilizable (empresa 1, almacén 1)
const SUBQUERY_STOCK = `
  SELECT
    s.ID_ARTICULO,
    s.STOCK_ART_ALMACEN,
    s.CANT_PDTE_RECIBIR,
    s.CANT_RESERVADA,
    s.STOCK_DISPONIBLE_SIN_PDTE,
    c.STOCK_MINIMO
  FROM ALM_VISTA_STOCK_RESUMEN AS s
  LEFT JOIN ALM_CONFIG_ARTICULOS AS c
         ON c.ID_EMPRESA  = s.ID_EMPRESA
        AND c.ID_ALMACEN  = s.ID_ALMACEN
        AND c.ID_ARTICULO = s.ID_ARTICULO
  WHERE s.ID_EMPRESA = 1
    AND s.ID_ALMACEN = 1
`;

// Subconsulta de PVP 2024 reutilizable
const SUBQUERY_PVP = `
  SELECT ta.ID_ARTICULO,
         MAX(ta.PRECIO_BASE_PVP) AS PRECIO_BASE_PVP
  FROM   COM_TARIFAS           t
  JOIN   COM_TARIFAS_ARTICULOS ta ON ta.COD_TARIFA = t.COD_TARIFA
  WHERE  t.DESC_TARIFA LIKE '%PVP%2024%' OR t.DESC_TARIFA = 'Tarifa PVP 2024'
  GROUP BY ta.ID_ARTICULO
`;

const SELECT_CAMPOS = `
  a.CODIGO_INTERNO                                                          AS referencia,
  a.DESC_ARTICULO                                                           AS nombre,
  a.item_description_technical                                              AS descripcion,
  f.DESC_FAMILIA                                                            AS familia,
  u.DESC_MEDIDA                                                             AS unidad,
  pvp.PRECIO_BASE_PVP                                                       AS pvp,
  COALESCE(stk.STOCK_ART_ALMACEN, 0)                                        AS stockAlmacen,
  COALESCE(stk.CANT_PDTE_RECIBIR, 0)                                        AS pendienteRecibir,
  COALESCE(stk.CANT_RESERVADA, 0)                                           AS reservada,
  stk.STOCK_MINIMO                                                          AS stockMinimo,
  COALESCE(stk.STOCK_DISPONIBLE_SIN_PDTE, 0)                                AS stock,
  COALESCE(stk.STOCK_ART_ALMACEN + stk.CANT_PDTE_RECIBIR - stk.CANT_RESERVADA, 0) AS stockDisponible
`;

const JOINS = `
  INNER JOIN ALM_FAMILIAS_ARTICULOS     AS f   ON f.ID_FAMILIA = a.ID_FAMILIA
  LEFT  JOIN CONFIG_AUX_UNIDADES_MEDIDA AS u   ON u.ID_MEDIDA  = a.UNIDAD_MEDIDA
  LEFT  JOIN (${SUBQUERY_STOCK})        AS stk ON stk.ID_ARTICULO = a.ID_ARTICULO
  LEFT  JOIN (${SUBQUERY_PVP})          AS pvp ON pvp.ID_ARTICULO = a.ID_ARTICULO
`;

const buscar = async (termino) => {
  if (isMockMode()) {
    const t = termino.toLowerCase();
    return PRODUCTOS_MOCK.filter(p =>
      p.referencia.toLowerCase().includes(t) || p.nombre.toLowerCase().includes(t)
    );
  }
  const pool = getPool();
  const result = await pool.request()
    .input('termino', sql.VarChar(200), `%${termino}%`)
    .query(`
      SELECT TOP 50
        ${SELECT_CAMPOS}
      FROM ALM_MAESTRO_ARTICULOS AS a
      ${JOINS}
      WHERE a.ID_ARTICULO <> -1
        AND (a.CODIGO_INTERNO LIKE @termino OR a.DESC_ARTICULO LIKE @termino)
      ORDER BY a.CODIGO_INTERNO
    `);
  return result.recordset;
};

const autocompletar = async (termino) => {
  if (isMockMode()) {
    const t = termino.toLowerCase();
    return PRODUCTOS_MOCK
      .filter(p => p.referencia.toLowerCase().includes(t) || p.nombre.toLowerCase().includes(t))
      .slice(0, 10)
      .map(p => ({ referencia: p.referencia, nombre: p.nombre }));
  }
  const pool = getPool();
  const result = await pool.request()
    .input('termino', sql.VarChar(200), `%${termino}%`)
    .query(`
      SELECT TOP 10
        a.CODIGO_INTERNO AS referencia,
        a.DESC_ARTICULO  AS nombre
      FROM ALM_MAESTRO_ARTICULOS AS a
      WHERE a.ID_ARTICULO <> -1
        AND (a.CODIGO_INTERNO LIKE @termino OR a.DESC_ARTICULO LIKE @termino)
      ORDER BY a.CODIGO_INTERNO
    `);
  return result.recordset;
};

const getByReferencia = async (referencia) => {
  if (isMockMode()) {
    return PRODUCTOS_MOCK.find(p => p.referencia === referencia) || PRODUCTOS_MOCK[0];
  }
  const pool = getPool();
  const result = await pool.request()
    .input('referencia', sql.VarChar(100), referencia)
    .query(`
      SELECT TOP 1
        ${SELECT_CAMPOS}
      FROM ALM_MAESTRO_ARTICULOS AS a
      ${JOINS}
      WHERE a.ID_ARTICULO <> -1
        AND a.CODIGO_INTERNO = @referencia
    `);
  return result.recordset[0] || null;
};

const getAlertasStock = async () => {
  if (isMockMode()) return ALERTAS_STOCK_MOCK;
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT TOP 50
      a.CODIGO_INTERNO                                                AS referencia,
      a.DESC_ARTICULO                                                 AS nombre,
      f.DESC_FAMILIA                                                  AS familia,
      u.DESC_MEDIDA                                                   AS unidad,
      COALESCE(stk.STOCK_DISPONIBLE_SIN_PDTE, 0)                     AS stock,
      stk.STOCK_MINIMO                                                AS stockMinimo,
      stk.STOCK_MINIMO - COALESCE(stk.STOCK_DISPONIBLE_SIN_PDTE, 0)  AS deficit
    FROM ALM_MAESTRO_ARTICULOS AS a
    INNER JOIN ALM_FAMILIAS_ARTICULOS     AS f   ON f.ID_FAMILIA = a.ID_FAMILIA
    LEFT  JOIN CONFIG_AUX_UNIDADES_MEDIDA AS u   ON u.ID_MEDIDA  = a.UNIDAD_MEDIDA
    LEFT  JOIN (${SUBQUERY_STOCK})        AS stk ON stk.ID_ARTICULO = a.ID_ARTICULO
    WHERE a.ID_ARTICULO <> -1
      AND stk.STOCK_MINIMO IS NOT NULL
      AND stk.STOCK_MINIMO > 0
      AND COALESCE(stk.STOCK_DISPONIBLE_SIN_PDTE, 0) < stk.STOCK_MINIMO
    ORDER BY deficit DESC
  `);
  return result.recordset;
};

const getDespiece = async (referencia) => {
  if (isMockMode()) return DESPIECE_MOCK;
  const pool = getPool();
  const result = await pool.request()
    .input('codigo', sql.VarChar(100), referencia)
    .query(`
      SELECT
        componentes.CODIGO_INTERNO                      AS referencia,
        componentes.DESC_ARTICULO                       AS componente,
        PROD_COMPOSICIONES.CANTIDAD                     AS cantidad,
        CONFIG_AUX_UNIDADES_MEDIDA.COD_MEDIDA           AS unidad,
        stocks.STOCK_DISPONIBLE_SIN_PDTE                AS stockDisponible
      FROM PROD_ARTICULOS
      JOIN PROD_COMPOSICIONES
          ON PROD_COMPOSICIONES.VER_ARTICULO_PADRE = PROD_ARTICULOS.ID_VERSION_ARTICULO
      JOIN ALM_MAESTRO_ARTICULOS
          ON ALM_MAESTRO_ARTICULOS.ID_ARTICULO = PROD_ARTICULOS.ID_ARTICULO
      JOIN PROD_ARTICULOS AS version_componentes
          ON version_componentes.ID_VERSION_ARTICULO = PROD_COMPOSICIONES.VER_ARTICULO_HIJO
      JOIN ALM_MAESTRO_ARTICULOS AS componentes
          ON componentes.ID_ARTICULO = version_componentes.ID_ARTICULO
      JOIN CONFIG_AUX_UNIDADES_MEDIDA
          ON componentes.UNIDAD_MEDIDA = CONFIG_AUX_UNIDADES_MEDIDA.ID_MEDIDA
      LEFT OUTER JOIN (
          SELECT ALM_VISTA_STOCK_RESUMEN.ID_ARTICULO,
                 SUM(ALM_VISTA_STOCK_RESUMEN.STOCK_DISPONIBLE_SIN_PDTE) AS STOCK_DISPONIBLE_SIN_PDTE
          FROM ALM_VISTA_STOCK_RESUMEN
          JOIN ALM_DEFINICION_ALMACENES
              ON ALM_VISTA_STOCK_RESUMEN.ID_ALMACEN = ALM_DEFINICION_ALMACENES.ID_ALMACEN
          WHERE ALM_DEFINICION_ALMACENES.ID_EMPRESA = 1
            AND ALM_DEFINICION_ALMACENES.by_default = 1
          GROUP BY ALM_VISTA_STOCK_RESUMEN.ID_ARTICULO
      ) AS stocks ON stocks.ID_ARTICULO = componentes.ID_ARTICULO
      WHERE ALM_MAESTRO_ARTICULOS.CODIGO_INTERNO = @codigo
    `);
  return result.recordset;
};

const getUbicacionesDespieces = async () => {
  if (isMockMode()) return UBICACIONES_DESPIECES_MOCK;
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT
      ma.CODIGO_INTERNO                     AS referencia,
      ma.DESC_ARTICULO                      AS nombre,
      al.DESC_ALMACEN                       AS almacen,
      sal.DESC_SUBALMACEN                   AS subalmacen,
      ub.COD_UBICACION                      AS ubicacion,
      aa.STOCK_FISICO                       AS stock
    FROM ALM_ARTICULOS_ALMACEN aa
    JOIN ALM_MAESTRO_ARTICULOS ma
        ON ma.ID_ARTICULO = aa.ID_ARTICULO
    LEFT JOIN ALM_DEFINICION_ALMACENES al
        ON al.ID_ALMACEN = aa.ID_ALMACEN
    LEFT JOIN ALM_DEFINICION_SUBALMACENES sal
        ON sal.ID_SUBALMACEN = aa.ID_SUBALMACEN
    LEFT JOIN ALM_DEFINICION_UBICACIONES ub
        ON ub.ID_UBICACION = aa.ID_UBICACION
    WHERE aa.STOCK_FISICO > 0
    ORDER BY
      ma.CODIGO_INTERNO,
      al.DESC_ALMACEN,
      sal.DESC_SUBALMACEN,
      ub.COD_UBICACION
  `);
  return result.recordset;
};

const getUbicacionesByRef = async (referencia) => {
  if (isMockMode()) {
    return UBICACIONES_DESPIECES_MOCK.filter(u => u.referencia === referencia);
  }
  const pool = getPool();
  const result = await pool.request()
    .input('referencia', sql.VarChar(100), referencia)
    .query(`
      SELECT
        al.DESC_ALMACEN      AS almacen,
        sal.DESC_SUBALMACEN  AS subalmacen,
        ub.COD_UBICACION     AS ubicacion,
        aa.STOCK_FISICO      AS stock
      FROM ALM_ARTICULOS_ALMACEN aa
      JOIN ALM_MAESTRO_ARTICULOS ma
          ON ma.ID_ARTICULO = aa.ID_ARTICULO
      LEFT JOIN ALM_DEFINICION_ALMACENES al
          ON al.ID_ALMACEN = aa.ID_ALMACEN
      LEFT JOIN ALM_DEFINICION_SUBALMACENES sal
          ON sal.ID_SUBALMACEN = aa.ID_SUBALMACEN
      LEFT JOIN ALM_DEFINICION_UBICACIONES ub
          ON ub.ID_UBICACION = aa.ID_UBICACION
      WHERE aa.STOCK_FISICO > 0
        AND ma.CODIGO_INTERNO = @referencia
      ORDER BY al.DESC_ALMACEN, sal.DESC_SUBALMACEN, ub.COD_UBICACION
    `);
  return result.recordset;
};

module.exports = { buscar, autocompletar, getByReferencia, getAlertasStock, getDespiece, getUbicacionesDespieces, getUbicacionesByRef };
