// src/routes/facturacion.routes.js

const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const facturacionController = require('../controllers/facturacion.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Solo usuarios con rol 'admin' pueden acceder
router.use(authenticate, authorize('admin'));

// GET /api/facturacion/dashboard?periodo=mes|trimestre|año
router.get('/dashboard', [
  query('periodo')
    .optional()
    .isIn(['mes', 'trimestre', 'anio']).withMessage('Periodo inválido. Usa: mes, trimestre, anio'),
], facturacionController.dashboard);

// GET /api/facturacion/evolucion?anio=2024
// Evolución mensual de un año completo
router.get('/evolucion', [
  query('anio')
    .optional()
    .isInt({ min: 2020, max: 2030 }).withMessage('Año inválido'),
], facturacionController.evolucionMensual);

// GET /api/facturacion/comparativa
// Comparativa mes actual vs anterior y año actual vs anterior
router.get('/comparativa', facturacionController.comparativa);

module.exports = router;
