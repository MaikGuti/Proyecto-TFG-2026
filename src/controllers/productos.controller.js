// src/controllers/productos.controller.js

const { validationResult } = require('express-validator');
const productosService = require('../services/productos.service');
const logger = require('../config/logger');

/**
 * GET /api/productos/buscar?q=término
 * Búsqueda por referencia o nombre parcial
 */
const buscar = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { q } = req.query;
    logger.debug(`Búsqueda de producto: "${q}" por usuario: ${req.user.email}`);

    const productos = await productosService.buscar(q);

    res.json({
      success: true,
      data: productos,
      total: productos.length,
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/productos/autocompletar?q=término
 * Sugerencias rápidas para autocompletado
 */
const autocompletar = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { q } = req.query;
    const sugerencias = await productosService.autocompletar(q);

    res.json({
      success: true,
      data: sugerencias,
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/productos/:referencia
 * Detalle completo de un producto
 */
const detalle = async (req, res, next) => {
  try {
    const { referencia } = req.params;
    logger.debug(`Detalle producto: ${referencia} por: ${req.user.email}`);

    const producto = await productosService.getByReferencia(referencia);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: `Producto con referencia "${referencia}" no encontrado`,
      });
    }

    res.json({
      success: true,
      data: producto,
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/productos/:referencia/despiece
 * Componentes del producto
 */
const despiece = async (req, res, next) => {
  try {
    const { referencia } = req.params;
    const componentes = await productosService.getDespiece(referencia);

    res.json({
      success: true,
      data: componentes,
      total: componentes.length,
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { buscar, autocompletar, detalle, despiece };
