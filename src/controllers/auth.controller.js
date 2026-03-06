// src/controllers/auth.controller.js

const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { getDB } = require('../config/database-usuarios');
const logger = require('../config/logger');

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;
    const db = getDB();

    const usuario = db.prepare(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1'
    ).get(email);

    if (!usuario) {
      logger.warn(`Login fallido (usuario no encontrado o inactivo): ${email} — IP: ${req.ip}`);
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas',
      });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      logger.warn(`Login fallido (contraseña incorrecta): ${email} — IP: ${req.ip}`);
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas',
      });
    }

    const token = jwt.sign(
      {
        id:     usuario.id,
        nombre: usuario.nombre,
        email:  usuario.email,
        rol:    usuario.rol,
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
          id:     usuario.id,
          nombre: usuario.nombre,
          email:  usuario.email,
          rol:    usuario.rol,
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
  logger.info(`Logout: ${req.user.email}`);
  res.json({
    success: true,
    message: 'Sesión cerrada correctamente',
  });
};

/**
 * POST /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { passwordActual, passwordNueva } = req.body;
    const db = getDB();

    const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.user.id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    const valida = await bcrypt.compare(passwordActual, usuario.password_hash);
    if (!valida) {
      return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta.' });
    }

    const hash = await bcrypt.hash(passwordNueva, 10);
    db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(hash, req.user.id);

    logger.info(`Contraseña cambiada: ${req.user.email}`);
    res.json({ success: true, message: 'Contraseña actualizada correctamente.' });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const me = (req, res) => {
  res.json({
    success: true,
    data: {
      id:     req.user.id,
      nombre: req.user.nombre,
      email:  req.user.email,
      rol:    req.user.rol,
    },
  });
};

module.exports = { login, logout, me, changePassword };
