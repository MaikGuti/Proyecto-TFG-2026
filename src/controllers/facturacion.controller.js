// src/controllers/facturacion.controller.js

const { validationResult } = require('express-validator');
const facturacionService = require('../services/facturacion.service');
const logger = require('../config/logger');

/**
 * GET /api/facturacion/dashboard?periodo=mes|trimestre|anio
 */
const dashboard = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const periodo = req.query.periodo || 'mes';
    logger.debug(`Dashboard facturación - periodo: ${periodo} - usuario: ${req.user.email}`);

    const datos = await facturacionService.getDashboard(periodo);

    res.json({
      success: true,
      data: datos,
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/facturacion/evolucion?anio=2024
 */
const evolucionMensual = async (req, res, next) => {
  try {
    const anio = parseInt(req.query.anio) || new Date().getFullYear();
    const datos = await facturacionService.getEvolucionMensual(anio);

    res.json({
      success: true,
      data: datos,
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/facturacion/comparativa
 */
const comparativa = async (req, res, next) => {
  try {
    const datos = await facturacionService.getComparativa();

    res.json({
      success: true,
      data: datos,
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { dashboard, evolucionMensual, comparativa };
