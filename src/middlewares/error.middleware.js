// src/middlewares/error.middleware.js
// tiene que registrarse siempre al final en index.js, después de todas las rutas

const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`, err);

  // error de validación (express-validator)
  if (err.type === 'validation') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: err.errors,
    });
  }

  // error de SQL Server — los códigos empiezan por E (ECONNREFUSED, ETIMEOUT...)
  if (err.code && err.code.startsWith('E')) {
    return res.status(503).json({
      success: false,
      message: 'Error de base de datos. Inténtalo de nuevo.',
    });
  }

  // en producción no muestro el mensaje real para no exponer detalles internos
  const statusCode = err.statusCode || 500;
  const message    = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message;

  res.status(statusCode).json({ success: false, message });
};

// captura las rutas que no existen
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = { errorHandler, notFound };
