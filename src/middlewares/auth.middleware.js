// src/middlewares/auth.middleware.js
// Verifica el token JWT en cada petición protegida

const jwt = require('jsonwebtoken');

/**
 * Middleware principal de autenticación.
 * Verifica que el token JWT es válido.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. Token no proporcionado.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, nombre, email, rol }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Sesión expirada. Por favor, inicia sesión de nuevo.',
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Token inválido.',
    });
  }
};

/**
 * Middleware de autorización por rol.
 * Uso: authorize('admin') o authorize('admin', 'operativo')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado.',
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso.',
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
