// src/routes/auth.routes.js

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Validaciones para el login
const loginValidation = [
  body('email')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
];

// POST /api/auth/login
router.post('/login', loginValidation, authController.login);

// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout);

// GET /api/auth/me → Datos del usuario actual
router.get('/me', authenticate, authController.me);

module.exports = router;
