// src/controllers/productos.controller.js

const { validationResult } = require('express-validator');
const productosService = require('../services/productos.service');
const logger = require('../config/logger');

// GET /api/productos/buscar?q=término
const buscar = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { q } = req.query;
    logger.debug(`Búsqueda: "${q}" — usuario: ${req.usuario.email}`);

    const productos = await productosService.buscar(q);

    res.json({
      success: true,
      data: productos,
      total: productos.length,
    });

  } catch (err) {
    next(err);
  }
};

// GET /api/productos/autocompletar?q=término
const autocompletar = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { q } = req.query;
    const sugerencias = await productosService.autocompletar(q);

    res.json({ success: true, data: sugerencias });

  } catch (err) {
    next(err);
  }
};

// GET /api/productos/:referencia
const detalle = async (req, res, next) => {
  try {
    const { referencia } = req.params;
    logger.debug(`Detalle: ${referencia} — usuario: ${req.usuario.email}`);

    const producto = await productosService.getByReferencia(referencia);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: `Producto "${referencia}" no encontrado`,
      });
    }

    res.json({ success: true, data: producto });

  } catch (err) {
    next(err);
  }
};

// GET /api/productos/:referencia/despiece
const despiece = async (req, res, next) => {
  try {
    const { referencia } = req.params;
    const componentes = await productosService.getDespiece(referencia);
    res.json({ success: true, data: componentes, total: componentes.length });
  } catch (err) {
    next(err);
  }
};

// GET /api/productos/alertas-stock — artículos con stock por debajo del mínimo
const alertasStock = async (_req, res, next) => {
  try {
    const alertas = await productosService.getAlertasStock();
    res.json({ success: true, data: alertas, total: alertas.length });
  } catch (err) {
    next(err);
  }
};

// GET /api/productos/ubicaciones-despieces
const ubicacionesDespieces = async (_req, res, next) => {
  try {
    const datos = await productosService.getUbicacionesDespieces();
    res.json({ success: true, data: datos, total: datos.length });
  } catch (err) {
    next(err);
  }
};

// GET /api/productos/:referencia/ubicaciones
// versión filtrada por referencia — la llama el frontend en el detalle de producto
const ubicacionesByRef = async (req, res, next) => {
  try {
    const { referencia } = req.params;
    const datos = await productosService.getUbicacionesByRef(referencia);
    res.json({ success: true, data: datos });
  } catch (err) {
    next(err);
  }
};

module.exports = { buscar, autocompletar, detalle, despiece, alertasStock, ubicacionesDespieces, ubicacionesByRef };
