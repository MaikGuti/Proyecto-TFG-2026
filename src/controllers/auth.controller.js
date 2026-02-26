// src/controllers/auth.controller.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

// =====================================================
// USUARIOS DE PRUEBA (temporal hasta tener BD propia)
// Mañana esto se sustituirá por consultas a la BD
// =====================================================
const USUARIOS_MOCK = [
  {
    id: 1,
    nombre: 'Admin TECSOLED',
    email: 'admin@tecsoled.com',
    // Contraseña: admin123 (hasheada con bcrypt)
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    rol: 'admin',
  },
  {
    id: 2,
    nombre: 'Comercial 1',
    email: 'comercial@tecsoled.com',
    // Contraseña: user123
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    rol: 'operativo',
  },
];

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    // Validar inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Buscar usuario (temporal: en mock, luego en BD)
    const usuario = USUARIOS_MOCK.find(u => u.email === email);
    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas',
      });
    }

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      logger.warn(`Intento de login fallido para: ${email} - IP: ${req.ip}`);
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas',
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    logger.info(`Login exitoso: ${email} (${usuario.rol})`);

    res.json({
      success: true,
      message: 'Login correcto',
      data: {
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
      },
    });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = (req, res) => {
  // Con JWT stateless, el logout lo gestiona el frontend
  // eliminando el token. Aquí solo confirmamos.
  logger.info(`Logout: ${req.user.email}`);
  res.json({
    success: true,
    message: 'Sesión cerrada correctamente',
  });
};

/**
 * GET /api/auth/me
 */
const me = (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      nombre: req.user.nombre,
      email: req.user.email,
      rol: req.user.rol,
    },
  });
};

module.exports = { login, logout, me };
