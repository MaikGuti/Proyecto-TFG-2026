// src/controllers/auth.controller.js

const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { getDB } = require('../config/database-usuarios');
const logger   = require('../config/logger');

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Datos inválidos', errors: errors.array() });
    }

    const { email, password } = req.body;
    const db = getDB();

    // busco el usuario por email y compruebo que esté activo
    const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ? AND activo = 1').get(email);

    if (!usuario) {
      // no distingo entre "usuario no existe" y "contraseña incorrecta" a propósito
      // así no se puede saber si un email está registrado o no
      logger.warn(`Login fallido: ${email} (ip: ${req.ip})`);
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }

    const ok = await bcrypt.compare(password, usuario.password_hash);
    if (!ok) {
      logger.warn(`Login fallido (pwd): ${email}`);
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    logger.info(`Login OK: ${email} — rol: ${usuario.rol}`);

    return res.json({
      success: true,
      data: {
        token,
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      },
    });

  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
// el logout en JWT es stateless — solo borramos la sesión en el cliente
// si en el futuro hace falta invalidar tokens habría que montar una blacklist
const logout = (req, res) => {
  logger.info(`Logout: ${req.usuario.email}`);
  res.json({ success: true, message: 'Sesión cerrada' });
};

// POST /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { passwordActual, passwordNueva } = req.body;
    const db = getDB();

    const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    const valida = await bcrypt.compare(passwordActual, usuario.password_hash);
    if (!valida) {
      return res.status(401).json({ success: false, message: 'La contraseña actual no es correcta.' });
    }

    // salt 10 — tarda ~100ms pero es suficiente para evitar fuerza bruta
    const hash = await bcrypt.hash(passwordNueva, 10);
    db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(hash, usuario.id);

    logger.info(`Contraseña cambiada: ${req.usuario.email}`);
    return res.json({ success: true, message: 'Contraseña actualizada.' });

  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const me = (req, res) => {
  const { id, nombre, email, rol } = req.usuario;
  res.json({ success: true, data: { id, nombre, email, rol } });
};

module.exports = { login, logout, me, changePassword };
