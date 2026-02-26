// src/middlewares/error.middleware.js
// Manejo centralizado de errores - captura todos los errores no controlados

const logger = require('../config/logger');

/**
 * Middleware de manejo de errores global.
 * SIEMPRE debe ser el último middleware en registrarse.
 */
const errorHandler = (err, req, res, next) => {
  // Log del error
  logger.error(`${err.message} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`, err);

  // Error de validación de express-validator
  if (err.type === 'validation') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: err.errors,
    });
  }

  // Error de base de datos SQL Server
  if (err.code && err.code.startsWith('E')) {
    return res.status(503).json({
      success: false,
      message: 'Error de base de datos. Inténtalo de nuevo.',
    });
  }

  // Error genérico
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message;

  res.status(statusCode).json({
    success: false,
    message,
  });
};

/**
 * Middleware para rutas no encontradas (404)
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = { errorHandler, notFound };
