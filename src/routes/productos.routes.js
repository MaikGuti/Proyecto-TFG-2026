// src/routes/productos.routes.js

const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const productosController = require('../controllers/productos.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Todas las rutas de productos requieren autenticación
router.use(authenticate);

// GET /api/productos/buscar?q=led-50w
// Búsqueda por referencia o nombre parcial
router.get('/buscar', [
  query('q')
    .notEmpty().withMessage('El término de búsqueda es obligatorio')
    .isLength({ min: 2 }).withMessage('Mínimo 2 caracteres')
    .trim()
    .escape(),
], productosController.buscar);

// GET /api/productos/autocompletar?q=led
// Sugerencias para el autocompletado (máx 10 resultados)
router.get('/autocompletar', [
  query('q')
    .notEmpty().withMessage('Término requerido')
    .isLength({ min: 2 })
    .trim()
    .escape(),
], productosController.autocompletar);

// GET /api/productos/:referencia
// Detalle completo de un producto por referencia exacta
router.get('/:referencia', [
  param('referencia')
    .notEmpty().withMessage('Referencia obligatoria')
    .trim()
    .escape(),
], productosController.detalle);

// GET /api/productos/:referencia/despiece
// Componentes del producto (despiece)
router.get('/:referencia/despiece', [
  param('referencia')
    .notEmpty()
    .trim()
    .escape(),
], productosController.despiece);

module.exports = router;
