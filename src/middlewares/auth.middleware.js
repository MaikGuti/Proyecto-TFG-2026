// src/middlewares/auth.middleware.js

const jwt = require('jsonwebtoken');

// comprueba que la petición lleva un token JWT válido en la cabecera Authorization
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // formato: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // guardo el usuario decodificado en req para usarlo en los controladores
    req.usuario = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Sesión expirada, vuelve a iniciar sesión.' });
    }
    return res.status(403).json({ success: false, message: 'Token inválido.' });
  }
};

// middleware de autorización — se usa como authorize('admin') en las rutas
// si el rol del usuario no está en la lista, devuelve 403
const authorize = (...roles) => (req, res, next) => {
  if (!req.usuario || !roles.includes(req.usuario.rol)) {
    return res.status(403).json({ success: false, message: 'No tienes permisos para esto.' });
  }
  next();
};

module.exports = { authenticate, authorize };
